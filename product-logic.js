lucide.createIcons();

window.ProductUI = {
    currentCategory: '',
    allCategoryProducts: [],
    reviewsData: [],
    currentReviewPage: 0,
    reviewsPerPage: 3,
    
    flowerState: {
        qty: 15,
        material: 'natural',
        color: 'أحمر',
        hasChocolate: false,
        chocolateBudget: 0,
        chocolatePreferences: '',
        hasCash: false,
        cashAmount: 0,
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
        const catalog = window.BoseState?.catalog || [];
        const flowerProducts = catalog.filter(p => p.category && this.normalizeArabic(p.category) === this.normalizeArabic('ورد'));
        let flowerPoster = 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg';

        if(flowerProducts.length > 0) {
            let img = flowerProducts[0].heroImg || flowerProducts[0].img || flowerProducts[0].image;
            if(img) { flowerPoster = window.processBoseImage ? window.processBoseImage(img) : img; }
        }
        const posterEl = document.getElementById('main-product-image');
        if(posterEl) posterEl.src = flowerPoster;
    },

    initRouter: function() {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        const action = params.get('action');

        document.getElementById('builder-container').classList.add('hidden');
        document.getElementById('category-viewer').classList.add('hidden');
        document.getElementById('flower-customizer-container').classList.add('hidden');

        if (action === 'build_cake') {
            document.getElementById('builder-container').classList.remove('hidden');
            this.state = { people: 4, print: 'none', gift: false, shape: 'round', healthNotes: '', refImageName: '', printImageName: '' };
            this.setupBuilderPoster();
            this.updatePrices();
        } else if (category && this.normalizeArabic(category) === this.normalizeArabic('ورد')) {
            document.getElementById('flower-customizer-container').classList.remove('hidden');
            this.setupFlowerPoster(); 
            this.updateFlowerPrices();
            this.updateVisualSimulator();
        } else if (category) {
            this.currentCategory = category;
            document.getElementById('category-viewer').classList.remove('hidden');
            this.trackBehavior(category); 
            this.setupCategoryView(category);
        } else {
            this.currentCategory = 'all';
            document.getElementById('category-viewer').classList.remove('hidden');
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
            this.showToast("أقل عدد للحفاظ على جودة وشكل التنسيق المعتمد هو 15 وردة.");
            return;
        }
        this.flowerState.qty = currentQty;
        document.getElementById('bouquet-density-count').innerText = currentQty;
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    setFlowerMaterial: function(mat, btn) {
        this.flowerState.material = mat;
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
        this.updateVisualSimulator();
    },

    setFlowerColor: function(col, btn) {
        this.flowerState.color = col;
        btn.parentElement.querySelectorAll('.color-circle').forEach(b => {
            b.classList.remove('active');
            b.style.borderWidth = '2px';
            b.style.borderColor = 'rgba(255,145,164,0.3)';
        });
        btn.classList.add('active');
        btn.style.borderWidth = '3px';
        btn.style.borderColor = '#ff91a4';
        this.updateVisualSimulator();
    },

    toggleFlowerChocolate: function(isChecked) {
        this.flowerState.hasChocolate = isChecked;
        const inputsWrap = document.getElementById('chocolate-details-inputs');
        if (isChecked) inputsWrap.classList.remove('hidden'); else inputsWrap.classList.add('hidden');
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    toggleFlowerGiftCash: function(isChecked) {
        this.flowerState.hasCash = isChecked;
        const inputWrap = document.getElementById('cash-amount-input');
        if (isChecked) inputWrap.classList.remove('hidden'); else inputWrap.classList.add('hidden');
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    toggleFlowerGift: function(val, btn) {
        this.flowerState.hasGift = val;
        const area = document.getElementById('flower-gift-area');
        if(val) area.classList.remove('hidden'); else area.classList.add('hidden');
        this.updateFlowerPrices();
        this.updateVisualSimulator();
    },

    toggleFlowerPhotoAddon: function(isChecked) {
        const uploadArea = document.getElementById('photo-upload-area');
        if (isChecked) uploadArea.classList.remove('hidden'); else uploadArea.classList.add('hidden');
        if (!isChecked) {
            this.flowerState.photoCount = 0;
            document.getElementById('flower-photo-count').innerText = '0';
            document.getElementById('layer-custom-photo').style.opacity = '0';
            document.getElementById('custom-photo-render').style.display = 'none';
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
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const renderImg = document.getElementById('custom-photo-render');
                renderImg.src = e.target.result;
                renderImg.style.display = 'block';
                document.getElementById('layer-custom-photo').style.opacity = '1';
            }
            reader.readAsDataURL(input.files[0]);
        }
    },

    updateFlowerPrices: function() {
        let basePrice = 400;
        if(this.flowerState.qty > 15) {
            basePrice += (this.flowerState.qty - 15) * 35;
        }

        let totalPrice = basePrice;
        if(this.flowerState.hasGift) totalPrice += 25; 
        totalPrice += this.flowerState.photoCount * 15; 

        const chocoBudget = parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0;
        const cashAmount = parseFloat(document.getElementById('flower-cash-amount')?.value) || 0;
        
        totalPrice += chocoBudget;
        totalPrice += cashAmount;

        const pDisplay = document.getElementById('live-total-price');
        if(pDisplay) pDisplay.innerText = `${totalPrice} ج.م`;

        return totalPrice;
    },

    updateVisualSimulator: function() {
        const layerFlowers = document.getElementById('layer-flowers');
        const layerChocolate = document.getElementById('layer-chocolate');
        const layerCash = document.getElementById('layer-cash');
        const layerCard = document.getElementById('layer-card');
        
        let colorHex = '#d32f2f';
        if (this.flowerState.color === 'أبيض') colorHex = '#f5f5f5';
        if (this.flowerState.color === 'وردي') colorHex = '#ff91a4';
        if (this.flowerState.color === 'مشكل') colorHex = 'linear-gradient(45deg, #d32f2f, #ffffff)';

        if (layerFlowers) {
            layerFlowers.innerHTML = `<div style="width: 130px; height: 130px; border-radius: 50%; background: ${colorHex}; border: 4px solid #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #3d241c; text-align: center; font-size: 13px; padding: 10px;">${this.flowerState.qty} وردة<br>${this.flowerState.color}</div>`;
            const scaleValue = 1 + ((this.flowerState.qty - 15) * 0.02);
            layerFlowers.style.transform = `scale(${Math.min(scaleValue, 1.4)})`;
        }

        if (layerChocolate) {
            if (this.flowerState.hasChocolate) {
                layerChocolate.style.opacity = '1';
                const budget = document.getElementById('flower-chocolate-budget')?.value || 0;
                layerChocolate.innerHTML = `<div class="animate-fade" style="background: #3d241c; color: #fff; padding: 8px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 2px solid #ff91a4; margin-top: -80px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">+ شوكولاتة بقيمة ${budget} ج.م</div>`;
            } else {
                layerChocolate.style.opacity = '0';
                layerChocolate.innerHTML = '';
            }
        }

        if (layerCash) {
            if (this.flowerState.hasCash) {
                layerCash.style.opacity = '1';
                const amount = document.getElementById('flower-cash-amount')?.value || 0;
                layerCash.innerHTML = `<div class="animate-fade" style="background: #2e7d32; color: #fff; padding: 8px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 2px solid #fff; margin-bottom: -120px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">+ مبالغ نقدية ${amount} ج.م</div>`;
            } else {
                layerCash.style.opacity = '0';
                layerCash.innerHTML = '';
            }
        }

        if (layerCard) {
            if (this.flowerState.hasGift) {
                layerCard.style.opacity = '1';
                const msg = document.getElementById('flower-gift-text')?.value || 'رسالة بيضاء';
                layerCard.innerHTML = `<div class="animate-fade" style="background: #fff5f6; color: #3d241c; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: 700; border: 1px solid #ff91a4; margin-right: -10px; max-width: 140px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">💌 "${msg}"</div>`;
            } else {
                layerCard.style.opacity = '0';
                layerCard.innerHTML = '';
            }
        }
    },

    addCustomFlowerToCart: function() {
        const finalPrice = this.updateFlowerPrices();
        const giftText = document.getElementById('flower-gift-text')?.value || '';
        this.flowerState.giftText = giftText;
        
        const chocoBudget = parseFloat(document.getElementById('flower-chocolate-budget')?.value) || 0;
        const chocoPref = document.getElementById('flower-chocolate-pref')?.value || 'تنسيق غني مخصص';
        const cashAmount = parseFloat(document.getElementById('flower-cash-amount')?.value) || 0;

        const item = {
            id: `custom-flower-${Date.now()}`,
            name: 'بوكيه ورد بتصميم خاص',
            price: finalPrice,
            quantity: 1,
            isCustom: true,
            details: {
                category: 'ورد',
                qty: this.flowerState.qty,
                material: this.flowerState.material,
                color: this.flowerState.color,
                hasGift: this.flowerState.hasGift,
                giftText: giftText,
                photoCount: this.flowerState.photoCount,
                chocolateBudget: chocoBudget,
                chocolatePreferences: chocoPref,
                cashAmount: cashAmount,
                photoFilesNames: this.flowerState.photoFiles.map(f => f.name)
            }
        };

        if (window.BoseState && window.cartSystem) {
            window.BoseState.cart.push(item);
            window.cartSystem.saveCartToStorage();
            window.location.href = 'cart.html';
        }
    },

    setupCategoryView: function(catName) {
        const catalog = window.BoseState?.catalog || [];
        const normalizedSearch = this.normalizeArabic(catName);

        this.allCategoryProducts = catName === 'all' ? catalog : catalog.filter(p => {
            if (!p.category) return false;
            const normalizedCat = this.normalizeArabic(p.category);
            return normalizedCat === normalizedSearch || 
                   normalizedSearch.includes(normalizedCat) || 
                   normalizedCat.includes(normalizedSearch);
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
            const tmpl = document.getElementById('bose-suggestion-card-template').innerHTML;
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
