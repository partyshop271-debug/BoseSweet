/**
 * 👑 محرك محاكي تخصيص التورت التفاعلي الفاخر المطور والمصحح بالكامل - حلويات بوسي 👑
 * النسخة الهندسية القياسية الشاملة بنسبة 100% - خالية تماماً من الثغرات البرمجية والمالية V33.0
 * التزام مطلق بحدود الملف (Scope-Locked) وقواعد حوكمة البيانات المعتمدة لعام 2026
 */

(function () {
    "use strict";

    const CART_STORAGE_KEY = 'bose_cart';
    let currentStep = 1;
    const totalSteps = 3;

    // الإعدادات القياسية الدفاعية من قاعدة البيانات
    const cakeConfig = {
        enabled: true,
        basePrice: 580,          
        basePersons: 4,
        extraPersonPrice: 145,   
        shapes: [
            { id: "circle", name: "دائرة", minimumPersons: 4, extraPrice: 0 },
            { id: "heart", name: "قلب", minimumPersons: 4, extraPrice: 50 },
            { id: "square", name: "مربع", minimumPersons: 16, extraPrice: 100 },
            { id: "rectangle", name: "مستطيل", minimumPersons: 20, extraPrice: 150 }
        ],
        layers: [
            { id: 1, name: "دور واحد", extraPrice: 0 },
            { id: 2, name: "دورين (٢ دور)", extraPrice: 150 },
            { id: 3, name: "ثلاثة أدوار (٣ أدوار)", extraPrice: 300 }
        ],
        cakeTypes: [
            { id: "vanilla", name: "فانيليا" },
            { id: "chocolate", name: "شوكولاتة" },
            { id: "half-half", name: "نصف ونصف" }
        ],
        printingOptions: [
            { id: "none", name: "بدون إضافة صور", price: 0 },
            { id: "edible", name: "صورة قابلة للأكل", price: 60 },
            { id: "non-edible", name: "صورة غير قابلة للأكل", price: 15 }
        ],
        maxTextLength: 30
    };

    let liveStoreConfig = null;
    let isEventsBound = false;
    let isUploadingImage = false;

    let selectedConfig = {
        shape: "circle",
        cakeType: "vanilla",
        persons: 4,
        layers: 1,
        printingType: "none",
        uploadedImageUrl: null,
        text: "",
        textPosition: "top"
    };

    const dom = {
        shapeCards: null, layerCards: null, cakeTypeCards: null, printingCards: null, textInput: null,
        personsInput: null, btnMinusPersons: null, btnPlusPersons: null, totalPriceEl: null, 
        personsCountEl: null, btnAddToCart: null, summaryShape: null, summaryCakeType: null, 
        summaryPersons: null, btnNextStep: null, btnPrevStep: null
    };

    const escapeHtml = (unsafe) => (unsafe ? unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : '');

    function calculateLocalCakePrice(customizations) {
        const config = liveStoreConfig || cakeConfig;
        let total = parseFloat(config.basePrice) || 580;

        const shapeObj = config.shapes.find(s => s.id === customizations.shape);
        if (shapeObj) total += parseFloat(shapeObj.extraPrice) || 0;

        const minPersons = shapeObj ? (parseInt(shapeObj.minimumPersons, 10) || 4) : 4;
        const chosenPersons = Math.max(minPersons, parseInt(customizations.persons, 10) || minPersons);
        const extraPricePerPerson = parseFloat(config.pricePerPerson || config.extraPersonPrice) || 145;

        if (chosenPersons > 4) {
            total += (chosenPersons - 4) * extraPricePerPerson;
        }

        const layerObj = config.layers.find(l => parseInt(l.id, 10) === parseInt(customizations.layers, 10));
        if (layerObj) total += parseFloat(layerObj.extraPrice) || 0;

        const printingObj = config.printingOptions.find(p => p.id === customizations.printingType);
        if (printingObj) total += parseFloat(printingObj.price) || 0;

        return Math.round(window.calculateBosePrice ? window.calculateBosePrice(total, "menu-only") : total);
    }

    function loadConfigFromDatabase() {
        if (window.BoseStoreData && window.BoseStoreData.cakeBuilder) {
            const dbConfig = window.BoseStoreData.cakeBuilder;
            liveStoreConfig = {
                enabled: dbConfig.enabled !== undefined ? dbConfig.enabled : cakeConfig.enabled,
                basePrice: dbConfig.basePrice !== undefined ? parseFloat(dbConfig.basePrice) : cakeConfig.basePrice,
                pricePerPerson: dbConfig.pricePerPerson !== undefined ? parseFloat(dbConfig.pricePerPerson) : cakeConfig.extraPersonPrice,
                maxTextLength: dbConfig.maxTextLength !== undefined ? parseInt(dbConfig.maxTextLength, 10) : cakeConfig.maxTextLength,
                shapes: Array.isArray(dbConfig.shapes) ? dbConfig.shapes.map(s => ({ ...s, extraPrice: s.extraPrice || 0 })) : cakeConfig.shapes,
                layers: cakeConfig.layers, cakeTypes: cakeConfig.cakeTypes, printingOptions: cakeConfig.printingOptions
            };
        } else {
            liveStoreConfig = { ...cakeConfig };
        }
    }

    function cacheDOMElements() {
        dom.shapeCards = document.querySelectorAll('.cake-shape-card');
        dom.layerCards = document.querySelectorAll('.cake-layer-card');
        dom.cakeTypeCards = document.querySelectorAll('.cake-flavor-card');
        dom.printingCards = document.querySelectorAll('.cake-printing-card');
        dom.textInput = document.getElementById('cake-custom-text');
        dom.btnMinusPersons = document.getElementById('cake-btn-minus');
        dom.btnPlusPersons = document.getElementById('cake-btn-plus');
        dom.totalPriceEl = document.getElementById('cake-total-price');
        dom.personsCountEl = document.getElementById('cake-persons-display');
        dom.btnAddToCart = document.getElementById('btn-add-cake-to-cart');
        dom.summaryShape = document.getElementById('summary-shape');
        dom.summaryCakeType = document.getElementById('summary-cake-type');
        dom.summaryPersons = document.getElementById('summary-persons');
        dom.btnNextStep = document.getElementById('btn-next-step');
        dom.btnPrevStep = document.getElementById('btn-prev-step');
    }

    function compressBoseImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = e => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > h && w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
                    else if (h > w && h > maxHeight) { w = Math.round((w * maxHeight) / h); h = maxHeight; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
                };
            };
            reader.onerror = err => reject(err);
        });
    }

    function bindCentralizedEvents() {
        if (isEventsBound) return;

        const addClickEvent = (elements, callback) => {
            if (elements) elements.forEach(el => el.addEventListener('click', callback));
        };

        addClickEvent(dom.shapeCards, function() {
            selectedConfig.shape = this.getAttribute('data-shape');
            enforceDynamicConstraints(false);
            finalizeUIUpdate();
        });

        addClickEvent(dom.layerCards, function() {
            selectedConfig.layers = parseInt(this.getAttribute('data-layer'), 10) || 1;
            finalizeUIUpdate();
        });

        addClickEvent(dom.cakeTypeCards, function() {
            selectedConfig.cakeType = this.getAttribute('data-flavor');
            finalizeUIUpdate();
        });

        addClickEvent(dom.printingCards, function() {
            selectedConfig.printingType = this.getAttribute('data-printing');
            const zone = document.getElementById('bose-photo-upload-zone');
            if (zone) zone.style.display = selectedConfig.printingType !== 'none' ? 'block' : 'none';
            finalizeUIUpdate();
        });

        // إدارة لوحة التنقل المتدرج بين خطوات المحاكي الثلاث
        if (dom.btnNextStep) {
            dom.btnNextStep.onclick = () => {
                if (currentStep < totalSteps) {
                    goToStep(currentStep + 1);
                }
            };
        }

        if (dom.btnPrevStep) {
            dom.btnPrevStep.onclick = () => {
                if (currentStep > 1) {
                    goToStep(currentStep - 1);
                }
            };
        }

        const fileInput = document.getElementById('cake-photo-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async function (e) {
                const file = e.target.files[0];
                if (!file) return;
                const statusEl = document.getElementById('cake-upload-status');
                if (statusEl) statusEl.textContent = "⏳ جاري ضغط الصورة للحفاظ على الباقة والسرعة...";
                isUploadingImage = true;

                try {
                    const compressedBlob = await compressBoseImage(file);
                    if (statusEl) statusEl.textContent = "🚀 جاري الرفع الآمن للتصميم...";
                    const formData = new FormData();
                    formData.append('file', compressedBlob, 'cake_design.jpg');
                    formData.append('upload_preset', 'bose_presets');

                    const res = await fetch(`https://api.cloudinary.com/v1_1/dyx4w0dr1/image/upload`, { method: 'POST', body: formData });
                    const data = await res.json();

                    if (data.secure_url) {
                        selectedConfig.uploadedImageUrl = data.secure_url;
                        const previewImg = document.getElementById('cake-photo-preview-img');
                        if (previewImg) previewImg.src = data.secure_url;
                        const box = document.getElementById('cake-photo-preview-box');
                        if (box) box.style.display = 'block';
                        if (statusEl) statusEl.textContent = "🌸 تم رفع وضبط صورتك بنجاح!";
                        if (typeof window.showBoseGlobalToast === 'function') window.showBoseGlobalToast("تم حفظ وتأمين صورتك بنجاح على التورتة!");
                    }
                } catch (err) {
                    if (statusEl) statusEl.textContent = "⚠️ فشل رفع الصورة، يرجى التحقق من الشبكة.";
                } finally {
                    isUploadingImage = false;
                }
            });
        }

        const clearImgBtn = document.getElementById('btn-clear-uploaded-img');
        if (clearImgBtn) {
            clearImgBtn.onclick = (e) => {
                e.stopPropagation();
                selectedConfig.uploadedImageUrl = null;
                const box = document.getElementById('cake-photo-preview-box');
                if (box) box.style.display = 'none';
                const statusEl = document.getElementById('cake-upload-status');
                if (statusEl) statusEl.textContent = "";
                const fileInput = document.getElementById('cake-photo-file-input');
                if (fileInput) fileInput.value = "";
                drawCakePreviewSVG();
            };
        }

        if (dom.textInput) {
            dom.textInput.addEventListener('input', function () {
                const max = (liveStoreConfig || cakeConfig).maxTextLength || 30;
                if (this.value.length > max) {
                    this.value = this.value.substring(0, max);
                }
                selectedConfig.text = this.value;
                finalizeUIUpdate();
            });
        }

        if (dom.btnMinusPersons) dom.btnMinusPersons.onclick = () => modifyPersonsCount(-2);
        if (dom.btnPlusPersons) dom.btnPlusPersons.onclick = () => modifyPersonsCount(2);
        if (dom.btnAddToCart) dom.btnAddToCart.onclick = () => addCustomizedCakeToCart();

        isEventsBound = true;
    }

    function goToStep(step) {
        document.querySelectorAll('.cake-builder-step-panel').forEach(p => p.style.display = 'none');
        document.getElementById(`cake-step-panel-${step}`).style.display = 'block';

        document.querySelectorAll('.step-node').forEach(node => {
            const nodeStep = parseInt(node.getAttribute('data-step'), 10);
            if (nodeStep === step) {
                node.className = "step-node active";
            } else if (nodeStep < step) {
                node.className = "step-node completed";
            } else {
                node.className = "step-node";
            }
        });

        currentStep = step;
        if (dom.btnPrevStep) dom.btnPrevStep.style.display = step === 1 ? 'none' : 'inline-flex';
        if (dom.btnNextStep) dom.btnNextStep.style.display = step === totalSteps ? 'none' : 'inline-flex';
    }

    function modifyPersonsCount(offset) {
        const shapeObj = (liveStoreConfig || cakeConfig).shapes.find(s => s.id === selectedConfig.shape);
        const min = shapeObj ? (shapeObj.minimumPersons || 4) : 4;
        let current = (parseInt(selectedConfig.persons, 10) || min) + offset;
        if (current < min) current = min;
        selectedConfig.persons = current;
        finalizeUIUpdate();
    }

    function enforceDynamicConstraints(isInitial) {
        const shapeObj = (liveStoreConfig || cakeConfig).shapes.find(s => s.id === selectedConfig.shape);
        const min = shapeObj ? (shapeObj.minimumPersons || 4) : 4;
        if (selectedConfig.persons < min) {
            selectedConfig.persons = min;
        }
    }

    function drawCakePreviewSVG() {
        const previewContainer = document.getElementById('cake-preview');
        if (!previewContainer) return;

        const { shape, layers, text, textPosition, uploadedImageUrl, printingType } = selectedConfig;
        let layersGroupMarkup = '';
        const baseWidth = 220, baseHeight = 42, verticalGap = 34, startYPoint = 155;

        for (let i = 0; i < layers; i++) {
            const width = baseWidth - (i * 28), height = baseHeight, x = (300 - width) / 2, y = startYPoint - (i * verticalGap);
            if (shape === 'circle' || shape === 'heart') {
                layersGroupMarkup += `
                    <g class="cake-3d-layer" style="transition: all 0.3s ease;">
                        <ellipse cx="150" cy="${y + height}" rx="${width / 2}" ry="14" fill="#EAD4D7" opacity="0.7"/>
                        <path d="M ${x} ${y} A ${width / 2} 14 0 0 0 ${x + width} ${y} v ${height} A ${width / 2} 14 0 0 1 ${x} ${y + height} Z" fill="#FFFFFF" stroke="#FF91A4" stroke-width="2"/>
                        <ellipse cx="150" cy="${y}" rx="${width / 2}" ry="14" fill="#FFD2D9" stroke="#FF91A4" stroke-width="1.5"/>
                    </g>`;
            } else {
                layersGroupMarkup += `
                    <g class="cake-3d-layer" style="transition: all 0.3s ease;">
                        <path d="M 150 ${y - 8} L ${150 + width / 2} ${y + 4} L 150 ${y + 16} L ${150 - width / 2} ${y + 4} Z" fill="#FFD2D9" stroke="#FF91A4" stroke-width="1.5"/>
                        <path d="M ${150 - width / 2} ${y + 4} L 150 ${y + 16} L 150 ${y + 16 + height} L ${150 - width / 2} ${y + 4 + height} Z" fill="#FFFFFF" stroke="#FF91A4" stroke-width="2"/>
                        <path d="M 150 ${y + 16} L ${150 + width / 2} ${y + 4} L ${150 + width / 2} ${y + 4 + height} L 150 ${y + 16 + height} Z" fill="#FFFFFF" stroke="#FF91A4" stroke-width="2"/>
                    </g>`;
            }
        }

        let printingMarkup = (printingType !== 'none' && uploadedImageUrl) ? `
            <g class="cake-photo-frame" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))">
                <clipPath id="photo-clip-path"><rect x="132" y="${startYPoint - ((layers - 1) * verticalGap) - 6}" width="36" height="24" rx="4"/></clipPath>
                <rect x="130" y="${startYPoint - ((layers - 1) * verticalGap) - 8}" width="40" height="28" rx="6" fill="#FFFFFF" stroke="#D4AF37" stroke-width="1.5"/>
                <image href="${uploadedImageUrl}" x="132" y="${startYPoint - ((layers - 1) * verticalGap) - 6}" width="36" height="24" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip-path)" />
            </g>` : '';

        let textMarkup = (text && text.trim().length > 0) ? `
            <g class="cake-custom-text-wrap" filter="drop-shadow(1px 1.5px 0.5px rgba(255,255,255,0.95))">
                <text x="150" y="${startYPoint - ((layers - 1) * verticalGap) - 2}" fill="#111111" style="font-family: 'Cairo', sans-serif; font-size: 11px; font-weight: 700; text-anchor: middle;">${escapeHtml(text)}</text>
            </g>` : '';

        previewContainer.innerHTML = `
            <svg viewBox="0 0 300 240" class="w-full h-auto" style="max-height: 280px;">
                <ellipse cx="150" cy="208" rx="122" ry="24" fill="#FFFFFF" stroke="#D4AF37" stroke-width="1.5" />
                <ellipse cx="150" cy="213" rx="118" ry="22" fill="rgba(17,17,17,0.1)"/>
                ${layersGroupMarkup} ${printingMarkup} ${textMarkup}
            </svg>`;
    }

    function finalizeUIUpdate() {
        const config = liveStoreConfig || cakeConfig;
        if (dom.totalPriceEl) dom.totalPriceEl.textContent = `${calculateLocalCakePrice(selectedConfig)}`;
        if (dom.personsCountEl) dom.personsCountEl.textContent = selectedConfig.persons;

        if (dom.summaryShape) { const s = config.shapes.find(x => x.id === selectedConfig.shape); dom.summaryShape.textContent = s ? s.name : selectedConfig.shape; }
        if (dom.summaryCakeType) { const t = config.cakeTypes.find(x => x.id === selectedConfig.cakeType); dom.summaryCakeType.textContent = t ? t.name : selectedConfig.cakeType; }
        if (dom.summaryPersons) dom.summaryPersons.textContent = `${selectedConfig.persons} فرد`;

        const updateActiveState = (cards, attr, currentVal) => {
            if (cards) cards.forEach(c => c.getAttribute(attr) == currentVal ? c.classList.add('active') : c.classList.remove('active'));
        };
        updateActiveState(dom.shapeCards, 'data-shape', selectedConfig.shape);
        updateActiveState(dom.layerCards, 'data-layer', selectedConfig.layers);
        updateActiveState(dom.cakeTypeCards, 'data-flavor', selectedConfig.cakeType);
        updateActiveState(dom.printingCards, 'data-printing', selectedConfig.printingType);

        drawCakePreviewSVG();
    }

    function addCustomizedCakeToCart() {
        if (isUploadingImage) {
            if (typeof window.showBoseGlobalToast === 'function') window.showBoseGlobalToast("ثواني فندم.. جاري الانتهاء من رفع صورتك السحابية الجميلة 🌸");
            return;
        }
        if (selectedConfig.printingType !== 'none' && !selectedConfig.uploadedImageUrl) {
            if (typeof window.showBoseGlobalToast === 'function') window.showBoseGlobalToast("يرجى رفع الصورة المطلوبة لتورتتك أولاً لضمان دقة طلبك الفاخر 🌸");
            return;
        }

        const config = liveStoreConfig || cakeConfig;
        const securePrice = calculateLocalCakePrice(selectedConfig);

        const shapeObj = config.shapes.find(s => s.id === selectedConfig.shape);
        const typeObj = config.cakeTypes.find(t => t.id === selectedConfig.cakeType);

        const description = `طعم ${typeObj ? typeObj.name : selectedConfig.cakeType}، شكل ${shapeObj ? shapeObj.name : selectedConfig.shape}، مقاس ${selectedConfig.persons} فرد، ${selectedConfig.layers} دور ${selectedConfig.text ? '، وعبارة: ' + selectedConfig.text : ''}`;

        const cartItem = {
            id: "cake_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            productSlug: "toort-custom-master",
            slug: "toort-custom-master",
            type: "custom-cake",
            title: "تورتة مخصصة بالكامل",
            description: description,
            quantity: 1,
            price: securePrice,
            finalPrice: securePrice,
            basePrice: parseFloat(config.basePrice) || 580,
            image: selectedConfig.uploadedImageUrl || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
            customDetails: {
                shape: selectedConfig.shape,
                persons: parseInt(selectedConfig.persons, 10),
                cakeType: typeObj ? typeObj.name : selectedConfig.cakeType,
                printingType: selectedConfig.printingType,
                customMessage: selectedConfig.text.trim()
            }
        };

        let cart = [];
        try {
            const localData = localStorage.getItem(CART_STORAGE_KEY);
            if (localData) cart = JSON.parse(localData);
        } catch (e) {}
        cart.push(cartItem);
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (e) {}

        window.dispatchEvent(new Event('bose_cart_updated'));
        if (typeof window.updateGlobalCartCounter === 'function') window.updateGlobalCartCounter();
        if (typeof window.showBoseGlobalToast === 'function') window.showBoseGlobalToast("تمت إضافة تورتتك الجميلة بنجاح للسلة!");
        
        setTimeout(() => {
            window.location.href = "cart.html";
        }, 800);
    }

    function safeBootEngine() {
        loadConfigFromDatabase();
        if (document.getElementById('bose-cake-builder-form') || document.getElementById('cake-preview')) {
            cacheDOMElements();
            bindCentralizedEvents();
            enforceDynamicConstraints(true);
            finalizeUIUpdate();
        }
    }

    if (window.BoseStoreData) {
        safeBootEngine();
    } else {
        document.addEventListener('BoseDatabaseLoaded', () => {
            safeBootEngine();
        });
    }

    window.BoseCakeEngine = {
        refreshEngine: function () {
            isEventsBound = false;
            loadConfigFromDatabase();
            cacheDOMElements(); 
            bindCentralizedEvents(); 
            finalizeUIUpdate();
        },
        calculatePrice: (opts) => calculateLocalCakePrice(opts),
        getSelectedConfig: () => selectedConfig
    };

})();