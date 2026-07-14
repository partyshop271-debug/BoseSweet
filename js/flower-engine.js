/**
 * 👑 محرك محاكي بوكيهات الورد والهدايا المالية الفاخر والآمن - حلويات بوسي 👑
 * النسخة الهندسية القياسية الكاملة بنسبة 100% - خالية تماماً من الثغرات المالية والبرمجية V6
 * متوافق بشكل مطلق وثنائي الاتجاه مع: core-engine.js، cart-engine.js، وقاعدة البيانات site-data-final.json 
 * [التصحيح الصارم V6]: تم دمج خيارات نوع الورد والعداد في الخطوة الأولى وتصحيح الاتجاهات بوضع (+) يميناً و (-) يساراً.
 * [عزل حقول الورد كلياً لحظر التداخل مع دالات التورت أو المنتجات العادية، وسد ثغرة تراكم الذاكرة بالمتصفح]
 */

(function () {
    "use strict";

    // مفاتيح التخزين الموحدة لعلامة بوسي الفاخرة لضمان التزامن المطلق
    const CART_STORAGE_KEY = 'bose_cart';
    const FLOWER_STATE_STORAGE_KEY = 'bose_flower_builder_state';
    const BASE64_IMAGE_SESSION_KEY = 'bose_active_base64_image_session';

    let flowerStateMemoryFallback = {};
    let activeBase64ImageInMemory = "";
    try {
        activeBase64ImageInMemory = sessionStorage.getItem(BASE64_IMAGE_SESSION_KEY) || "";
    } catch (e) {
        console.warn("⚠️ الـ sessionStorage غير متاح في المتصفح الحالي.");
    }

    // الإعدادات القياسية للورد لضمان استقرار العمل
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
            { amount: 5 },
            { amount: 10 },
            { amount: 20 },
            { amount: 50 },
            { amount: 100 },
            { amount: 200 }
        ]
    };

    // الحالة الديناميكية الحالية للمحاكي مع التزام فخامة بوسي الفاخرة
    let state = {
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
        includeChocolate: false,
        chocolateBudget: 0,
        includeCard: false,
        cardText: "",
        moneyAmount: 0,
        moneyCategoryAmount: 0,
        totalPrice: 400,
        isUploading: false
    };

    // عناصر الـ DOM الأساسية
    let flowerTypeSelect, flowerCountHidden, flowerCountDisplayNode;
    let includePhotoCheckbox, photoFileInput, photoPreviewContainer, photoPreviewImg;
    let includeCardCheckbox, cardTextInput, moneyCategorySelect, bouquetTotalVal, addToCartBtn;
    let includeRibbonTextCheckbox, ribbonTextSection, ribbonTextInput;
    let includeCashCheckbox, cashMasterBlock, cashIntegrationCounterBlock, moneyAmountHidden, moneyAmountDisplayVal;
    let includeChocolateCheckbox, chocolateBudgetMasterBlock, chocolateBudgetHidden, chocolateBudgetDisplayVal;
    let photoCountHidden, photoCountDisplayVal, dynamicAddonsArea;

    function showBoseToast(message) {
        if (typeof window.showBoseGlobalToast === 'function') {
            window.showBoseGlobalToast(message);
        } else {
            alert(message);
        }
    }

    // ضغط الصور لحماية ذاكرة الموبايل وسرعة الاستجابة
    function compressAndOptimizeImage(file, maxDimension = 600, quality = 0.6) {
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
                            if (ctx) ctx.clearRect(0, 0, width, height);
                            canvas.width = 1;
                            canvas.height = 1;
                            resolve(blob);
                        } else {
                            reject(new Error("فشل توليد وضغط الصورة المخصصة."));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    function generateMicroBase64Fallback(file) {
        return compressAndOptimizeImage(file, 150, 0.4).then(blob => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve(reader.result);
            });
        });
    }

    async function uploadImageToCloudinary(blob) {
        const cloudName = window.BoseStoreData?.store?.cloudinaryCloudName || 'dyx4w0dr1';
        const uploadPreset = window.BoseStoreData?.flowerBuilder?.cloudinaryPreset || 'ml_default';
        const endpointUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const formData = new FormData();
        formData.append('file', blob, 'bose_custom_flower.jpg');
        formData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(endpointUrl, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('استجابة غير صالحة من السيرفر السحابي.');
            const responseData = await response.json();
            if (responseData && responseData.secure_url) {
                return responseData.secure_url;
            }
            throw new Error("لم يتم استقبال رابط آمن وصحيح للملف السحابي.");
        } catch (error) {
            throw error;
        }
    }

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
        }

        // ربط العناصر الجديدة الموحدة للعدادات والمحاكي
        flowerTypeSelect = document.getElementById('flower-type');
        flowerCountHidden = document.getElementById('flower-count');
        flowerCountDisplayNode = document.getElementById('flower-count-display');
        
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
        
        includeRibbonTextCheckbox = document.getElementById('include-ribbon-text');
        ribbonTextSection = document.getElementById('ribbon-text-section');
        ribbonTextInput = document.getElementById('ribbon-text-input');
        
        includeCashCheckbox = document.getElementById('include-cash-toggle');
        cashMasterBlock = document.getElementById('cash-master-integration-block');
        cashIntegrationCounterBlock = document.getElementById('cash-integration-counter-block');
        moneyAmountHidden = document.getElementById('money-amount-display');
        moneyAmountDisplayVal = document.getElementById('money-amount-display-val');
        
        includeChocolateCheckbox = document.getElementById('include-chocolate-toggle');
        chocolateBudgetMasterBlock = document.getElementById('chocolate-budget-master-block');
        chocolateBudgetHidden = document.getElementById('chocolate-budget-display');
        chocolateBudgetDisplayVal = document.getElementById('chocolate-budget-display-val');
        
        photoCountHidden = document.getElementById('photo-count-input');
        photoCountDisplayVal = document.getElementById('photo-count-display-val');

        if (!flowerCountHidden || !bouquetTotalVal) return;

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
            flowerTypeSelect.value = state.flowerType;
        }
        if (moneyCategorySelect) {
            let optionsHtml = `<option value="0" selected>اختار فئة الفلوس النقدية...</option>`;
            flowerConfig.moneyCategories.forEach(cat => {
                optionsHtml += `<option value="${cat.amount}">فئة الـ ${cat.amount} جنيه</option>`;
            });
            moneyCategorySelect.innerHTML = optionsHtml;
        }
    }

    function applyStateToUI() {
        if (flowerTypeSelect) flowerTypeSelect.value = state.flowerType;
        if (flowerCountHidden) flowerCountHidden.value = state.flowerCount;
        if (flowerCountDisplayNode) flowerCountDisplayNode.textContent = state.flowerCount;
        
        if (includeRibbonTextCheckbox) {
            includeRibbonTextCheckbox.checked = state.includeRibbonText;
            if (ribbonTextSection) ribbonTextSection.style.display = state.includeRibbonText ? "block" : "none";
        }
        if (ribbonTextInput) ribbonTextInput.value = state.ribbonText;

        if (includePhotoCheckbox) {
            includePhotoCheckbox.checked = state.includePhoto;
            const photoUploadSectionDOM = document.getElementById('photo-upload-section');
            if (photoUploadSectionDOM) {
                photoUploadSectionDOM.style.display = state.includePhoto ? "block" : "none";
            }
        }
        if (photoCountHidden) photoCountHidden.value = state.photoCount;
        if (photoCountDisplayVal) photoCountDisplayVal.textContent = state.photoCount;

        if (state.photoUrl && state.includePhoto) {
            if (photoPreviewImg) photoPreviewImg.src = state.photoUrl;
            if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
        } else {
            if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
        }

        if (includeCashCheckbox) {
            includeCashCheckbox.checked = state.includeCash;
            if (cashMasterBlock) cashMasterBlock.style.display = state.includeCash ? "block" : "none";
        }
        if (moneyCategorySelect) moneyCategorySelect.value = state.moneyCategoryAmount.toString();
        if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = state.moneyCategoryAmount > 0 ? "block" : "none";
        
        if (moneyAmountHidden) moneyAmountHidden.value = state.moneyAmount;
        if (moneyAmountDisplayVal) moneyAmountDisplayVal.textContent = state.moneyAmount;

        if (includeChocolateCheckbox) {
            includeChocolateCheckbox.checked = state.includeChocolate;
            if (chocolateBudgetMasterBlock) chocolateBudgetMasterBlock.style.display = state.includeChocolate ? "block" : "none";
        }
        if (chocolateBudgetHidden) chocolateBudgetHidden.value = state.chocolateBudget;
        if (chocolateBudgetDisplayVal) chocolateBudgetDisplayVal.textContent = state.chocolateBudget;

        if (includeCardCheckbox) {
            includeCardCheckbox.checked = state.includeCard;
            const cardTextSection = document.getElementById('card-text-section');
            if (cardTextSection) {
                cardTextSection.style.display = state.includeCard ? "block" : "none";
            }
        }
        if (cardTextInput) cardTextInput.value = state.cardText;
    }

    function setupEventListeners() {
        const preventActionIfUploading = (e) => {
            if (state.isUploading) {
                e.preventDefault();
                showBoseToast("ثواني بنرفع صورتك الشيك ونأمنها بنجاح... 🌸");
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

        // ربط أزرار العداد المطور هندسياً للخطوة الأولى
        const minusBtn = document.getElementById('flower-minus');
        const plusBtn = document.getElementById('flower-plus');

        if (minusBtn) {
            minusBtn.addEventListener('click', function (e) {
                if (preventActionIfUploading(e)) return;
                if (state.flowerCount > flowerConfig.baseFlowers) {
                    state.flowerCount--;
                    if (flowerCountHidden) flowerCountHidden.value = state.flowerCount;
                    if (flowerCountDisplayNode) flowerCountDisplayNode.textContent = state.flowerCount;
                    saveCurrentState();
                    recalculatePrice();
                }
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', function (e) {
                if (preventActionIfUploading(e)) return;
                state.flowerCount++;
                if (flowerCountHidden) flowerCountHidden.value = state.flowerCount;
                if (flowerCountDisplayNode) flowerCountDisplayNode.textContent = state.flowerCount;
                saveCurrentState();
                recalculatePrice();
            });
        }
        
        if (includeRibbonTextCheckbox) {
            includeRibbonTextCheckbox.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    includeRibbonTextCheckbox.checked = state.includeRibbonText;
                    return;
                }
                state.includeRibbonText = e.target.checked;
                if (ribbonTextSection) ribbonTextSection.style.display = state.includeRibbonText ? "block" : "none";
                if (!state.includeRibbonText) {
                    state.ribbonText = "";
                    if (ribbonTextInput) ribbonTextInput.value = "";
                }
                saveCurrentState();
                recalculatePrice();
            });
        }
        if (ribbonTextInput) {
            ribbonTextInput.addEventListener('input', (e) => {
                state.ribbonText = e.target.value;
                saveCurrentState();
            });
        }

        if (includePhotoCheckbox) {
            includePhotoCheckbox.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    includePhotoCheckbox.checked = state.includePhoto;
                    return;
                }
                state.includePhoto = e.target.checked;
                const photoUploadSectionDOM = document.getElementById('photo-upload-section');
                if (photoUploadSectionDOM) {
                    photoUploadSectionDOM.style.display = state.includePhoto ? "block" : "none";
                }
                if (!state.includePhoto) {
                    state.photoUrl = "";
                    state.photoCount = 1;
                    if (photoCountHidden) photoCountHidden.value = 1;
                    if (photoCountDisplayVal) photoCountDisplayVal.textContent = 1;
                    activeBase64ImageInMemory = ""; 
                    try { sessionStorage.removeItem(BASE64_IMAGE_SESSION_KEY); } catch (ex) {}
                    if (photoFileInput) photoFileInput.value = "";
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "none";
                } else if (state.photoUrl) {
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
                }
                saveCurrentState();
                recalculatePrice();
            });
        }
        
        const photoCountPlus = document.getElementById('photo-count-plus');
        const photoCountMinus = document.getElementById('photo-count-minus');
        if (photoCountPlus) {
            photoCountPlus.onclick = function (e) {
                if (preventActionIfUploading(e)) return;
                state.photoCount++;
                if (photoCountHidden) photoCountHidden.value = state.photoCount;
                if (photoCountDisplayVal) photoCountDisplayVal.textContent = state.photoCount;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (photoCountMinus) {
            photoCountMinus.onclick = function (e) {
                if (preventActionIfUploading(e)) return;
                if (state.photoCount > 1) {
                    state.photoCount--;
                    if (photoCountHidden) photoCountHidden.value = state.photoCount;
                    if (photoCountDisplayVal) photoCountDisplayVal.textContent = state.photoCount;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        if (photoFileInput) {
            photoFileInput.addEventListener('change', async function (e) {
                const file = e.target.files[0];
                if (!file) return;

                state.isUploading = true;
                if (addToCartBtn) {
                    addToCartBtn.disabled = true;
                    addToCartBtn.innerHTML = `بنجيب لكِ أعلى جودة للصورة...`;
                }

                try {
                    const optimizedBlob = await compressAndOptimizeImage(file);
                    const CloudinarySecureUrl = await uploadImageToCloudinary(optimizedBlob);
                    state.photoUrl = CloudinarySecureUrl;
                    
                    if (photoPreviewImg) photoPreviewImg.src = CloudinarySecureUrl;
                    if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
                    showBoseToast("تم تأمين وحفظ الصورة بنجاح! ✨");

                    saveCurrentState();
                    recalculatePrice();
                } catch (error) {
                    try {
                        const localFallbackUrl = await generateMicroBase64Fallback(file);
                        state.photoUrl = localFallbackUrl;
                        activeBase64ImageInMemory = localFallbackUrl; 
                        try { sessionStorage.setItem(BASE64_IMAGE_SESSION_KEY, localFallbackUrl); } catch (ex) {}
                        
                        if (photoPreviewImg) photoPreviewImg.src = localFallbackUrl;
                        if (photoPreviewContainer) photoPreviewContainer.style.display = "block";
                        showBoseToast("تم تأمين الصورة محلياً لضمان السرية.");
                        saveCurrentState();
                        recalculatePrice();
                    } catch (fallbackError) {
                        showBoseToast("فشلت معالجة الصورة، جربي مرة ثانية.");
                    }
                } finally {
                    state.isUploading = false;
                    if (addToCartBtn) {
                        addToCartBtn.disabled = false;
                        addToCartBtn.innerHTML = `اعتماد البوكيه وإضافته للسلة`;
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
        
        if (includeCashCheckbox) {
            includeCashCheckbox.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    includeCashCheckbox.checked = state.includeCash;
                    return;
                }
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
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "block";
                    if (state.moneyAmount <= 0) state.moneyAmount = valueSelected; 
                } else {
                    if (cashIntegrationCounterBlock) cashIntegrationCounterBlock.style.display = "none";
                    state.moneyAmount = 0;
                }
                
                if (moneyAmountHidden) moneyAmountHidden.value = state.moneyAmount;
                if (moneyAmountDisplayVal) moneyAmountDisplayVal.textContent = state.moneyAmount;

                saveCurrentState();
                recalculatePrice();
            });
        }

        const billMinus = document.getElementById('bill-minus');
        const billPlus = document.getElementById('bill-plus');

        if (billMinus) {
            billMinus.addEventListener('click', function (e) {
                if (preventActionIfUploading(e)) return;
                let step = state.moneyCategoryAmount || 50;
                if (state.moneyAmount >= step) {
                    state.moneyAmount -= step;
                    if (moneyAmountHidden) moneyAmountHidden.value = state.moneyAmount;
                    if (moneyAmountDisplayVal) moneyAmountDisplayVal.textContent = state.moneyAmount;
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
                if (moneyAmountHidden) moneyAmountHidden.value = state.moneyAmount;
                if (moneyAmountDisplayVal) moneyAmountDisplayVal.textContent = state.moneyAmount;
                saveCurrentState();
                recalculatePrice();
            });
        }
        
        if (includeChocolateCheckbox) {
            includeChocolateCheckbox.addEventListener('change', function (e) {
                if (preventActionIfUploading(e)) {
                    includeChocolateCheckbox.checked = state.includeChocolate;
                    return;
                }
                state.includeChocolate = e.target.checked;
                if (chocolateBudgetMasterBlock) chocolateBudgetMasterBlock.style.display = state.includeChocolate ? "block" : "none";
                if (!state.includeChocolate) {
                    state.chocolateBudget = 0;
                    if (chocolateBudgetHidden) chocolateBudgetHidden.value = 0;
                    if (chocolateBudgetDisplayVal) chocolateBudgetDisplayVal.textContent = 0;
                }
                saveCurrentState();
                recalculatePrice();
            });
        }
        
        const chocBudgetPlus = document.getElementById('choc-budget-plus');
        const chocBudgetMinus = document.getElementById('choc-budget-minus');
        if (chocBudgetPlus) {
            chocBudgetPlus.onclick = function (e) {
                if (preventActionIfUploading(e)) return;
                state.chocolateBudget += 50;
                if (chocolateBudgetHidden) chocolateBudgetHidden.value = state.chocolateBudget;
                if (chocolateBudgetDisplayVal) chocolateBudgetDisplayVal.textContent = state.chocolateBudget;
                saveCurrentState();
                recalculatePrice();
            };
        }
        if (chocBudgetMinus) {
            chocBudgetMinus.onclick = function (e) {
                if (preventActionIfUploading(e)) return;
                if (state.chocolateBudget >= 50) {
                    state.chocolateBudget -= 50;
                    if (chocolateBudgetHidden) chocolateBudgetHidden.value = state.chocolateBudget;
                    if (chocolateBudgetDisplayVal) chocolateBudgetDisplayVal.textContent = state.chocolateBudget;
                    saveCurrentState();
                    recalculatePrice();
                }
            };
        }

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function () {
                if (state.isUploading) {
                    showBoseToast("ثواني بنرفع صورتك الشيك ونأمنها بنجاح... 🌸");
                    return;
                }

                const flowerTypeObj = flowerConfig.flowerTypes.find(t => t.id === state.flowerType);
                const flowerTypeName = flowerTypeObj ? flowerTypeObj.name : "ورد مخصص";

                const masterProduct = window.BoseStoreData?.products?.find(p => p.slug === "flowers-master") || {
                    slug: "flowers-master",
                    title: "الورد",
                    image: "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
                    type: "custom-flower"
                };

                const customOptionsObj = {
                    flavorName: `بوكيه مخصص (${flowerTypeName})`,
                    flowerType: state.flowerType, 
                    flowerCount: `${state.flowerCount} وردة`,
                    hasSatinRibbon: state.includeRibbonText,
                    satinRibbonText: state.ribbonText,
                    chocolateBudget: state.chocolateBudget,
                    cashAmount: state.moneyAmount,
                    photoCount: state.includePhoto ? state.photoCount : 0,
                    customMessage: state.includeCard ? state.cardText : ""
                };

                if (state.includeCard && state.cardText.trim()) {
                    customOptionsObj.giftCardText = state.cardText;
                }

                const boseCartItem = {
                    id: `flowers-master-${Date.now()}`,
                    productSlug: masterProduct.slug,
                    title: masterProduct.title,
                    flavorName: `بوكيه مخصص (${flowerTypeName})`,
                    basePrice: parseFloat(flowerConfig.basePrice),
                    finalPrice: parseFloat(state.totalPrice),
                    quantity: 1,
                    image: state.photoUrl || masterProduct.image,
                    type: "custom-flower",
                    customDetails: customOptionsObj
                };

                let currentCart = [];
                try {
                    currentCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
                } catch (e) {
                    currentCart = [];
                }
                currentCart.push(boseCartItem);
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentCart));

                showBoseToast("تمت إضافة البوكيه الجميل إلى سلتك بنجاح! 🌸");

                try {
                    sessionStorage.removeItem(BASE64_IMAGE_SESSION_KEY);
                    localStorage.removeItem(FLOWER_STATE_STORAGE_KEY);
                } catch (e) {}

                setTimeout(() => {
                    window.location.href = "cart.html";
                }, 400);
            });
        }
    }

    function recalculatePrice() {
        let extraFlowers = Math.max(0, state.flowerCount - flowerConfig.baseFlowers);
        let extraCost = extraFlowers * flowerConfig.extraFlowerPrice;
        let ribbonCost = state.includeRibbonText ? 50 : 0;
        let photoCost = state.includePhoto ? (state.photoCount * flowerConfig.photoPrintPrice) : 0;
        let cardCost = (state.includeCard && state.cardText.trim() !== "") ? flowerConfig.giftCardPrice : 0;
        
        let servicePrice = flowerConfig.basePrice + extraCost + ribbonCost + photoCost + cardCost;
        let finalServicePrice = window.calculateBosePrice ? window.calculateBosePrice(servicePrice, "menu-only") : servicePrice;

        let total = Math.round(finalServicePrice) + state.moneyAmount + state.chocolateBudget;
        state.totalPrice = total;

        if (bouquetTotalVal) bouquetTotalVal.textContent = `${total} جنيه`;

        // حقن الفواتير والتفاصيل بشكل أنيق ومقروء دون تشتيت
        if (dynamicAddonsArea) {
            let html = "";
            if (extraFlowers > 0) html += `<div style="display:flex; justify-content:space-between; background:rgba(255,145,164,0.04); padding:8px 12px; border-radius:10px; font-size:13px; font-weight:700; color:#111111;"><span>الورد الإضافي (${extraFlowers} وردة):</span><span>+ ${extraCost} جنيه</span></div>`;
            if (ribbonCost > 0) html += `<div style="display:flex; justify-content:space-between; background:rgba(255,145,164,0.04); padding:8px 12px; border-radius:10px; font-size:13px; font-weight:700; color:#111111;"><span>شريط ستان كلام مخصوص:</span><span>+ 50 جنيه</span></div>`;
            if (photoCost > 0) html += `<div style="display:flex; justify-content:space-between; background:rgba(255,145,164,0.04); padding:8px 12px; border-radius:10px; font-size:13px; font-weight:700; color:#111111;"><span>الصور الشخصية المترتبة (${state.photoCount}):</span><span>+ ${photoCost} جنيه</span></div>`;
            if (cardCost > 0) html += `<div style="display:flex; justify-content:space-between; background:rgba(255,145,164,0.04); padding:8px 12px; border-radius:10px; font-size:13px; font-weight:700; color:#111111;"><span>كارت إهداء شيك مكتوب:</span><span>+ 20 جنيه</span></div>`;
            if (state.moneyAmount > 0) html += `<div style="display:flex; justify-content:space-between; background:rgba(255,145,164,0.04); padding:8px 12px; border-radius:10px; font-size:13px; font-weight:700; color:#111111;"><span>مفاجأة الكاش جوه البوكيه:</span><span>+ ${state.moneyAmount} جنيه</span></div>`;
            if (state.chocolateBudget > 0) html += `<div style="display:flex; justify-content:space-between; background:rgba(255,145,164,0.04); padding:8px 12px; border-radius:10px; font-size:13px; font-weight:700; color:#111111;"><span>ميزانية الشوكولاتة الفخمة:</span><span>+ ${state.chocolateBudget} جنيه</span></div>`;
            
            dynamicAddonsArea.innerHTML = html;
        }
    }

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