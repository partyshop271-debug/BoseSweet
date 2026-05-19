lucide.createIcons();

window.ProductUI = {
    currentCategory: '',
    allCategoryProducts: [],
    reviewsData: [],
    currentReviewPage: 0,
    reviewsPerPage: 3,
    currentFlowerProduct: null, 
    _pendingSimulatorFrame: null, 
    _reviewsUnsubscribe: null, // معالج إلغاء الاشتراك لمنع استهلاك البيانات والتكرار المفرط

    // تهيئة حالة التصميم الخاص بالتورتات لحمايتها من الانهيار عند الاستدعاء المباشر
    state: {
        people: 4,
        print: 'none',
        gift: false,
        shape: 'round',
        healthNotes: '',
        refImageName: '',
        printImageName: ''
    },

    flowerState: {
        qty: 15,
        material: 'natural',
        pathType: 'natural', 
        color: 'أحمر',
        customColorText: '',
        sampleRoseImgData: null,
        sampleRoseName: '',
        mixDetails: '',
        hasChocolate: false,
        chocolateBudget: 0,
        chocolatePreferences: '',
        hasCash: false,
        cashAmount: 0,
        cashDenomination: '200', 
        hasRibbon: false,
        ribbonText: '',
        hasGift: false,
        giftText: '',
        photoCount: 0,
        photoFiles: []
    },

    normalizeArabic: function(str) {
        if (!str) return '';
        return str.trim()
            .replace(/^ال/, '')       
            .replace(/[أإآا]/g, 'ا')   
            .replace(/ة/g, 'ه')        
            .replace(/ى/g, 'ي')        
            .replace(/\s+/g, '');      
    },

    showToast: function(msg) {
        const toast = document.getElementById('bose-toast');
        const text = document.getElementById('bose-toast-msg');
        if(!toast || !text) return;
        text.innerText = msg;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    },

    trackBehavior: function(catName) {
        if(!catName || catName === 'all') return;
        try {
            let history = JSON.parse(localStorage.getItem('Bose_Behavior_History') || '[]');
            history.push(catName);
            if(history.length > 15) history.shift();
            localStorage.setItem('Bose_Behavior_History', JSON.stringify(history));
        } catch(e) {
            console.warn("فشل حفظ سجل السلوك المحركي:", e);
        }
    },

    setupFlowerPoster: function() {
        const layerFlowers = document.getElementById('layer-flowers');
        if (layerFlowers) {
            layerFlowers.innerHTML = `
                <div id="bose-canvas-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-brand-pink/30 rounded-[32px] bg-brand-pinkLight/10">
                    <div class="w-16 h-16 rounded-full bg-brand-pinkLight flex items-center justify-center mb-4 border border-brand-pink/20 animate-pulse">
                        <i data-lucide="sparkles" class="w-8 h-8 text-brand-pink"></i>
                    </div>
                    <p class="font-bold text-brand-brown text-base">مساحة تصميم وتنسيق البوكيه الخاص بك</p>
                    <p class="text-xs text-brand-brown/50 mt-1">ابدأ باختيار الخامات والألوان لتشاهد التصميم حياً خطوة بخطوة</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    },

    initFlowerTabs: function() {
        const flowerTabs = document.querySelectorAll('.flower-tab');
        
        // تفادي تكرار مستمعي الأحداث عند إعادة الاستدعاء المتكرر لروتر التصفح
        flowerTabs.forEach(tab => {
            tab.removeAttribute('onclick'); 
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });

        const refreshedTabs = document.querySelectorAll('.flower-tab');
        this.updateSelectedFlowerImage();

        refreshedTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                this.setFlowerPathCombo(target, tab);
            });
        });
    },

    setFlowerPathCombo: function(target, btnElement) {
        this.flowerState.pathType = target;
        this.flowerState.material = target; // الحفاظ على المزامنة الكاملة للخامة والمسار المختار

        const cashOptions = document.getElementById('cash-options-container');
        
        this.updateSelectedFlowerImage();

        // التبديل الديناميكي الفوري للخيارات الإضافية بناء على المسار المحدد
        if (target === 'cash') {
            if (cashOptions) cashOptions.style.display = 'flex';
            this.toggleFlowerGiftCash(true);
            this.toggleFlowerChocolate(false);
        } else if (target === 'chocolate') {
            if (cashOptions) cashOptions.style.display = 'none';
            this.toggleFlowerGiftCash(false);
            this.toggleFlowerChocolate(true);
        } else {
            if (cashOptions) cashOptions.style.display = 'none';
            this.toggleFlowerGiftCash(false);
            this.toggleFlowerChocolate(false);
        }

        const flowerTabs = document.querySelectorAll('.flower-tab');
        flowerTabs.forEach(t => {
            t.classList.remove('active', 'selected');
            t.style.backgroundColor = '#ffffff';
        });

        let activeTab = btnElement || document.querySelector(`.flower-tab[data-target="${target}"]`);
        if (activeTab) {
            activeTab.classList.add('active', 'selected');
            activeTab.style.backgroundColor = '#fff5f6';
        }
        
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    updateSelectedFlowerImage: function() {
        const mainProductImg = document.getElementById('main-product-image');
        if (!mainProductImg) return;

        const catalog = window.BoseState?.catalog || [];
        if (!this.currentFlowerProduct || !this.currentFlowerProduct.id) {
            this.currentFlowerProduct = catalog.find(p => p.category && this.normalizeArabic(p.category) === this.normalizeArabic('ورد')) || {};
        }

        const defaultImg = this.currentFlowerProduct.img || this.currentFlowerProduct.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        
        const imagesMap = {
            'natural': this.currentFlowerProduct.imgNatural || defaultImg,
            'artificial': this.currentFlowerProduct.imgArtificial || defaultImg,
            'satin': this.currentFlowerProduct.imgSatin || defaultImg,
            'chocolate': this.currentFlowerProduct.imgChoco || defaultImg,
            'cash': this.currentFlowerProduct.imgCash || defaultImg,
            'photo': this.currentFlowerProduct.imgPhoto || defaultImg
        };

        const currentPath = this.flowerState.pathType || 'natural';
        let targetSrc = imagesMap[currentPath] || defaultImg;

        mainProductImg.src = window.processBoseImage ? window.processBoseImage(targetSrc) : targetSrc;
        mainProductImg.style.display = 'block';

        const placeholder = document.getElementById('bose-canvas-placeholder');
        if (placeholder) placeholder.style.display = 'none';
    },

    // 👑 آلية العزل المطلق الفوري لمنع تداخل الصفحات ومسح بقايا الصفحات الأخرى نهائياً
    initRouter: function() {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        const action = params.get('action');

        const builderContainer = document.getElementById('builder-container');
        const categoryViewer = document.getElementById('category-viewer');
        const flowerCustomizer = document.getElementById('flower-customizer-container');
        const reviewsSection = document.getElementById('reviews-section');
        const suggestionsArea = document.getElementById('suggestions-area');
        const floatingCart = document.getElementById('bose-floating-cart');

        // فرض إخفاء تام وكامل لكافة عناصر الحاويات برمجياً لضمان عدم الدمج
        if (builderContainer) builderContainer.style.display = 'none';
        if (categoryViewer) categoryViewer.style.display = 'none';
        if (flowerCustomizer) flowerCustomizer.style.display = 'none';
        if (reviewsSection) reviewsSection.style.display = 'none';
        if (suggestionsArea) suggestionsArea.style.display = 'none';
        if (floatingCart) floatingCart.style.display = 'none';

        const normalizedCat = category ? this.normalizeArabic(category) : '';

        if (action === 'build_cake') {
            if (builderContainer) builderContainer.style.display = 'block';
            this.state = { people: 4, print: 'none', gift: false, shape: 'round', healthNotes: '', refImageName: '', printImageName: '' };
            this.setupBuilderPoster();
            this.updatePrices();
        } 
        else if (category && (normalizedCat === 'ورد' || normalizedCat === 'ورود' || normalizedCat === 'زهور')) {
            if (flowerCustomizer) flowerCustomizer.style.display = 'block';
            if (floatingCart) floatingCart.style.display = 'flex';
            this.setupFlowerPoster();
            this.initFlowerTabs();
            this.updateFlowerPrices();
            this.updateVisualSimulator();
        } 
        else if (category) {
            this.currentCategory = category;
            if (categoryViewer) categoryViewer.style.display = 'block';
            if (reviewsSection) reviewsSection.style.display = 'block';
            if (suggestionsArea) suggestionsArea.style.display = 'block';
            this.trackBehavior(category); 
            this.setupCategoryView(category);
        } 
        else {
            this.currentCategory = 'all';
            if (categoryViewer) categoryViewer.style.display = 'block';
            if (reviewsSection) reviewsSection.style.display = 'block';
            if (suggestionsArea) suggestionsArea.style.display = 'block';
            this.setupCategoryView('all');
        }
        
        this.fetchReviews();
        setTimeout(() => this.renderSmartSuggestions(), 500);
    },

    setupBuilderPoster: function() {
        const catalog = window.BoseState?.catalog || [];
        const cakeProducts = catalog.filter(p => p.category && (p.category.includes('تورت') || p.category.includes('كيك')));
        let builderPoster = 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        
        if(cakeProducts.length > 0) {
            let img = cakeProducts[0].heroImg || cakeProducts[0].img || cakeProducts[0].image;
            if(img) { builderPoster = window.processBoseImage ? window.processBoseImage(img) : img; }
        }
        const posterEl = document.getElementById('builder-poster-img');
        if(posterEl) posterEl.src = builderPoster;
    },

    nextJourneyStep: function(nextStepIndex) {
        document.querySelectorAll('.journey-step').forEach(step => step.style.display = 'none');
        const targetStep = document.getElementById(`step-${nextStepIndex}`);
        if (targetStep) targetStep.style.display = 'block';

        document.querySelectorAll('.step-dot').forEach(dot => {
            const dotStep = parseInt(dot.getAttribute('data-step'));
            if (dotStep <= nextStepIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        if (window.lucide) lucide.createIcons();

        const customizerWrapper = document.getElementById('flower-customizer-container');
        if (customizerWrapper) {
            customizerWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    prevJourneyStep: function(prevStepIndex) {
        this.nextJourneyStep(prevStepIndex);
    },

    modFlowerQty: function(val) {
        const currentQty = this.flowerState.qty + val;
        if(currentQty < 15) {
            this.showToast("أقل عدد لتنسيق البوكيه بشكل احترافي هو 15 وردة.");
            return;
        }
        this.flowerState.qty = currentQty;
        
        const countEl = document.getElementById('bouquet-density-count');
        if (countEl) countEl.innerText = currentQty;

        const labelEl = document.getElementById('bouquet-density-label');
        if (labelEl) {
            labelEl.innerText = "وردة";
        }

        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    setFlowerMaterial: function(mat, btn) {
        this.flowerState.material = mat;
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.bose-btn-option').forEach(b => {
                b.classList.remove('active');
                b.style.backgroundColor = '#ffffff';
                b.style.color = '#ff91a4';
                b.style.borderColor = 'rgba(255,145,164,0.3)';
            });
            btn.classList.add('active');
            btn.style.backgroundColor = '#ff91a4';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#ff91a4';
        }
        
        this.setFlowerPathCombo(mat, null);
    },

    setFlowerColor: function(col, btn) {
        this.flowerState.color = col;
        this.flowerState.customColorText = '';
        
        if (btn) {
            btn.parentElement.querySelectorAll('.color-circle').forEach(b => {
                b.classList.remove('active');
                b.style.borderWidth = '2px';
                b.style.borderColor = 'rgba(255,145,164,0.3)';
            });
            btn.classList.add('active');
            btn.style.borderWidth = '3px';
            btn.style.borderColor = '#ff91a4';
        }

        const mixContainer = document.getElementById('mix-colors-specifier');
        if(col === 'مشكل') {
            if(mixContainer) mixContainer.classList.remove('hidden');
        } else {
            if(mixContainer) mixContainer.classList.add('hidden');
            this.flowerState.mixDetails = '';
            const mixInput = document.getElementById('flower-mix-details');
            if(mixInput) mixInput.value = '';
        }

        this.updateVisualSimulator();
    },

    setCustomColorText: function(val) {
        this.flowerState.color = 'درجة مخصصة';
        this.flowerState.customColorText = val;
        
        const circlesContainer = document.getElementById('flower-circles-wrap');
        if (circlesContainer) {
            circlesContainer.querySelectorAll('.color-circle').forEach(b => {
                b.classList.remove('active');
                b.style.borderWidth = '2px';
                b.style.borderColor = 'rgba(255,145,164,0.3)';
            });
        }
        this.updateVisualSimulator();
    },

    handleSampleRoseUpload: function(input) {
        const status = document.getElementById('sample-rose-status');
        if (input.files && input.files[0]) {
            this.flowerState.sampleRoseName = input.files[0].name;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.flowerState.sampleRoseImgData = e.target.result;
                if (status) {
                    status.innerText = `تم اعتماد عينة الوردة: ${input.files[0].name}`;
                    status.classList.add('text-brand-pink');
                }
                this.updateVisualSimulator();
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    toggleFlowerChocolate: function(isChecked) {
        this.flowerState.hasChocolate = isChecked;
        const inputsWrap = document.getElementById('chocolate-details-inputs');
        if (isChecked) { 
            if(inputsWrap) inputsWrap.classList.remove('hidden'); 
        } else { 
            if(inputsWrap) inputsWrap.classList.add('hidden'); 
        }
        if(!isChecked) {
            const budgetInput = document.getElementById('flower-chocolate-budget');
            const prefInput = document.getElementById('flower-chocolate-pref');
            if(budgetInput) budgetInput.value = 0;
            if(prefInput) prefInput.value = '';
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    toggleFlowerGiftCash: function(isChecked) {
        this.flowerState.hasCash = isChecked;
        const inputWrap = document.getElementById('cash-amount-input');
        if (isChecked) { 
            if(inputWrap) inputWrap.classList.remove('hidden'); 
        } else { 
            if(inputWrap) inputWrap.classList.add('hidden'); 
        }
        if(!isChecked) {
            const cashInput = document.getElementById('cash-amount');
            if(cashInput) cashInput.value = 0;
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    updateCashDetails: function() {
        const cashAmount = parseFloat(document.getElementById('cash-amount')?.value) || 0;
        const denomination = document.getElementById('cash-denomination')?.value || '200';
        this.flowerState.cashAmount = cashAmount;
        this.flowerState.cashDenomination = denomination;
        this.updateFlowerPrices();
    },

    toggleFlowerRibbonPrint: function(isChecked) {
        this.flowerState.hasRibbon = isChecked;
        const container = document.getElementById('ribbon-text-input-container');
        if (isChecked) { 
            if(container) container.classList.remove('hidden'); 
        } else { 
            if(container) container.classList.add('hidden'); 
        }
        if(!isChecked) {
            const ribbonInput = document.getElementById('flower-ribbon-text');
            if(ribbonInput) ribbonInput.value = '';
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    toggleFlowerGift: function(isChecked) {
        this.flowerState.hasGift = isChecked;
        const area = document.getElementById('flower-gift-area');
        if(isChecked) { 
            if(area) area.classList.remove('hidden'); 
        } else { 
            if(area) area.classList.add('hidden'); 
        }
        if(!isChecked) {
            const giftInput = document.getElementById('flower-gift-text');
            if(giftInput) giftInput.value = '';
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    toggleFlowerPhotoAddon: function(isChecked) {
        const uploadArea = document.getElementById('photo-upload-area');
        if (isChecked) {
            if (uploadArea) uploadArea.classList.remove('hidden');
        } else {
            if (uploadArea) uploadArea.classList.add('hidden');
        }
        if (!isChecked) {
            this.flowerState.photoCount = 0;
            const countDisplay = document.getElementById('flower-photo-count');
            if (countDisplay) countDisplay.innerText = '0';
            this.flowerState.photoFiles = [];
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    modFlowerPhotos: function(val) {
        const currentCount = this.flowerState.photoCount + val;
        if(currentCount < 0) return;
        this.flowerState.photoCount = currentCount;
        
        const countDisplay = document.getElementById('flower-photo-count');
        if (countDisplay) countDisplay.innerText = currentCount;
        
        const uploadContainer = document.getElementById('flower-photo-upload-container');
        if (uploadContainer) {
            if(currentCount > 0) uploadContainer.classList.remove('hidden'); else uploadContainer.classList.add('hidden');
        }
        
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    handleFlowerPhotos: function(input) {
        const status = document.getElementById('flower-photos-status');
        if(input.files && input.files.length > 0) {
            this.flowerState.photoFiles = Array.from(input.files);
            this.flowerState.photoCount = input.files.length;
            if (status) status.innerText = `تم استلام ${input.files.length} صورة بدقة عالية`;
            this.updateFlowerPrices();
            this.updateVisualSimulator();
        }
    },

    updateFlowerPrices: function() {
        let basePrice = 400; 
        const pricing = window.BoseState?.pricingRules || {};
        
        if (this.flowerState.material === 'natural' && pricing.priceNatural) basePrice = this.flowerState.qty * pricing.priceNatural;
        else if (this.flowerState.material === 'artificial' && pricing.priceArtificial) basePrice = this.flowerState.qty * pricing.priceArtificial;
        else if (this.flowerState.material === 'satin' && pricing.priceSatin) basePrice = this.flowerState.qty * pricing.priceSatin;
        else {
             if(this.flowerState.qty > 15) {
                basePrice += (this.flowerState.qty - 15) * 35;
             }
        }

        let totalPrice = basePrice;
        
        const ribbonText = document.getElementById('flower-ribbon-text')?.value || '';
        if (this.flowerState.hasRibbon || ribbonText.trim() !== '') totalPrice += 50;

        const giftText = document.getElementById('flower-gift-text')?.value || '';
        if (this.flowerState.hasGift || giftText.trim() !== '') totalPrice += (pricing.priceCard || 25);

        totalPrice += this.flowerState.photoCount * (pricing.pricePhoto || 15); 

        const chocoBudget = parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0;
        const cashAmount = parseFloat(document.getElementById('cash-amount')?.value) || 0;
        
        totalPrice += chocoBudget;
        totalPrice += cashAmount;

        const pDisplay = document.getElementById('live-total-price');
        if(pDisplay) pDisplay.innerText = `${totalPrice} ج.م`;

        const floatPrice = document.getElementById('floating-total-price');
        if(floatPrice) floatPrice.innerText = `${totalPrice} ج.م`;

        return totalPrice;
    },

    updateVisualSimulator: function() {
        if (window.ProductUI._pendingSimulatorFrame) {
            cancelAnimationFrame(window.ProductUI._pendingSimulatorFrame);
        }

        window.ProductUI._pendingSimulatorFrame = requestAnimationFrame(() => {
            const layerFlowers = document.getElementById('layer-flowers');
            const layerChocolate = document.getElementById('layer-chocolate');
            const layerCash = document.getElementById('layer-cash');
            const layerRibbon = document.getElementById('layer-ribbon');
            const layerCard = document.getElementById('layer-card');
            
            if (!layerFlowers) {
                window.ProductUI._pendingSimulatorFrame = null;
                return;
            }

            const placeholder = document.getElementById('bose-canvas-placeholder');
            if (placeholder) placeholder.remove();

            const self = window.ProductUI;
            const totalRoses = self.flowerState.qty;
            const baseCenterX = 50;
            const baseCenterY = 48;

            let matText = "طبيعي";
            if (self.flowerState.material === 'artificial') matText = "صناعي";
            if (self.flowerState.material === 'satin') matText = "ستان";

            let descLabel = `${totalRoses} وردة (${matText}) - ${self.flowerState.color === 'درجة مخصصة' ? self.flowerState.customColorText : self.flowerState.color}`;
            if (self.flowerState.color === 'مشكل' && self.flowerState.mixDetails) {
                descLabel += ` (${self.flowerState.mixDetails})`;
            }
            if (self.flowerState.sampleRoseImgData) {
                descLabel += ` [مستنسخ من الصورة المرفوعة]`;
            }

            layerFlowers.innerHTML = `
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-brand-pink text-brand-brown px-5 py-2.5 rounded-full font-black text-xs shadow-md z-40 text-center whitespace-nowrap pointer-events-none">
                    💐 ${descLabel}
                </div>
            `;

            if (layerChocolate) {
                if (self.flowerState.hasChocolate || self.flowerState.pathType === 'chocolate') {
                    layerChocolate.style.opacity = '1';
                    const budget = parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0;
                    const chocoCount = Math.min(Math.max(Math.floor(budget / 20), 2), 14);
                    let chocoHtml = '';
                    
                    for (let i = 0; i < chocoCount; i++) {
                        const angle = (i / chocoCount) * 2 * Math.PI + 0.7;
                        const radius = 12 + (i % 2 ? 8 : 0); 
                        const left = baseCenterX + radius * Math.cos(angle);
                        const top = baseCenterY + radius * Math.sin(angle);
                        
                        chocoHtml += `
                            <div class="absolute w-8 h-8 -ml-4 -mt-4 rounded-xl shadow-lg z-30 flex items-center justify-center animate-fade pointer-events-none"
                                 style="left: ${left}%; top: ${top}%; background: linear-gradient(135deg, #ebd197 0%, #b4934c 50%, #846424 100%); border: 2px solid #ffffff;">
                                 <span class="text-[11px]">🍫</span>
                            </div>`;
                    }
                    layerChocolate.innerHTML = chocoHtml;
                } else {
                    layerChocolate.style.opacity = '0';
                    layerChocolate.innerHTML = '';
                }
            }

            if (layerCash) {
                if (self.flowerState.hasCash || self.flowerState.pathType === 'cash') {
                    layerCash.style.opacity = '1';
                    const cashAmount = parseFloat(document.getElementById('cash-amount')?.value) || 0;
                    const notesCount = Math.min(Math.max(Math.floor(cashAmount / 150), 2), 10);
                    let cashHtml = '';
                    
                    for (let i = 0; i < notesCount; i++) {
                        const angle = (i / notesCount) * 2 * Math.PI + 1.4;
                        const radius = 20 - (i % 2 ? 6 : 0);
                        const left = baseCenterX + radius * Math.cos(angle);
                        const top = baseCenterY + radius * Math.sin(angle);
                        const rotation = (angle * 180 / Math.PI) + 90;
                        
                        cashHtml += `
                            <div class="absolute w-9 h-5 -ml-4.5 -mt-2.5 bg-emerald-700 border-2 border-emerald-100 rounded-sm shadow-md z-30 flex items-center justify-center text-[9px] text-white font-black animate-fade pointer-events-none"
                                 style="left: ${left}%; top: ${top}%; transform: rotate(${rotation}deg);">
                                 💵
                            </div>`;
                    }
                    layerCash.innerHTML = cashHtml;
                } else {
                    layerCash.style.opacity = '0';
                    layerCash.innerHTML = '';
                }
            }

            const layerCustomPhoto = document.getElementById('layer-custom-photo');
            if (layerCustomPhoto) {
                if (self.flowerState.photoCount > 0 && self.flowerState.photoFiles.length > 0) {
                    layerCustomPhoto.style.opacity = '1';
                    const renderImg = document.getElementById('custom-photo-render');
                    if (renderImg) {
                        renderImg.style.display = 'block';
                        renderImg.className = "w-24 h-28 p-2 bg-white shadow-2xl border-2 border-brand-pink/20 rounded-sm transform rotate-[-4deg] absolute z-30 left-[20%] top-[26%] object-cover animate-fade pointer-events-none";
                    }
                } else {
                    layerCustomPhoto.style.opacity = '0';
                    const renderImg = document.getElementById('custom-photo-render');
                    if (renderImg) renderImg.style.display = 'none';
                }
            }

            if (layerRibbon) {
                const ribbonText = document.getElementById('flower-ribbon-text')?.value || '';
                if (self.flowerState.hasRibbon && ribbonText.trim() !== '') {
                    layerRibbon.style.opacity = '1';
                    layerRibbon.innerHTML = `
                        <div class="absolute bottom-16 left-1/2 -translate-x-1/2 bg-brand-pink text-white text-[11px] font-black px-5 py-2 rounded-sm shadow-md border-y border-white/30 z-30 max-w-[240px] text-center whitespace-nowrap tracking-wider animate-fade pointer-events-none">
                            🎀 ${ribbonText} 🎀
                        </div>
                    `;
                } else {
                    layerRibbon.style.opacity = '0';
                    layerRibbon.innerHTML = '';
                }
            }

            if (layerCard) {
                const giftText = document.getElementById('flower-gift-text')?.value || '';
                if (self.flowerState.hasGift && giftText.trim() !== '') {
                    layerCard.style.opacity = '1';
                    layerCard.innerHTML = `
                        <div class="absolute top-6 right-6 bg-white border border-brand-pink/40 text-brand-brown px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md z-30 max-w-[150px] truncate animate-fade pointer-events-none">
                            ✉️ كارت: "${giftText}"
                        </div>
                    `;
                } else {
                    layerCard.style.opacity = '0';
                    layerCard.innerHTML = '';
                }
            }

            window.ProductUI._pendingSimulatorFrame = null;
        });
    },

    addCustomFlowerToCart: function() {
        const finalPrice = this.updateFlowerPrices();
        const ribbonText = document.getElementById('flower-ribbon-text')?.value || '';
        const giftText = document.getElementById('flower-gift-text')?.value || '';
        
        let orderDetails = {
            productId: (this.currentFlowerProduct && this.currentFlowerProduct.id) ? this.currentFlowerProduct.id : `custom-flower-${Date.now()}`,
            name: (this.currentFlowerProduct && this.currentFlowerProduct.name) ? `بوكيه: ${this.currentFlowerProduct.name}` : 'بوكيه ورد بتصميم خاص',
            price: finalPrice,
            quantity: 1,
            isCustom: true,
            type: this.flowerState.pathType || 'natural', 
            details: {
                category: 'ورد',
                qty: this.flowerState.qty,
                material: this.flowerState.material,
                color: this.flowerState.color === 'درجة مخصصة' ? this.flowerState.customColorText : this.flowerState.color,
                mixDetails: this.flowerState.mixDetails,
                sampleRoseName: this.flowerState.sampleRoseName,
                hasGift: this.flowerState.hasGift,
                giftText: giftText,
                hasRibbon: this.flowerState.hasRibbon,
                ribbonText: ribbonText,
                photoCount: this.flowerState.photoCount,
                chocolateBudget: parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0,
                chocolatePreferences: document.getElementById('flower-chocolate-pref')?.value || 'تفضيل قياسي',
                cashAmount: this.flowerState.cashAmount,
                cashDenomination: this.flowerState.cashDenomination,
                photoFilesNames: this.flowerState.photoFiles.map(f => f.name)
            }
        };

        if (window.BoseState && window.cartSystem) {
            window.BoseState.cart.push(orderDetails);
            window.cartSystem.saveCartToStorage();
            window.location.href = 'cart.html';
        }
    },

    // 👑 الخوارزمية السيادية لعزل وتوجيه تصنيفات المنتجات (V40.0)
    // تضمن الفصل الكامل والحاسم لمنع خلط أقسام الورد، الميني تورت، والتورت القياسية
    setupCategoryView: function(catName) {
        const catalog = window.BoseState?.catalog || [];
        const normalizedSearch = this.normalizeArabic(catName);

        this.allCategoryProducts = catName === 'all' ? catalog : catalog.filter(p => {
            if (!p.category) return false;
            
            const normalizedCat = this.normalizeArabic(p.category);
            const normalizedName = this.normalizeArabic(p.name || '');

            // فحص كينونة المنتجات الوردية لمنع تسللها
            const isFlowerSearch = (normalizedSearch === 'ورد' || normalizedSearch === 'ورود' || normalizedSearch === 'زهور');
            const isFlowerProduct = (normalizedCat === 'ورد' || normalizedCat === 'ورود' || normalizedCat === 'زهور' || normalizedName.includes('ورد') || normalizedName.includes('زهور'));

            // فحص كينونة الميني تورت لمنع خلطها مع التورت القياسية
            const isMiniSearch = (normalizedSearch === 'مينيتورت' || normalizedSearch === 'مينيتورته' || normalizedSearch === 'مينيتورتات' || normalizedSearch.includes('ميني'));
            const isMiniProduct = (normalizedCat.includes('ميني') || normalizedName.includes('ميني') || normalizedCat.includes('mini') || normalizedName.includes('mini'));

            // 1. عزل قسم الورد والزهور بشكل كامل
            if (isFlowerSearch) {
                return isFlowerProduct;
            }
            if (isFlowerProduct) {
                return false; // استبعاد الورد تماماً من أي قسم حلويات أو تورتات أخرى
            }

            // 2. عزل قسم الميني تورت بشكل كامل
            if (isMiniSearch) {
                return isMiniProduct;
            }
            if (isMiniProduct) {
                return false; // استبعاد الميني تورت تماماً من صفحات التورت القياسية الكبيرة
            }

            // 3. قسم التورت الكبيرة / القياسية (يستعرض كيك وتورت بجميع المسميات بشرط عدم كونه ميني أو ورداً)
            if (normalizedSearch === 'تورت' || normalizedSearch === 'تورته' || normalizedSearch === 'تورتات' || normalizedSearch === 'كيك') {
                return (normalizedCat === 'تورت' || normalizedCat === 'تورته' || normalizedCat === 'تورتات' || normalizedCat === 'حلويات' || normalizedCat === 'كيك');
            }

            // 4. تصفية مطابقة طبيعية لباقي الأقسام المختلفة مثل الجاتوه أو غيرها
            return normalizedCat === normalizedSearch || 
                   normalizedCat === normalizedSearch + 'ه' || 
                   normalizedSearch === normalizedCat + 'ه' ||
                   (normalizedCat.endsWith('ات') && normalizedCat.slice(0, -2) === normalizedSearch) ||
                   (normalizedSearch.endsWith('ات') && normalizedSearch.slice(0, -2) === normalizedCat);
        });

        const headerContainer = document.getElementById('category-header-container');
        const tabsContainer = document.getElementById('size-tabs-container');
        const gridContainer = document.getElementById('category-grid');
        
        let displayName = catName === 'all' ? 'منتجات حلويات بوسي' : catName;
        if (normalizedSearch === 'تورت' || normalizedSearch === 'تورته' || normalizedSearch === 'تورتات') {
            displayName = 'التورت الفاخرة المعتمدة';
        } else if (normalizedSearch === 'مينيتورت' || normalizedSearch === 'مينيتورته') {
            displayName = 'قسم الميني تورت الفاخرة';
        }

        let dynamicPoster = 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        if (this.allCategoryProducts.length > 0) {
            let firstProdImg = this.allCategoryProducts[0].heroImg || this.allCategoryProducts[0].img || this.allCategoryProducts[0].image;
            if (firstProdImg) { dynamicPoster = window.processBoseImage ? window.processBoseImage(firstProdImg) : firstProdImg; }
        }

        headerContainer.innerHTML = `
            <div class="rounded-[40px] overflow-hidden shadow-sm border border-brand-pink/20 bg-white">
                <div class="w-full h-[30vh] md:h-[45vh] relative bg-brand-pinkLight">
                    <img src="${dynamicPoster}" class="w-full h-full object-cover" alt="${displayName}">
                </div>
                <div class="p-8 md:p-16 text-center bg-brand-pinkLight/30">
                    <h2 class="text-4xl md:text-5xl font-black text-brand-brown mb-6 tracking-tighter">${displayName}</h2>
                </div>
            </div>
        `;

        const hasSizes = this.allCategoryProducts.some(p => p.name.includes('صغير') || p.name.includes('وسط') || p.name.includes('كبير') || p.name.includes('عائلي'));
        
        if (hasSizes && normalizedSearch !== 'مينيتورت' && normalizedSearch !== 'مينيتورته') {
            tabsContainer.classList.remove('hidden');
            const btns = tabsContainer.querySelectorAll('.size-tab');
            btns.forEach(b => b.classList.remove('active'));
            if(btns[0]) btns[0].classList.add('active');
        } else {
            tabsContainer.classList.add('hidden');
        }

        gridContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto";
        this.renderCards(this.allCategoryProducts);
    },

    filterBySize: function(sizeQuery, btn) {
        const btns = document.getElementById('size-tabs-container').querySelectorAll('.size-tab');
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        let filtered = [];
        if (sizeQuery === 'all') { filtered = this.allCategoryProducts; } 
        else if (sizeQuery === 'كبير') { filtered = this.allCategoryProducts.filter(p => p.name.includes('كبير') || p.name.includes('عائلي') || p.name.includes('لارج')); } 
        else { filtered = this.allCategoryProducts.filter(p => p.name.includes(sizeQuery)); }

        this.renderCards(filtered);
    },

    renderCards: function(products) {
        const grid = document.getElementById('category-grid');
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full py-16 font-bold text-brand-brown opacity-50 text-xl text-center">لا توجد منتجات مطابقة لهذا الاختيار حالياً.</div>';
            return;
        }

        grid.innerHTML = products.map(p => {
            const isFullSpan = p.gridSpan === 'full';
            const tmplId = isFullSpan ? 'template-card-full' : 'template-card-grid';
            let template = document.getElementById(tmplId).innerHTML;

            const spanClass = isFullSpan ? 'col-span-1 md:col-span-2' : 'col-span-1';
            const catName = p.category || 'حلويات بوسي';

            let cardHtml = template
                .replace(/{PRODUCT_ID}/g, p.id)
                .replace(/{CAT_NAME}/g, catName)
                .replace(/{PRODUCT_NAME}/g, p.name)
                .replace(/{PRODUCT_IMAGE}/g, window.processBoseImage ? window.processBoseImage(p.img || p.image) : (p.img || p.image))
                .replace(/{PRODUCT_DESC}/g, p.description || p.desc || 'يتم التحضير بأجود المكونات لضمان أعلى معايير الجودة.')
                .replace(/{PRODUCT_PRICE}/g, parseFloat(p.price) || 0);

            return `<div class="${spanClass} w-full">${cardHtml}</div>`;
        }).join('');

        lucide.createIcons();
    },

    renderSmartSuggestions: function() {
        const catalog = window.BoseState?.catalog || [];
        const container = document.getElementById('dynamic-suggestions-slider');
        const section = document.getElementById('suggestions-area');
        if (catalog.length === 0 || !container || !section) return;

        const currentNormalized = this.normalizeArabic(this.currentCategory || 'all');
        const cartIds = window.BoseState?.cart?.map(i => String(i.id)) || [];

        let filteredCatalog = catalog.filter(p => {
            if (!p.category) return false;
            const prodNorm = this.normalizeArabic(p.category);

            if (currentNormalized === 'ورد' || currentNormalized === 'ورود') {
                return prodNorm === 'ورد' || prodNorm === 'ورود' || prodNorm === 'زهور';
            }
            if (currentNormalized === 'مينيتورت' || currentNormalized === 'مينيتورته') {
                return prodNorm === 'مينيتورت' || prodNorm === 'مينيتورته' || prodNorm === 'مينيتورتات';
            }
            if (currentNormalized === 'تورت' || currentNormalized === 'تورتات') {
                return (prodNorm === 'تورت' || prodNorm === 'تورته' || prodNorm === 'تورتات') && !prodNorm.includes('ميني');
            }
            if (currentNormalized === 'all') {
                return true;
            }
            return prodNorm === currentNormalized;
        });

        let suggestions = filteredCatalog.filter(p => !cartIds.includes(String(p.id)));
        if (suggestions.length === 0) {
            suggestions = filteredCatalog.slice(0, 8);
        } else {
            suggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 8);
        }

        if (suggestions.length > 0 && currentNormalized !== 'all') {
            section.classList.remove('hidden');
            section.style.display = 'block';
            const tmpl = document.getElementById('bose-suggestion-card-template') ? document.getElementById('bose-suggestion-card-template').innerHTML : '';
            if(!tmpl) return;
            container.innerHTML = suggestions.map(p => {
                const catName = p.category || 'حلويات بوسي';
                return tmpl
                    .replace(/{PRODUCT_ID}/g, p.id)
                    .replace(/{CAT_NAME}/g, catName)
                    .replace(/{PRODUCT_NAME}/g, p.name)
                    .replace(/{PRODUCT_IMAGE}/g, window.processBoseImage ? window.processBoseImage(p.img || p.image) : (p.img || p.image))
                    .replace(/{PRODUCT_DESC}/g, p.description || p.desc || 'يتم التحضير بأجود المكونات لضمان أعلى معايير الجودة.')
                    .replace(/{PRODUCT_PRICE}/g, parseFloat(p.price) || 0);
            }).join('');
            lucide.createIcons();
        } else {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    },

    fetchReviews: function() {
        const db = window.db;
        if (!db) return;
        
        // منع تراكم مستمعي الأحداث غير النشطين لخفض استهلاك البيانات والذاكرة
        if (this._reviewsUnsubscribe) {
            try {
                this._reviewsUnsubscribe();
            } catch(e) {
                console.warn("فشل إغلاق مستمع التقييمات القديم:", e);
            }
        }

        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js').then(fs => {
            const appId = window.__app_id || 'bosy-sweets';
            const reviewsRef = fs.collection(db, 'artifacts', appId, 'public', 'data', 'reviews');
            
            this._reviewsUnsubscribe = fs.onSnapshot(fs.query(reviewsRef), (snap) => {
                this.reviewsData = [];
                snap.docs.forEach(doc => this.reviewsData.push({id: doc.id, ...doc.data()}));
                
                if(this.reviewsData.length === 0) {
                    this.reviewsData = [
                        { name: "أحمد", text: "جودة ممتازة وطعم ولا أروع، التورتة كانت حديث الحفلة." },
                        { name: "منى", text: "تعامل راقي والتوصيل في الميعاد بالضبط." },
                        { name: "د. خالد", text: "خامات نظيفة جداً والسكر مضبوط. مكان مميز فعلاً." },
                        { name: "سارة", text: "بوكس الروقان ممتاز. شكراً لكم." }
                    ];
                }
                
                this.currentReviewPage = 0;
                this.renderReviewsPage();
            }, (error) => { console.warn("تعذر جلب التقييمات من السيرفر:", error); });
        });
    },

    renderReviewsPage: function() {
        const grid = document.getElementById('reviews-grid');
        const pagContainer = document.getElementById('reviews-pagination');
        const dotsContainer = document.getElementById('reviews-dots');
        if(!grid) return;

        if (this.reviewsData.length === 0) return;

        const totalPages = Math.ceil(this.reviewsData.length / this.reviewsPerPage);
        const startIndex = this.currentReviewPage * this.reviewsPerPage;
        const pageReviews = this.reviewsData.slice(startIndex, startIndex + this.reviewsPerPage);

        let html = '';
        pageReviews.forEach(d => {
            html += `
                <div class="review-card animate-fade">
                    <div>
                        <div class="flex gap-1 text-brand-pink mb-6">
                            <i data-lucide="star" class="w-5 h-5 fill-current text-brand-pink"></i><i data-lucide="star" class="w-5 h-5 fill-current text-brand-pink"></i><i data-lucide="star" class="w-5 h-5 fill-current text-brand-pink"></i><i data-lucide="star" class="w-5 h-5 fill-current text-brand-pink"></i><i data-lucide="star" class="w-5 h-5 fill-current text-brand-pink"></i>
                        </div>
                        <p class="font-bold text-lg leading-relaxed text-brand-brown opacity-90 mb-8 whitespace-normal text-balance">"${d.text || d.review}"</p>
                    </div>
                    <div class="flex items-center gap-4 border-t border-brand-pink/10 pt-6">
                        <div class="w-12 h-12 rounded-full bg-brand-pinkLight flex items-center justify-center font-bold text-brand-pink text-lg border border-brand-pink/20 shrink-0">${(d.name || 'ب').charAt(0)}</div>
                        <div>
                            <h5 class="font-bold text-base text-brand-brown">${d.name || 'عميل'}</h5>
                            <span class="text-[10px] opacity-60 uppercase tracking-widest font-bold text-brand-brown">تجربة مؤكدة</span>
                        </div>
                    </div>
                </div>`;
        });
        grid.innerHTML = html;

        if (totalPages > 1) {
            if (pagContainer) pagContainer.style.display = 'flex';
            let dotsHtml = '';
            for(let i=0; i<totalPages; i++) {
                dotsHtml += `<div onclick="window.ProductUI.goToReviewPage(${i})" class="pagination-dot ${i === this.currentReviewPage ? 'active' : ''}"></div>`;
            }
            if (dotsContainer) dotsContainer.innerHTML = dotsHtml;
        } else {
            if (pagContainer) pagContainer.style.display = 'none';
        }
        
        lucide.createIcons();
    },

    changeReviewPage: function(dir) {
        const totalPages = Math.ceil(this.reviewsData.length / this.reviewsPerPage);
        this.currentReviewPage += dir;
        if(this.currentReviewPage < 0) this.currentReviewPage = totalPages - 1; 
        if(this.currentReviewPage >= totalPages) this.currentReviewPage = 0; 
        this.renderReviewsPage();
    },

    goToReviewPage: function(idx) {
        this.currentReviewPage = idx;
        this.renderReviewsPage();
    },

    openReviewModal: function() {
        const modal = document.getElementById('review-modal');
        if(modal) modal.classList.add('active');
    },
    closeReviewModal: function() {
        const modal = document.getElementById('review-modal');
        if(modal) modal.classList.remove('active');
    },
    submitReview: function() {
        const name = document.getElementById('review-name').value;
        const review = document.getElementById('review-text').value;
        
        if (!name || !review) {
            this.showToast("برجاء استكمال البيانات المطلوبة.");
            return;
        }

        if (window.db) {
            const appId = window.__app_id || 'bosy-sweets';
            import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js').then(fs => {
                fs.addDoc(fs.collection(window.db, 'artifacts', appId, 'public', 'data', 'reviews'), {
                    name: name, text: review, timestamp: Date.now()
                }).then(() => {
                    this.closeReviewModal();
                    document.getElementById('review-name').value = '';
                    document.getElementById('review-text').value = '';
                    this.showToast("شكراً لمشاركتك. تم استلام تقييمك بنجاح.");
                });
            });
        } else {
            this.closeReviewModal();
            this.showToast("شكراً لمشاركتك. تم استلام تقييمك بنجاح.");
        }
    },

    modQty: function(val) {
        const newVal = this.state.people + val;
        if (newVal < 4 || newVal > 250) return;
        
        if (val < 0) {
            if (this.state.shape === 'rectangle' && newVal < 20) {
                this.showToast("الهيكل المستطيل يتطلب 20 فرد على الأقل. سيتم تغيير الهيكل إلى دائري.");
                this.state.shape = 'round';
                this.syncShapeUI();
            } else if (this.state.shape === 'square' && newVal < 16) {
                this.showToast("الهيكل المربع يتطلب 16 فرد على الأقل. سيتم تغيير الهيكل إلى دائري.");
                this.state.shape = 'round';
                this.syncShapeUI();
            }
        }
        
        this.state.people = newVal;
        document.getElementById('people-display').innerText = this.state.people;
        this.updatePrices();
    },

    setShape: function(sh, btn) {
        if (sh === 'rectangle' && this.state.people < 20) {
            this.showToast("الهيكل المستطيل يتطلب 20 فرد على الأقل.");
            return;
        }
        if (sh === 'square' && this.state.people < 16) {
            this.showToast("الهيكل المربع يتطلب 16 فرد على الأقل.");
            return;
        }
        this.state.shape = sh;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    syncShapeUI: function() {
        const btns = document.querySelectorAll('#builder-step-1 .option-btn');
        btns.forEach(b => {
            b.classList.remove('selected');
            const onclickValue = b.getAttribute('onclick');
            if(onclickValue && onclickValue.includes('setShape') && onclickValue.includes(`'${this.state.shape}'`)) {
                b.classList.add('selected');
            }
        });
    },

    updatePrices: function() {
        let total = this.state.people * 145;
        if (this.state.print === 'edible') total += 60;
        if (this.state.print === 'non_edible') total += 20;
        if (this.state.gift) total += 40;
        const fin = document.getElementById('final-price-display');
        if (fin) fin.innerText = `${total} ج.م`;
        return total;
    },

    nextStep: function(n) {
        document.querySelectorAll('.builder-step-content').forEach(s => s.classList.add('hidden'));
        
        const targetStep = document.getElementById(`builder-step-${n}`);
        if(targetStep) {
            targetStep.classList.remove('hidden');
        }

        const builderSection = document.getElementById('builder-container');
        if(builderSection) {
            const y = builderSection.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({top: y, behavior: 'smooth'});
        }
    },

    setPrint: function(type, btn) {
        this.state.print = type;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => {
            b.classList.remove('selected');
            const icon = b.querySelector('i');
            if(icon) { icon.classList.remove('lucide-check-circle', 'text-brand-pink'); icon.classList.add('lucide-circle', 'text-gray-300'); }
        });
        btn.classList.add('selected');
        const selectedIcon = btn.querySelector('i');
        if(selectedIcon) { selectedIcon.classList.remove('lucide-circle', 'text-gray-300'); selectedIcon.classList.add('lucide-check-circle', 'text-brand-pink'); }
        
        const up = document.getElementById('print-upload-area');
        if(type !== 'none') {
            if (up) up.classList.remove('hidden');
        } else {
            if (up) up.classList.add('hidden');
        }
        this.updatePrices();
        lucide.createIcons();
    },

    setGift: function(val, btn) {
        this.state.gift = val;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const ga = document.getElementById('gift-card-area');
        if(val) {
            if (ga) ga.classList.remove('hidden');
        } else {
            if (ga) ga.classList.add('hidden');
        }
        this.updatePrices();
    },

    handleFile: function(input, targetId) {
        const status = document.getElementById(targetId);
        if (input.files && input.files[0]) {
            status.innerText = `تم اعتماد الصورة: ${input.files[0].name}`;
            status.classList.add('text-brand-pink');
            if(targetId === 'ref-file-status') this.state.refImageName = input.files[0].name;
            if(targetId === 'print-status') this.state.printImageName = input.files[0].name;
        }
    },

    addCustomCakeToCart: function() {
        const finalPrice = this.updatePrices();
        const healthNotes = document.getElementById('cake-health')?.value || 'لا توجد ملاحظات خاصة';
        this.state.healthNotes = healthNotes;

        const item = {
            id: `custom-cake-${Date.now()}`, name: 'تورتة بتصميم خاص', price: finalPrice, quantity: 1, isCustom: true,
            details: { ...this.state, occasion: document.getElementById('cake-occasion-input')?.value || 'تفضيل مصمم' }
        };
        
        if (window.BoseState && window.cartSystem) {
            window.BoseState.cart.push(item);
            window.cartSystem.saveCartToStorage();
            window.location.href = 'cart.html';
        }
    },

    changeCardQty: function(btn, delta) {
        const display = btn.parentElement.querySelector('.card-qty-display');
        if (display) {
            let val = parseInt(display.innerText) + delta;
            if (val < 1) val = 1;
            if (val > 50) val = 50;
            display.innerText = val;
        }
    },

    addFromCard: function(btn, productId) {
        const display = btn.parentElement.querySelector('.card-qty-display');
        const qty = display ? parseInt(display.innerText) : 1;
        
        if (window.cartSystem) {
            const product = window.BoseState.catalogMap.get(String(productId)) || window.BoseState.catalog.find(p => String(p.id) === String(productId));
            if (!product) return;

            const existing = window.BoseState.cart.find(i => String(i.id) === String(productId) && !i.isCustom);
            if (existing) {
                existing.quantity = (existing.quantity || existing.qty || 1) + qty;
                existing.qty = existing.quantity;
            } else {
                window.BoseState.cart.push({ 
                    id: product.id, name: product.name, price: parseFloat(product.price) || 0, 
                    image: product.img || product.image, quantity: qty, qty: qty, isCustom: false 
                });
            }
            window.cartSystem.saveCartToStorage();
            this.showToast(`تم إضافة [${product.name}] للسلة باحترافية.`);
            if(display) display.innerText = '1';
        }
    },

    syncCartBadge: function() {
        const count = window.BoseState?.cart?.reduce((acc, item) => acc + (item.quantity || item.qty || 1), 0) || 0;
        const badge = document.getElementById('cart-count-badge');
        if (badge) { badge.innerText = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
    }
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;

    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

// تهيئة المحرك وتنسيق التوافق الكامل مع جميع مستندات التطبيق
window.addEventListener('BoseSweets_Engine_Ready', () => {
    window.ProductUI.initRouter();
    window.ProductUI.syncCartBadge();
});

window.addEventListener('catalogDataReady', () => {
    window.ProductUI.initRouter();
});

window.addEventListener('BoseSweets_Cart_Updated', () => window.ProductUI.syncCartBadge());

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if(window.BoseState?.isAppReady) window.ProductUI.initRouter(); }, 1500);
});