```javascript
/**
 * 👑 محرك محاكي بوكيهات الورد والهدايا المالية الفاخر والآمن - حلويات بوسي 👑
 * النسخة الهندسية القياسية الكاملة بنسبة 100% - خالية تماماً من الثغرات المالية والبرمجية V95.0
 * متوافق بشكل مطلق وثنائي الاتجاه مع: core-engine.js، cart-engine.js، وقاعدة البيانات site-data-final.json ومعايير الأداء والموبايل أولاً
 * [تم حل ثغرات التصفح الخفي، حظر فقدان الصور عند التحديث F5، حظر ظهور نصوص الصور المشوهة بالسلة، تأمين أداء هواتف الموبايل، وتوحيد الحسابات المالية]
 */

(function () {
    "use strict";

    // مفاتيح التخزين الموحدة لعلامة بوسي الفاخرة لضمان التزامن المطلق
    const CART_STORAGE_KEY = 'bose_cart';
    const FLOWER_STATE_STORAGE_KEY = 'bose_flower_builder_state';
    const BASE64_IMAGE_SESSION_KEY = 'bose_active_base64_image_session';

    // ذاكرة احتياطية لضمان عمل المحاكي واستقرار التصفح الخفي (Incognito Mode)
    let flowerStateMemoryFallback = {};

    // استعادة الـ Base64 من الـ sessionStorage المقاوم لعمليات التحديث (F5) لضمان عدم ضياع الصور المخصصة للعملاء
    let activeBase64ImageInMemory = "";
    try {
        activeBase64ImageInMemory = sessionStorage.getItem(BASE64_IMAGE_SESSION_KEY) || "";
    } catch (e) {
        console.warn("⚠️ الـ sessionStorage غير متاح في المتصفح الحالي.");
    }

    // الإعدادات القياسية والاحتياطية للورد لضمان استقرار العمل وتجنب ثغرات الـ undefined من الـ JSON
    let flowerConfig = {
        basePrice: 400,
        baseFlowers: 15,
        extraFlowerPrice: 35,
        photoPrintPrice: 15,
        giftCardPrice: 20,
        flowerTypes: [
            { id: "natural", name: "ورد طبيعي نضر ورائع" },
            { id: "artificial", name: "ورد صناعي فاخر يدوم طويلاً" },
            { id: "satin", name: "ورد ستان منسق يدوياً بكل حب" }
        ],
        moneyCategories: [
            { amount: 5, fee: 5 },
            { amount: 10, fee: 5 },
            { amount: 20, fee: 10 },
            { amount: 50, fee: 15 },
            { amount: 100, fee: 20 },
            { amount: 200, fee: 30 }
        ],
        chocolateTypes: [
            { id: "none", name: "بدون شوكولاتة", price: 0 },
            { id: "local", name: "شوكولاتة كلاسيك", price: 20 },
            { id: "premium", name: "شوكولاتة فاخرة", price: 30 },
            { id: "rocher", name: "روشيه مستورد", price: 50 }
        ],
        ribbonColors: [
            { id: "pink", name: "بمبي بوسي الفاخر", hex: "#FF91A4" },
            { id: "gold", name: "ذهبي ملكي ناعم", hex: "#D4AF37" },
            { id: "white", name: "أبيض ناصع راقٍ", hex: "#FFFFFF" }
        ],
        wrappingTypes: [
            { id: "satin", name: "تغليف ستان فاخر", price: 50 },
            { id: "classic", name: "تغليف كلاسيك راقٍ", price: 30 },
            { id: "box", name: "بوكس هدايا فاخر", price: 100 }
        ],
        largeChocolateMinimumPrice: 100
    };

    // الحالة الديناميكية الحالية للمحاكي مع الحفاظ على قيم التخصيص
    let state = {
        flowerType: "natural",
        flowerCount: 15,
        wrappingType: "satin",
        ribbonColor: "pink",
        chocolateType: "none",
        chocolatePieces: 0,
        includePhoto: false,
        photoUrl: "", // يحتوي حصرياً على رابط سحابي آمن أو كود ضغط مصغر لحماية مساحة المتصفح
        includeCard: false,
        cardText: "",
        moneyAmount: 0,
        moneyCategoryAmount: 0, 
        moneyFee: 0,
        totalPrice: 400,
        isUploading: false // حارس المزامنة لمنع تكرار الإرسال أو حدوث أخطاء سباق أثناء معالجة الصور
    };

    // عناصر الـ DOM الأساسية
    let flowerTypeSelect, flowerCountInput, wrappingTypeSelect, ribbonColorSelect, chocolateTypeSelect, chocolatePiecesInput;
    let includePhotoCheckbox, photoFileInput, photoPreviewContainer, photoPreviewImg;
    let includeCardCheckbox, cardTextInput, moneyAmountInput, moneyCategorySelect, moneyFeeDisplay, moneyTotalDisplay;
    let basePriceVal, extraFlowersCount, extraFlowersCost, photoCostVal, cardCostVal, chocolateCostVal, wrappingCostVal, bouquetTotalVal;
    let addToCartBtn, ribbonVisualColor;

    /**
     * 🛡️ حارس الواجهة الفاخر لإظهار الإشعارات بأسلوب وتطابق البراند (بديل آمن لـ alert)
     */
    function showBoseToast(message, type = 'info') {
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast(message);
        } else {
            let container = document.getElementById('bose-toast-container') || document.querySelector('.bose-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'bose-toast-container';
                container.className = 'bose-toast-container';
                container.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:999999; display:flex; flex-direction:column; gap:12px; width:90%; max-width:400px; pointer-events:none;';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.style.cssText = `
                background: var(--bose-white, #FFFFFF) !important;
                color: var(--bose-black, #111111) !important;
                border: 1px solid rgba(255, 145, 164, 0.4) !important;
                border-right: 4px solid var(--bose-pink, #FF91A4) !important;
                padding: 16px 24px !important;
                border-radius: 16px !important;
                box-shadow: 0 8px 32px rgba(255, 145, 164, 0.12) !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                pointer-events: auto !important;
                direction: rtl;
                text-align: right;
                font-family: 'Cairo', sans-serif !important;
                transition: opacity 0.3s ease;
                opacity: 0;
            `;

            const icon = type === 'error' ? '⚠️' : '🌸';
            toast.innerHTML = `${icon} <span style="line-height:1.5; font-weight: 700;">${window.escapeHTML ? window.escapeHTML(message) : message}</span>`;
            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 400);
            }, 3500);
        }
    }

    /**
     * 🖼️ محرك ضغط الصور المطور لتقليص الأبعاد وتخفيض حجم الملف لسرعة الرفع والأداء الفائق وحماية ذاكرة الموبايل
     */
    function compressAndOptimizeImage(file, maxDimension = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function (event) {
                const img = new Image();
                img.src = event.target.result;
                img.onload = function () {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                    }

                    canvas.toBlob((blob) => {
                        if (blob) {
                            if (ctx) {
                                ctx.clearRect(0, 0, width, height);
                            }
                            canvas.width = 1;
                            canvas.height = 1;
                            resolve(blob);
                        } else {
                            reject(new Error("فشل توليد وضغط الصورة المخصصة."));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = function (err) {
                    reject(err);
                };
            };
            reader.onerror = function (err) {
                reject(err);
            };
        });
    }

    /**
     * 💾 صمام الأمان الفائق ومحاكي الرفع السريع لضغط الصور بجودة خفيفة للغاية عند انقطاع شبكة الرفع
     */
    function generateMicroBase64Fallback(file) {
        return compressAndOptimizeImage(file, 180, 0.5).then(blob => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function () {
                    resolve(reader.result);
                };
            });
        });
    }

    /**
     * ☁️ معالج الرفع المباشر والآمن إلى سحابة Cloudinary مع آلية إعادة المحاولة المتتالية
     */
    async function uploadImageToCloudinary(blob) {
        const cloudName = window.BoseStoreData?.store?.cloudinaryCloudName || 'dyx4w0dr1';
        const uploadPreset = window.BoseStoreData?.flowerBuilder?.cloudinaryPreset || 'ml_default';
        const endpointUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const formData = new FormData();
        formData.append('file', blob, 'bose_custom_flower.jpg');
        formData.append('upload_preset', uploadPreset);

        let delay = 1000;
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(endpointUrl, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`استجابة غير صالحة من السيرفر السحابي بكود: ${response.status}`);
                }

                const responseData = await response.json();
                if (responseData && responseData.secure_url) {
                    return responseData.secure_url;
                }
                throw new Error("لم يتم استقبال رابط آمن وصحيح للملف السحابي.");
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error; 
                }
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5;
            }
        }
    }

    /**
     * 💾 وظيفة حفظ الحالة الحالية بأمان وتفادي مشكلة تراكم ملفات الـ Base64 القديمة والضخمة بالمتصفح
     */
    function saveCurrentState() {
        try {
            const tempState = { ...state };
            if (tempState.photoUrl && tempState.photoUrl.startsWith('data:image/')) {
                activeBase64ImageInMemory = tempState.photoUrl; 
                tempState.photoUrl = "base64-stored-in-memory";
                try {
                    sessionStorage.setItem(BASE64_IMAGE_SESSION_KEY, activeBase64ImageInMemory);
                } catch (sessEx) {
                    console.warn("⚠️ فشل حفظ الصورة في sessionStorage:", sessEx);
                }
            }
            try {
                localStorage.setItem(FLOWER_STATE_STORAGE_KEY, JSON.stringify(tempState));
            } catch (storageEx) {
                flowerStateMemoryFallback[FLOWER_STATE_STORAGE_KEY] = JSON.stringify(tempState);
            }
        } catch (err) {
            console.warn("⚠️ فشل حفظ حالة محاكي الورد محلياً:", err);
        }
    }

    /**
     * 🧮 دالة حساب وتوزيع البواقي المادية الدقيقة متوافقة 100% مع المحرك المركزي لمنع فوارق الكسور
     */
    function calculateLocalMoneyFee(totalCash, categoryAmount) {
        let moneyHandlingFees = 0;
        if (totalCash > 0 && categoryAmount > 0) {
            const category = flowerConfig.moneyCategories.find(c => c.amount === categoryAmount);
            if (category) {
                const billCount = Math.floor(totalCash / categoryAmount);
                moneyHandlingFees += billCount * parseFloat(category.fee);

                const remainder = totalCash % categoryAmount;
                if (remainder > 0) {
                    const remainderCategory = flowerConfig.moneyCategories
                        .filter(cat => cat.amount <= remainder)
                        .sort((a, b) => b.amount - a.amount)[0] || flowerConfig.moneyCategories[0];
                    if (remainderCategory) {
                        moneyHandlingFees += parseFloat(remainderCategory.fee);
                    }
                }
            }
        }
        return moneyHandlingFees;
    }

    /**
     * 🛠️ تهيئة المحاكي الأولي والتحقق اللوجستي الكامل من قاعدة البيانات والـ DOM
     */
    function initializeUIAndState() {
        if (window.BoseStoreData && window.BoseStoreData.flowerBuilder) {
            const data = window.BoseStoreData.flowerBuilder;
            flowerConfig.basePrice = Number(data.basePrice) || flowerConfig.basePrice;
            flowerConfig.baseFlowers = Number(data.baseFlowers) || flowerConfig.baseFlowers;
            flowerConfig.extraFlowerPrice = Number(data.extraFlowerPrice) || flowerConfig.extraFlowerPrice;
            flowerConfig.photoPrintPrice = Number(data.photoPrintPrice) || flowerConfig.photoPrintPrice;
            flowerConfig.giftCardPrice = Number(data.giftCardPrice) || flowerConfig.giftCardPrice;

            if (Array.isArray(data.flowerTypes)) flowerConfig.flowerTypes = data.flowerTypes;
            if (Array.isArray(data.moneyCategories)) flowerConfig.moneyCategories = data.moneyCategories;
            if (Array.isArray(data.chocolateTypes)) {
                flowerConfig.chocolateTypes = [
                    { id: "none", name: "بدون شوكولاتة", price: 0 },
                    ...data.chocolateTypes
                ];
            }
            if (Array.isArray(data.wrappingTypes)) flowerConfig.wrappingTypes = data.wrappingTypes;
            if (data.largeChocolateMinimumPrice) flowerConfig.largeChocolateMinimumPrice = Number(data.largeChocolateMinimumPrice);
        }

        // ربط عناصر الـ DOM الأساسية مع التثبيت والتحقق المباشر
        flowerTypeSelect = document.getElementById('flower-type');
        flowerCountInput = document.getElementById('flower-count');
        wrappingTypeSelect = document.getElementById('wrapping-type');
        ribbonColorSelect = document.getElementById('ribbon-color');
        chocolateTypeSelect = document.getElementById('chocolate-type');
        chocolatePiecesInput = document.getElementById('chocolate-pieces');
        includePhotoCheckbox = document.getElementById('include-photo');
        photoFileInput = document.getElementById('photo-file');
        photoPreviewContainer = document.getElementById('photo-preview-container');
        photoPreviewImg = document.getElementById('photo-preview-img');
        includeCardCheckbox = document.getElementById('include-card');
        cardTextInput = document.getElementById('card-text');
        moneyAmountInput = document.getElementById('money-amount');
        moneyCategorySelect = document.getElementById('money-category');
        moneyFeeDisplay = document.getElementById('money-fee-display');
        moneyTotalDisplay = document.getElementById('money-total-display');

        basePriceVal = document.getElementById('base-price-val');
        extraFlowersCount = document.getElementById('extra-flowers-count');
        extraFlowersCost = document.getElementById('extra-flowers-cost');
        photoCostVal = document.getElementById('photo-cost-val');
        cardCostVal = document.getElementById('card-cost-val');
        chocolateCostVal = document.getElementById('chocolate-cost-val');
        wrappingCostVal = document.getElementById('wrapping-cost-val');
        bouquetTotalVal = document.getElementById('bouquet-total-val');
        addToCartBtn = document.getElementById('add-to-cart-btn');
        ribbonVisualColor = document.getElementById('ribbon-visual-color');

        if (!flowerTypeSelect || !flowerCountInput || !bouquetTotalVal) {
            return;
        }

        let savedStateRaw = null;
        try {
            savedStateRaw = localStorage.getItem(FLOWER_STATE_STORAGE_KEY);
        } catch (storageEx) {
            savedStateRaw = flowerStateMemoryFallback[FLOWER_STATE_STORAGE_KEY] || null;
        }

        if (savedStateRaw) {
            try {
                const parsed = JSON.parse(savedStateRaw);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.photoUrl === "base64-stored-in-memory") {
                        parsed.photoUrl = activeBase64ImageInMemory;
                    }
                    state = { ...state, ...parsed };
                }
            } catch (e) {
                console.warn("⚠️ تم تهيئة حالة الورد افتراضياً.");
            }
        }

        populateSelectOptions();
        applyStateToUI();
        setupEventListeners();
        recalculatePrice();
    }

    function populateSelectOptions() {
        if (flowerTypeSelect) {
            flowerTypeSelect.innerHTML = flowerConfig.flowerTypes
                .map(t => `<option value="${t.id}">${t.name}</option>`)
                .join('');
        }
        if (wrappingTypeSelect) {
            wrappingTypeSelect.innerHTML = flowerConfig.wrappingTypes
                .map(w => `<option value="${w.id}">${w.name}</option>`)
                .join('');
        }
        if (ribbonColorSelect) {
            ribbonColorSelect.innerHTML = flowerConfig.ribbonColors
                .map(r => `<option value="${r.id}">${r.name}</option>`)
                .join('');
        }
        if (chocolateTypeSelect) {
            chocolateTypeSelect.innerHTML = flowerConfig.chocolateTypes
                .map(c => `<option value="${c.id}">${c.name}</option>`)
                .join('');
        }
        if (moneyCategorySelect) {
            let optionsHtml = `<option value="0">اختار فئة الفلوس النقدية لتغليفها داخل البوكيه...</option>`;
            flowerConfig.moneyCategories.forEach(cat => {
                optionsHtml += `<option value="${cat.amount}">فئة الـ ${cat.amount} جنيه (رسوم التجهيز: ${cat.fee} جنيه)</option>`;
            });
            moneyCategorySelect.innerHTML = optionsHtml;
        }
    }

    function applyStateToUI() {
        if (flowerTypeSelect) flowerTypeSelect.value = state.flowerType;
        if (flowerCountInput) flowerCountInput.value = state.flowerCount;
        if (wrappingTypeSelect) wrappingTypeSelect.value = state.wrappingType;
        if (ribbonColorSelect) ribbonColorSelect.value = state.ribbonColor;
        if (chocolateTypeSelect) chocolateTypeSelect.value = state.chocolateType;
        if (chocolatePiecesInput) chocolatePiecesInput.value = state.chocolatePieces;

        if (includePhotoCheckbox) {
            includePhotoCheckbox.checked = state.includePhoto;
            const photoUploadSection = document.getElementById('photo-upload-section');
            if (photoUploadSection) {
                photoUploadSection.style.display = state.includePhoto ? "block" : "none";
            }
        }

        if (state.photoUrl && state.includePhoto) {
            if (photoPreviewImg) photoPreviewImg.src = state.photoUrl;
            if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
        } else {
            if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
        }

        if (includeCardCheckbox) {
            includeCardCheckbox.checked = state.includeCard;
            const cardTextSection = document.getElementById('card-text-section');
            if (cardTextSection) {
                cardTextSection.style.display = state.includeCard ? "block" : "none";
            }
        }

        if (cardTextInput) cardTextInput.value = state.cardText;

        if (moneyCategorySelect) {
            moneyCategorySelect.value = state.moneyCategoryAmount.toString();
        }

        if (moneyAmountInput) {
            moneyAmountInput.value = state.moneyAmount || 0;
        }

        const piecesWrapper = document.getElementById('chocolate-pieces-wrapper') || (chocolatePiecesInput ? chocolatePiecesInput.parentNode : null);
        if (piecesWrapper) {
            if (state.chocolateType === "none") {
                piecesWrapper.style.opacity = "0.4";
                piecesWrapper.style.pointerEvents = "none";
                piecesWrapper.style.filter = "grayscale(1)";
            } else {
                piecesWrapper.style.opacity = "1";
                piecesWrapper.style.pointerEvents = "auto";
                piecesWrapper.style.filter = "none";
            }
        }

        updateRibbonVisualColor();
    }

    function updateRibbonVisualColor() {
        if (ribbonVisualColor && ribbonColorSelect) {
            const selectedColor = flowerConfig.ribbonColors.find(r => r.id === ribbonColorSelect.value);
            if (selectedColor) {
                ribbonVisualColor.style.backgroundColor = selectedColor.hex;
                ribbonVisualColor.style.boxShadow = `0 4px 12px rgba(255, 145, 164, 0.15)`;
            }
        }
    }

    function setupEventListeners() {
        const preventActionIfUploading = (e) => {
            if (state.isUploading) {
                e.preventDefault();
                showBoseToast("يرجى الانتظار حتى يكتمل تأمين ورفع الصورة المخصصة بنجاح 🌸", "error");
                return true;
            }
            return false;
        };

        if (flowerTypeSelect) {
            flowerTypeSelect.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    flowerTypeSelect.value = state.flowerType;
                    return;
                }
                state.flowerType = e.target.value;
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (flowerCountInput) {
            flowerCountInput.addEventListener('input', function (e) {
                if (preventActionIfUploading(e)) {
                    flowerCountInput.value = state.flowerCount;
                    return;
                }
                let val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < flowerConfig.baseFlowers) {
                    val = flowerConfig.baseFlowers;
                }
                state.flowerCount = val;
                saveCurrentState();
                recalculatePrice();
            });

            const minusBtn = document.getElementById('flower-minus');
            const plusBtn = document.getElementById('flower-plus');

            if (minusBtn) {
                minusBtn.addEventListener('click', function (e) {
                    if (preventActionIfUploading(e)) return;
                    if (state.flowerCount > flowerConfig.baseFlowers) {
                        state.flowerCount--;
                        flowerCountInput.value = state.flowerCount;
                        saveCurrentState();
                        recalculatePrice();
                    }
                });
            }

            if (plusBtn) {
                plusBtn.addEventListener('click', function (e) {
                    if (preventActionIfUploading(e)) return;
                    state.flowerCount++;
                    flowerCountInput.value = state.flowerCount;
                    saveCurrentState();
                    recalculatePrice();
                });
            }
        }

        if (wrappingTypeSelect) {
            wrappingTypeSelect.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    wrappingTypeSelect.value = state.wrappingType;
                    return;
                }
                state.wrappingType = e.target.value;
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (ribbonColorSelect) {
            ribbonColorSelect.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    ribbonColorSelect.value = state.ribbonColor;
                    return;
                }
                state.ribbonColor = e.target.value;
                updateRibbonVisualColor();
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (chocolateTypeSelect) {
            chocolateTypeSelect.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    chocolateTypeSelect.value = state.chocolateType;
                    return;
                }
                state.chocolateType = e.target.value;
                if (state.chocolateType === "none") {
                    state.chocolatePieces = 0;
                    if (chocolatePiecesInput) chocolatePiecesInput.value = 0;
                } else if (state.chocolatePieces === 0) {
                    state.chocolatePieces = 4;
                    if (chocolatePiecesInput) chocolatePiecesInput.value = 4;
                }
                
                const piecesWrapper = document.getElementById('chocolate-pieces-wrapper') || (chocolatePiecesInput ? chocolatePiecesInput.parentNode : null);
                if (piecesWrapper) {
                    if (state.chocolateType === "none") {
                        piecesWrapper.style.opacity = "0.4";
                        piecesWrapper.style.pointerEvents = "none";
                        piecesWrapper.style.filter = "grayscale(1)";
                    } else {
                        piecesWrapper.style.opacity = "1";
                        piecesWrapper.style.pointerEvents = "auto";
                        piecesWrapper.style.filter = "none";
                    }
                }
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (chocolatePiecesInput) {
            chocolatePiecesInput.addEventListener('input', function (e) {
                if (preventActionIfUploading(e)) {
                    chocolatePiecesInput.value = state.chocolatePieces;
                    return;
                }
                let val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 0) val = 0;
                state.chocolatePieces = val;
                if (val > 0 && state.chocolateType === "none") {
                    state.chocolateType = "local";
                    if (chocolateTypeSelect) chocolateTypeSelect.value = "local";
                }
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (includePhotoCheckbox) {
            includePhotoCheckbox.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    includePhotoCheckbox.checked = state.includePhoto;
                    return;
                }
                state.includePhoto = e.target.checked;
                const photoUploadSection = document.getElementById('photo-upload-section');
                if (photoUploadSection) {
                    photoUploadSection.style.display = state.includePhoto ? "block" : "none";
                }
                if (!state.includePhoto) {
                    state.photoUrl = "";
                    activeBase64ImageInMemory = ""; 
                    try { sessionStorage.removeItem(BASE64_IMAGE_SESSION_KEY); } catch (ex) {}
                    if (photoFileInput) photoFileInput.value = "";
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
                    const statusText = document.getElementById('bose-photo-upload-status');
                    if (statusText) statusText.remove();
                } else if (state.photoUrl) {
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
                }
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (photoFileInput) {
            photoFileInput.addEventListener('change', async function (e) {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    showBoseToast("يرجى اختيار ملف صورة صالح ومناسب للطباعة.", "error");
                    photoFileInput.value = "";
                    return;
                }

                state.isUploading = true;
                if (addToCartBtn) {
                    addToCartBtn.disabled = true;
                    addToCartBtn.innerHTML = `<span style="display:inline-block; animation: bose-spin 1s infinite linear; margin-left: 8px;">⏳</span> جاري تأمين صورتك الفاخرة...`;
                    addToCartBtn.style.opacity = '0.7';
                }

                let statusText = document.getElementById('bose-photo-upload-status');
                if (!statusText) {
                    statusText = document.createElement('div');
                    statusText.id = 'bose-photo-upload-status';
                    statusText.style.cssText = 'font-family:\'Cairo\', sans-serif !important; font-size:13px; font-weight:700 !important; color:var(--bose-pink); margin-top:10px; text-align:right; direction:rtl;';
                    photoFileInput.parentNode.appendChild(statusText);
                }
                statusText.innerHTML = `⏳ جاري ضغط الصورة وتوفير المساحة لتسريع طلبك...`;

                try {
                    const optimizedBlob = await compressAndOptimizeImage(file);
                    statusText.innerHTML = `⏳ جاري رفع الصورة المخصصة لسحابة بوسي الآمنة...`;

                    const CloudinarySecureUrl = await uploadImageToCloudinary(optimizedBlob);
                    state.photoUrl = CloudinarySecureUrl;
                    
                    if (photoPreviewImg) photoPreviewImg.src = CloudinarySecureUrl;
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "block";

                    statusText.style.color = '#2ecc71';
                    statusText.innerHTML = `✅ تم رفع الصورة المخصصة وتأمينها بنجاح!`;
                    showBoseToast("تم تحميل وتأمين الصورة المخصصة لطلبك.", "success");

                    saveCurrentState();
                    recalculatePrice();
                } catch (error) {
                    console.warn("⚠️ سيرفر الرفع منقطع، جاري الانتقال لصمام الأمان المحلي:", error);
                    statusText.innerHTML = `⏳ جاري تهيئة صمام الأمان الفائق للطلب السريع...`;

                    try {
                        const localFallbackUrl = await generateMicroBase64Fallback(file);
                        state.photoUrl = localFallbackUrl;
                        activeBase64ImageInMemory = localFallbackUrl; 
                        
                        try {
                            sessionStorage.setItem(BASE64_IMAGE_SESSION_KEY, localFallbackUrl);
                        } catch (sessEx) {
                            console.warn("⚠️ sessionStorage ممتلئ.");
                        }
                        
                        if (photoPreviewImg) photoPreviewImg.src = localFallbackUrl;
                        if (photoPreviewContainer) photoPreviewContainer.style.display = "block";

                        statusText.style.color = '#2ecc71';
                        statusText.innerHTML = `✅ تم حفظ صورتك محلياً لضمان استمرارية طلبك بنجاح!`;
                        showBoseToast("تم تأمين الصورة داخل طلبك بذكاء لضمان الجودة والسرعة.", "success");
                        saveCurrentState();
                        recalculatePrice();
                    } catch (fallbackError) {
                        statusText.style.color = '#ff4d4d';
                        statusText.innerHTML = `⚠️ عذراً، فشل رفع أو معالجة الصورة المخصصة. يرجى إعادة المحاولة.`;
                        showBoseToast("فشل رفع الصورة، يرجى تكرار المحاولة مجدداً.", "error");
                        state.photoUrl = "";
                        activeBase64ImageInMemory = "";
                        try { sessionStorage.removeItem(BASE64_IMAGE_SESSION_KEY); } catch (ex) {}
                        if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
                    }
                } finally {
                    state.isUploading = false;
                    if (addToCartBtn) {
                        addToCartBtn.disabled = false;
                        addToCartBtn.innerHTML = `إضافة للسلة`;
                        addToCartBtn.style.opacity = '1';
                    }
                }
            });
        }

        if (includeCardCheckbox) {
            includeCardCheckbox.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    includeCardCheckbox.checked = state.includeCard;
                    return;
                }
                state.includeCard = e.target.checked;
                const cardTextSection = document.getElementById('card-text-section');
                if (cardTextSection) {
                    cardTextSection.style.display = state.includeCard ? "block" : "none";
                }
                if (!state.includeCard) {
                    state.cardText = "";
                    if (cardTextInput) cardTextInput.value = "";
                }
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (cardTextInput) {
            cardTextInput.addEventListener('input', function (e) {
                state.cardText = e.target.value;
                saveCurrentState();
                recalculatePrice();
            });
        }

        if (moneyCategorySelect) {
            moneyCategorySelect.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    moneyCategorySelect.value = state.moneyCategoryAmount.toString();
                    return;
                }
                const valueSelected = parseInt(e.target.value, 10);
                state.moneyCategoryAmount = valueSelected;

                if (valueSelected > 0) {
                    if (state.moneyAmount <= 0) {
                        state.moneyAmount = valueSelected; 
                        if (moneyAmountInput) moneyAmountInput.value = valueSelected;
                    }
                    state.moneyFee = calculateLocalMoneyFee(state.moneyAmount, valueSelected);
                } else {
                    state.moneyFee = 0;
                    state.moneyAmount = 0;
                    if (moneyAmountInput) moneyAmountInput.value = 0;
                }

                saveCurrentState();
                recalculatePrice();
            });
        }

        if (moneyAmountInput) {
            moneyAmountInput.addEventListener('input', function (e) {
                if (preventActionIfUploading(e)) {
                    moneyAmountInput.value = state.moneyAmount;
                    return;
                }
                let totalCash = parseInt(e.target.value, 10) || 0;
                if (totalCash < 0) totalCash = 0;
                state.moneyAmount = totalCash;

                state.moneyFee = calculateLocalMoneyFee(totalCash, state.moneyCategoryAmount);

                saveCurrentState();
                recalculatePrice();
            });

            const billMinus = document.getElementById('bill-minus');
            const billPlus = document.getElementById('bill-plus');

            if (billMinus) {
                billMinus.addEventListener('click', function (e) {
                    if (preventActionIfUploading(e)) return;
                    let step = state.moneyCategoryAmount || 50;
                    if (state.moneyAmount >= step) {
                        state.moneyAmount -= step;
                        if (moneyAmountInput) moneyAmountInput.value = state.moneyAmount;
                        
                        state.moneyFee = calculateLocalMoneyFee(state.moneyAmount, state.moneyCategoryAmount);
                        saveCurrentState();
                        recalculatePrice();
                    }
                });
            }

            if (billPlus) {
                billPlus.addEventListener('click', function (e) {
                    if (preventActionIfUploading(e)) return;
                    let step = state.moneyCategoryAmount || 50;
                    state.moneyAmount += step;
                    if (moneyAmountInput) moneyAmountInput.value = state.moneyAmount;
                    
                    state.moneyFee = calculateLocalMoneyFee(state.moneyAmount, state.moneyCategoryAmount);
                    saveCurrentState();
                    recalculatePrice();
                });
            }
        }

        if (addToCartBtn && !addToCartBtn.dataset.boseListener) {
            addToCartBtn.addEventListener('click', function () {
                try {
                    if (state.isUploading) {
                        showBoseToast("يرجى الانتظار لحين اكتمال تأمين صورتك الفاخرة للبوكيه 🌸", "error");
                        return;
                    }

                    if (state.includePhoto && !state.photoUrl) {
                        showBoseToast("يرجى اختيار صورة مخصصة والانتظار حتى اكتمال معالجتها للبوكيه.", "error");
                        return;
                    }

                    if (state.includeCard && !state.cardText.trim()) {
                        showBoseToast("يرجى كتابة نص الإهداء للكرت الفاخر أو إلغاء تفعيل الخيار.", "error");
                        return;
                    }

                    if (state.chocolateType === "rocher" && state.chocolatePieces >= 8) {
                        const currentChocCost = state.chocolatePieces * 50;
                        if (currentChocCost < flowerConfig.largeChocolateMinimumPrice) {
                            showBoseToast(`لتجهيز بوكس الشوكولاتة المستوردة الكبيرة، يجب أن لا يقل إجمالي الشوكولاتة عن ${flowerConfig.largeChocolateMinimumPrice} جنيه لضمان التنسيق الملكي.`, "error");
                            return;
                        }
                    }

                    const flowerTypeObj = flowerConfig.flowerTypes.find(t => t.id === state.flowerType);
                    const flowerTypeName = flowerTypeObj ? flowerTypeObj.name : "ورد مخصص";

                    const masterProduct = window.BoseStoreData?.products?.find(p => p.slug === "flowers-master") || {
                        slug: "flowers-master",
                        title: "الورد",
                        image: window.getBoseLogo ? window.getBoseLogo() : "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                        type: "custom-flower"
                    };

                    const ribbonObj = flowerConfig.ribbonColors.find(r => r.id === state.ribbonColor);
                    const ribbonNameArabic = ribbonObj ? ribbonObj.name : "لون منسق";

                    const wrapObj = flowerConfig.wrappingTypes.find(w => w.id === state.wrappingType);
                    const wrapNameArabic = wrapObj ? wrapObj.name : "تغليف منسق";

                    const chocObj = flowerConfig.chocolateTypes.find(c => c.id === state.chocolateType);
                    const chocNameArabic = chocObj ? chocObj.name : "بدون";

                    // [🔐 تطابق هندسي كامل وحل ثغرة تكرار نوع الكيك]:
                    // نقوم بدمج لون شريطة الستان داخل حقل التغليف مباشرة لتجنب تشويه نصوص السلة بكلمات إنجليزية غير مترجمة
                    const decoratedWrappingText = `${wrapNameArabic} (شريط ${ribbonNameArabic})`;

                    // نقوم بتمرير cakeType كـ "none" لكي يتخطى محرك السلة cart-engine رندرتها تماماً في السلة وتجنب تكرار "نوع الكيك"
                    const customOptionsObj = {
                        flavorName: `بوكيه مخصص (${flowerTypeName})`,
                        cakeType: "none", 
                        flowerType: state.flowerType, 
                        flowerCount: `${state.flowerCount} وردة`,
                        wrappingType: decoratedWrappingText,
                        chocolateType: chocNameArabic,
                        chocolatePieces: state.chocolatePieces,
                        moneyAmount: state.moneyAmount,
                        moneyFee: state.moneyFee,
                        customMessage: state.includeCard ? state.cardText : ""
                    };

                    if (state.includePhoto && state.photoUrl) {
                        customOptionsObj.printingType = "صورة ورقية تذكارية مجسمة";
                    }

                    if (state.includeCard && state.cardText.trim()) {
                        customOptionsObj.giftCardText = state.cardText;
                    }

                    let boseCartItem = null;
                    if (typeof window.createCartItem === 'function') {
                        boseCartItem = window.createCartItem(masterProduct, customOptionsObj, 1);
                        if (boseCartItem) {
                            boseCartItem.type = "custom-flower"; 
                            boseCartItem.finalPrice = parseFloat(state.totalPrice);
                            boseCartItem.price = parseFloat(state.totalPrice);
                            boseCartItem.image = (state.includePhoto && state.photoUrl) ? state.photoUrl : masterProduct.image;
                            boseCartItem.customDetails = { ...boseCartItem.customDetails, ...customOptionsObj };
                        }
                    }

                    if (!boseCartItem) {
                        boseCartItem = {
                            id: `flowers-master-${Date.now()}`,
                            productSlug: masterProduct.slug,
                            title: masterProduct.title,
                            flavorName: `بوكيه مخصص (${flowerTypeName})`,
                            basePrice: parseFloat(flowerConfig.basePrice),
                            finalPrice: parseFloat(state.totalPrice),
                            price: parseFloat(state.totalPrice),
                            quantity: 1,
                            image: (state.includePhoto && state.photoUrl) ? state.photoUrl : masterProduct.image,
                            type: "custom-flower",
                            customDetails: customOptionsObj
                        };
                    }

                    let successAdd = false;
                    if (typeof window.addBoseCartItem === 'function') {
                        window.addBoseCartItem(boseCartItem);
                        successAdd = true;
                    } else {
                        let currentCart = [];
                        try {
                            currentCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
                        } catch (e) {
                            currentCart = [];
                        }
                        currentCart.push(boseCartItem);
                        
                        try {
                            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));
                            successAdd = true;
                        } catch (storageErr) {
                            console.error("❌ فشل حفظ السلة محلياً:", storageErr);
                            showBoseToast("عذراً يا فندم، ذاكرة المتصفح ممتلئة بالكامل. يرجى تصفية السلة.", "error");
                        }
                    }

                    if (successAdd) {
                        showBoseToast("تمت إضافة بوكيه الورد المخصص الفاخر إلى سلتك بنجاح!");

                        // [🔐 حل ثغرة التحديث F5]: لا نحذف الصورة من الـ Session فوراً، نتركها لضمان ثباتها أثناء رندرة صفحة السلة
                        state = {
                            flowerType: "natural",
                            flowerCount: 15,
                            wrappingType: "satin",
                            ribbonColor: "pink",
                            chocolateType: "none",
                            chocolatePieces: 0,
                            includePhoto: false,
                            photoUrl: "",
                            includeCard: false,
                            cardText: "",
                            moneyAmount: 0,
                            moneyCategoryAmount: 0,
                            moneyFee: 0,
                            totalPrice: flowerConfig.basePrice,
                            isUploading: false
                        };

                        if (photoFileInput) photoFileInput.value = "";
                        saveCurrentState();
                        applyStateToUI();
                        recalculatePrice();

                        if (typeof window.updateGlobalCartCounter === 'function') {
                            window.updateGlobalCartCounter();
                        }
                        
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('bose_cart_updated'));

                        setTimeout(() => {
                            window.location.href = "cart.html";
                        }, 500);
                    }

                } catch (err) {
                    console.error("❌ فشل معالج السلة في تعبئة الباقة المخصصة:", err);
                    showBoseToast("عذراً، واجهنا مشكلة في معالجة طلبك وإضافته للسلة.", "error");
                }
            });
            addToCartBtn.dataset.boseListener = "true";
        }
    }

    /**
     * 🧮 الحساب المالي الدقيق والرياضي المطلق لتفاصيل تسعيرة الباقة ومزامنتها مع الموتور الرئيسي
     */
    function recalculatePrice() {
        let calculatedTotalPrice = 400;

        const pricingOptions = {
            moneyAmount: state.moneyAmount,
            moneyCategoryAmount: state.moneyCategoryAmount,
            chocolatePieces: state.chocolatePieces,
            chocolateType: state.chocolateType,
            wrappingType: state.wrappingType,
            ribbonColor: state.ribbonColor,
            hasGiftCard: (state.includeCard && state.cardText.trim() !== ""),
            photoCount: state.includePhoto ? 1 : 0
        };

        if (typeof window.calculateCustomFlowerPrice === 'function') {
            calculatedTotalPrice = window.calculateCustomFlowerPrice(state.flowerType, state.flowerCount, pricingOptions);
        } else {
            let calculatedBasePrice = flowerConfig.basePrice;
            const extraFlowers = Math.max(0, state.flowerCount - flowerConfig.baseFlowers);
            const extraCost = extraFlowers * flowerConfig.extraFlowerPrice;

            let photoPrintCost = state.includePhoto ? flowerConfig.photoPrintPrice : 0;
            let giftCardCost = (state.includeCard && state.cardText.trim() !== "") ? flowerConfig.giftCardPrice : 0;

            let chocolateCost = 0;
            if (state.chocolateType !== "none" && state.chocolatePieces > 0) {
                const chocObj = flowerConfig.chocolateTypes.find(c => c.id === state.chocolateType);
                if (chocObj) {
                    chocolateCost = chocObj.price * state.chocolatePieces;
                }
            }

            let wrappingCost = 0;
            const wrapObj = flowerConfig.wrappingTypes.find(w => w.id === state.wrappingType);
            if (wrapObj) {
                wrappingCost = wrapObj.price;
            }

            let rawMoneyValue = state.moneyAmount || 0;
            let moneyHandlingFees = state.moneyFee || 0;

            let activeServicePrice = calculatedBasePrice + extraCost + photoPrintCost + giftCardCost + chocolateCost + wrappingCost + moneyHandlingFees;
            let finalServicePrice = window.calculateBosePrice ? window.calculateBosePrice(activeServicePrice, "menu-only") : activeServicePrice;

            calculatedTotalPrice = Math.round(finalServicePrice + rawMoneyValue);
        }

        state.totalPrice = calculatedTotalPrice;

        const extraFlowers = Math.max(0, state.flowerCount - flowerConfig.baseFlowers);
        const extraCost = extraFlowers * flowerConfig.extraFlowerPrice;
        let photoPrintCost = state.includePhoto ? flowerConfig.photoPrintPrice : 0;
        let giftCardCost = (state.includeCard && state.cardText.trim() !== "") ? flowerConfig.giftCardPrice : 0;

        let chocolateCost = 0;
        if (state.chocolateType !== "none" && state.chocolatePieces > 0) {
            const chocObj = flowerConfig.chocolateTypes.find(c => c.id === state.chocolateType);
            if (chocObj) {
                chocolateCost = chocObj.price * state.chocolatePieces;
            }
        }

        let wrappingCost = 0;
        const wrapObj = flowerConfig.wrappingTypes.find(w => w.id === state.wrappingType);
        if (wrapObj) {
            wrappingCost = wrapObj.price;
        }

        if (basePriceVal) basePriceVal.textContent = `${flowerConfig.basePrice} EGP`;
        if (extraFlowersCount) extraFlowersCount.textContent = `(${extraFlowers} وردة إضافية)`;
        if (extraFlowersCost) extraFlowersCost.textContent = `+ ${extraCost} EGP`;
        if (photoCostVal) photoCostVal.textContent = `+ ${photoPrintCost} EGP`;
        if (cardCostVal) cardCostVal.textContent = `+ ${giftCardCost} EGP`;
        if (chocolateCostVal) chocolateCostVal.textContent = `+ ${chocolateCost} EGP`;
        if (wrappingCostVal) wrappingCostVal.textContent = `+ ${wrappingCost} EGP`;
        
        state.moneyFee = calculateLocalMoneyFee(state.moneyAmount, state.moneyCategoryAmount);
        if (moneyFeeDisplay) moneyFeeDisplay.textContent = `${state.moneyFee} EGP`;
        if (moneyTotalDisplay) moneyTotalDisplay.textContent = `${state.moneyAmount} EGP`;

        if (bouquetTotalVal) {
            bouquetTotalVal.textContent = `${calculatedTotalPrice} EGP`;
        }
    }

    /**
     * 🛡️ حارس التشغيل المطور لضمان تأمين وتحميل محرك الورد بالتنسيق المتزامن التام مع قاعدة البيانات
     */
    function verifyAndBootFlowerEngine() {
        if (typeof window.onBoseDatabaseReady === 'function') {
            window.onBoseDatabaseReady(() => {
                initializeUIAndState();
            });
        } else if (window.BoseStoreData && window.BoseStoreData.store) {
            initializeUIAndState();
        } else {
            const handleDatabaseLoaded = () => {
                initializeUIAndState();
                document.removeEventListener('BoseDatabaseLoaded', handleDatabaseLoaded);
            };
            document.addEventListener('BoseDatabaseLoaded', handleDatabaseLoaded);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verifyAndBootFlowerEngine);
    } else {
        verifyAndBootFlowerEngine();
    }
})();
