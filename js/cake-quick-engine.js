/**
 * محرك صفحة "اطلبي تورتتك في خطوة واحدة" - حلويات بوسي V1.0
 * صفحة مستقلة مبسطة لعميل مستعجل أو مش عايز يدخل في تفاصيل المحاكي الكامل:
 * عدد أفراد + ملاحظات/مشاكل صحية + صورة اختيارية، ثم تأكيد وإضافة للسلة
 * بنفس آلية أي منتج عادي في الموقع.
 */

function startQuickOrderEngine() {
    const inputPersons = document.getElementById('qo-input-persons');
    const btnMinus = document.getElementById('qo-btn-persons-minus');
    const btnPlus = document.getElementById('qo-btn-persons-plus');
    const priceDisplay = document.getElementById('qo-price-display');
    const priceLabel = document.getElementById('qo-price-label');
    const notesField = document.getElementById('qo-notes');
    const btnConfirm = document.getElementById('qo-btn-confirm');

    const config = window.BoseStoreData?.cakeBuilder || {
        basePrice: 580,
        pricePerPerson: 145,
        persons: { minimum: 4, maximum: 250, step: 2 }
    };

    document.querySelectorAll('.bose-quick-notes-examples button').forEach((btn) => {
        btn.addEventListener('click', () => {
            const note = btn.dataset.note || "";
            const existing = notesField.value.trim();
            notesField.value = existing ? `${existing}، ${note}` : note;
        });
    });

    function updatePrice() {
        const currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        const finalPrice = window.calculateCustomCakePrice(currentPersons, { printingType: 'none' });
        if (priceLabel) priceLabel.textContent = `سعر التورتة الحالي لـ ${currentPersons} أفراد هو:`;
        if (priceDisplay) priceDisplay.textContent = `${Math.round(finalPrice)} جنيه`;
    }

    btnMinus.addEventListener('click', () => {
        let current = parseInt(inputPersons.value, 10) || config.persons.minimum;
        if (current > config.persons.minimum) {
            inputPersons.value = current - config.persons.step;
            updatePrice();
        }
    });
    btnPlus.addEventListener('click', () => {
        let current = parseInt(inputPersons.value, 10) || config.persons.minimum;
        if (current < config.persons.maximum) {
            inputPersons.value = current + config.persons.step;
            updatePrice();
        }
    });

    /* رفع صورة مرجعية اختيارية - نفس آلية الرفع الموحدة */
    let uploadedPhotoUrl = "";
    let isUploadingPhoto = false;
    const photoUploadZone = document.getElementById('qo-photo-upload-zone');
    const photoFileInput = document.getElementById('qo-photo-file');
    const photoPreviewImg = document.getElementById('qo-photo-preview-img');
    const photoUploadLabel = document.getElementById('qo-photo-upload-label');

    if (photoUploadZone && photoFileInput) {
        photoUploadZone.addEventListener('click', () => photoFileInput.click());
        photoFileInput.addEventListener('change', async function () {
            const file = this.files && this.files[0];
            if (!file) return;
            if (!window.BoseSupabase || typeof window.BoseSupabase.uploadBoseReferenceImage !== 'function') {
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر تحميل خدمة رفع الصور، حاول تحديث الصفحة.");
                }
                return;
            }
            isUploadingPhoto = true;
            if (photoUploadLabel) photoUploadLabel.textContent = "بيتم رفع الصورة الآن...";
            try {
                uploadedPhotoUrl = await window.BoseSupabase.uploadBoseReferenceImage(file, (txt) => {
                    if (photoUploadLabel) photoUploadLabel.textContent = txt;
                });
                if (photoPreviewImg) {
                    photoPreviewImg.src = uploadedPhotoUrl;
                    photoPreviewImg.style.display = 'block';
                }
                if (photoUploadLabel) photoUploadLabel.textContent = "تم رفع الصورة بنجاح ✓ (اضغط لتغييرها)";
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تم رفع صورتك بنجاح! ✨");
                }
            } catch (err) {
                uploadedPhotoUrl = "";
                if (photoUploadLabel) photoUploadLabel.textContent = "فشل الرفع، اضغط للمحاولة مرة أخرى";
                if (typeof window.showBoseGlobalToast === 'function') {
                    window.showBoseGlobalToast("تعذر رفع الصورة، تأكدي من الاتصال بالإنترنت وحاولي تاني.");
                }
            } finally {
                isUploadingPhoto = false;
            }
        });
    }

    function submitQuickOrder() {
        if (isUploadingPhoto) {
            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast("لسه بيتم رفع صورتك، استني ثواني وبعدين اضغطي تأكيد الحجز.");
            }
            return;
        }

        const currentPersons = parseInt(inputPersons.value, 10) || config.persons.minimum;
        const notesText = (notesField.value || "").trim();

        const masterProduct = window.BoseStoreData?.products?.find(p => p.slug === "toort-custom-master") || {
            slug: "toort-custom-master",
            title: "التورت",
            basePrice: config.basePrice,
            type: "custom-cake"
        };

        const customOptions = {
            cakeType: 'فانيليا',
            shape: 'circle',
            persons: currentPersons,
            printingType: 'none',
            customMessage: "",
            allergyNote: notesText,
            flavorName: "طلب سريع - تصميم كلاسيكي حسب اختيار الشيف",
            occasionLabel: "",
            hasReplicaDesign: !!uploadedPhotoUrl,
            hasGiftCard: false,
            giftCardText: "",
            printImageUrl: "",
            replicaImageUrl: uploadedPhotoUrl || "",
            isQuickOrder: true
        };

        const finalCartItem = window.createCartItem(masterProduct, customOptions, 1);
        if (!finalCartItem) return;

        let localCartRaw = localStorage.getItem('bose_cart');
        let boseCart = localCartRaw ? JSON.parse(localCartRaw) : [];

        finalCartItem.finalPrice = window.calculateCustomCakePrice(currentPersons, { printingType: 'none' });
        finalCartItem.type = "custom-cake";
        if (uploadedPhotoUrl) {
            finalCartItem.image = uploadedPhotoUrl;
            finalCartItem.referenceImages = [uploadedPhotoUrl];
        }

        boseCart.push(finalCartItem);
        localStorage.setItem('bose_cart', JSON.stringify(boseCart));

        if (typeof window.updateGlobalCartCounter === 'function') {
            window.updateGlobalCartCounter();
        }

        // 📊 [نمو - AddToCart]: طلب تورتة سريع بخطوة واحدة.
        if (typeof window.fireBoseCommerceEvent === 'function') {
            window.fireBoseCommerceEvent('add_to_cart', {
                value: finalCartItem.finalPrice, currency: window.BoseStoreData?.store?.currency || 'EGP',
                contentId: masterProduct.slug, contentName: masterProduct.title || 'التورت', quantity: 1
            });
        }

        if (typeof window.showBoseGlobalToast === 'function') {
            window.showBoseGlobalToast("تم حجز تورتتك بنجاح! تقدري تكملي طلبك من السلة دلوقتي.");
        }

        window.location.href = "/cart.html";
    }

    if (btnConfirm) btnConfirm.addEventListener('click', submitQuickOrder);

    updatePrice();
}

if (window.BoseStoreData && window.BoseStoreData.store) {
    startQuickOrderEngine();
} else {
    document.addEventListener("BoseDatabaseLoaded", () => {
        startQuickOrderEngine();
    });
}
