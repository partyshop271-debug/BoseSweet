lucide.createIcons();

window.ProductUI = {
    currentCategory: '',
    allCategoryProducts: [],
    reviewsData: [],
    currentReviewPage: 0,
    reviewsPerPage: 3,
    currentFlowerProduct: null, // تم إضافته لحمل بيانات الورد ديناميكياً
    _pendingSimulatorFrame: null, // مؤشر جدولة الإطارات الرسومية لتفادي أعباء المعالجة الفائقة

    flowerState: {
        qty: 15,
        material: 'natural',
        pathType: 'natural', // المسار المختار من التبويبات الذكية
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
        cashDenomination: '200', // فئة النقود (عشرات، ميات، إلخ)
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
        let history = JSON.parse(localStorage.getItem('Bose_Behavior_History') || '[]');
        history.push(catName);
        if(history.length > 15) history.shift();
        localStorage.setItem('Bose_Behavior_History', JSON.stringify(history));
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

    // 👑 الخوارزمية السيادية لمراقبة التبويبات وربطها بالصور والفئات النقدية (V39.2)
    initFlowerTabs: function() {
        const flowerTabs = document.querySelectorAll('.flower-tab');
        const mainProductImg = document.getElementById('main-product-image');
        const cashOptions = document.getElementById('cash-options-container');

        // جلب المنتج المخصص للورد من الذاكرة المركزية
        const catalog = window.BoseState?.catalog || [];
        this.currentFlowerProduct = catalog.find(p => p.category && this.normalizeArabic(p.category) === this.normalizeArabic('ورد')) || {};
        
        // تجهيز خريطة الصور للتبديل الفوري
        const defaultImg = this.currentFlowerProduct.img || this.currentFlowerProduct.image || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        const imagesMap = {
            'natural': this.currentFlowerProduct.imgNatural || defaultImg,
            'artificial': this.currentFlowerProduct.imgArtificial || defaultImg,
            'chocolate': this.currentFlowerProduct.imgChoco || defaultImg,
            'cash': this.currentFlowerProduct.imgCash || defaultImg
        };

        // تفعيل الصورة الأولى تلقائيا لكسر الجمود
        if (mainProductImg && imagesMap['natural']) {
            mainProductImg.src = window.processBoseImage ? window.processBoseImage(imagesMap['natural']) : imagesMap['natural'];
            mainProductImg.style.display = 'block';
            const placeholder = document.getElementById('bose-canvas-placeholder');
            if (placeholder) placeholder.style.display = 'none';
        }

        // مراقبة نقرات العميل وتوجيه المسار بذكاء
        flowerTabs.forEach(tab => {
            tab.removeAttribute('onclick'); // منع أي تعارض مع الـ HTML القديم
            
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                this.flowerState.pathType = target;
                
                // 1. تبديل الصورة فورا حسب الاختيار
                if(imagesMap[target] && mainProductImg) {
                    mainProductImg.src = window.processBoseImage ? window.processBoseImage(imagesMap[target]) : imagesMap[target];
                    mainProductImg.style.display = 'block';
                    const placeholder = document.getElementById('bose-canvas-placeholder');
                    if (placeholder) placeholder.style.display = 'none';
                }

                // 2. إظهار أو إخفاء قسم النقود وتنشيط الإضافات بناء على الاختيار
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
                    this.flowerState.material = target; // طبيعي أو صناعي
                }

                // 3. تمييز التبويب النشط بصريا بشكل راقٍ
                flowerTabs.forEach(t => {
                    t.classList.remove('active', 'selected');
                    t.style.backgroundColor = '#ffffff';
                });
                tab.classList.add('active', 'selected');
                tab.style.backgroundColor = '#fff5f6';
                
                this.updateFlowerPrices();
                this.updateVisualSimulator();
            });
        });
    },

    // 👑 العقل المفكر لشبكة التوجيه - فصل تام بين محاكي الورد وقسم استعراض التورت (V39.2)
    initRouter: function() {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        const action = params.get('action');

        // إخفاء كل الحاويات لتهيئة المشهد بشكل نظيف ومنع التبادل أو التداخل البصري
        const builderContainer = document.getElementById('builder-container');
        const categoryViewer = document.getElementById('category-viewer');
        const flowerCustomizer = document.getElementById('flower-customizer-container');
        const floatingCart = document.getElementById('bose-floating-cart');

        if (builderContainer) builderContainer.classList.add('hidden');
        if (categoryViewer) categoryViewer.classList.add('hidden');
        if (flowerCustomizer) flowerCustomizer.classList.add('hidden');
        if (floatingCart) floatingCart.style.display = 'none';

        // تطبيع المسار الحالي لفحص الأقسام بدقة
        const normalizedCat = category ? this.normalizeArabic(category) : '';

        if (action === 'build_cake') {
            // 1. مسار محاكي وتصميم التورتات المخصص بالكامل (Cake Builder)
            if (builderContainer) builderContainer.classList.remove('hidden');
            this.state = { people: 4, print: 'none', gift: false, shape: 'round', healthNotes: '', refImageName: '', printImageName: '' };
            this.setupBuilderPoster();
            this.updatePrices();
        } 
        else if (category && (normalizedCat === 'ورد' || normalizedCat === 'ورود' || normalizedCat === 'زهور')) {
            // 2. مسار محاكي وتصميم بوكيهات الورد الخاص (Flower Simulator) - مستقل ومعزول كلياً
            if (flowerCustomizer) flowerCustomizer.classList.remove('hidden');
            if (floatingCart) floatingCart.style.display = 'flex';
            
            this.setupFlowerPoster(); 
            this.initFlowerTabs(); 
            this.updateFlowerPrices();
            this.updateVisualSimulator();
        } 
        else if (category) {
            // 3. مسار استعراض المنتجات العادية والجاهزة (بما في ذلك قسم التورت، الجاتوهات، وغيرها)
            this.currentCategory = category;
            if (categoryViewer) categoryViewer.classList.remove('hidden');
            this.trackBehavior(category); 
            this.setupCategoryView(category);
        } 
        else {
            // 4. المسار الافتراضي للموقع (استعراض كافة المنتجات)
            this.currentCategory = 'all';
            if (categoryViewer) categoryViewer.classList.remove('hidden');
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
        document.getElementById('bouquet-density-count').innerText = currentQty;
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
        this.updateFlowerPrices();
        this.updateVisualSimulator();
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
        if (isChecked) { if(inputsWrap) inputsWrap.classList.remove('hidden'); } else { if(inputsWrap) inputsWrap.classList.add('hidden'); }
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
        if (isChecked) { if(inputWrap) inputWrap.classList.remove('hidden'); } else { if(inputWrap) inputWrap.classList.add('hidden'); }
        if(!isChecked) {
            const cashInput = document.getElementById('flower-cash-amount');
            if(cashInput) cashInput.value = 0;
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    // 👑 استشعار التعديلات النقدية من القوائم
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
        if (isChecked) { if(container) container.classList.remove('hidden'); } else { if(container) container.classList.add('hidden'); }
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
        if(isChecked) { if(area) area.classList.remove('hidden'); } else { if(area) area.classList.add('hidden'); }
        if(!isChecked) {
            const giftInput = document.getElementById('flower-gift-text');
            if(giftInput) giftInput.value = '';
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    toggleFlowerPhotoAddon: function(isChecked) {
        const uploadArea = document.getElementById('photo-upload-area');
        if (isChecked) uploadArea.classList.remove('hidden'); else uploadArea.classList.add('hidden');
        if (!isChecked) {
            this.flowerState.photoCount = 0;
            document.getElementById('flower-photo-count').innerText = '0';
            this.flowerState.photoFiles = [];
        }
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    modFlowerPhotos: function(val) {
        const currentCount = this.flowerState.photoCount + val;
        if(currentCount < 0) return;
        this.flowerState.photoCount = currentCount;
        document.getElementById('flower-photo-count').innerText = currentCount;
        
        const uploadContainer = document.getElementById('flower-photo-upload-container');
        if(currentCount > 0) uploadContainer.classList.remove('hidden'); else uploadContainer.classList.add('hidden');
        
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    handleFlowerPhotos: function(input) {
        const status = document.getElementById('flower-photos-status');
        if(input.files && input.files.length > 0) {
            this.flowerState.photoFiles = Array.from(input.files);
            status.innerText = `تم استلام ${input.files.length} صورة بدقة عالية`;
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
        if(this.flowerState.hasGift) totalPrice += (pricing.priceCard || 25); 
        if(this.flowerState.hasRibbon) totalPrice += 50; 
        totalPrice += this.flowerState.photoCount * (pricing.pricePhoto || 15); 

        const chocoBudget = parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0;
        const cashAmount = parseFloat(document.getElementById('cash-amount')?.value) || 0;
        
        if (this.flowerState.hasChocolate || this.flowerState.pathType === 'chocolate') totalPrice += chocoBudget;
        if (this.flowerState.hasCash || this.flowerState.pathType === 'cash') totalPrice += cashAmount;

        const pDisplay = document.getElementById('live-total-price');
        if(pDisplay) pDisplay.innerText = `${totalPrice} ج.م`;

        const floatPrice = document.getElementById('floating-total-price');
        if(floatPrice) floatPrice.innerText = `${totalPrice} ج.م`;

        return totalPrice;
    },

    // 👑 تغليف وتأمين محرك المحاكاة الرسومية بجدولة متزامنة لتجنب انهيار الشاشات (V39.2)
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

            let clusterHtml = '';
            const self = window.ProductUI;
            const totalRoses = self.flowerState.qty;
            
            let bgStyle = 'radial-gradient(circle, #ff2e55 0%, #b80c2f 100%)'; 
            let borderStyle = 'border: 2px solid rgba(255,255,255,0.45);';
            let textureClass = 'shadow-md';

            if (self.flowerState.color === 'أبيض') {
                bgStyle = 'radial-gradient(circle, #ffffff 0%, #f1e4e6 100%)';
                borderStyle = 'border: 2px solid rgba(255,145,164,0.25);';
            } else if (self.flowerState.color === 'وردي') {
                bgStyle = 'radial-gradient(circle, #ffb3c1 0%, #ff758f 100%)';
            } else if (self.flowerState.color === 'مشكل') {
                bgStyle = 'linear-gradient(135deg, #ff2e55 0%, #ffffff 50%, #ff758f 100%)';
            } else if (self.flowerState.color === 'درجة مخصصة' && self.flowerState.customColorText) {
                bgStyle = 'radial-gradient(circle, #ff8095 0%, #8c2334 100%)'; 
            }

            if (self.flowerState.material === 'satin') {
                borderStyle += 'box-shadow: inset 0 0 12px rgba(255,255,255,0.85), 0 4px 10px rgba(0,0,0,0.1);';
            } else if (self.flowerState.material === 'artificial') {
                borderStyle += 'box-shadow: inset 0 0 6px rgba(0,0,0,0.12);';
            }

            if (self.flowerState.sampleRoseImgData) {
                bgStyle = `url('${self.flowerState.sampleRoseImgData}') center/cover no-repeat`;
                borderStyle = 'border: 3px solid #ff91a4;';
            }

            const baseCenterX = 50;
            const baseCenterY = 48;

            for (let i = 0; i < totalRoses; i++) {
                const phi = i * 137.5 * (Math.PI / 180); 
                const c = 3.6; 
                const radius = c * Math.sqrt(i); 
                
                const left = baseCenterX + radius * Math.cos(phi);
                const top = baseCenterY + radius * Math.sin(phi) * 0.95; 
                
                const roseSize = 34 + (i % 3 * 3) - (i > 30 ? 4 : 0); 

                clusterHtml += `
                    <div class="absolute rounded-full transition-all duration-500 hover:scale-110 ${textureClass} animate-fade"
                         style="left: ${left}%; top: ${top}%; width: ${roseSize}px; height: ${roseSize}px; margin-left: -${roseSize/2}px; margin-top: -${roseSize/2}px; background: ${bgStyle}; ${borderStyle} z-20">
                    </div>
                `;
            }

            let matText = "طبيعي";
            if (self.flowerState.material === 'artificial') matText = "صناعي";
            if (self.flowerState.material === 'satin') matText = "ستان";

            let descLabel = `${totalRoses} وردة (${matText}) - ${self.flowerState.color === 'درجة مخصصة' ? self.flowerState.customColorText : self.flowerState.color}`;
            if (self.flowerState.color === 'مشكل' && self.flowerState.mixDetails) {
                descLabel += ` (${self.flowerState.mixDetails})`;
            }
            if (self.flowerState.sampleRoseImgData) {
                descLabel += ` [مستنسخ من صورتك المرفوعة]`;
            }

            clusterHtml += `
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-brand-pink text-brand-brown px-5 py-2.5 rounded-full font-black text-xs shadow-md z-40 text-center whitespace-nowrap">
                    💐 ${descLabel}
                </div>
            `;
            layerFlowers.innerHTML = clusterHtml;

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
                            <div class="absolute w-8 h-8 -ml-4 -mt-4 rounded-xl shadow-lg z-30 flex items-center justify-center animate-fade"
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
                            <div class="absolute w-9 h-5 -ml-4.5 -mt-2.5 bg-emerald-700 border-2 border-emerald-100 rounded-sm shadow-md z-30 flex items-center justify-center text-[9px] text-white font-black animate-fade"
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
                        renderImg.className = "w-24 h-28 p-2 bg-white shadow-2xl border-2 border-brand-pink/20 rounded-sm transform rotate-[-4deg] absolute z-30 left-[20%] top-[26%] object-cover animate-fade";
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
                        <div class="absolute bottom-16 left-1/2 -translate-x-1/2 bg-brand-pink text-white text-[11px] font-black px-5 py-2 rounded-sm shadow-md border-y border-white/30 z-30 max-w-[240px] text-center whitespace-nowrap tracking-wider animate-fade">
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
                        <div class="absolute top-6 right-6 bg-white border border-brand-pink/40 text-brand-brown px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md z-30 max-w-[150px] truncate animate-fade">
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

    // 👑 دالة الاعتماد وجمع البيانات لإرسالها للسلة (تم دمج منطق الفئات النقدية بدقة)
    addCustomFlowerToCart: function() {
        const finalPrice = this.updateFlowerPrices();
        
        // استخلاص المسار النشط بذكاء
        const activeTabEl = document.querySelector('.flower-tab.active') || document.querySelector('.flower-tab.selected');
        const activeTab = activeTabEl ? activeTabEl.getAttribute('data-target') : (this.flowerState.pathType || 'natural');
        
        const ribbonText = document.getElementById('flower-ribbon-text')?.value || '';
        const giftText = document.getElementById('flower-gift-text')?.value || '';
        
        let orderDetails = {
            productId: (this.currentFlowerProduct && this.currentFlowerProduct.id) ? this.currentFlowerProduct.id : `custom-flower-${Date.now()}`,
            name: (this.currentFlowerProduct && this.currentFlowerProduct.name) ? `بوكيه: ${this.currentFlowerProduct.name}` : 'بوكيه ورد بتصميم خاص',
            price: finalPrice,
            quantity: 1,
            isCustom: true,
            type: activeTab, // تحديد المسار بدقة كما طلبت الإدارة
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
                photoFilesNames: this.flowerState.photoFiles.map(f => f.name)
            }
        };

        // تغليف وإضافة تفاصيل الفلوس والفئات لو العميل اختار مسار الكاش
        if (activeTab === 'cash' || this.flowerState.hasCash) {
            orderDetails.details.cashAmount = document.getElementById('cash-amount')?.value || 0;
            orderDetails.details.cashDenomination = document.getElementById('cash-denomination')?.value || '200';
        }

        // إرسال البيانات النهائية والمنسقة لسلة المشتريات
        if (window.BoseState && window.cartSystem) {
            window.BoseState.cart.push(orderDetails);
            window.cartSystem.saveCartToStorage();
            window.location.href = 'cart.html';
        }
    },

    // 👑 الخوارزمية الحصرية لعرض المنتجات مع استبعاد تام لأي تداخل بين الأقسام (V39.2)
    setupCategoryView: function(catName) {
        const catalog = window.BoseState?.catalog || [];
        const normalizedSearch = this.normalizeArabic(catName);

        this.allCategoryProducts = catName === 'all' ? catalog : catalog.filter(p => {
            if (!p.category) return false;
            const normalizedCat = this.normalizeArabic(p.category);
            
            // مقارنة صارمة تضمن عدم خلط تصفح التورت مع الورد تحت أي ظرف من الظروف
            if (normalizedSearch === 'ورد' || normalizedSearch === 'ورود') {
                return normalizedCat === 'ورد' || normalizedCat === 'ورود' || normalizedCat === 'زهور';
            }
            if (normalizedSearch === 'تورت' || normalizedSearch === 'تورته' || normalizedSearch === 'تورتات') {
                return normalizedCat === 'تورت' || normalizedCat === 'تورته' || normalizedCat === 'تورتات' || normalizedCat === 'حلويات' || normalizedCat === 'كيك';
            }
            
            return normalizedCat === normalizedSearch || 
                   normalizedCat === normalizedSearch + 'ه' || 
                   normalizedSearch === normalizedCat + 'ه' ||
                   (normalizedCat.endsWith('ات') && normalizedCat.slice(0, -2) === normalizedSearch) ||
                   (normalizedSearch.endsWith('ات') && normalizedSearch.slice(0, -2) === normalizedCat);
        });

        const headerContainer = document.getElementById('category-header-container');
        const tabsContainer = document.getElementById('size-tabs-container');
        const gridContainer = document.getElementById('category-grid');
        const displayName = catName === 'all' ? 'منتجات حلويات بوسي' : catName;

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
        
        if (hasSizes) {
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
        if (catalog.length === 0 || !container) return;

        let history = JSON.parse(localStorage.getItem('Bose_Behavior_History') || '[]');
        let preferredCats = [];
        if(history.length > 0) {
            const counts = history.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
            preferredCats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        }

        const cartIds = window.BoseState?.cart?.map(i => String(i.id)) || [];
        
        let suggestions = [];
        for(let cat of preferredCats) {
            const normalizedCat = this.normalizeArabic(cat);
            let catProds = catalog.filter(p => {
                if (!p.category) return false;
                return this.normalizeArabic(p.category) === normalizedCat && !cartIds.includes(String(p.id));
            });
            suggestions.push(...catProds);
        }

        if(suggestions.length < 8) {
            let randomProds = catalog.filter(p => !cartIds.includes(String(p.id)) && !suggestions.find(sp => sp.id === p.id));
            randomProds = randomProds.sort(() => 0.5 - Math.random());
            suggestions.push(...randomProds);
        }

        suggestions = suggestions.slice(0, 8);

        if (suggestions.length > 0) {
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
        }
    },

    fetchReviews: function() {
        const db = window.db;
        if (!db) return;
        
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js').then(fs => {
            const appId = window.__app_id || 'bosy-sweets';
            const reviewsRef = fs.collection(db, 'artifacts', appId, 'public', 'data', 'reviews');
            fs.onSnapshot(fs.query(reviewsRef), (snap) => {
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
            }, (error) => { console.warn("تعذر جلب التقييمات:", error); });
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
            pagContainer.style.display = 'flex';
            let dotsHtml = '';
            for(let i=0; i<totalPages; i++) {
                dotsHtml += `<div onclick="window.ProductUI.goToReviewPage(${i})" class="pagination-dot ${i === this.currentReviewPage ? 'active' : ''}"></div>`;
            }
            dotsContainer.innerHTML = dotsHtml;
        } else {
            pagContainer.style.display = 'none';
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
        if(type !== 'none') up.classList.remove('hidden'); else up.classList.add('hidden');
        this.updatePrices();
        lucide.createIcons();
    },

    setGift: function(val, btn) {
        this.state.gift = val;
        btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const ga = document.getElementById('gift-card-area');
        if(val) ga.classList.remove('hidden'); else ga.classList.add('hidden');
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