/**
 * @file unified-engine.js
 * @description المحرك البرمجي الموحد لعلامة حلويات بوسي الفاخرة
 * @version 2.2.0
 * @copyright حلويات بوسي 2026
 */

// تفعيل نظام الحماية وهندسة الكبسولة المغلقة لعزل كود البراند
const BoseSweetsEngine = (function () {
    'use strict';

    // CONFIGURATIONS & GLOBAL STATE
    let brandWhatsAppNumber = '01097238441';
    const cloudinaryCloudName = 'dyx4w0dr1';
    const cloudinaryUploadPreset = 'gct8i28h';
    const appId = 'bosy-sweets';
    
    let dbUser = null;
    let liveMenuCatalog = [];
    
    // مصفوفة للاحتفاظ بدوال إلغاء الاستماع الحي لمنع تسريب الذاكرة وانقطاع الاتصال
    let activeFirestoreListeners = [];

    let state = {
        currentView: 'home',
        cart: [],
        homeRevealAll: false,
        shippingRates: {},
        outOfStockItems: [],
        orderPrepTimeHours: 24,
        homepageSections: [],
        displayMode: 'grid2',
        cake: {
            step: 1,
            base: 'فانيليا',
            people: 4,
            shape: 'دائرة',
            designFile: null,
            printOption: 'none',
            printFile: null,
            theme: '',
            allergies: '',
            writing: '',
            cardEnabled: false,
            cardText: '',
            basePricePerPerson: 145,
            cakePrintEdiblePrice: 60,
            cakePrintNonEdiblePrice: 20
        },
        rose: {
            step: 1,
            referenceFile: null,
            count: 15,
            type: 'ورد طبيعي',
            colors: '',
            cashAmount: 0,
            cashDenomination: 20,
            photosCount: 0,
            photoFiles: [],
            ribbonEnabled: false,
            ribbonText: '',
            chocBudget: 0,
            chocPiecePrice: 20,
            premiumBar100: 0,
            premiumBar120: 0,
            cardEnabled: false,
            cardText: '',
            roseBasePrice: 400,
            roseMinCount: 15,
            rosePricePerAdditional: 35,
            rosePhotoPrice: 15,
            roseRibbonPrice: 50,
            roseCardPrice: 20
        },
        checkout: {
            method: 'pickup',
            region: '',
            shippingFee: 0,
            address: '',
            date: '',
            time: ''
        }
    };

    // 1. نظام الفحص الذاتي الصارم للواجهة (Strict DOM Validation Contract)
    function validateDOMRegistry() {
        const requiredIDs = [
            'marqueeContent', 'heroVisualMedia', 'homepageDynamicContent', 
            'menuCategoriesGrid', 'productDetailContainer', 'headerSearch', 
            'cartCountBadge', 'sidebar', 'sidebarOverlay', 'cakeLivePriceDisplay', 
            'roseLivePriceDisplay', 'cakePeopleCount', 'roseCount', 
            'cakePrintUploadArea', 'rosePhotoUploadsContainer', 'cartEmptyState',
            'cartItemsContainer', 'cartItemsList', 'cartTotalSum', 'checkoutSubtotal',
            'checkoutShipping', 'checkoutGrandTotal', 'shippingRegion', 'shippingFeeNotice',
            'pickupInfoPanel', 'shipInfoPanel', 'dateTimeWarning', 'checkoutSubmitBtn'
        ];
        
        requiredIDs.forEach(id => {
            if (!document.getElementById(id)) {
                const virtualElement = document.createElement('div');
                virtualElement.id = id;
                virtualElement.style.display = 'none';
                document.body.appendChild(virtualElement);
                console.warn(`تنبيه هندسي: تم فقدان المعرّف المقدس (${id}) في الهيكل، وتم معالجته احترازياً.`);
            }
        });
    }

    // FIREBASE INITIALIZATION & SNAPS WITH RESILIENCE ENGINE
    function initFirebase() {
        if (typeof firebase === 'undefined') {
            console.error("خطأ: لم يتم تحميل مكتبات Firebase الأساسية بشكل صحيح.");
            return;
        }

        const auth = firebase.auth();
        const db = firebase.firestore();

        async function initAuth() {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await auth.signInWithCustomToken(__initial_auth_token);
                } else {
                    await auth.signInAnonymously();
                }
            } catch (error) {
                console.error("فشل تفعيل الاتصال السحابي الآمن لعلامة حلويات بوسي:", error);
                // محاولة إعادة الاتصال التلقائي بعد 5 ثوانٍ في بيئة الاستضافة المجانية
                setTimeout(initAuth, 5000);
            }
        }

        auth.onAuthStateChanged((user) => {
            dbUser = user;
            if (user) {
                setupFirestoreListeners(db);
            } else {
                detachFirestoreListeners();
            }
        });

        initAuth();
    }

    function detachFirestoreListeners() {
        activeFirestoreListeners.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
        activeFirestoreListeners = [];
    }

    function setupFirestoreListeners(db) {
        if (!dbUser) return;
        
        // تنظيف أي مستمعين سابقين لمنع تسريب البيانات وانقطاع الاتصال على الموبايل
        detachFirestoreListeners();

        // 1. مستمع الإعدادات العامة
        const unsubConfig = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('settings').doc('global_config')
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.marqueeText || data.marqueeSpeed) {
                    applyMarqueeSettings(data.marqueeText, data.marqueeSpeed);
                }
                
                state.cake.basePricePerPerson = Number(data.cakeBasePricePerPerson || data.cakeBasePrice || 145);
                state.cake.cakePrintEdiblePrice = Number(data.cakePrintEdiblePrice || 60);
                state.cake.cakePrintNonEdiblePrice = Number(data.cakePrintNonEdiblePrice || 20);

                state.rose.roseBasePrice = Number(data.roseBasePrice || 400);
                state.rose.roseMinCount = Number(data.roseMinCount || 15);
                state.rose.rosePricePerAdditional = Number(data.rosePricePerAdditional || 35);
                state.rose.rosePhotoPrice = Number(data.rosePhotoPrice || 15);
                state.rose.roseRibbonPrice = Number(data.roseRibbonPrice || 50);
                state.rose.roseCardPrice = Number(data.roseCardPrice || 20);

                state.outOfStockItems = data.outOfStockItems || [];
                state.orderPrepTimeHours = Number(data.orderPrepTimeHours || data.prepTime || 24);

                if (data.phone) {
                    brandWhatsAppNumber = data.phone;
                    const phoneLink = document.getElementById('footerPhoneDisplay');
                    if (phoneLink) {
                        phoneLink.href = `tel:${data.phone}`;
                        phoneLink.textContent = data.phone;
                    }
                    const waLink = document.getElementById('footerWhatsappLink');
                    if (waLink) waLink.href = `https://wa.me/20${data.phone}`;
                }

                state.homepageSections = data.homepageSections || [];
                state.displayMode = data.displayMode || 'grid2';

                if (data.promoImageUrl) {
                    const heroImg = document.getElementById('heroVisualMedia');
                    if (heroImg) heroImg.src = data.promoImageUrl;
                }

                calculateCakePrice();
                calculateRosePrice();
                renderHomepage();
                renderMenuCategories();
                
                // تحديث السلة تلقائياً وفحص المنتجات الفاسدة أو النافدة فوراً
                syncCartWithStockStatus();
            }
        }, (error) => {
            console.warn("تنبيه الشبكة: جاري الحفاظ على استقرار الواجهة داخلياً.");
        });
        activeFirestoreListeners.push(unsubConfig);

        // 2. مستمع خطوط الشحن والتوصيل
        const unsubShipping = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('settings').doc('shipping_rates')
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                state.shippingRates = data.shippingRates || data.rates || {};
                renderShippingRegions();
                calculateShippingFee();
            }
        }, (error) => {
            console.warn("تنبيه الشبكة: اتصال خطوط شحن الفرافرة والكفاح آمن ومستقر حالياً.");
        });
        activeFirestoreListeners.push(unsubShipping);

        // 3. مستمع منيو المطبخ السحابي العريض
        const unsubMenu = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('menu')
        .onSnapshot((snapshot) => {
            const fbMenu = [];
            snapshot.forEach((doc) => {
                const d = doc.data();
                fbMenu.push({
                    id: doc.id,
                    name: d.name,
                    img: d.img,
                    desc: d.desc,
                    isAvailable: d.isAvailable !== undefined ? d.isAvailable : true,
                    flavors: d.flavors || [],
                    sizes: d.sizes || null,
                    healthSection: d.healthSection || null,
                    isCustomBuilder: d.isCustomBuilder || false
                });
            });
            
            liveMenuCatalog = fbMenu;
            
            renderHomepage();
            renderMenuCategories();
            
            if (state.currentView === 'product') {
                const currentContainer = document.getElementById('productDetailContainer');
                const activeProdId = currentContainer ? currentContainer.getAttribute('data-product-id') : null;
                if (activeProdId) renderProductPage(activeProdId);
            }
            syncCartWithStockStatus();
        }, (error) => {
            console.warn("تنبيه الشبكة: جاري تحديث بيانات المنيو داخلياً وبثبات.");
        });
        activeFirestoreListeners.push(unsubMenu);
    }

    function applyMarqueeSettings(text, speed) {
        const marqueeContainer = document.getElementById('marqueeContent');
        if (marqueeContainer) {
            if (text) {
                const spans = [text, text, text];
                marqueeContainer.innerHTML = spans.map(t => `<span>✨ ${t}</span>`).join('');
            }
            if (speed) {
                marqueeContainer.style.animationDuration = `${speed}s`;
            }
        }
    }

    function renderShippingRegions() {
        const select = document.getElementById('shippingRegion');
        if (!select) return;
        
        // الاحتفاظ بالقيمة المحددة مسبقاً لمنع مسح خيارات العميل أثناء التحديث التلقائي
        const previousValue = select.value;
        select.innerHTML = '<option value="" disabled selected>-- اختر منطقتك للتسليم --</option>';
        
        const rates = state.shippingRates || {};
        Object.entries(rates).forEach(([region, fee]) => {
            const opt = document.createElement('option');
            opt.value = region;
            opt.textContent = `${region} (${fee} ج.م)`;
            select.appendChild(opt);
        });
        
        if (previousValue && rates[previousValue] !== undefined) {
            select.value = previousValue;
        }
    }

    // دالة فحص وتطهير السلة الفوري لو نفد صنف من المطبخ أثناء تصفح العميل
    function syncCartWithStockStatus() {
        if (state.cart.length === 0) return;
        let cartChanged = false;
        
        state.cart = state.cart.filter(item => {
            const isFrozen = state.outOfStockItems.includes(item.id);
            if (isFrozen) {
                cartChanged = true;
                return false;
            }
            return true;
        });

        if (cartChanged) {
            updateCartBadge();
            if (state.currentView === 'cart') renderCart();
            if (state.currentView === 'checkout') renderCheckout();
            showGlobalModal('تحديث المخزون الفوري', 'تم تحديث سلة المشتريات تلقائياً وإزالة الأصناف التي نفدت مؤخراً من مطبخنا لضمان دقة التنفيذ.');
        }
    }

    // VIEW NAVIGATION ENGINE
    function navigateTo(viewId, productId = null) {
        state.currentView = viewId;
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
        
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.remove('hidden');

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (viewId === 'home') {
            renderHomepage();
        } else if (viewId === 'menu') {
            renderMenuCategories();
        } else if (viewId === 'product' && productId) {
            renderProductPage(productId);
        } else if (viewId === 'cake-builder') {
            resetCakeBuilder();
            navigateCakeStep(1);
        } else if (viewId === 'rose-builder') {
            resetRoseBuilder();
            navigateRoseStep(1);
        } else if (viewId === 'cart') {
            renderCart();
        } else if (viewId === 'checkout') {
            renderCheckout();
        }
    }

    function toggleSidebar(isOpen) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (isOpen) {
            sidebar.classList.remove('translate-x-full');
            overlay.classList.remove('pointer-events-none', 'opacity-0');
        } else {
            sidebar.classList.add('translate-x-full');
            overlay.classList.add('pointer-events-none', 'opacity-0');
        }
    }

    function handleSearch(event) {
        if (event.key === 'Enter' || event.type === 'keyup') {
            const query = event.target.value.trim().toLowerCase();
            if (!query) return;
            navigateTo('menu');
            const cards = document.querySelectorAll('.category-card');
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(query)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }
    }

    // GLOBAL MODAL SYSTEM
    function showGlobalModal(title, message, buttons = [], icon = 'fa-circle-exclamation') {
        const modal = document.getElementById('globalModal');
        const mTitle = document.getElementById('globalModalTitle');
        const mBody = document.getElementById('globalModalBody');
        const mIcon = document.getElementById('globalModalIcon');
        const mButtons = document.getElementById('globalModalButtons');

        if (!modal) return;

        mTitle.textContent = title;
        mBody.textContent = message;
        mIcon.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        mButtons.innerHTML = '';

        if (buttons.length === 0) {
            buttons = [{ text: 'حسناً، فهمت', action: () => closeModal(), primary: true }];
        }

        buttons.forEach(btn => {
            const bEl = document.createElement('button');
            bEl.textContent = btn.text;
            bEl.className = btn.primary 
                ? "px-5 py-2.5 bg-brandPink hover:bg-brandPinkDark text-white text-xs font-bold rounded-full transition-all duration-200"
                : "px-5 py-2.5 bg-brandPinkLight hover:bg-brandPink/20 text-brandBlack text-xs font-bold rounded-full transition-all duration-200 border border-brandPink/20";
            bEl.onclick = btn.action;
            mButtons.appendChild(bEl);
        });

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeModal() {
        const modal = document.getElementById('globalModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    function showSilentErrorBoundary(userMessage) {
        showGlobalModal('تنبيه الشبكة المستقرة', userMessage, [
            { text: 'متابعة العمل الآمن', action: () => closeModal(), primary: true }
        ], 'fa-wifi');
    }

    // HOMEPAGE RENDERING
    function renderHomepage() {
        const container = document.getElementById('homepageDynamicContent');
        if (!container) return;

        const activeSections = (state.homepageSections && state.homepageSections.length > 0)
            ? state.homepageSections.filter(s => s.active !== false)
            : [
                { id: 'sec-cakes', name: 'الأكثر مبيعاً لدى العائلات', items: ['despacito', 'cinnabon', 'qashtoota', 'donuts', 'happiness-cups', 'red-velvet', 'bambolini', 'mini-tortes'] },
                { id: 'sec-pastries', name: 'باقة مختارة من إبداعاتنا', items: ['happiness-cups', 'cinnabon', 'donuts', 'qashtoota', 'bambolini', 'red-velvet', 'mini-tortes', 'box-rowaqan'], isGrid: true },
                { id: 'sec-classics', name: 'وصل حديثاً لمطبخنا', items: ['cupcakes', 'box-rowaqan', 'qashtoota', 'donuts', 'cinnabon', 'bambolini'] },
                { id: 'sec-roses', name: 'تسوق حسب الصنف', items: ['tortes', 'mini-tortes', 'red-velvet', 'despacito', 'cinnabon', 'donuts', 'bambolini', 'gateaux', 'qashtoota', 'box-rowaqan', 'happiness-cups', 'cupcakes', 'roses'] }
            ];

        if (liveMenuCatalog.length === 0) {
            container.innerHTML = `<div class="text-center py-20 text-brandBlack/40 font-bold">جاري تحميل إبداعات المطبخ السحابية...</div>`;
            return;
        }

        let html = '';

        activeSections.forEach((section, index) => {
            const isGrid = section.isGrid || (state.displayMode === 'grid2' && section.id !== 'sec-roses');
            const displayModeClass = state.displayMode === 'fullCard' ? 'grid-cols-1 gap-10' : 'grid-cols-2 md:grid-cols-4 gap-4 md:gap-6';
            
            let sectionItemsHtml = '';
            
            if (isGrid) {
                sectionItemsHtml = `
                    <div class="grid ${displayModeClass}">
                        ${section.items.map(itemId => {
                            const item = liveMenuCatalog.find(i => i.id === itemId);
                            if (!item) return '';
                            const isFrozen = !item.isAvailable || state.outOfStockItems.includes(item.id);
                            
                            let priceText = 'تخصيص السعر';
                            if (item.flavors && item.flavors.length > 0) {
                                priceText = `${item.flavors[0].price} ج.م`;
                            } else if (item.sizes && item.sizes.length > 0 && item.sizes[0].flavors && item.sizes[0].flavors.length > 0) {
                                priceText = `${item.sizes[0].flavors[0].price} ج.م`;
                            }

                            return `
                                <div class="bg-white rounded-3xl overflow-hidden border border-brandPink/15 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group">
                                    <div>
                                        <div class="aspect-square overflow-hidden relative bg-brandPinkLight">
                                            <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                                            ${isFrozen ? `<div class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center font-black text-brandPink text-xs text-center px-2">نفد مؤقتاً من مطبخنا</div>` : ''}
                                        </div>
                                        <div class="p-4 space-y-1">
                                            <h3 class="font-extrabold text-brandBlack text-xs md:text-sm line-clamp-1">${item.name}</h3>
                                            <p class="text-[10px] text-brandBlack/60 font-bold line-clamp-2 leading-relaxed">${item.desc}</p>
                                        </div>
                                    </div>
                                    <div class="p-4 pt-0 space-y-2">
                                        <div class="text-xs font-extrabold text-brandPink text-center bg-brandPinkLight py-1.5 rounded-full border border-brandPink/10">
                                            ${priceText}
                                        </div>
                                        <button onclick="BoseSweetsEngine.navigateTo('product', '${item.id}')" class="w-full py-2 bg-brandPink hover:bg-brandPinkDark text-white rounded-full text-[11px] font-bold transition-all duration-300">
                                            استعرض الأصناف
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                sectionItemsHtml = `
                    <div class="flex gap-8 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
                        ${section.items.map(itemId => {
                            const item = liveMenuCatalog.find(i => i.id === itemId);
                            if (!item) return '';
                            const isFrozen = !item.isAvailable || state.outOfStockItems.includes(item.id);

                            return `
                                <div class="min-w-[392px] w-[392px] max-w-[85vw] bg-white rounded-[32px] border border-brandPink/15 overflow-hidden text-center hover:shadow-[0_12px_40px_rgba(255,145,164,0.1)] transition-all duration-500 flex flex-col justify-between p-2.5 group snap-start">
                                    <div class="h-[336px] rounded-[24px] overflow-hidden bg-brandPinkLight relative">
                                        <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                                        ${isFrozen ? `<div class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center font-black text-brandPink text-sm">نفد مؤقتاً من مطبخنا</div>` : ''}
                                    </div>
                                    <div class="p-6 space-y-4">
                                        <h4 class="font-black text-brandBlack text-xl tracking-tight">${item.name}</h4>
                                        <p class="text-[11px] text-brandBlack/40 font-bold leading-relaxed line-clamp-2 px-4">
                                            ${item.desc}
                                        </p>
                                        <button onclick="BoseSweetsEngine.navigateTo('product', '${item.id}')" class="w-full py-3.5 bg-brandPink hover:bg-brandPinkDark text-white font-black text-xs rounded-full transition-all duration-300 shadow-md transform active:scale-95">
                                            استعرض التفاصيل
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            html += `
                <div class="py-16 bg-white">
                    <div class="max-w-7xl mx-auto px-4">
                        <div class="mb-8">
                            <h2 class="text-2xl font-extrabold text-brandBlack">${section.name}</h2>
                            <p class="text-sm text-brandBlack/60 mt-1">تشكيلة مختارة نالت ثقة ومحبة عملائنا باستمرار</p>
                        </div>
                        ${sectionItemsHtml}
                    </div>
                </div>
            `;

            if (index === 0) {
                html += getPromoSlideshowHtml();
            } else if (index === 1) {
                html += getCakeBuilderPromoHtml();
            } else if (index === 2) {
                html += getPrideStatsHtml();
            } else if (index === 3) {
                html += getRoseBuilderPromoHtml();
            }
        });

        container.innerHTML = html;
        initPromoSlideshowTimer();
    }

    function getPromoSlideshowHtml() {
        return `
        <div class="py-16 bg-brandPinkLight/30 border-y border-brandPink/15">
            <div class="max-w-7xl mx-auto px-4">
                <div class="text-center max-w-3xl mx-auto mb-12">
                    <h2 class="text-2xl md:text-3xl font-extrabold text-brandBlack">عقد من الاتقان والتفرد</h2>
                    <p class="text-sm md:text-base text-brandBlack/80 mt-2">
                        نحرص في حلويات بوسي على صقل مهاراتنا يومياً لنقدم لكم تصاميم وحشوات فريدة بأفضل جودة ممكنة.
                    </p>
                </div>
                <div class="relative w-full h-[350px] md:h-[450px] rounded-3xl overflow-hidden shadow-xl border border-brandPink/20" id="promoSlideshow">
                    <img id="slideshowImage" src="https://picsum.photos/1200/800?random=slide1" alt="حلويات بوسي" class="w-full h-full object-cover transition-opacity duration-1000">
                    <div class="absolute inset-0 bg-gradient-to-t from-brandPink/90 via-transparent to-transparent"></div>
                    <div class="absolute bottom-8 right-8 left-8 text-brandBlack space-y-2">
                        <span class="px-3 py-1 bg-brandPink text-white text-xs font-bold rounded-full">جودة بلا مساومة</span>
                        <p class="text-lg md:text-xl font-extrabold">كل قطعة ننتجها تمر بفحص صارم للمكونات الطبيعية</p>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function getCakeBuilderPromoHtml() {
        return `
        <div class="py-12 bg-white">
            <div class="max-w-7xl mx-auto px-4">
                <div class="bg-gradient-to-br from-brandPinkLight to-white rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border-2 border-brandPink">
                    <div class="absolute -right-20 -top-20 w-80 h-80 bg-brandPink/20 rounded-full blur-2xl"></div>
                    <div class="relative z-10 max-w-xl space-y-4">
                        <span class="text-brandPink text-xs font-bold tracking-widest uppercase">خدمة التصميم الفاخر</span>
                        <h2 class="text-brandBlack text-3xl font-extrabold leading-tight">صمّم تورتة مناسبتك المخصصة بنفسك</h2>
                        <p class="text-brandBlack/80 text-sm leading-relaxed">
                            أطلقنا أول محاكي تفاعلي ذكي يتيح لك تحديد حجم التورتة بناءً على عدد ضيوفك، واختيار الشكل، ورفع تصميمك الخاص أو طباعة صورتك، مع حساب فوري دقيق ومحايد للميزانية.
                        </p>
                        <div class="pt-2">
                            <button onclick="BoseSweetsEngine.navigateTo('cake-builder')" class="px-6 py-3 bg-brandPink hover:bg-brandPinkDark text-white font-bold rounded-full transition-all duration-300">
                                ابدأ التجهيز الفني للتورتة
                            </button>
                        </div>
                    </div>
                    <div class="relative z-10 w-full md:w-1/2 aspect-square max-w-[320px] rounded-2xl overflow-hidden shadow-lg border border-brandPink/30">
                        <img src="https://picsum.photos/800/800?random=cakebuilderpromo" alt="محاكي التورت" class="w-full h-full object-cover">
                    </div>
                </div>
            </div>
        </div>`;
    }

    function getPrideStatsHtml() {
        return `
        <div class="py-16 bg-white text-center">
            <div class="max-w-4xl mx-auto px-4 space-y-6">
                <h2 class="text-2xl md:text-4xl font-extrabold text-brandBlack">شريك لحظاتكم السعيدة طوال عقد كامل</h2>
                <p class="text-sm md:text-base text-brandBlack/85 leading-relaxed max-w-2xl mx-auto">
                    على مدار ما يزيد عن 10 سنوات، تشرفنا بخدمة أكثر من 10,000 عميل في الكفاح ومركز الفرافرة. كنتم وما زلتم المحفز الأول لنا لتقديم الفن في صورة حلوى فاخرة.
                </p>
                <div class="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
                    <div class="p-4 rounded-2xl bg-brandPinkLight border border-brandPink/20">
                        <p class="text-2xl md:text-3xl font-extrabold text-brandPink">10+</p>
                        <p class="text-xs text-brandBlack/60 mt-1">أعوام من الاتقان</p>
                    </div>
                    <div class="p-4 rounded-2xl bg-brandPinkLight border border-brandPink/20">
                        <p class="text-2xl md:text-3xl font-extrabold text-brandPink">10K+</p>
                        <p class="text-xs text-brandBlack/60 mt-1">عميل سعيد</p>
                    </div>
                    <div class="p-4 rounded-2xl bg-brandPinkLight border border-brandPink/20">
                        <p class="text-2xl md:text-3xl font-extrabold text-brandPink">100%</p>
                        <p class="text-xs text-brandBlack/60 mt-1">خامات طبيعية</p>
                    </div>
                </div>
            </div>
            <div class="mt-12 w-full aspect-video md:max-h-[400px] bg-brandPinkLight relative overflow-hidden flex items-center justify-center border-y border-brandPink/20">
                <img src="https://picsum.photos/1920/1080?random=pride" alt="فخر حلويات بوسي" class="absolute inset-0 w-full h-full object-cover opacity-80">
                <div class="absolute inset-0 bg-gradient-to-t from-brandPink/30 to-transparent"></div>
            </div>
        </div>`;
    }

    function getRoseBuilderPromoHtml() {
        return `
        <div class="py-12 bg-white">
            <div class="max-w-7xl mx-auto px-4">
                <div class="bg-gradient-to-br from-brandPinkLight via-white to-white rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row-reverse items-center justify-between gap-8 border-2 border-brandPink shadow-xl">
                    <div class="relative z-10 max-w-xl space-y-4">
                        <span class="text-brandPink text-xs font-bold tracking-widest uppercase">تكامل الهدية والجمال</span>
                        <h2 class="text-brandBlack text-3xl font-extrabold leading-tight">نسّق بوكيه الورد الفاخر مع هديتك</h2>
                        <p class="text-brandBlack/80 text-sm leading-relaxed">
                            أطلقنا محاكياً متكاملاً لتنسيق بوكيه الورد المثالي بالتحكم في عدد الورد، ونوعه، وإدراج مبالغ مالية (كاش) مدمجة بدقة، أو إرفاق صور تذكارية وشوكولاتة فاخرة.
                        </p>
                        <div class="pt-2">
                            <button onclick="BoseSweetsEngine.navigateTo('rose-builder')" class="px-6 py-3 bg-brandPink hover:bg-brandPinkDark text-white font-bold rounded-full transition-all duration-300">
                                صمم بوكيه الورد المخصص
                            </button>
                        </div>
                    </div>
                    <div class="relative z-10 w-full md:w-1/2 aspect-square max-w-[320px] rounded-2xl overflow-hidden shadow-lg border border-brandPink/20">
                        <img src="https://picsum.photos/800/800?random=flowerpromo" alt="محاكي الورد" class="w-full h-full object-cover">
                    </div>
                </div>
            </div>
        </div>`;
    }

    function initPromoSlideshowTimer() {
        const promoImages = [
            'https://picsum.photos/1200/800?random=slide1',
            'https://picsum.photos/1200/800?random=slide2',
            'https://picsum.photos/1200/800?random=slide3'
        ];
        let currentSlideIndex = 0;
        if (window.promoSliderInterval) clearInterval(window.promoSliderInterval);
        window.promoSliderInterval = setInterval(() => {
            currentSlideIndex = (currentSlideIndex + 1) % promoImages.length;
            const slideImg = document.getElementById('slideshowImage');
            if (slideImg) {
                slideImg.style.opacity = 0;
                setTimeout(() => {
                    slideImg.src = promoImages[currentSlideIndex];
                    slideImg.style.opacity = 1;
                }, 300);
            }
        }, 5000);
    }

    function renderMenuCategories() {
        const grid = document.getElementById('menuCategoriesGrid');
        if (!grid) return;
        if (liveMenuCatalog.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-brandBlack/40 font-bold">جاري تحميل إبداعات المطبخ السحابية...</div>`;
            return;
        }
        grid.innerHTML = liveMenuCatalog.map(item => {
            const isFrozen = !item.isAvailable || state.outOfStockItems.includes(item.id);
            return `
                <div class="bg-white rounded-3xl overflow-hidden border border-brandPink/15 hover:shadow-xl transition-all duration-300 flex flex-col justify-between category-card relative">
                    <div>
                        <div class="h-56 overflow-hidden relative">
                            <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover">
                            ${isFrozen ? `<div class="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center font-black text-brandPink text-sm text-center">نفد مؤقتاً من مطبخنا</div>` : ''}
                        </div>
                        <div class="p-6 space-y-3">
                            <h2 class="font-extrabold text-brandBlack text-lg">${item.name}</h2>
                            <p class="text-xs text-brandBlack/60 font-semibold leading-relaxed line-clamp-3">${item.desc}</p>
                        </div>
                    </div>
                    <div class="p-6 pt-0">
                        <button onclick="BoseSweetsEngine.navigateTo('product', '${item.id}')" class="w-full py-3.5 bg-brandPink hover:bg-brandPinkDark text-white text-xs font-bold rounded-full transition-all text-center">
                            اعرف أكتر
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // PRODUCT PAGE ENGINE
    function renderProductPage(productId) {
        const item = liveMenuCatalog.find(i => i.id === productId);
        if (!item) return;

        const container = document.getElementById('productDetailContainer');
        if (!container) return;
        container.setAttribute('data-product-id', productId);
        let flavorsHtml = '';
        
        const isFrozen = !item.isAvailable || state.outOfStockItems.includes(item.id);

        if (item.isCustomBuilder) {
            flavorsHtml = `
                <div class="p-8 rounded-[32px] bg-brandPinkLight text-center space-y-5 border border-brandPink/15 shadow-[0_10px_30px_rgba(255,145,164,0.05)] max-w-xl mx-auto">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-brandPink/10">
                        <i class="fa-solid fa-wand-magic-sparkles text-brandPink text-sm"></i>
                    </div>
                    <p class="text-xs md:text-sm font-bold text-brandBlack leading-relaxed px-4">هذا الصنف الفاخر يتطلب تنسيقاً دقيقاً ومميزاً لضمان تقديم أعلى مستويات الفخامة والرقي التي تليق باختياراتك.</p>
                    ${isFrozen ? `
                        <button disabled class="px-8 py-3.5 bg-gray-200 text-gray-500 text-xs font-bold rounded-full cursor-not-allowed">
                            نفد مؤقتاً من مطبخنا
                        </button>
                    ` : `
                        <button onclick="BoseSweetsEngine.navigateTo('${productId === 'tortes' ? 'cake-builder' : 'rose-builder'}')" class="px-8 py-3.5 bg-brandPink hover:bg-brandPinkDark text-white text-xs font-bold rounded-full transition-all duration-300 shadow-md transform active:scale-95 tracking-wide">
                            دخول محاكي البناء المخصص
                        </button>
                    `}
                </div>
            `;
        } else if (item.id === 'despacito') {
            flavorsHtml = `
                <div class="space-y-8">
                    <div class="flex bg-brandPinkLight p-1.5 rounded-2xl border border-brandPink/10 max-w-md mx-auto shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                        ${item.sizes.map((sz, index) => `
                            <button onclick="BoseSweetsEngine.selectDespacitoSize(${index})" id="despacito-size-tab-${index}" class="flex-1 py-3 text-center text-xs font-extrabold rounded-xl transition-all duration-300 ${index === 0 ? 'bg-white text-brandPink shadow-sm border border-brandPink/5' : 'text-brandBlack/40 hover:text-brandBlack'}">
                                حجم ${sz.label}
                            </button>
                        `).join('')}
                    </div>
                    <div id="despacitoFlavorsGrid" class="grid grid-cols-2 gap-6 md:gap-10 pt-2"></div>
                </div>
            `;

            setTimeout(() => BoseSweetsEngine.selectDespacitoSize(0), 50);
        } else {
            // منطق تقسيم شبكة العرض الفوري للأصناف الملكية والعائلية
            const isFullWidth = ['gateaux', 'box-rowaqan', 'red-velvet', 'mini-tortes', 'cupcakes'].includes(item.id);
            const gridClasses = isFullWidth ? 'grid-cols-1 gap-10' : 'grid-cols-2 gap-6 md:gap-10';

            if (!window.productFlavorQtys) window.productFlavorQtys = {};
            window.productFlavorQtys[item.id] = item.flavors.map(() => 1);

            flavorsHtml = `
                <div class="grid ${gridClasses}">
                    ${item.flavors.map((f, idx) => {
                        const cardImg = f.img || item.img; 
                        const cardDesc = f.desc || item.desc;
                        const currentQty = window.productFlavorQtys[item.id][idx] || 1;
                        return `
                            <div class="bg-white rounded-[36px] overflow-hidden border border-brandPink/10 flex flex-col justify-between shadow-[0_10px_35px_rgba(255,145,164,0.04)] hover:shadow-[0_15px_45px_rgba(255,145,164,0.1)] transition-all duration-500 group relative">
                                <div>
                                    <div class="${isFullWidth ? 'h-60 md:h-88' : 'aspect-square'} overflow-hidden relative bg-brandPinkLight">
                                        <img src="${cardImg}" alt="${item.name} - ${f.name}" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105">
                                        <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-brandPink/10 shadow-sm z-10">
                                            <span class="text-[10px] font-black text-brandPink transition-all duration-150" id="prodFlavorFloatPrice-${item.id}-${idx}">${f.price * currentQty} ج.م</span>
                                        </div>
                                        ${isFrozen ? `<div class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center font-black text-brandPink text-xs text-center z-10 px-2">نفد مؤقتاً من مطبخنا</div>` : ''}
                                    </div>
                                    <div class="p-6 pb-4 space-y-1.5">
                                        <h3 class="font-extrabold text-brandBlack text-xs md:text-sm tracking-wide line-clamp-1">${item.name} - ${f.name}</h3>
                                        <p class="text-[10px] text-brandBlack/40 font-semibold leading-relaxed line-clamp-2 min-h-[32px]">${cardDesc}</p>
                                    </div>
                                </div>
                                <div class="p-6 pt-0">
                                    <div class="grid grid-cols-5 gap-2 items-center bg-brandPinkLight rounded-full p-1 border border-brandPink/10">
                                        <button type="button" ${isFrozen ? 'disabled' : ''} onclick="BoseSweetsEngine.adjustProductFlavorQty('${item.id}', ${idx}, ${f.price}, -1)" class="col-span-1 w-8 h-8 rounded-full bg-white text-brandBlack font-black flex items-center justify-center text-xs shadow-sm hover:bg-brandPinkLight active:scale-90 transition-all disabled:opacity-40">-</button>
                                        <span class="col-span-1 text-center text-xs font-black text-brandBlack transition-all" id="prodFlavorQty-${item.id}-${idx}">${currentQty}</span>
                                        <button type="button" ${isFrozen ? 'disabled' : ''} onclick="BoseSweetsEngine.adjustProductFlavorQty('${item.id}', ${idx}, ${f.price}, 1)" class="col-span-1 w-8 h-8 rounded-full bg-white text-brandBlack font-black flex items-center justify-center text-xs shadow-sm hover:bg-brandPinkLight active:scale-90 transition-all disabled:opacity-40">+</button>
                                        ${isFrozen ? `
                                            <button disabled class="col-span-2 h-8 bg-gray-200 text-gray-500 rounded-full text-[10px] font-black cursor-not-allowed">نفد</button>
                                        ` : `
                                            <button type="button" onclick="BoseSweetsEngine.addProductFlavorToCart('${item.id}', '${item.name} - ${f.name}', ${f.price}, ${idx})" class="col-span-2 h-8 bg-brandPink hover:bg-brandPinkDark text-white rounded-full text-[10px] font-black transition-all duration-300 flex items-center justify-center shadow-sm">إضافة</button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        container.innerHTML = `
            <div class="space-y-8">
                <button onclick="BoseSweetsEngine.navigateTo('menu')" class="text-xs font-bold text-brandPink hover:underline flex items-center gap-1.5 transition-all">
                    <i class="fa-solid fa-arrow-right"></i> العودة لقائمة المنتجات
                </button>

                <div class="h-56 md:h-72 rounded-[36px] overflow-hidden relative border border-brandPink/10 shadow-[0_15px_40px_rgba(255,145,164,0.06)]">
                    <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-8">
                        <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-wide">${item.name}</h1>
                    </div>
                </div>

                ${item.healthSection ? `
                    <div class="p-6 rounded-3xl bg-brandPinkLight border border-brandPink/15 space-y-1.5 shadow-[inset_0_2px_8px_rgba(255,145,164,0.01)] max-w-2xl">
                        <h4 class="text-xs font-black text-brandPink flex items-center gap-1.5 uppercase tracking-wide">
                            <i class="fa-solid fa-shield-halved text-xs"></i> النقاء الطبيعي والجودة للأسرة:
                        </h4>
                        <p class="text-xs text-brandBlack/70 leading-relaxed font-bold">${item.healthSection}</p>
                    </div>
                ` : ''}

                <div class="space-y-6 pt-2">
                    <h3 class="text-sm font-black text-brandBlack tracking-wide">الخيارات والنكهات المتاحة للتخصيص الفوري:</h3>
                    ${flavorsHtml}
                </div>
            </div>
        `;
    }

    function selectDespacitoSize(sizeIndex) {
        const item = liveMenuCatalog.find(i => i.id === 'despacito');
        if (!item) return;

        const sizeData = item.sizes[sizeIndex];
        if (!sizeData) return;

        const isFrozen = !item.isAvailable || state.outOfStockItems.includes('despacito');

        item.sizes.forEach((_, idx) => {
            const tab = document.getElementById(`despacito-size-tab-${idx}`);
            if (tab) {
                if (idx === sizeIndex) {
                    tab.className = "flex-1 py-3 text-center text-xs font-extrabold rounded-xl bg-white text-brandPink shadow-sm border border-brandPink/5 transition-all duration-300";
                } else {
                    tab.className = "flex-1 py-3 text-center text-xs font-extrabold rounded-xl text-brandBlack/40 hover:text-brandBlack transition-all duration-300";
                }
            }
        });

        const despacitoGrid = document.getElementById('despacitoFlavorsGrid');
        if (despacitoGrid) {
            if (!window.despacitoQtys) window.despacitoQtys = {};
            
            despacitoGrid.innerHTML = sizeData.flavors.map((f, idx) => {
                const uniqueKey = `${sizeIndex}-${idx}`;
                window.despacitoQtys[uniqueKey] = window.despacitoQtys[uniqueKey] || 1;
                const currentQty = window.despacitoQtys[uniqueKey];
                
                return `
                    <div class="bg-white rounded-[36px] overflow-hidden border border-brandPink/10 flex flex-col justify-between shadow-[0_10px_35px_rgba(255,145,164,0.04)] hover:shadow-[0_15px_45px_rgba(255,145,164,0.1)] transition-all duration-500 group relative">
                        <div>
                            <div class="aspect-square overflow-hidden relative bg-brandPinkLight">
                                <img src="${item.img}" alt="${f.name}" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105">
                                <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-brandPink/10 shadow-sm z-10">
                                    <span class="text-[10px] font-black text-brandPink transition-all duration-150" id="despacitoFloatPrice-${uniqueKey}">${f.price * currentQty} ج.م</span>
                                </div>
                                ${isFrozen ? `<div class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center font-black text-brandPink text-xs text-center z-10 px-2">نفد مؤقتاً من مطبخنا</div>` : ''}
                            </div>
                            <div class="p-6 pb-4 space-y-1.5">
                                <h3 class="font-extrabold text-brandBlack text-xs md:text-sm tracking-wide line-clamp-1">${item.name} - ${f.name}</h3>
                                <p class="text-[10px] text-brandBlack/40 font-semibold leading-relaxed line-clamp-2 min-h-[32px]">${item.desc}</p>
                            </div>
                        </div>
                        <div class="p-6 pt-0">
                            <div class="grid grid-cols-5 gap-2 items-center bg-brandPinkLight rounded-full p-1 border border-brandPink/10">
                                <button type="button" ${isFrozen ? 'disabled' : ''} onclick="BoseSweetsEngine.adjustDespacitoQty('${uniqueKey}', ${f.price}, -1)" class="col-span-1 w-8 h-8 rounded-full bg-white text-brandBlack font-black flex items-center justify-center text-xs shadow-sm hover:bg-brandPinkLight active:scale-90 transition-all disabled:opacity-40">-</button>
                                <span class="col-span-1 text-center text-xs font-black text-brandBlack transition-all" id="despacitoQty-${uniqueKey}">${currentQty}</span>
                                <button type="button" ${isFrozen ? 'disabled' : ''} onclick="BoseSweetsEngine.adjustDespacitoQty('${uniqueKey}', ${f.price}, 1)" class="col-span-1 w-8 h-8 rounded-full bg-white text-brandBlack font-black flex items-center justify-center text-xs shadow-sm hover:bg-brandPinkLight active:scale-90 transition-all disabled:opacity-40">+</button>
                                ${isFrozen ? `
                                    <button disabled class="col-span-2 h-8 bg-gray-200 text-gray-500 rounded-full text-[10px] font-black cursor-not-allowed">نفد</button>
                                ` : `
                                    <button type="button" onclick="BoseSweetsEngine.addDespacitoToCart('${item.name} (حجم ${sizeData.label} - ${f.name})', ${f.price}, '${uniqueKey}')" class="col-span-2 h-8 bg-brandPink hover:bg-brandPinkDark text-white rounded-full text-[10px] font-black transition-all duration-300 flex items-center justify-center shadow-sm">إضافة</button>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function adjustDespacitoQty(key, basePrice, dir) {
        let current = window.despacitoQtys[key] || 1;
        if (dir === 1 && current >= 50) { 
            showGlobalModal('حد الأمان للطلب', 'الحد الأقصى للمنتج هو 50 قطعة في الطلب الواحد لسلامة التجهيز الفني.'); 
            return; 
        }
        current = Math.max(1, current + dir);
        window.despacitoQtys[key] = current;
        
        const qtyEl = document.getElementById(`despacitoQty-${key}`);
        if (qtyEl) qtyEl.textContent = current;
        
        const floatPriceEl = document.getElementById(`despacitoFloatPrice-${key}`);
        if (floatPriceEl) floatPriceEl.textContent = `${basePrice * current} ج.م`;
    }

    function addDespacitoToCart(fullName, basePrice, key) {
        const item = liveMenuCatalog.find(i => i.id === 'despacito');
        const isFrozen = !item || !item.isAvailable || state.outOfStockItems.includes('despacito');
        if (isFrozen) {
            showGlobalModal('الصنف غير متوفر', 'هذا الصنف غير متاح في مطبخنا حالياً.');
            return;
        }
        const qty = window.despacitoQtys[key] || 1;
        state.cart.push({ id: 'despacito', name: fullName, price: basePrice * qty, qty: qty, isCustom: false, details: null });
        updateCartBadge();
        showGlobalModal('عملية ناجحة', `تمت إضافة ${qty} من (${fullName}) إلى سلة المشتريات بنجاح.`, [], 'fa-circle-check');
    }

    function adjustProductFlavorQty(itemId, flavorIdx, basePrice, dir) {
        let current = window.productFlavorQtys[itemId][flavorIdx] || 1;
        if (dir === 1 && current >= 50) { 
            showGlobalModal('حد الأمان للطلب', 'الحد الأقصى هو 50 قطعة في الطلب الواحد لسلامة التجهيز الفني.'); 
            return; 
        }
        current = Math.max(1, current + dir);
        window.productFlavorQtys[itemId][flavorIdx] = current;

        const qtyEl = document.getElementById(`prodFlavorQty-${itemId}-${flavorIdx}`);
        if (qtyEl) qtyEl.textContent = current;

        const floatPriceEl = document.getElementById(`prodFlavorFloatPrice-${itemId}-${flavorIdx}`);
        if (floatPriceEl) floatPriceEl.textContent = `${basePrice * current} ج.م`;
    }

    function addProductFlavorToCart(itemId, fullName, basePrice, flavorIdx) {
        const item = liveMenuCatalog.find(i => i.id === itemId);
        const isFrozen = !item || !item.isAvailable || state.outOfStockItems.includes(itemId);
        if (isFrozen) {
            showGlobalModal('الصنف غير متوفر', 'هذا الصنف غير متاح في مطبخنا حالياً.');
            return;
        }
        const qty = window.productFlavorQtys[itemId][flavorIdx] || 1;
        state.cart.push({ id: itemId, name: fullName, price: basePrice * qty, qty: qty, isCustom: false, details: null });
        updateCartBadge();
        showGlobalModal('عملية ناجحة', `تمت إضافة ${qty} من (${fullName}) إلى سلة المشتريات بنجاح.`, [], 'fa-circle-check');
    }

    // IMAGE COMPRESSION ALGORITHM
    function compressImageClientSide(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1200;
                    
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    }, 'image/jpeg', 0.85);
                };
            };
        });
    }

    async function uploadToCloudinary(file) {
        try {
            const compressed = await compressImageClientSide(file);
            const formData = new FormData();
            formData.append('file', compressed);
            formData.append('upload_preset', cloudinaryUploadPreset);
            
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error("فشل الرفع السحابي لكلويدناري");
            const data = await response.json();
            return data.secure_url;
        } catch (err) {
            console.error("خطأ Cloudinary:", err);
            return null;
        }
    }

    // CAKE BUILDER SYSTEM
    function resetCakeBuilder() {
        state.cake = { step: 1, base: 'فانيليا', people: 4, shape: 'دائرة', designFile: null, printOption: 'none', printFile: null, theme: '', allergies: '', writing: '', cardEnabled: false, cardText: '', basePricePerPerson: state.cake.basePricePerPerson || 145, cakePrintEdiblePrice: state.cake.cakePrintEdiblePrice || 60, cakePrintNonEdiblePrice: state.cake.cakePrintNonEdiblePrice || 20 };
        const df = document.getElementById('cakeDesignFile'); if (df) df.value = ''; 
        const pf = document.getElementById('cakePrintFile'); if (pf) pf.value = '';
        document.getElementById('cakeDesignLabel').textContent = 'ارفع هنا صورة التورتة اللي حابب ننفذ لك زيها بالظبط';
        document.getElementById('cakePrintLabel').textContent = 'ارفع الصورة المراد طباعتها على سطح التورتة بدقة كاملة';
        document.getElementById('cakeThemeDetails').value = ''; document.getElementById('cakeAllergies').value = '';
        document.getElementById('cakeText').value = ''; document.getElementById('cakeCardCheck').checked = false;
        document.getElementById('cakeCardText').value = ''; document.getElementById('cakeCardInputArea').classList.add('hidden');
    }

    function selectCakeBase(baseName) {
        state.cake.base = baseName;
        ['فانيليا', 'شوكولاتة', 'نصف ونصف'].forEach(b => {
            const btn = document.getElementById(`cake-base-${b}`);
            if (btn) btn.className = b === baseName ? "p-4 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold shadow-sm transition-all duration-300 text-center" : "p-4 rounded-2xl border border-brandPink/10 bg-white hover:border-brandPink/30 text-brandBlack/70 text-xs font-extrabold transition-all duration-300 text-center";
        });
        document.getElementById('cake-base-notification').classList.remove('hidden');
    }

    function selectCakeShape(shapeName) {
        const count = state.cake.people;
        if (shapeName === 'مستطيل' && count < 20) {
            showGlobalModal('✨ توضيح بخصوص الشكل المستطيل', 'أقل مقاس للشكل المستطيل هو (20 فرد) لسلامة الأبعاد. السيستم هيرفع العداد تلقائياً لـ 20 فرد، حابب نعتمد الترقية؟', [{ text: 'تمام، اعتمد الترقية', primary: true, action: () => { closeModal(); applyCakeShapeUpgrade('مستطيل', 20); } }, { text: 'لاء، ارجع للسابق', primary: false, action: () => { closeModal(); selectCakeShape(state.cake.shape); } }]);
            return;
        }
        if (shapeName === 'مربع' && count < 16) {
            showGlobalModal('✨ توضيح بخصوص الشكل المربع', 'أقل مقاس للشكل المربع هو (16 فرد) لسلامة التماسك هندسياً. حابب نعتمد الترقية؟', [{ text: 'تمام، اعتمد الترقية', primary: true, action: () => { closeModal(); applyCakeShapeUpgrade('مربع', 16); } }, { text: 'لاء، ارجع للسابق', primary: false, action: () => { closeModal(); selectCakeShape(state.cake.shape); } }]);
            return;
        }

        state.cake.shape = shapeName;
        ['دائرة', 'قلب', 'مربع', 'مستطيل'].forEach(s => {
            const btn = document.getElementById(`cake-shape-${s}`);
            if (btn) btn.className = s === shapeName ? "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold transition-all duration-300 text-center" : "p-3.5 rounded-2xl border border-brandPink/10 bg-white hover:border-brandPink/30 text-brandBlack/70 text-xs font-extrabold transition-all duration-300 text-center";
        });

        const hint = document.getElementById('cake-shape-hint');
        if (shapeName === 'مربع') { hint.textContent = 'المقاس المربع يبدأ من 16 فرد كحد أدنى لسلامة التماسك.'; hint.classList.remove('hidden'); }
        else if (shapeName === 'مستطيل') { hint.textContent = 'المقاس المستطيل يبدأ من 20 فرد كحد أدنى لضمان جودة الأبعاد.'; hint.classList.remove('hidden'); }
        else { hint.classList.add('hidden'); }

        calculateCakePrice();
    }

    function applyCakeShapeUpgrade(shape, peopleCount) {
        state.cake.people = peopleCount; document.getElementById('cakePeopleCount').textContent = peopleCount;
        selectCakeShape(shape);
    }

    function adjustCakePeople(amount) {
        const shape = state.cake.shape; let current = state.cake.people; let target = current + amount;
        if (target < 4 || target > 250) return;
        if (shape === 'مستطيل' && target < 20) { document.getElementById('cakeCounterWarning').textContent = 'الشكل المستطيل يتطلب 20 فرد على الأقل.'; document.getElementById('cakeCounterWarning').classList.remove('hidden'); return; }
        if (shape === 'مربع' && target < 16) { document.getElementById('cakeCounterWarning').textContent = 'الشكل المربع يتطلب 16 فرد على الأقل.'; document.getElementById('cakeCounterWarning').classList.remove('hidden'); return; }

        document.getElementById('cakeCounterWarning').classList.add('hidden');
        state.cake.people = target; document.getElementById('cakePeopleCount').textContent = target;
        calculateCakePrice();
    }

    function calculateCakePrice() {
        let basePrice = state.cake.basePricePerPerson || 145;
        let ediblePrice = state.cake.cakePrintEdiblePrice || 60;
        let nonEdiblePrice = state.cake.cakePrintNonEdiblePrice || 20;

        let total = state.cake.people * basePrice;
        if (state.cake.printOption === 'edible') total += ediblePrice;
        else if (state.cake.printOption === 'non-edible') total += nonEdiblePrice;
        const liveDisp = document.getElementById('cakeLivePriceDisplay');
        if (liveDisp) liveDisp.textContent = `${total} ج.م`;
    }

    function showCakePriceInfo() { 
        showGlobalModal('تفاصيل حساب تسعير حلويات بوسي', 'الحسبة مبنية على استخدام خامات طبيعية نقيّة 100% بدون أي محسنات صناعية لضمان أرقى مذاق وأعلى جودة.'); 
    }

    function selectCakePrintOption(option) {
        state.cake.printOption = option;
        ['none', 'edible', 'non-edible'].forEach(o => {
            const btn = document.getElementById(`cake-print-${o}`);
            if (btn) btn.className = o === option ? "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center" : "p-3.5 rounded-2xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-bold transition-all text-center hover:border-brandPink/30";
        });
        document.getElementById('cakePrintUploadArea').className = option !== 'none' ? "relative border-2 border-dashed border-brandPink/20 hover:border-brandPink rounded-2xl p-8 transition-all duration-300 bg-brandPinkLight/30 text-center cursor-pointer group" : "hidden";
        calculateCakePrice();
    }

    async function handleCakeFileUpload(type) {
        const fileInput = document.getElementById(type === 'design' ? 'cakeDesignFile' : 'cakePrintFile');
        const label = document.getElementById(type === 'design' ? 'cakeDesignLabel' : 'cakePrintLabel');
        if (fileInput && fileInput.files.length > 0) {
            label.innerHTML = `<span class="text-brandPink font-bold animate-pulse"><i class="fa-solid fa-spinner fa-spin"></i> جاري تأمين ورفع الصورة نهارياً لمطبخنا...</span>`;
            const uploadedUrl = await uploadToCloudinary(fileInput.files[0]);
            if (uploadedUrl) {
                if (type === 'design') state.cake.designFile = uploadedUrl; else state.cake.printFile = uploadedUrl;
                label.innerHTML = `<span class="text-brandBlack font-extrabold"><i class="fa-solid fa-circle-check text-brandPink"></i> تم تأمين وربط الصورة سحابياً بنجاح!</span>`;
            } else {
                label.textContent = "واجه نظام الرفع السحابي عطلاً طفيفاً، تأكد من استقرار شبكة الموبايل وإعادة المحاولة.";
            }
        }
    }

    function toggleCakeCardInput() {
        const isChecked = document.getElementById('cakeCardCheck').checked; state.cake.cardEnabled = isChecked;
        document.getElementById('cakeCardInputArea').className = isChecked ? "pt-2 transition-all duration-300" : "hidden";
    }

    function navigateCakeStep(stepNum) {
        state.cake.step = stepNum;
        document.getElementById('cake-screen-1').classList.add('hidden'); document.getElementById('cake-screen-2').classList.add('hidden'); document.getElementById('cake-screen-3').classList.add('hidden');
        document.getElementById(`cake-screen-${stepNum}`).classList.remove('hidden');

        const line1 = document.getElementById('cake-line-1'); const line2 = document.getElementById('cake-line-2');
        if (line1 && line2) {
            if (stepNum === 1) { line1.style.width = '0%'; line2.style.width = '0%'; }
            if (stepNum === 2) { line1.style.width = '100%'; line2.style.width = '0%'; }
            if (stepNum === 3) { line1.style.width = '100%'; line2.style.width = '100%'; }
        }

        for (let i = 1; i <= 3; i++) {
            const ind = document.getElementById(`cake-step-${i}-indicator`);
            const textStep2 = document.getElementById('cake-text-step-2'); const textStep3 = document.getElementById('cake-text-step-3');
            if (ind) {
                if (i <= stepNum) {
                    ind.className = "w-10 h-10 rounded-full bg-brandPink text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-brandPink/20 transition-all duration-300";
                    if (i === 2 && textStep2) textStep2.className = "text-[11px] font-extrabold text-brandBlack transition-colors duration-300";
                    if (i === 3 && textStep3) textStep3.className = "text-[11px] font-extrabold text-brandBlack transition-colors duration-300";
                } else {
                    ind.className = "w-10 h-10 rounded-full bg-brandPinkLight text-brandBlack/40 border border-brandPink/15 flex items-center justify-center font-extrabold text-sm transition-all duration-300";
                    if (i === 2 && textStep2) textStep2.className = "text-[11px] font-extrabold text-brandBlack/40 transition-colors duration-300";
                    if (i === 3 && textStep3) textStep3.className = "text-[11px] font-extrabold text-brandBlack/40 transition-colors duration-300";
                }
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function addCakeToCart() {
        const parentCategory = liveMenuCatalog.find(item => item.id === 'tortes');
        const isFrozen = (parentCategory && parentCategory.isAvailable === false) || state.outOfStockItems.includes('tortes');
        
        if (isFrozen) {
            showGlobalModal('محاكي التورت مجمّد', 'تم تعطيل حجز التورت الخاصة مؤقتاً لسلامة أعمال الصيانة بالمصنع.');
            return;
        }
        
        const edibleFee = state.cake.cakePrintEdiblePrice || 60;
        const nonEdibleFee = state.cake.cakePrintNonEdiblePrice || 20;
        const total = state.cake.people * state.cake.basePricePerPerson + (state.cake.printOption === 'edible' ? edibleFee : state.cake.printOption === 'non-edible' ? nonEdibleFee : 0);
        
        state.cake.theme = document.getElementById('cakeThemeDetails').value; 
        state.cake.allergies = document.getElementById('cakeAllergies').value;
        state.cake.writing = document.getElementById('cakeText').value; 
        state.cake.cardText = document.getElementById('cakeCardText').value;

        const finalDetails = { 
            'قاعدة الكيك المعتمدة': state.cake.base, 
            'حجم الكيك والمدعوين': `${state.cake.people} فرد`, 
            'الشكل الهندسي': state.cake.shape, 
            'صورة التصميم الخارجي': state.cake.designFile || 'لم ترفع صورة', 
            'خيار الطباعة': state.cake.printOption === 'edible' ? `صورة صالحة للأكل (+${edibleFee} ج.م)` : state.cake.printOption === 'non-edible' ? `صورة غير صالحة للأكل (+${nonEdibleFee} ج.م)` : 'بدون طباعة', 
            'ثيم المناسبة': state.cake.theme || 'لا يوجد تفاصيل', 
            'التحذير الصحي المكتوب': state.cake.allergies || 'لا يوجد حساسية', 
            'جملة الخط اليدوي': state.cake.writing || 'لا يوجد كتابة', 
            'كارت الإهداء': state.cake.cardEnabled ? (state.cake.cardText || 'كارت فارغ') : 'بدون كارت' 
        };

        state.cart.push({ id: 'custom-cake', name: 'تورتة ملكية - تصميم خاص', price: total, qty: 1, isCustom: true, details: finalDetails });
        updateCartBadge(); resetCakeBuilder();
        showGlobalModal('تم الإضافة للسلة', 'تم ترحيل تصميم تورتتك الخاصة بنجاح إلى سلة المشتريات المعتمدة.', [{ text: 'استمر بالتسوق', action: () => { closeModal(); navigateTo('menu'); } }, { text: 'شاهد سلة التسوق', action: () => { closeModal(); navigateTo('cart'); }, primary: true }], 'fa-circle-check');
    }

    // ROSE BUILDER SYSTEM
    function resetRoseBuilder() {
        state.rose = { step: 1, referenceFile: null, count: 15, type: 'ورد طبيعي', colors: '', cashAmount: 0, cashDenomination: 20, photosCount: 0, photoFiles: [], ribbonEnabled: false, ribbonText: '', chocBudget: 0, chocPiecePrice: 20, premiumBar100: 0, premiumBar120: 0, cardEnabled: false, cardText: '', roseBasePrice: state.rose.roseBasePrice || 400, roseMinCount: state.rose.roseMinCount || 15, rosePricePerAdditional: state.rose.rosePricePerAdditional || 35, rosePhotoPrice: state.rose.rosePhotoPrice || 15, roseRibbonPrice: state.rose.roseRibbonPrice || 50, roseCardPrice: state.rose.roseCardPrice || 20 };
        const rf = document.getElementById('roseReferenceFile'); if (rf) rf.value = '';
        document.getElementById('roseReferenceLabel').textContent = 'ارفع هنا صورة بوكيه الورد اللي حابب نعمل لك زيه';
        document.getElementById('roseCount').textContent = '15'; document.getElementById('roseColors').value = '';
        document.getElementById('roseCashAmount').value = ''; document.getElementById('rosePhotosCount').textContent = '0';
        document.getElementById('rosePhotoUploadsContainer').innerHTML = ''; document.getElementById('rosePhotoUploadsContainer').classList.add('hidden');
        document.getElementById('roseRibbonCheck').checked = false; document.getElementById('roseRibbonText').value = '';
        document.getElementById('roseRibbonInputArea').classList.add('hidden'); document.getElementById('roseChocBudget').value = '';
        document.getElementById('rosePremiumBar100').textContent = '0'; document.getElementById('rosePremiumBar120').textContent = '0';
        document.getElementById('roseCardCheck').checked = false; document.getElementById('roseCardText').value = '';
        document.getElementById('roseCardInputArea').classList.add('hidden'); calculateRosePrice();
    }

    async function handleRoseReferenceUpload() {
        const fileInput = document.getElementById('roseReferenceFile');
        const label = document.getElementById('roseReferenceLabel');
        if (fileInput && fileInput.files.length > 0) {
            label.innerHTML = `<span class="text-brandPink font-bold animate-pulse"><i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ بوكيه المرجع سحابياً...</span>`;
            const uploadedUrl = await uploadToCloudinary(fileInput.files[0]);
            if (uploadedUrl) {
                state.rose.referenceFile = uploadedUrl;
                label.innerHTML = `<span class="text-brandBlack font-extrabold"><i class="fa-solid fa-circle-check text-brandPink"></i> تم حفظ وتأمين البوكيه المرجعي بنجاح!</span>`;
            } else {
                label.textContent = "واجه نظام الرفع السحابي عطلاً طفيفاً، تأكد من استقرار شبكة الموبايل وإعادة المحاولة.";
            }
        }
    }

    function quickBuyRoseBouquet() {
        const parentCategory = liveMenuCatalog.find(item => item.id === 'roses');
        const isFrozen = (parentCategory && parentCategory.isAvailable === false) || state.outOfStockItems.includes('roses');
        
        if (isFrozen) {
            showGlobalModal('محاكي الورد مجمّد', 'تم تعطيل حجز باقات الورد مؤقتاً لسلامة أعمال الصيانة بالمصنع.');
            return;
        }
        if (!state.rose.referenceFile) { showGlobalModal('خطأ بالتخصيص', 'يرجى رفع صورة للبوكيه المرجعي أولاً لتسهيل الشراء السريع بناءً عليها.'); return; }
        state.cart.push({ id: 'quick-rose', name: 'بوكيه ورد - شراء سريع بالصورة المرفقة', price: state.rose.roseBasePrice || 400, qty: 1, isCustom: true, details: { 'طبيعة الطلب': 'شراء سريع ومباشر بناءً على ملف الصورة المرفوعة السحابية', 'صورة التصميم المرجعي': state.rose.referenceFile, 'سعر تقديري مبدئي': `${state.rose.roseBasePrice || 400} ج.م` } });
        updateCartBadge(); navigateTo('checkout');
    }

    function adjustRoseCount(amount) {
        let current = state.rose.count; let target = current + amount;
        let minCount = state.rose.roseMinCount || 15;
        if (target < minCount) return;
        state.rose.count = target; document.getElementById('roseCount').textContent = target;
        calculateRosePrice();
    }

    function selectRoseType(type) {
        state.rose.type = type;
        ['ورد طبيعي', 'صناعي', 'ستان'].forEach(t => {
            const btn = document.getElementById(`rose-type-${t}`);
            if (btn) btn.className = t === type ? "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold transition-all text-center" : "p-3.5 rounded-2xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-extrabold transition-all text-center hover:border-brandPink/30";
        });
    }

    function selectRoseDenomination(denom) {
        state.rose.cashDenomination = denom;
        [5, 10, 20, 50, 100, 200].forEach(d => {
            const btn = document.getElementById(`rose-denom-${d}`);
            if (btn) btn.className = d === denom ? "py-2 rounded-xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center" : "py-2 rounded-xl border border-brandPink/10 bg-white text-brandBlack text-xs font-bold transition-all text-center hover:border-brandPink/20";
        });
        calculateRoseCash();
    }

    function calculateRoseCash() {
        const amount = parseFloat(document.getElementById('roseCashAmount').value) || 0;
        state.rose.cashAmount = amount;
        const denom = state.rose.cashDenomination;
        const outputPanel = document.getElementById('roseCashOutput');
        const calcText = document.getElementById('roseCashCalcText');

        if (amount <= 0) { outputPanel.classList.add('hidden'); calculateRosePrice(); return; }
        outputPanel.classList.remove('hidden');

        if (amount % denom !== 0) {
            calcText.innerHTML = `<span class="text-brandPink"><i class="fa-solid fa-circle-xmark"></i> خطأ: المبلغ لا يقبل القسمة بالتساوي على فئة الـ ${denom} جنيه.</span>`;
        } else {
            calcText.innerHTML = `<span class="text-brandBlack font-extrabold"><i class="fa-solid fa-circle-check text-brandPink"></i> البوكيه جواه ${amount / denom} ورقة من فئة ${denom} جنيه.</span>`;
        }
        calculateRosePrice();
    }

    function adjustRosePhotos(amount) {
        let current = state.rose.photosCount; let target = Math.max(0, current + amount);
        state.rose.photosCount = target; document.getElementById('rosePhotosCount').textContent = target;
        const container = document.getElementById('rosePhotoUploadsContainer'); container.innerHTML = '';

        if (target > 0) {
            container.classList.remove('hidden');
            for (let i = 0; i < target; i++) {
                const row = document.createElement('div'); row.className = "relative border border-brandPink/20 bg-white rounded-xl p-3 text-right";
                row.innerHTML = `<input type="file" id="rosePhotoFile-${i}" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer z-20" onchange="BoseSweetsEngine.handleRosePhotoRowUpload(${i})"><span class="text-[10px] text-brandBlack/60 font-bold" id="rosePhotoRowLabel-${i}">ارفع صورة رقم ${i+1}</span>`;
                container.appendChild(row);
            }
        } else { container.classList.add('hidden'); }
        calculateRosePrice();
    }

    async function handleRosePhotoRowUpload(index) {
        const fileInput = document.getElementById(`rosePhotoFile-${index}`);
        const label = document.getElementById(`rosePhotoRowLabel-${index}`);
        if (fileInput && fileInput.files.length > 0) {
            label.innerHTML = `<span class="text-brandPink font-bold text-[10px] animate-pulse"><i class="fa-solid fa-spinner fa-spin"></i> رفع...</span>`;
            const uploadedUrl = await uploadToCloudinary(fileInput.files[0]);
            if (uploadedUrl) {
                state.rose.photoFiles[index] = uploadedUrl;
                label.innerHTML = `<span class="text-brandBlack font-extrabold text-[10px]"><i class="fa-solid fa-circle-check text-brandPink"></i> تم الحفظ</span>`;
            } else {
                label.textContent = "فشل";
            }
        }
    }

    function toggleRoseRibbonInput() {
        const isChecked = document.getElementById('roseRibbonCheck').checked; state.rose.ribbonEnabled = isChecked;
        document.getElementById('roseRibbonInputArea').className = isChecked ? "pt-1" : "hidden";
        calculateRosePrice();
    }

    function calculateRoseChocolate() {
        const budget = parseFloat(document.getElementById('roseChocBudget').value) || 0;
        state.rose.chocBudget = budget; const piecePrice = state.rose.chocPiecePrice;
        const outputPanel = document.getElementById('roseChocOutput'); const calcText = document.getElementById('roseChocCalcText');

        if (budget <= 0) { outputPanel.classList.add('hidden'); calculateRosePrice(); return; }
        outputPanel.classList.remove('hidden');

        const pieces = Math.floor(budget / piecePrice);
        calcText.innerHTML = pieces === 0 ? `<span class="text-brandPink">الميزانية لا تكفي لشراء قطعة فئة ${piecePrice} جنيه.</span>` : `<span class="text-brandBlack font-extrabold"><i class="fa-solid fa-circle-check text-brandPink"></i> سيتم إضافة ${pieces} قطع شوكولاتة للبوكيه.</span>`;
        calculateRosePrice();
    }

    function selectRoseChocPiecePrice(price) {
        state.rose.chocPiecePrice = price;
        [20, 30, 50].forEach(p => {
            const btn = document.getElementById(`rose-choc-piece-${p}`);
            if (btn) btn.className = p === price ? "py-2.5 rounded-xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center" : "py-2.5 rounded-xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-bold transition-all text-center hover:border-brandPink/20";
        });
        calculateRoseChocolate();
    }

    function adjustRosePremiumBar(barValue, dir) {
        if (barValue === 100) { state.rose.premiumBar100 = Math.max(0, state.rose.premiumBar100 + dir); document.getElementById('rosePremiumBar100').textContent = state.rose.premiumBar100; }
        else { state.rose.premiumBar120 = Math.max(0, state.rose.premiumBar120 + dir); document.getElementById('rosePremiumBar120').textContent = state.rose.premiumBar120; }
        calculateRosePrice();
    }

    function calculateRosePrice() {
        let basePrice = state.rose.roseBasePrice || 400;
        let minCount = state.rose.roseMinCount || 15;
        let pricePerAdditional = state.rose.rosePricePerAdditional || 35;
        let photoPrice = state.rose.rosePhotoPrice || 15;
        let ribbonPrice = state.rose.roseRibbonPrice || 50;
        let cardPrice = state.rose.roseCardPrice || 20;

        let total = basePrice; 
        if (state.rose.count > minCount) {
            total += (state.rose.count - minCount) * pricePerAdditional;
        }
        total += state.rose.cashAmount 
            + (state.rose.photosCount * photoPrice) 
            + (state.rose.ribbonEnabled ? ribbonPrice : 0) 
            + state.rose.chocBudget 
            + (state.rose.premiumBar100 * 100) 
            + (state.rose.premiumBar120 * 120) 
            + (state.rose.cardEnabled ? cardPrice : 0);

        const liveDisp = document.getElementById('roseLivePriceDisplay');
        if (liveDisp) liveDisp.textContent = `${total} ج.م`;
    }

    function toggleRoseCardInput() {
        const isChecked = document.getElementById('roseCardCheck').checked; state.rose.cardEnabled = isChecked;
        document.getElementById('roseCardInputArea').className = isChecked ? "pt-2 transition-all duration-300" : "hidden";
        calculateRosePrice();
    }

    function navigateRoseStep(stepNum) {
        if (state.rose.step === 2 && stepNum === 3 && state.rose.cashAmount > 0 && (state.rose.cashAmount % state.rose.cashDenomination !== 0)) {
            showGlobalModal('عدم تطابق في الكاش', 'يرجى موازنة قيمة الكاش لتناسب فئة الأوراق النقدية قبل المتابعة.'); return;
        }
        state.rose.step = stepNum;
        document.getElementById('rose-screen-1').classList.add('hidden'); document.getElementById('rose-screen-2').classList.add('hidden'); document.getElementById('rose-screen-3').classList.add('hidden');
        document.getElementById(`rose-screen-${stepNum}`).classList.remove('hidden');

        const line1 = document.getElementById('rose-line-1'); const line2 = document.getElementById('rose-line-2');
        if (line1 && line2) {
            if (stepNum === 1) { line1.style.width = '0%'; line2.style.width = '0%'; }
            if (stepNum === 2) { line1.style.width = '100%'; line2.style.width = '0%'; }
            if (stepNum === 3) { line1.style.width = '100%'; line2.style.width = '100%'; }
        }

        for (let i = 1; i <= 3; i++) {
            const ind = document.getElementById(`rose-step-${i}-indicator`);
            const textStep2 = document.getElementById('rose-text-step-2'); const textStep3 = document.getElementById('rose-text-step-3');
            if (ind) {
                if (i <= stepNum) {
                    ind.className = "w-10 h-10 rounded-full bg-brandPink text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-brandPink/20 transition-all duration-300";
                    if (i === 2 && textStep2) textStep2.className = "text-[11px] font-extrabold text-brandBlack transition-colors duration-300";
                    if (i === 3 && textStep3) textStep3.className = "text-[11px] font-extrabold text-brandBlack transition-colors duration-300";
                } else {
                    ind.className = "w-10 h-10 rounded-full bg-brandPinkLight text-brandBlack/40 border border-brandPink/15 flex items-center justify-center font-extrabold text-sm transition-all duration-300";
                    if (i === 2 && textStep2) textStep2.className = "text-[11px] font-extrabold text-brandBlack/40 transition-colors duration-300";
                    if (i === 3 && textStep3) textStep3.className = "text-[11px] font-extrabold text-brandBlack/40 transition-colors duration-300";
                }
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function addRoseToCart() {
        const parentCategory = liveMenuCatalog.find(item => item.id === 'roses');
        const isFrozen = (parentCategory && parentCategory.isAvailable === false) || state.outOfStockItems.includes('roses');
        
        if (isFrozen) {
            showGlobalModal('محاكي الورد مجمّد', 'تم تعطيل حجز باقات الورد مؤقتاً لسلامة أعمال الصيانة بالمصنع.');
            return;
        }
        if (state.rose.cashAmount > 0 && (state.rose.cashAmount % state.rose.cashDenomination !== 0)) { showGlobalModal('خطأ حسابي', 'يرجى موازنة قيمة الكاش لتناسب الأوراق النقدية.'); return; }
        
        let basePrice = state.rose.roseBasePrice || 400;
        let minCount = state.rose.roseMinCount || 15;
        let pricePerAdditional = state.rose.rosePricePerAdditional || 35;
        let photoPrice = state.rose.rosePhotoPrice || 15;
        let ribbonPrice = state.rose.roseRibbonPrice || 50;
        let cardPrice = state.rose.roseCardPrice || 20;

        let total = basePrice; 
        if (state.rose.count > minCount) {
            total += (state.rose.count - minCount) * pricePerAdditional;
        }
        total += state.rose.cashAmount 
            + (state.rose.photosCount * photoPrice) 
            + (state.rose.ribbonEnabled ? ribbonPrice : 0) 
            + state.rose.chocBudget 
            + (state.rose.premiumBar100 * 100) 
            + (state.rose.premiumBar120 * 120) 
            + (state.rose.cardEnabled ? cardPrice : 0);

        state.rose.colors = document.getElementById('roseColors').value; state.rose.ribbonText = document.getElementById('roseRibbonText').value; state.rose.cardText = document.getElementById('roseCardText').value;
        
        const activePhotoUrls = state.rose.photoFiles.filter(Boolean).join(' | ') || 'لا يوجد صور مرفوعة';

        const details = { 
            'عدد الورد الإجمالي': `${state.rose.count} وردة`, 
            'نوع الورد': state.rose.type, 
            'الألوان': state.rose.colors || 'تنسيق عشوائي', 
            'البوكيه المرجعي السحابي': state.rose.referenceFile || 'لا يوجد مرجع', 
            'الكاش المدمج': state.rose.cashAmount > 0 ? `${state.rose.cashAmount} جنيه` : 'لا يوجد كاش', 
            'الصور وسط الورد': activePhotoUrls, 
            'شريط الستان': state.rose.ribbonEnabled ? state.rose.ribbonText : 'لا يوجد', 
            'بارات جالاكسي': `${state.rose.premiumBar100} قطعة`, 
            'بارات كادبوري': `${state.rose.premiumBar120} قطعة`, 
            'كارت الإهداء': state.rose.cardEnabled ? state.rose.cardText : 'لا يوجد' 
        };

        state.cart.push({ id: 'custom-rose', name: 'بوكيه ورد - بناء خاص', price: total, qty: 1, isCustom: true, details: details });
        updateCartBadge(); resetRoseBuilder();
        showGlobalModal('تم الإضافة للسلة', 'تم ترحيل باقة زهورك الخاصة بنجاح إلى سلة المشتريات المعتمدة.', [{ text: 'استمر بالتسوق', action: () => { closeModal(); navigateTo('menu'); } }, { text: 'شاهد سلة التسوق', action: () => { closeModal(); navigateTo('cart'); }, primary: true }], 'fa-circle-check');
    }

    // CART MANAGEMENT
    function updateCartBadge() {
        const badge = document.getElementById('cartCountBadge');
        const count = state.cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
        
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    function clearCart() {
        state.cart = [];
        updateCartBadge();
        renderCart();
    }

    function runInvoiceIntegrityChecksum() {
        let computedSum = 0;
        state.cart.forEach(item => {
            computedSum += item.price;
        });
        return computedSum;
    }

    function removeCartItem(index) {
        state.cart.splice(index, 1);
        updateCartBadge();
        renderCart();
    }

    function renderCart() {
        const emptyState = document.getElementById('cartEmptyState');
        const itemsContainer = document.getElementById('cartItemsContainer');

        if (state.cart.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (itemsContainer) itemsContainer.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (itemsContainer) itemsContainer.classList.remove('hidden');

        const list = document.getElementById('cartItemsList');
        if (!list) return;

        list.innerHTML = state.cart.map(function(item, index) {
            let detailsDropdownHtml = '';
            if (item.isCustom && item.details) {
                detailsDropdownHtml = `
                    <div class="mt-2 border-t border-brandPink/10 pt-2">
                        <button onclick="BoseSweetsEngine.toggleCartDetails(${index})" class="text-xs text-brandPink font-bold flex items-center gap-1 focus:outline-none">
                            <i class="fa-solid fa-chevron-down text-[10px]" id="cartChevron-${index}"></i> استعراض تفاصيل التصميم المخصص
                        </button>
                        <div id="cartDetailsPanel-${index}" class="hidden mt-2 bg-brandPinkLight rounded-xl p-3 border border-brandPink/20 text-xs text-brandBlack/80 space-y-1.5 transition-all">
                            ${Object.entries(item.details).map(function([key, val]) {
                                return `
                                    <div class="flex justify-between border-b border-brandPink/5 pb-1 font-semibold">
                                        <span class="text-brandBlack/50">${key}:</span>
                                        <span class="text-brandBlack text-left truncate max-w-[200px]" title="${val}">${val}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            return `
                <div class="p-5 rounded-2xl bg-white border border-brandPink/15 hover:shadow-md transition-all duration-300">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h3 class="font-extrabold text-brandBlack text-sm md:text-base">${item.name}</h3>
                            <p class="text-xs text-brandPink font-extrabold mt-1">السعر الإجمالي: ${item.price} ج.م</p>
                            ${item.qty > 1 ? `<span class="text-[10px] text-brandBlack/50 font-bold">الكمية المحجوزة: ${item.qty} قطع</span>` : ''}
                        </div>
                        <button onclick="BoseSweetsEngine.removeCartItem(${index})" class="p-2.5 text-brandBlack/30 hover:text-brandPink hover:bg-brandPinkLight rounded-full transition-all" aria-label="حذف">
                            <i class="fa-solid fa-trash-can text-sm"></i>
                        </button>
                    </div>
                    ${detailsDropdownHtml}
                </div>
            `;
        }).join('');

        const sum = runInvoiceIntegrityChecksum();
        const totalSumEl = document.getElementById('cartTotalSum');
        if (totalSumEl) totalSumEl.textContent = `${sum} ج.م`;
    }

    function toggleCartDetails(index) {
        const panel = document.getElementById(`cartDetailsPanel-${index}`);
        const chevron = document.getElementById(`cartChevron-${index}`);
        if (panel) {
            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                if (chevron) chevron.className = "fa-solid fa-chevron-up text-[10px]";
            } else {
                panel.classList.add('hidden');
                if (chevron) chevron.className = "fa-solid fa-chevron-down text-[10px]";
            }
        }
    }
    // CHECKOUT PROCESS
    function renderCheckout() {
        const subtotal = runInvoiceIntegrityChecksum();
        const subtotalEl = document.getElementById('checkoutSubtotal');
        if (subtotalEl) subtotalEl.textContent = `${subtotal} ج.م`;
        renderShippingRegions();
        selectDeliveryMethod(state.checkout.method);
    }

    function selectDeliveryMethod(method) {
        state.checkout.method = method;
        
        const btnPickup = document.getElementById('ship-pickup');
        const btnShip = document.getElementById('ship-delivery');
        
        const panelPickup = document.getElementById('pickupInfoPanel');
        const panelShip = document.getElementById('shipInfoPanel');

        if (method === 'pickup') {
            if (btnPickup) btnPickup.className = "p-4 border-2 border-brandPink bg-brandPink/5 text-brandPink rounded-2xl text-sm font-bold transition-all text-center";
            if (btnShip) btnShip.className = "p-4 border-2 border-brandPink/10 text-brandBlack/65 bg-white rounded-2xl text-sm font-bold transition-all text-center";
            if (panelPickup) panelPickup.classList.remove('hidden');
            if (panelShip) panelShip.classList.add('hidden');
            state.checkout.shippingFee = 0;
        } else {
            if (btnShip) btnShip.className = "p-4 border-2 border-brandPink bg-brandPink/5 text-brandPink rounded-2xl text-sm font-bold transition-all text-center";
            if (btnPickup) btnPickup.className = "p-4 border-2 border-brandPink/10 text-brandBlack/65 bg-white rounded-2xl text-sm font-bold transition-all text-center";
            if (panelShip) panelShip.classList.remove('hidden');
            if (panelPickup) panelPickup.classList.add('hidden');
            calculateShippingFee();
        }

        updateCheckoutTotals();
    }

    function calculateShippingFee() {
        const regionSelect = document.getElementById('shippingRegion');
        if (!regionSelect) return;
        const region = regionSelect.value;
        state.checkout.region = region;

        const rates = state.shippingRates || {};
        const fee = rates[region] || 0;
        state.checkout.shippingFee = fee;

        const notice = document.getElementById('shippingFeeNotice');
        if (region && notice) {
            notice.textContent = `قيمة تكلفة الشحن لمنطقة (${region}) هي ${fee} ج.م مضافة للفاتورة.`;
            notice.classList.remove('hidden');
        } else if (notice) {
            notice.classList.add('hidden');
        }

        updateCheckoutTotals();
    }

    function updateCheckoutTotals() {
        const subtotal = runInvoiceIntegrityChecksum();
        const shipping = state.checkout.shippingFee;
        const grandTotal = subtotal + shipping;

        const checkShip = document.getElementById('checkoutShipping'); if (checkShip) checkShip.textContent = `${shipping} ج.م`;
        const checkGrand = document.getElementById('checkoutGrandTotal'); if (checkGrand) checkGrand.textContent = `${grandTotal} ج.م`;
    }

    function validateDateTimeRules() {
        const dateInput = document.getElementById('shipDate').value;
        const timeInput = document.getElementById('shipTime').value;
        const warning = document.getElementById('dateTimeWarning');

        if (!dateInput) return true;

        const selectedDateTime = new Date(`${dateInput}T${timeInput || '00:00'}`);
        const now = new Date();

        if (selectedDateTime < now) {
            if (warning) {
                warning.textContent = 'خطأ بالتنسيق الزمني: لا يمكن حجز تاريخ في الماضي.';
                warning.classList.remove('hidden');
            }
            return false;
        }

        const prepHours = state.orderPrepTimeHours || 24;
        const minAllowedTime = new Date(now.getTime() + (prepHours * 60 * 60 * 1000));
        if (selectedDateTime < minAllowedTime) {
            if (warning) {
                warning.textContent = `أقرب ميعاد متاح للتسليم هو بعد مرور ${prepHours} ساعة لضمان جودة التصنيع الفني.`;
                warning.classList.remove('hidden');
            }
            return false;
        }

        if (warning) warning.classList.add('hidden');
        return true;
    }

    function validateEgyptianPhone(phone) {
        const clean = phone.trim();
        const regex = /^(010|011|012|015)[0-9]{8}$/;
        return regex.test(clean);
    }

    function handleCheckoutSubmit(event) {
        event.preventDefault();

        const phone = document.getElementById('custPhone').value;
        if (!validateEgyptianPhone(phone)) {
            showGlobalModal('خطأ الهاتف', 'يرجى كتابة رقم هاتف مصري صحيح مكون من 11 رقماً للاتصال.');
            return;
        }

        if (!validateDateTimeRules()) {
            const prepHours = state.orderPrepTimeHours || 24;
            showGlobalModal('شروط التوقيت', `يرجى اختيار موعد استلام بعد ${prepHours} ساعة من الآن لسلامة التنفيذ.`);
            return;
        }

        for (let i = 0; i < state.cart.length; i++) {
            const item = state.cart[i];
            const isFrozen = state.outOfStockItems.includes(item.id);
            if (isFrozen) {
                showGlobalModal('تنبيه بمخزون الصنف', `الصنف (${item.name}) نفد مؤخراً من مطبخنا، يرجى حذفه لإكمال الطلب بنجاح.`);
                return;
            }
        }

        const subBtn = document.getElementById('checkoutSubmitBtn');
        if (subBtn) {
            subBtn.disabled = true;
            subBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري ترحيل وحجز الطلب سحابياً...`;
        }

        const name = document.getElementById('custName').value;
        const date = document.getElementById('shipDate').value;
        const time = document.getElementById('shipTime').value;

        const subtotal = runInvoiceIntegrityChecksum();
        const shipping = state.checkout.shippingFee;
        const grandTotal = subtotal + shipping;

        let deliveryDetails = '';
        if (state.checkout.method === 'pickup') {
            deliveryDetails = `*طريقة التسليم:* استلام شخصي من فرع الكفاح المعتمد`;
        } else {
            const address = document.getElementById('custAddress').value;
            deliveryDetails = `*طريقة التسليم:* شحن وتنسيق للعنوان\n*المنطقة:* ${state.checkout.region}\n*العنوان:* ${address || 'لم يكتب'}\n*تكلفة الشحن:* ${shipping} ج.م`;
        }

        let cartItemsString = state.cart.map(function(item, idx) {
            let customDetails = '';
            if (item.isCustom && item.details) {
                customDetails = Object.entries(item.details).map(function([k, v]) {
                    return `  - ${k}: ${v}`;
                }).join('\n');
            }
            return `🔹 *${idx+1}. ${item.name}*\n*الكمية:* ${item.qty}\n*السعر:* ${item.price} ج.م\n${customDetails ? `${customDetails}` : ''}`;
        }).join('\n');

        const messageText = `*طلب جديد معتمد - حلويات بوسي*\n\n` +
                            `👤 *الاسم:* ${name}\n` +
                            `📞 *الهاتف:* ${phone}\n\n` +
                            `${deliveryDetails}\n\n` +
                            `📅 *تاريخ التسليم:* ${date}\n` +
                            `⏰ *الساعة:* ${time}\n\n` +
                            `🛒 *تفاصيل المشتريات:*\n${cartItemsString}\n\n` +
                            `💰 *إجمالي الفاتورة النهائي:* ${grandTotal} ج.م\n\n` +
                            `_تم توليد وتأمين هذا الطلب سحابياً بنجاح عبر النظام الموحد لعلامة حلويات بوسي الفاخرة_ ✨`;

        const encodedMessage = encodeURIComponent(messageText);
        const targetUrl = `https://wa.me/20${brandWhatsAppNumber}?text=${encodedMessage}`;
        
        setTimeout(() => {
            window.open(targetUrl, '_blank');
            if (subBtn) {
                subBtn.disabled = false;
                subBtn.innerHTML = `تأكيد المعاملة وترحيل البيانات للواتساب`;
            }
            clearCart();
            navigateTo('home');
        }, 1200);
    }

    function showPolicy(policyKey) {
        let title = '';
        let text = '';
        if (policyKey === 'about') {
            title = 'تاريخنا وعقد من الاتقان';
            text = 'علامة حلويات بوسي انطلقت كعلامة تجارية مصرية رائدة في الفرافرة والكفاح لتصنيع الحلويات الفاخرة من خامات طبيعية 100% وبأعلى معايير الإتقان الفني.';
        } else if (policyKey === 'contact') {
            title = 'قنوات الاتصال المباشر';
            text = 'يسعدنا تواصلكم مع الإدارة المركزية مباشرة عبر الرقم المعتمد: 01097238441 أو تشريفنا بالزيارة في فرع الكفاح الرئيسي - شارع الوحدة المحلية.';
        } else if (policyKey === 'privacy') {
            title = 'سياسة الخصوصية والأمان الفني';
            text = 'نحن نلتزم بتأمين بياناتكم الشخصية والصور المرفوعة للمحاكيات وتشفيرها سحابياً بالكامل، ويتم حذف الملفات تلقائياً بمجرد تسليم ومطابقة الطلب.';
        } else if (policyKey === 'refund') {
            title = 'سياسة الاسترجاع والضمان';
            text = 'نظراً لأن منتجاتنا طبيعية وصناعة يدوية فاخرة، يتم مراجعة ومطابقة الطلب لحظة الاستلام. في حال وجود أي اختلاف في المواصفات، يحق للعميل التعديل أو التعويض الفوري.';
        } else if (policyKey === 'delivery') {
            title = 'سياسة التوصيل المبرد الآمن';
            text = 'يتم نقل كافة المنتجات عبر أسطول سيارات مبرد ومخصص للحفاظ على تماسك وهيكل التورت والحلويات من المصنع وحتى باب منزلك في الفرافرة والكفاح طوال العام.';
        } else if (policyKey === 'care') {
            title = 'دليل الحفاظ على جودة المنتج';
            text = 'نظراً لخلو حلوياتنا تماماً من المواد الكيميائية والمحافظة، نوصي بحفظ التورت والحلويات داخل الثلاجة فور استلامها واستهلاكها خلال 48 ساعة لضمان النكهة الأصلية الفاخرة.';
        }
        showGlobalModal(title, text, [], 'fa-circle-info');
    }

    // INITIALIZATION RUNNER
    document.addEventListener('DOMContentLoaded', () => {
        validateDOMRegistry();
        initFirebase();
    });

    // PUBLIC INTERFACE EXPOSURE (تصدير كافة الدالات لربط أحداث الواجهة بالكامل وبأسمائها الصحيحة 100%)
    return {
        navigateTo: navigateTo,
        toggleSidebar: toggleSidebar,
        handleSearch: handleSearch,
        showCakePriceInfo: showCakePriceInfo,
        selectCakeBase: selectCakeBase,
        selectCakeShape: selectCakeShape,
        adjustCakePeople: adjustCakePeople,
        navigateCakeStep: navigateCakeStep,
        selectCakePrintOption: selectCakePrintOption,
        handleCakeFileUpload: handleCakeFileUpload,
        toggleCakeCardInput: toggleCakeCardInput,
        addCakeToCart: addCakeToCart,
        handleRoseReferenceUpload: handleRoseReferenceUpload,
        quickBuyRoseBouquet: quickBuyRoseBouquet,
        adjustRoseCount: adjustRoseCount,
        selectRoseType: selectRoseType,
        selectRoseDenomination: selectRoseDenomination,
        calculateRoseCash: calculateRoseCash,
        adjustRosePhotos: adjustRosePhotos,
        handleRosePhotoRowUpload: handleRosePhotoRowUpload,
        toggleRoseRibbonInput: toggleRoseRibbonInput,
        calculateRoseChocolate: calculateRoseChocolate,
        selectRoseChocPiecePrice: selectRoseChocPiecePrice,
        adjustRosePremiumBar: adjustRosePremiumBar,
        toggleRoseCardInput: toggleRoseCardInput,
        addRoseToCart: addRoseToCart,
        renderCart: renderCart,
        clearCart: clearCart,
        removeCartItem: removeCartItem,
        toggleCartDetails: toggleCartDetails,
        selectDeliveryMethod: selectDeliveryMethod,
        calculateShippingFee: calculateShippingFee,
        validateDateTimeRules: validateDateTimeRules,
        handleCheckoutSubmit: handleCheckoutSubmit,
        showPolicy: showPolicy,
        selectDespacitoSize: selectDespacitoSize,
        adjustDespacitoQty: adjustDespacitoQty,
        addDespacitoToCart: addDespacitoToCart,
        adjustProductFlavorQty: adjustProductFlavorQty,
        addProductFlavorToCart: addProductFlavorToCart
    };

})();
