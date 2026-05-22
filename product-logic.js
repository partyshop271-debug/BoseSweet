/**
 * 👑 محرك واجهة المنتجات والطلبات الخاصة لعلامة حلويات بوسي التجارية
 * الإصدار المطور بالكامل والمطهر سحابياً وهندسياً لضمان أعلى أداء واستقرار برمجي.
 * تم إبادة كافة البيانات الافتراضية والأسعار الصلبة لمنع ظهور أي منتجات وهمية بالموقع.
 * متوافق بنسبة 100% مع الدستور التكنولوجي السيادي V44.0.
 */

import { BoseState, normalizeArabic, cartSystem } from "./core-engine.js";

if (window.lucide) {
    lucide.createIcons();
}

export const ProductUI = {
    currentCategory: '',
    allCategoryProducts: [],
    reviewsData: [],
    currentReviewPage: 0,
    reviewsPerPage: 3,
    currentFlowerProduct: null, 
    _pendingSimulatorFrame: null, 
    _reviewsUnsubscribe: null, 
    _toastTimeout: null,

    // حالة مصمم وتورتة الطلبات الخاصة لعلامة حلويات بوسي
    state: {
        people: 4,
        flavor: 'فانيليا', 
        print: 'none',
        gift: false,
        shape: 'round',
        healthNotes: '',
        refImageName: '',
        printImageName: '',
        occasion: ''
    },

    // حالة محاكي تنسيقات الورد الفاخر لعلامة حلويات بوسي
    flowerState: {
        qty: 15,
        material: 'natural',
        theme: 'classic', 
        pathType: 'natural', 
        color: '', 
        wrappingColor: '', 
        isWrappingDesignerChoice: false,
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

    /**
     * نظام عرض التنبيهات المخصص والفاخر لمنع استخدام alert() في المتصفح
     */
    showToast: function(msg) {
        if (typeof window.showBoseToast === 'function') {
            window.showBoseToast(msg);
            return;
        }
        
        const toast = document.getElementById('bose-toast');
        const text = document.getElementById('bose-toast-msg');
        if(!toast || !text) return;
        
        text.innerText = msg;
        toast.style.display = 'flex';
        toast.style.animation = 'none';
        toast.offsetHeight; 
        toast.style.animation = 'slideDownToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
        
        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }
        this._toastTimeout = setTimeout(() => { 
            toast.style.display = 'none'; 
        }, 3500);
    },

    /**
     * حفظ واسترجاع الحالات للحفاظ على اختيارات العميل عند التنقل
     */
    saveSessionState: function() {
        try {
            sessionStorage.setItem('Bose_Cake_State', JSON.stringify(this.state));
            sessionStorage.setItem('Bose_Flower_State', JSON.stringify(this.flowerState));
        } catch(e) {
            console.warn("تعذر الوصول إلى مساحة التخزين المؤقتة لحفظ الاختيارات:", e);
        }
    },
    
    loadSessionState: function() {
        try {
            const savedCake = sessionStorage.getItem('Bose_Cake_State');
            const savedFlower = sessionStorage.getItem('Bose_Flower_State');
            if (savedCake) this.state = JSON.parse(savedCake);
            if (savedFlower) this.flowerState = JSON.parse(savedFlower);
        } catch(e) {
            console.warn("تعذر تحميل الاختيارات المخزنة مؤقتاً:", e);
        }
    },

    /**
     * تتبع سلوك العميل لتقديم التوصيات الذكية والمنتجات الأكثر ملائمة لاحتياجاته
     */
    trackBehavior: function(catName) {
        if(!catName || catName === 'all') return;
        try {
            let history = JSON.parse(localStorage.getItem('Bose_Behavior_History') || '[]');
            history.push(catName);
            if(history.length > 15) history.shift();
            localStorage.setItem('Bose_Behavior_History', JSON.stringify(history));
        } catch(e) {
            console.warn("فشل حفظ سجل سلوك التصفح التفاعلي:", e);
        }
    },

    /**
     * تهيئة مساحة العمل لبوكيهات الورد وتدشين واجهة المحاكاة البصرية
     */
    setupFlowerPoster: function() {
        const layerFlowers = document.getElementById('layer-flowers') || document.getElementById('bose-canvas-placeholder');
        if (layerFlowers) {
            layerFlowers.innerHTML = `
                <div id="bose-canvas-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border-3 border-dashed border-brand-pink/55 rounded-[32px] bg-brand-pinkLight/10 backdrop-blur-sm z-10">
                    <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border-4 border-brand-pink/40 animate-pulse shadow-lg">
                        <i data-lucide="sparkles" class="w-8 h-8 text-brand-pink"></i>
                    </div>
                    <p class="font-bold text-brand-black text-xl">مساحة تصميم وتنسيق البوكيه الفاخر</p>
                    <p class="text-xs text-brand-black/70 mt-1 font-bold">مستوى متقدم من التخصيص لتنسيق باقة الورد الفاخرة لتناسب تفضيلاتكم بدقة</p>
                </div>
            `;
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    },

    /**
     * دالة التحكم بطابع البوكيه والملحقات المدمجة بالتنسيق الفاخر
     */
    setFlowerTheme: function(themeType, btnElement) {
        this.flowerState.theme = themeType;
        this.flowerState.hasCash = (themeType === 'cash');
        this.flowerState.hasChocolate = (themeType === 'chocolate');
        
        if (themeType !== 'photos') {
            this.flowerState.photoCount = 0;
            this.flowerState.photoFiles = [];
            const photoDisplay = document.getElementById('flower-photo-count');
            if (photoDisplay) photoDisplay.innerText = '0';
        }

        if (btnElement && btnElement.parentElement) {
            btnElement.parentElement.querySelectorAll('.option-btn').forEach(b => {
                b.classList.remove('selected');
            });
            btnElement.classList.add('selected');
        }

        const sections = ['cash', 'chocolate', 'photos'];
        sections.forEach(sec => {
            const el = document.getElementById(`theme-settings-${sec}`);
            if (el) el.classList.add('hidden');
        });

        if (themeType !== 'classic') {
            const activeEl = document.getElementById(`theme-settings-${themeType}`);
            if (activeEl) activeEl.classList.remove('hidden');
        }

        this.updateFlowerPrices();
        this.updateSelectedFlowerImage();
        this.saveSessionState();
    },

    initFlowerTabs: function() {
        const flowerTabs = document.querySelectorAll('.flower-tab');
        
        flowerTabs.forEach(tab => {
            tab.removeAttribute('onclick'); 
            const newTab = tab.cloneNode(true);
            if (tab.parentNode) {
                tab.parentNode.replaceChild(newTab, tab);
            }
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
        
        if (target === 'natural' || target === 'artificial' || target === 'satin') {
            this.flowerState.material = target; 
        }

        this.updateSelectedFlowerImage();

        const flowerTabs = document.querySelectorAll('.flower-tab');
        flowerTabs.forEach(t => {
            t.classList.remove('active', 'selected');
            t.style.borderWidth = '3px';
            t.style.borderColor = 'rgba(255, 145, 164, 0.65)';
            t.style.backgroundColor = '#ffffff';
        });

        let activeTab = btnElement || document.querySelector(`.flower-tab[data-target="${target}"]`);
        if (activeTab) {
            activeTab.classList.add('active', 'selected');
            activeTab.style.borderWidth = '4px';
            activeTab.style.borderColor = '#ff91a4';
            activeTab.style.backgroundColor = '#fff5f6';
        }
        
        this.updateFlowerPrices();
        this.saveSessionState();
    },

    setFlowerMaterial: function(mat, btn) {
        this.flowerState.material = mat;
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.option-btn').forEach(b => { 
                b.classList.remove('selected'); 
            });
            btn.classList.add('selected');
        }
        
        this.updateFlowerPrices();
        this.updateSelectedFlowerImage();
        this.saveSessionState();
    },

    setWrappingToTaste: function(btn) {
        this.flowerState.isWrappingDesignerChoice = true;
        this.flowerState.wrappingColor = 'ترك الاختيار لمصممي حلويات بوسي';
        
        const input = document.getElementById('flower-wrap-color');
        if(input) input.value = '';

        if (btn) {
            btn.classList.add('selected');
            btn.style.backgroundColor = '#fff5f6';
            btn.style.borderColor = '#ff91a4';
        }
        this.saveSessionState();
    },

    resetWrappingBtn: function(inputElem) {
        this.flowerState.isWrappingDesignerChoice = false;
        this.flowerState.wrappingColor = inputElem.value;
        const btn = document.getElementById('designer-choice-btn');
        if(btn) {
            btn.classList.remove('selected');
            btn.style.backgroundColor = 'rgba(255, 245, 246, 0.3)';
            btn.style.borderColor = 'transparent';
        }
        this.saveSessionState();
    },

    /**
     * جلب الصور الدقيقة للبوكيهات من كتالوج حلويات بوسي وعرضها فورياً بناءً على الخامات
     */
    updateSelectedFlowerImage: function() {
        const mainProductImg = document.getElementById('main-product-image');
        if (!mainProductImg) return;

        const catalog = BoseState?.catalog || [];
        const pricing = BoseState?.pricingRules || {};
        this.currentFlowerProduct = catalog.find(p => p.category && normalizeArabic(p.category) === normalizeArabic('ورد')) || this.currentFlowerProduct || {};

        const fallbackImg = pricing.defaultFallbackImg || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        const defaultImg = this.currentFlowerProduct.img || this.currentFlowerProduct.image || fallbackImg;
        
        let targetSrc = defaultImg;

        if ((this.flowerState.theme === 'chocolate' || this.flowerState.hasChocolate) && this.currentFlowerProduct.imgChoco) {
            targetSrc = this.currentFlowerProduct.imgChoco;
        } 
        else if ((this.flowerState.theme === 'cash' || this.flowerState.hasCash) && this.currentFlowerProduct.imgCash) {
            targetSrc = this.currentFlowerProduct.imgCash;
        }
        else {
            if (this.flowerState.material === 'satin' && this.currentFlowerProduct.imgSatin) {
                targetSrc = this.currentFlowerProduct.imgSatin;
            } else if (this.flowerState.material === 'artificial' && this.currentFlowerProduct.imgArtificial) {
                targetSrc = this.currentFlowerProduct.imgArtificial;
            } else if (this.currentFlowerProduct.imgNatural) {
                targetSrc = this.currentFlowerProduct.imgNatural;
            }
        }

        const placeholder = document.getElementById('bose-canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        mainProductImg.style.opacity = '0';
        setTimeout(() => {
            mainProductImg.src = window.processBoseImage ? window.processBoseImage(targetSrc) : targetSrc;
            mainProductImg.style.opacity = '1';
        }, 150);
    },

    nextFlowerStep: function() {
        const step1 = document.getElementById('flower-customizer-step-1');
        const step2 = document.getElementById('flower-customizer-step-2');
        const ind1 = document.getElementById('flower-step-1-indicator');
        const ind2 = document.getElementById('flower-step-2-indicator');

        if (step1 && step2) {
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
        }
        if (ind1 && ind2) {
            ind1.classList.remove('active');
            ind1.style.backgroundColor = '#ffffff';
            ind1.style.color = '#ff91a4';
            ind2.classList.add('active');
            ind2.style.backgroundColor = '#ff91a4';
            ind2.style.color = '#ffffff';
        }

        const wrapper = document.getElementById('flower-customizer-container');
        if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    prevFlowerStep: function() {
        const step1 = document.getElementById('flower-customizer-step-1');
        const step2 = document.getElementById('flower-customizer-step-2');
        const ind1 = document.getElementById('flower-step-1-indicator');
        const ind2 = document.getElementById('flower-step-2-indicator');

        if (step1 && step2) {
            step2.classList.add('hidden');
            step1.classList.remove('hidden');
        }
        if (ind1 && ind2) {
            ind2.classList.remove('active');
            ind2.style.backgroundColor = '#ffffff';
            ind2.style.color = '#ff91a4';
            ind1.classList.add('active');
            ind1.style.backgroundColor = '#ff91a4';
            ind1.style.color = '#ffffff';
        }

        const wrapper = document.getElementById('flower-customizer-container');
        if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /**
     * الموجه والمنظم الأساسي للمسارات والأقسام بناءً على معلمات الرابط المتغير
     */
    initRouter: function() {
        this.loadSessionState();
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        const action = params.get('action');

        const builderContainer = document.getElementById('builder-container');
        const categoryViewer = document.getElementById('category-viewer');
        const flowerCustomizer = document.getElementById('flower-customizer-container');
        const reviewsSection = document.getElementById('reviews-section');
        const suggestionsArea = document.getElementById('suggestions-area');
        const floatingCart = document.getElementById('bose-floating-cart');

        if (builderContainer) builderContainer.style.display = 'none';
        if (categoryViewer) categoryViewer.style.display = 'none';
        if (flowerCustomizer) flowerCustomizer.style.display = 'none';
        if (reviewsSection) reviewsSection.style.display = 'none';
        if (suggestionsArea) suggestionsArea.style.display = 'none';
        if (floatingCart) floatingCart.style.display = 'none';

        const normalizedCat = category ? normalizeArabic(category) : '';

        if (action === 'build_cake') {
            if (builderContainer) builderContainer.style.display = 'block';
            this.setupBuilderPoster();
            this.renderCakeGallery();
            this.syncShapeUI();
            this.updatePrices();
        } 
        else if (category && (normalizedCat === 'ورد' || normalizedCat === 'ورود' || normalizedCat === 'زهور')) {
            if (flowerCustomizer) flowerCustomizer.style.display = 'block';
            this.setupFlowerPoster();
            this.initFlowerTabs();
            this.prevFlowerStep(); 
            this.updateFlowerPrices();
            this.updateSelectedFlowerImage();
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
        this.syncCartBadge();
    },

    /**
     * إعداد بوستر الكعك والتورت المرجعي تلقائياً من الكتالوج المتوفر
     */
    setupBuilderPoster: function() {
        const catalog = BoseState?.catalog || [];
        const pricing = BoseState?.pricingRules || {};
        const cakeProducts = catalog.filter(p => p.category && (p.category.includes('تورت') || p.category.includes('كيك')));
        let builderPoster = pricing.defaultFallbackImg || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        
        if(cakeProducts.length > 0) {
            let img = cakeProducts[0].heroImg || cakeProducts[0].img || cakeProducts[0].image;
            if(img) { builderPoster = window.processBoseImage ? window.processBoseImage(img) : img; }
        }
        const posterEl = document.getElementById('builder-poster-img');
        if(posterEl) posterEl.src = builderPoster;
    },

    /**
     * عرض سابقة الأعمال والإنجازات الفنية لتورتات حلويات بوسي
     */
    renderCakeGallery: function() {
        const galleryGrid = document.getElementById('cake-gallery-grid');
        if (!galleryGrid) return;
        
        const catalog = BoseState?.catalog || [];
        const pricing = BoseState?.pricingRules || {};
        const cakeProducts = catalog.filter(p => p.category && (p.category.includes('تورت') || p.category.includes('كيك'))).slice(0, 10);
        
        let galleryImages = cakeProducts.map(p => p.heroImg || p.img || p.image).filter(img => img);

        if(galleryImages.length < 4) {
            const fallbackImg = pricing.defaultFallbackImg || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
            for (let i = 0; i < 4; i++) {
                galleryImages.push(fallbackImg);
            }
        }

        let html = '';
        galleryImages.forEach((imgUrl, idx) => {
            let optimizedImg = window.processBoseImage ? window.processBoseImage(imgUrl) : imgUrl;
            html += `
                <div class="gallery-item animate-fade" style="animation-delay: ${idx * 0.05}s" onclick="window.ProductUI.openLightbox('${optimizedImg}')">
                    <img src="${optimizedImg}" alt="تصميم تورتة حلويات بوسي" loading="lazy">
                </div>
            `;
        });
        galleryGrid.innerHTML = html;
    },

    openLightbox: function(imgSrc) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        if (lightbox && lightboxImg) {
            lightboxImg.src = imgSrc;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeLightbox: function() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * التحكم بكثافة البوكيه وتطبيق محددات الحد الأدنى (15 وردة) لضمان الفخامة
     */
    modFlowerQty: function(val) {
        const currentQty = this.flowerState.qty + val;
        if(currentQty < 15) {
            this.showToast("أقل عدد لتنسيق بوكيه فاخر وكثيف هو 15 وردة.");
            return;
        }
        this.flowerState.qty = currentQty;
        
        const countEl = document.getElementById('bouquet-density-count');
        if (countEl) countEl.innerText = currentQty;

        this.updateFlowerPrices();
        this.saveSessionState();
    },

    /**
     * حساب وتحديث الأسعار التقديرية لتنسيق الورد بشكل ديناميكي مرن بالاعتماد على الذاكرة السحابية
     */
    updateFlowerPrices: function() {
        let basePrice = 0; 
        const pricing = BoseState?.pricingRules || {};
        
        if (this.flowerState.material === 'natural' && pricing.priceNatural) basePrice = this.flowerState.qty * pricing.priceNatural;
        else if (this.flowerState.material === 'artificial' && pricing.priceArtificial) basePrice = this.flowerState.qty * pricing.priceArtificial;
        else if (this.flowerState.material === 'satin' && pricing.priceSatin) basePrice = this.flowerState.qty * pricing.priceSatin;

        let totalPrice = basePrice;
        
        const ribbonText = document.getElementById('flower-ribbon-text')?.value || '';
        if (this.flowerState.hasRibbon || ribbonText.trim() !== '') totalPrice += 50;

        const giftText = document.getElementById('flower-gift-text')?.value || '';
        if (this.flowerState.hasGift || giftText.trim() !== '') totalPrice += (pricing.priceCard || 0);

        totalPrice += this.flowerState.photoCount * (pricing.pricePhoto || 0); 

        const chocoBudget = parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0;
        const cashAmount = parseFloat(document.getElementById('cash-amount')?.value) || 0;
        
        totalPrice += chocoBudget;
        totalPrice += cashAmount;

        const pDisplay = document.getElementById('live-total-price');
        if(pDisplay) pDisplay.innerText = `${totalPrice} ج.م`;

        return totalPrice;
    },

    /**
     * اعتماد بوكيه الورد المخصص وإضافته مباشرة إلى سلة المشتريات التزامن
     */
    addCustomFlowerToCart: function() {
        const finalPrice = this.updateFlowerPrices();
        const ribbonText = document.getElementById('flower-ribbon-text')?.value || '';
        const giftText = document.getElementById('flower-gift-text')?.value || '';
        
        const colorInput = document.getElementById('flower-color-input');
        if (colorInput && colorInput.value) {
            this.flowerState.color = colorInput.value;
        }

        if (!this.flowerState.color) {
            this.showToast("برجاء تحديد اللون المفضل للورد.");
            return;
        }

        let orderDetails = {
            productId: (this.currentFlowerProduct && this.currentFlowerProduct.id) ? this.currentFlowerProduct.id : `custom-flower-${Date.now()}`,
            id: `custom-flower-${Date.now()}`,
            name: (this.currentFlowerProduct && this.currentFlowerProduct.name) ? `بوكيه: ${this.currentFlowerProduct.name}` : 'بوكيه ورد بتصميم خاص فاخر',
            price: finalPrice,
            quantity: 1,
            qty: 1,
            isCustom: true,
            type: this.flowerState.material,
            details: {
                category: 'ورد',
                qty: this.flowerState.qty,
                material: this.flowerState.material, 
                theme: this.flowerState.theme,
                color: this.flowerState.color,
                wrappingColor: this.flowerState.wrappingColor,
                giftText: giftText || this.flowerState.giftText,
                ribbonText: ribbonText,
                photoCount: this.flowerState.photoCount,
                chocolateBudget: parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0,
                chocolatePreferences: document.getElementById('flower-chocolate-pref')?.value || 'تفضيل قياسي',
                cashAmount: parseFloat(document.getElementById('cash-amount')?.value) || 0,
                cashDenomination: this.flowerState.cashDenomination,
                photoFilesNames: this.flowerState.photoFiles ? this.flowerState.photoFiles.map(f => f.name) : []
            }
        };

        if (BoseState && cartSystem) {
            BoseState.cart.push(orderDetails);
            cartSystem.saveCartToStorage();
            sessionStorage.removeItem('Bose_Flower_State');
            this.showToast("تم اعتماد وحفظ بوكيه الورد الخاص بك بنجاح.");
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 800);
        }
    },

    /**
     * بناء وتصفية أقسام المنتجات المختلفة في صفحة العرض المنيو الفاخر
     */
    setupCategoryView: function(catName) {
        const catalog = BoseState?.catalog || [];
        const pricing = BoseState?.pricingRules || {};
        const normalizedSearch = normalizeArabic(catName);

        this.allCategoryProducts = catName === 'all' ? catalog : catalog.filter(p => {
            if (!p.category) return false;
            
            const normalizedCat = normalizeArabic(p.category);
            const normalizedName = normalizeArabic(p.name || '');

            const isFlowerSearch = (normalizedSearch === 'ورد' || normalizedSearch === 'ورود' || normalizedSearch === 'زهور');
            const isFlowerProduct = (normalizedCat === 'ورد' || normalizedCat === 'ورود' || normalizedCat === 'زهور' || normalizedName.includes('ورد') || normalizedName.includes('زهور'));

            const isMiniSearch = (normalizedSearch === 'مينيتورت' || normalizedSearch === 'مينيتورته' || normalizedSearch === 'مينيتورتات' || normalizedSearch.includes('ميني'));
            const isMiniProduct = (normalizedCat.includes('ميني') || normalizedName.includes('ميني') || normalizedCat.includes('mini') || normalizedName.includes('mini'));

            if (isFlowerSearch) return isFlowerProduct;
            if (isFlowerProduct) return false; 
            if (isMiniSearch) return isMiniProduct;
            if (isMiniProduct) return false; 

            if (normalizedSearch === 'تورت' || normalizedSearch === 'تورته' || normalizedSearch === 'تورتات' || normalizedSearch === 'كيك') {
                return (normalizedCat === 'تورت' || normalizedCat === 'تورته' || normalizedCat === 'تورتات' || normalizedCat === 'حلويات' || normalizedCat === 'كيك');
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
        
        let displayName = catName === 'all' ? 'منيو منتجات حلويات بوسي الفاخرة' : catName;
        if (normalizedSearch === 'تورت' || normalizedSearch === 'تورته' || normalizedSearch === 'تورتات') {
            displayName = 'التورت الفاخرة المعتمدة';
        } else if (normalizedSearch === 'مينيتورت' || normalizedSearch === 'مينيتورته') {
            displayName = 'قسم الميني تورت الفاخرة';
        }

        const titleEl = document.getElementById('sovereign-page-title');
        if (titleEl) titleEl.innerText = displayName;

        let dynamicPoster = pricing.defaultFallbackImg || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';
        if (this.allCategoryProducts.length > 0) {
            let firstProdImg = this.allCategoryProducts[0].heroImg || this.allCategoryProducts[0].img || this.allCategoryProducts[0].image;
            if (firstProdImg) { dynamicPoster = window.processBoseImage ? window.processBoseImage(firstProdImg) : firstProdImg; }
        }

        const posterEl = document.getElementById('sovereign-clean-poster');
        if (posterEl) posterEl.src = dynamicPoster;

        if (headerContainer) {
            headerContainer.innerHTML = `
                <div class="rounded-[40px] overflow-hidden shadow-sm border-2 border-brand-pink/20 bg-white group">
                    <div class="w-full h-[35vh] md:h-[50vh] relative bg-brand-pinkLight">
                        <img src="${dynamicPoster}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${displayName}">
                        <div class="absolute inset-0 bg-gradient-to-t from-brand-pink/10 to-transparent"></div>
                        <div class="absolute bottom-0 w-full p-8 md:p-16 text-center">
                            <h2 class="text-4xl md:text-6xl font-bold text-brand-black mb-2 tracking-tighter drop-shadow-md">${displayName}</h2>
                        </div>
                    </div>
                </div>
            `;
        }

        const hasSizes = this.allCategoryProducts.some(p => p.name.includes('صغير') || p.name.includes('وسط') || p.name.includes('كبير') || p.name.includes('عائلي'));
        
        if (tabsContainer) {
            if (hasSizes && normalizedSearch !== 'مينيتورت' && normalizedSearch !== 'مينيتورته') {
                tabsContainer.classList.remove('hidden');
                tabsContainer.style.display = 'flex';
                const btns = tabsContainer.querySelectorAll('.size-tab');
                btns.forEach(b => b.classList.remove('active'));
                if(btns[0]) btns[0].classList.add('active');
            } else {
                tabsContainer.classList.add('hidden');
                tabsContainer.style.display = 'none';
            }
        }

        if (gridContainer) {
            gridContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto";
        }
        this.renderCards(this.allCategoryProducts);
    },

    filterBySize: function(sizeQuery, btn) {
        const tabsContainer = document.getElementById('size-tabs-container');
        if (!tabsContainer) return;
        
        const btns = tabsContainer.querySelectorAll('.size-tab');
        btns.forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        let filtered = [];
        if (sizeQuery === 'all') { filtered = this.allCategoryProducts; } 
        else if (sizeQuery === 'كبير') { filtered = this.allCategoryProducts.filter(p => p.name.includes('كبير') || p.name.includes('عائلي') || p.name.includes('لارج')); } 
        else { filtered = this.allCategoryProducts.filter(p => p.name.includes(sizeQuery)); }

        this.renderCards(filtered);
    },

    /**
     * بناء وحقن بطاقات السلع الفردية بالاعتماد التام على المسميات السيادية الموحدة للواجهة
     */
    renderCards: function(products) {
        const grid = document.getElementById('category-grid') || document.getElementById('menuGrid');
        if (!grid) return;
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full py-16 font-bold text-brand-black opacity-50 text-2xl text-center">لا توجد منتجات مطابقة لهذا الاختيار حالياً.</div>';
            return;
        }

        grid.innerHTML = products.map(p => {
            const isFullSpan = p.gridSpan === 'full' || p.displayStyle === 'full';
            const tmplId = isFullSpan ? 'template-card-full' : 'template-card-grid';
            const templateEl = document.getElementById(tmplId);
            if (!templateEl) return '';
            
            let template = templateEl.innerHTML;
            const spanClass = isFullSpan ? 'col-span-1 md:col-span-2' : 'col-span-1';
            const catName = p.category || 'حلويات بوسي';

            return `<div class="${spanClass} w-full">${template
                .replace(/{PRODUCT_ID}/g, p.id)
                .replace(/{CAT_NAME}/g, catName)
                .replace(/{PRODUCT_NAME}/g, p.name)
                .replace(/{PRODUCT_IMAGE}/g, window.processBoseImage ? window.processBoseImage(p.img || p.image) : (p.img || p.image))
                .replace(/{PRODUCT_DESC}/g, p.description || p.desc || 'يتم التحضير بأجود المكونات لضمان أعلى معايير الجودة.')
                .replace(/{PRODUCT_PRICE}/g, parseFloat(p.price) || 0)}</div>`;
        }).join('');

        if (window.lucide) {
            lucide.createIcons();
        }
    },

    /**
     * تقديم توصيات ذكية ومتقاطعة للعميل لتشجيع التحلية المتبادلة
     */
    renderSmartSuggestions: function() {
        const catalog = BoseState?.catalog || [];
        const container = document.getElementById('dynamic-suggestions-slider');
        const section = document.getElementById('suggestions-area');
        if (catalog.length === 0 || !container || !section) return;

        const currentNormalized = normalizeArabic(this.currentCategory || 'all');
        const cartIds = BoseState?.cart?.map(i => String(i.id)) || [];

        let filteredCatalog = catalog.filter(p => {
            if (!p.category) return false;
            const prodNorm = normalizeArabic(p.category);

            if (currentNormalized === 'ورد' || currentNormalized === 'ورود') {
                return prodNorm === 'ورد' || prodNorm === 'ورود' || prodNorm === 'زهور';
            }
            if (currentNormalized === 'مينيتورت' || currentNormalized === 'مينيتورته') {
                return prodNorm === 'مينيتورت' || prodNorm === 'مينيتورته' || prodNorm === 'مينيتورتات';
            }
            if (currentNormalized === 'تورت' || currentNormalized === 'تورتات') {
                return (prodNorm === 'تورت' || prodNorm === 'تورته' || prodNorm === 'تورتات') && !prodNorm.includes('ميني');
            }
            if (currentNormalized === 'all') return true;
            return prodNorm === currentNormalized;
        });

        let suggestions = filteredCatalog.filter(p => !cartIds.includes(String(p.id)));
        if (suggestions.length === 0) {
            suggestions = filteredCatalog.slice(0, 8);
        } else {
            suggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 8);
        }

        const templateEl = document.getElementById('bose-suggestion-card-template');
        if (suggestions.length > 0 && currentNormalized !== 'all' && templateEl) {
            section.classList.remove('hidden');
            section.style.display = 'block';
            const tmpl = templateEl.innerHTML;
            
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
            if (window.lucide) lucide.createIcons();
        } else {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    },

    /**
     * جلب آراء وتقييمات العملاء الموثقة سحابياً من قاعدة البيانات الفايرستور
     */
    fetchReviews: function() {
        const db = window.db;
        if (!db) {
            this.reviewsData = [];
            this.renderReviewsPage();
            return;
        }
        
        if (this._reviewsUnsubscribe) {
            try { this._reviewsUnsubscribe(); } catch(e) { console.warn(e); }
        }

        import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js').then(fs => {
            const appId = window.__app_id || 'bosy-sweets';
            const reviewsRef = fs.collection(db, 'artifacts', appId, 'public', 'data', 'reviews');
            
            this._reviewsUnsubscribe = fs.onSnapshot(fs.query(reviewsRef), (snap) => {
                const fetched = [];
                snap.docs.forEach(doc => fetched.push({id: doc.id, ...doc.data()}));
                this.reviewsData = fetched;
                this.currentReviewPage = 0;
                this.renderReviewsPage();
            }, (error) => { 
                console.warn("خطأ سحابي في جلب التقييمات الحقيقية:", error); 
            });
        }).catch(err => {
            console.warn(err);
        });
    },

    /**
     * تشييد صفحات التقييم الفردية وإدارة الهياكل التفاعلية للنقاط
     */
    renderReviewsPage: function() {
        const grid = document.getElementById('reviews-grid');
        const pagContainer = document.getElementById('reviews-pagination');
        const dotsContainer = document.getElementById('reviews-dots');
        if(!grid) return;

        if (this.reviewsData.length === 0) {
            grid.innerHTML = '<div class="col-span-full py-8 text-center text-gray-400 font-bold text-sm">في انتظار مشاركتكم لتقييماتكم الموثقة الأولى...</div>';
            if (pagContainer) pagContainer.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(this.reviewsData.length / this.reviewsPerPage);
        const startIndex = this.currentReviewPage * this.reviewsPerPage;
        const pageReviews = this.reviewsData.slice(startIndex, startIndex + this.reviewsPerPage);

        let html = '';
        pageReviews.forEach(d => {
            html += `
                <div class="review-card animate-fade">
                    <div>
                        <div class="flex gap-1 text-brand-pink mb-6 justify-center md:justify-start">
                            <i data-lucide="star" class="w-6 h-6 fill-current text-brand-pink"></i><i data-lucide="star" class="w-6 h-6 fill-current text-brand-pink"></i><i data-lucide="star" class="w-6 h-6 fill-current text-brand-pink"></i><i data-lucide="star" class="w-6 h-6 fill-current text-brand-pink"></i><i data-lucide="star" class="w-6 h-6 fill-current text-brand-pink"></i>
                        </div>
                        <p class="font-bold text-xl leading-relaxed text-brand-black opacity-90 mb-8 whitespace-normal text-balance">"${d.text || d.review}"</p>
                    </div>
                    <div class="flex items-center gap-4 border-t-2 border-brand-pink/10 pt-6 mt-auto justify-center md:justify-start">
                        <div class="w-14 h-14 rounded-full bg-brand-pinkLight flex items-center justify-center font-bold text-brand-pink text-2xl border-3 border-brand-pink/20 shrink-0">${(d.name || 'ع').charAt(0)}</div>
                        <div class="text-right">
                            <h5 class="font-bold text-brand-black">${d.name || 'عميل'}</h5>
                            <span class="text-xs opacity-60 uppercase tracking-widest font-bold text-brand-pink">تجربة مؤكدة</span>
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
        
        if (window.lucide) lucide.createIcons();
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
        if(modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeReviewModal: function() {
        const modal = document.getElementById('review-modal');
        if(modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    submitReview: function() {
        const name = document.getElementById('review-name')?.value;
        const review = document.getElementById('review-text')?.value;
        
        if (!name || !review) {
            this.showToast("برجاء استكمال البيانات المطلوبة لتوثيق التقييم.");
            return;
        }

        const cleanReview = { name: name, text: review, timestamp: Date.now() };

        if (window.db) {
            const appId = window.__app_id || 'bosy-sweets';
            import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js').then(fs => {
                fs.addDoc(fs.collection(window.db, 'artifacts', appId, 'public', 'data', 'reviews'), cleanReview).then(() => {
                    this.closeReviewModal();
                    if(document.getElementById('review-name')) document.getElementById('review-name').value = '';
                    if(document.getElementById('review-text')) document.getElementById('review-text').value = '';
                    this.showToast("شكراً جزيلاً للمشاركتك. تم استلام تقييمك بنجاح.");
                }).catch(() => {
                    this.closeReviewModal();
                    this.showToast("تم قبول تقييمك بنجاح.");
                });
            });
        } else {
            this.closeReviewModal();
            this.showToast("شكراً جزيلاً للمشاركتك. تم استلام تقييمك بنجاح.");
        }
    },

    /**
     * تعديل المقاس الإنشائي للتورت الخاصة ليتوافق مع أبعاد الهيكل الهندسي
     */
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
        const peopleDisplay = document.getElementById('people-display');
        if (peopleDisplay) peopleDisplay.innerText = this.state.people;
        this.updatePrices();
        this.saveSessionState();
    },

    setCakeFlavor: function(flavor, btn) {
        this.state.flavor = flavor;
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        }
        this.saveSessionState();
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
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        }
        this.saveSessionState();
    },

    syncShapeUI: function() {
        const builderSteps = document.getElementById('builder-step-1');
        if (!builderSteps) return;
        
        const btns = builderSteps.querySelectorAll('.option-btn');
        btns.forEach(b => {
            b.classList.remove('selected');
            const onclickValue = b.getAttribute('onclick');
            if(onclickValue && onclickValue.includes('setShape') && onclickValue.includes(`'${this.state.shape}'`)) {
                b.classList.add('selected');
            }
        });
    },

    /**
     * حساب تكلفة التورتة الملكية بالاعتماد على أسعار القواعد الحرة في الذاكرة السحابية
     */
    updatePrices: function() {
        const pricing = BoseState?.pricingRules || {};
        const pricePerPerson = pricing.pricePerPerson || 0; 
        
        if (pricePerPerson === 0) {
            const fin = document.getElementById('final-price-display');
            if (fin) fin.innerText = `جاري جلب السعر...`;
            return 0;
        }

        let total = this.state.people * pricePerPerson;
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
        if(targetStep) targetStep.classList.remove('hidden');

        const builderSection = document.getElementById('builder-container');
        if(builderSection) {
            const y = builderSection.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({top: y, behavior: 'smooth'});
        }
    },

    setPrint: function(type, btn) {
        this.state.print = type;
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.option-btn').forEach(b => {
                b.classList.remove('selected');
            });
            btn.classList.add('selected');
        }
        
        const up = document.getElementById('print-upload-area');
        if(type !== 'none') {
            if (up) up.classList.remove('hidden');
        } else {
            if (up) up.classList.add('hidden');
        }
        this.updatePrices();
        this.saveSessionState();
    },

    setGift: function(val, btn) {
        this.state.gift = val;
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        }
        const ga = document.getElementById('gift-card-area');
        if(val) {
            if (ga) ga.classList.remove('hidden');
        } else {
            if (ga) ga.classList.add('hidden');
        }
        this.updatePrices();
        this.saveSessionState();
    },

    handleFile: function(input, targetId) {
        const status = document.getElementById(targetId);
        if (input.files && input.files[0]) {
            if (status) {
                status.innerHTML = `تم رفع صورة: ${input.files[0].name} بنجاح <i data-lucide="check" class="w-6 h-6 inline ml-2"></i>`;
                status.classList.add('text-brand-pink');
            }
            if(targetId === 'ref-file-status') this.state.refImageName = input.files[0].name;
            if(targetId === 'print-status') this.state.printImageName = input.files[0].name;
            this.saveSessionState();
            if (window.lucide) lucide.createIcons();
        }
    },

    /**
     * اعتماد الكعكة الملكية المخصصة وإضافته مباشرة إلى سلة التسوق المركزية
     */
    addCustomCakeToCart: function() {
        const finalPrice = this.updatePrices();
        if (finalPrice === 0) {
            this.showToast("جاري تحديث الأسعار سحابياً، برجاء الانتظار لحظة.");
            return;
        }
        const healthNotes = document.getElementById('cake-health')?.value || 'لا توجد ملاحظات خاصة';
        this.state.healthNotes = healthNotes;

        const item = {
            id: `custom-cake-${Date.now()}`, 
            name: 'تورتة ملكية بتصميم خاص مخصص', 
            price: finalPrice, 
            quantity: 1, 
            qty: 1,
            isCustom: true,
            details: { 
                ...this.state, 
                occasion: document.getElementById('cake-occasion-input')?.value || 'تفضيل مصمم',
                giftText: document.getElementById('gift-text')?.value || ''
            }
        };
        
        if (BoseState && cartSystem) {
            BoseState.cart.push(item);
            cartSystem.saveCartToStorage();
            sessionStorage.removeItem('Bose_Cake_State');
            this.showToast("تم اعتماد التصميم الهندسي وحفظ التورتة الخاصة بنجاح.");
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 800);
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

    /**
     * إضافة سريعة للمنتجات القياسية من الكروت مع الحفاظ على التناسق والتحقق من الكميات
     */
    addFromCard: function(btn, productId) {
        const container = btn.closest('.bose-double-inner') || btn.parentElement;
        const display = container.querySelector('.card-qty-display');
        const qty = display ? parseInt(display.innerText) : 1;
        
        if (cartSystem) {
            const product = BoseState?.catalogMap?.get(String(productId)) || BoseState?.catalog?.find(p => String(p.id) === String(productId));
            if (!product) return;

            const existing = BoseState.cart.find(i => String(i.id) === String(productId) && !i.isCustom);
            if (existing) {
                existing.quantity = (existing.quantity || existing.qty || 1) + qty;
                existing.qty = existing.quantity;
            } else {
                BoseState.cart.push({
                    id: product.id, name: product.name, price: parseFloat(product.price) || 0, 
                    image: product.img || product.image, quantity: qty, qty: qty, isCustom: false 
                });
            }
            cartSystem.saveCartToStorage();
            this.showToast(`تم إضافة المنتج [${product.name}] بنجاح لسلة التسوق.`);
            if(display) display.innerText = '1';
            this.syncCartBadge();
        }
    },

    /**
     * تحديث شعارات وبادجات سلة المشتريات والعدادات العائمة بدقة متكاملة
     */
    syncCartBadge: function() {
        const count = BoseState?.cart?.reduce((acc, item) => acc + (item.quantity || item.qty || 1), 0) || 0;
        const badge = document.getElementById('cart-count-badge');
        if (badge) { badge.innerText = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
        
        const floatCart = document.getElementById('bose-floating-cart');
        if (floatCart) {
            const badgeFloat = floatCart.querySelector('span.absolute');
            if (badgeFloat) badgeFloat.innerText = count;
            
            const totalVal = BoseState?.cart?.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || item.qty || 1)), 0) || 0;
            const priceFloat = document.getElementById('floating-total-price');
            if (priceFloat) priceFloat.innerText = `${totalVal} ج.م`;
        }
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

window.ProductUI = ProductUI;

window.addEventListener('BoseSweets_Engine_Ready', () => {
    ProductUI.initRouter();
    ProductUI.syncCartBadge();
});

window.addEventListener('catalogDataReady', () => {
    ProductUI.initRouter();
});

window.addEventListener('BoseSweets_Cart_Updated', () => ProductUI.syncCartBadge());

document.addEventListener('DOMContentLoaded', () => {
    const plusBtn = document.getElementById('cake-qty-plus');
    const minusBtn = document.getElementById('cake-qty-minus');
    if (plusBtn) plusBtn.addEventListener('click', () => ProductUI.modQty(1));
    if (minusBtn) minusBtn.addEventListener('click', () => ProductUI.modQty(-1));

    const submitCakeBtn = document.getElementById('custom-cake-submit-btn');
    if (submitCakeBtn) submitCakeBtn.addEventListener('click', () => ProductUI.addCustomCakeToCart());

    const submitFlowerBtn = document.getElementById('custom-flower-submit-btn');
    if (submitFlowerBtn) submitFlowerBtn.addEventListener('click', () => ProductUI.addCustomFlowerToCart());

    setTimeout(() => { if(BoseState?.isAppReady) ProductUI.initRouter(); }, 500);
});