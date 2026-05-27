/**
 * =========================================================
 * Bose Sweets — Enterprise UI Display Manager
 * =========================================================
 * File               : app-display-manager.js
 * Architecture Level : ENTERPRISE UI PERFORMANCE LAYER
 * Runtime Level      : COMPLIANT INTERACTION LAYER
 * Stability Level    : MAXIMUM PRODUCTION
 * Mobile Optimized   : LOW MEMORY EVENT CAPTURING
 * =========================================================
 */

'use strict';

import REGISTRY from './system-registry.js';
import SYSTEM_CORE from './system-core.js';
import FIREBASE_ENGINE from './firebase-engine.js';
import COMMERCE_ENGINE from './commerce-engine.js';
import UNIFIED_ENGINE from './unified-engine.js';

export class BoseSweetsAppManager {
    constructor() {
        this.currentView = 'home';
        this.cakeCustomState = { base: 'فانيليا', shape: 'دائرة', people: 4, print: 'none' };
        this.roseCustomState = { type: 'ورد طبيعي', count: 15, cash: 0, denomination: 20, photos: 0, ribbon: false, chocBudget: 0, chocPiecePrice: 20, premiumBars: { 100: 0, 120: 0 }, card: false };
        this.cart = [];
        this.menuData = [];
        this.globalConfig = null;
        this.selectedShippingCost = 0;
        this.activeListeners = [];
    }

    init() {
        SYSTEM_CORE.Diagnostics.info('[DISPLAY_MANAGER] Initializing Technical Compliance Interface Pipeline');
        
        // إسناد فوري ومبكر للكائن بنطاق النافذة لضمان استجابة واجهات واجهة المستخدم في كل الظروف
        window.BoseSweetsEngine = this;
        window.BoseSweets = this;

        this.syncWithCoreState();
        this.activateRealtimeCloudSync();
        
        SYSTEM_CORE.EVENTS.on(REGISTRY.EVENTS.SYSTEM.READY, (payload) => {
            if (payload.runtime === 'SYSTEM_CORE') {
                this.syncWithCoreState();
            }
        });
    }

    syncWithCoreState() {
        const savedCart = SYSTEM_CORE.STATE.get(REGISTRY.STATE.CART.key);
        if (savedCart && Array.isArray(savedCart)) {
            this.cart = savedCart;
            this.updateCartBadge();
        }
    }

    activateRealtimeCloudSync() {
        const unsubscribeConfigId = FIREBASE_ENGINE.WATCHERS.document(REGISTRY.FIREBASE.SETTINGS.GLOBAL_CONFIG, (cleanGlobalConfig) => {
            if (cleanGlobalConfig) {
                this.globalConfig = { ...this.globalConfig, ...cleanGlobalConfig };
                SYSTEM_CORE.STATE.set(REGISTRY.STATE.SYSTEM_STATUS.key, this.globalConfig);
                
                const footerPhone = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.GLOBAL.FOOTER_PHONE_DISPLAY.id);
                if (footerPhone && cleanGlobalConfig.phone) {
                    footerPhone.textContent = cleanGlobalConfig.phone;
                }
                
                const ticker = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.GLOBAL.MARQUEE_CONTENT.id);
                if (ticker && cleanGlobalConfig.marqueeText) {
                    ticker.innerHTML = `<span>✨ ${cleanGlobalConfig.marqueeText}</span>`.repeat(4);
                }
                
                this.updateStaticLabels();
                this.updateCakePriceDisplay();
                this.updateRosePriceDisplay();
            }
        });
        this.activeListeners.push(unsubscribeConfigId);

        const unsubscribeMenuId = FIREBASE_ENGINE.WATCHERS.collection(REGISTRY.FIREBASE.COLLECTIONS.MENU, (cloudMenu) => {
            if (cloudMenu && cloudMenu.length > 0) {
                this.menuData = cloudMenu.map(item => {
                    let computedPrice = item.price || 150;
                    if (item.flavors && item.flavors[0]) {
                        computedPrice = item.flavors[0].price;
                    } else if (item.sizes && item.sizes[0] && item.sizes[0].flavors && item.sizes[0].flavors[0]) {
                        computedPrice = item.sizes[0].flavors[0].price;
                    }
                    return {
                        id: item.id,
                        name: item.name || 'صنف فاخر',
                        category: item.category || 'حلويات',
                        price: computedPrice,
                        image: item.img || item.image || './assets/cake-placeholder.webp',
                        img: item.img || item.image || './assets/cake-placeholder.webp',
                        desc: item.desc || item.description || '',
                        unit: item.unit || 'معياري فاخر',
                        hidden: Boolean(item.hidden),
                        status: item.status || 'visible'
                    };
                });
                
                SYSTEM_CORE.STATE.set(REGISTRY.STATE.MENU.key, this.menuData);
                this.renderMenuCategories();
            }
        });
        this.activeListeners.push(unsubscribeMenuId);

        this.populateShippingRegions();
    }

    updateStaticLabels() {
        if (!this.globalConfig) return;
        
        const edibleBtn = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PRINT_EDIBLE_BTN.id);
        const nonEdibleBtn = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PRINT_NON_EDIBLE_BTN.id);
        if (edibleBtn) edibleBtn.textContent = `قابلة للأكل (+${this.globalConfig.cakePrintEdiblePrice || 60} ج.م)`;
        if (nonEdibleBtn) nonEdibleBtn.textContent = `غير قابلة للأكل (+${this.globalConfig.cakePrintNonEdiblePrice || 20} ج.م)`;

        const minCountHint = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.MIN_COUNT_HINT.id);
        if (minCountHint) minCountHint.textContent = `الحد الأدنى للتنسيق ${this.globalConfig.roseMinCount || 15} وردة طبيعية فريش`;

        const photoHint = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.PHOTO_PRICE_HINT.id);
        if (photoHint) photoHint.textContent = `تكلفة طباعة وتجهيز كل صورة هي +${this.globalConfig.rosePhotoPrice || 15} ج.م`;

        const ribbonLabel = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.RIBBON_LABEL.id);
        if (ribbonLabel) ribbonLabel.textContent = `إضافة شريط ستان مطبوع يلتف فاخراً حول البوكيه (+${this.globalConfig.roseRibbonPrice || 50} ج.م)`;

        const cardLabel = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CARD_LABEL.id);
        if (cardLabel) cardLabel.textContent = `شراء كارت إهداء خارجي فاخر مع الطباعة الملونة (+${this.globalConfig.roseCardPrice || 20} ج.م)`;
    }

    populateShippingRegions() {
        const select = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SHIPPING_REGION.id);
        if (!select) return;

        const rates = COMMERCE_ENGINE.SHIPPING.regions();
        select.innerHTML = '<option value="" disabled selected>اختر المنطقة لشحن وتبريد آمن...</option>' + 
            Object.keys(rates).map(region => `<option value="${region}">قرية ${region} (${rates[region]} ج.م)</option>`).join('');
    }

    handleRegionChange() {
        const select = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SHIPPING_REGION.id);
        if (!select) return;

        const rates = COMMERCE_ENGINE.SHIPPING.regions();
        this.selectedShippingCost = rates[select.value] || 0;
        
        COMMERCE_ENGINE.CHECKOUT.set({ region: select.value });
        this.renderCheckoutView();
    }

    navigateTo(viewId) {
        const validViews = ['home', 'menu', 'product', 'cake-builder', 'rose-builder', 'cart', 'checkout'];
        if (!validViews.includes(viewId)) return;

        validViews.forEach(v => {
            const el = UNIFIED_ENGINE.DOM.get(`view-${v}`);
            if (el) el.classList.add('hidden');
        });

        const targetEl = UNIFIED_ENGINE.DOM.get(`view-${viewId}`);
        if (targetEl) targetEl.classList.remove('hidden');

        this.currentView = viewId;
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });

        if (viewId === 'cart') this.renderCartView();
        if (viewId === 'checkout') this.renderCheckoutView();
        
        SYSTEM_CORE.EVENTS.emit(REGISTRY.EVENTS.VIEW.CHANGED, { view: viewId });
    }

    toggleSidebar(open) {
        const sidebar = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.GLOBAL.SIDEBAR.id);
        const overlay = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.GLOBAL.SIDEBAR_OVERLAY.id);
        if (!sidebar || !overlay) return;

        if (open) {
            sidebar.classList.remove('translate-x-full');
            overlay.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            sidebar.classList.add('translate-x-full');
            overlay.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    renderMenuCategories() {
        // الالتزام التام بعقد السجل الأساسي لواجهة العرض والصفحة الرئيسية لمنع الاختفاء
        const targetGrid = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.HOMEPAGE.MENU_GRID.id);
        if (!targetGrid) return;

        const categories = ['تورتات', 'باقات الورد', 'حلويات'];
        const outOfStockList = SYSTEM_CORE.STATE.get(REGISTRY.STATE.OUT_OF_STOCK_ITEMS.key) || [];

        targetGrid.innerHTML = categories.map(cat => {
            const items = this.menuData.filter(i => {
                const itemCat = String(i.category || '').toLowerCase();
                if (cat === 'تورتات') return itemCat.includes('تورت') || itemCat.includes('cake');
                if (cat === 'باقات الورد') return itemCat.includes('ورد') || itemCat.includes('rose') || itemCat.includes('bouquet');
                if (cat === 'حلويات') return itemCat.includes('حلو') || itemCat.includes('sweet') || itemCat.includes('donuts') || itemCat.includes('cinnabon');
                return i.category === cat;
            });

            return `
                <div class="bg-brandPinkLight/40 rounded-3xl p-6 border border-brandPink/10 space-y-4">
                    <h2 class="text-sm font-black text-brandBlack border-r-4 border-brandPink pr-2.5 uppercase tracking-wide">${cat}</h2>
                    <div class="space-y-3">
                        ${items.map(item => {
                            const isOutOfStock = outOfStockList.includes(item.id);
                            return `
                                <div class="flex items-center gap-3 bg-white p-3 rounded-2xl border border-brandPink/5 hover:border-brandPink/20 transition-colors cursor-pointer relative ${isOutOfStock ? 'opacity-50' : ''}" 
                                     onclick="${isOutOfStock ? '' : `BoseSweetsEngine.viewProductDetails('${item.id}')`}">
                                    <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-xl object-cover bg-brandPinkLight flex-shrink-0" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"50\" height=\"50\" viewBox=\"0 0 50 50\"><rect width=\"100%\" height=\"100%\" fill=\"%23fff5f6\"/></svg>'">
                                    <div class="flex-grow min-w-0">
                                        <h3 class="text-[11px] font-extrabold text-brandBlack truncate">${item.name}</h3>
                                        <span class="text-brandPink font-black text-xs block mt-0.5">${item.price} ج.م ${isOutOfStock ? '<span class="text-[9px] text-red-500 font-bold">(غير متوفر)</span>' : ''}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    viewProductDetails(productId) {
        const item = this.menuData.find(i => i.id === productId);
        if (!item) return;

        const container = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.PRODUCT.CONTAINER.id);
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white rounded-[2rem] border border-brandPink/15 overflow-hidden shadow-sm space-y-6 p-4 md:p-8">
                <button onclick="BoseSweetsEngine.navigateTo('menu')" class="inline-flex items-center gap-1 text-xs font-bold text-brandBlack/60 hover:text-brandPink mb-2 transition-colors">
                    <i class="fa-solid fa-chevron-right text-[10px]"></i> العودة للمنيو الكامل
                </button>
                <div class="flex flex-col md:flex-row gap-8 items-stretch">
                    <div class="w-full md:w-1/2 aspect-square bg-brandPinkLight rounded-2xl overflow-hidden border border-brandPink/10">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                    </div>
                    <div class="w-full md:w-1/2 flex flex-col justify-between py-2 space-y-6">
                        <div class="space-y-4">
                            <span class="inline-block px-3 py-1 bg-brandPinkLight text-brandPink rounded-full text-[10px] font-black">${item.category}</span>
                            <h1 class="text-xl font-black text-brandBlack leading-snug">${item.name}</h1>
                            <p class="text-xs text-brandBlack/60 font-semibold leading-relaxed">${item.desc}</p>
                            <div class="p-3 bg-brandPinkLight/50 rounded-xl border border-brandPink/5 text-[11px] font-bold text-brandBlack/70">
                                <i class="fa-solid fa-grid-check text-brandPink ml-1"></i> خامات طبيعية 100% خالية تماماً من المكونات المهدرجة أو المحسنات الصناعية.
                            </div>
                        </div>
                        <div class="space-y-4 pt-4 border-t border-brandPink/10">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-brandBlack/50">السعر المعتمد للفرد/القطعة:</span>
                                <span class="text-2xl font-black text-brandPink tracking-tight">${item.price} ج.م</span>
                            </div>
                            <button onclick="BoseSweetsEngine.addItemToCart('${item.id}')" class="w-full py-4 bg-brandPink hover:bg-brandPinkDark text-white font-extrabold rounded-full text-xs transition-all duration-300 shadow-md flex items-center justify-center gap-2">
                                <i class="fa-solid fa-bag-shopping"></i> اضافة للسلة
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.navigateTo('product');
    }

    addItemToCart(productId) {
        const item = this.menuData.find(i => i.id === productId);
        if (!item) return;

        const outOfStockList = SYSTEM_CORE.STATE.get(REGISTRY.STATE.OUT_OF_STOCK_ITEMS.key) || [];
        if (outOfStockList.includes(item.id)) return;

        COMMERCE_ENGINE.CART.add(item);
        this.cart = COMMERCE_ENGINE.CART.getItems();
        this.updateCartBadge();
        this.navigateTo('cart');
    }

    updateCartBadge() {
        const badge = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CART.BADGE.id);
        if (!badge) return;

        const totalCount = COMMERCE_ENGINE.CART.count();
        if (totalCount > 0) {
            badge.textContent = totalCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    renderCartView() {
        const emptyState = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CART.EMPTY_STATE.id);
        const container = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CART.CONTAINER.id);
        const list = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CART.ITEMS.id);
        const totalDisplay = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CART.TOTAL.id);

        if (!emptyState || !container || !list || !totalDisplay) return;

        this.cart = COMMERCE_ENGINE.CART.getItems();

        if (this.cart.length === 0) {
            emptyState.classList.remove('hidden');
            container.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.classList.remove('hidden');

        list.innerHTML = this.cart.map(item => {
            const desc = item.details?.identity || item.details || '';
            return `
                <div class="p-4 rounded-2xl bg-white border border-brandPink/15 flex items-center justify-between gap-4 shadow-[0_2px_12px_rgba(255,145,164,0.02)]">
                    <div class="space-y-1 min-w-0 flex-grow">
                        <h3 class="text-xs font-extrabold text-brandBlack truncate">${item.name}</h3>
                        <p class="text-[10px] text-brandBlack/50 font-bold line-clamp-1">${desc}</p>
                    </div>
                    <div class="flex items-center gap-4 flex-shrink-0">
                        <span class="text-brandPink font-black text-sm tracking-tight">${item.price} ج.م</span>
                        <button onclick="BoseSweetsEngine.removeCartItem('${item.uid}')" class="p-2 bg-brandPinkLight hover:bg-brandPink/20 text-brandPink rounded-xl text-xs transition-colors">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        totalDisplay.textContent = `${COMMERCE_ENGINE.CART.subtotal()} ج.م`;
    }

    removeCartItem(uid) {
        COMMERCE_ENGINE.CART.remove(uid);
        this.cart = COMMERCE_ENGINE.CART.getItems();
        this.renderCartView();
        this.updateCartBadge();
    }

    clearCart() {
        COMMERCE_ENGINE.CART.clear();
        this.cart = [];
        this.renderCartView();
        this.updateCartBadge();
    }

    renderCheckoutView() {
        const calculations = COMMERCE_ENGINE.PRICING.calculateCartTotal();
        const subtotalEl = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SUBTOTAL.id);
        const shippingEl = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SHIPPING.id);
        const totalEl = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.TOTAL.id);

        if (subtotalEl) subtotalEl.textContent = `${calculations.subtotal} ج.م`;
        if (shippingEl) shippingEl.textContent = `${calculations.shipping} ج.م`;
        if (totalEl) totalEl.textContent = `${calculations.total} ج.م`;
    }

    handleSearch(e) {
        const query = e.target.value.trim().toLowerCase();
        const container = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.HOMEPAGE.DYNAMIC_CONTENT.id);
        if (!container) return;

        if (!query) {
            this.renderMenuCategories();
            return;
        }

        const filtered = this.menuData.filter(i => i.name.toLowerCase().includes(query) || i.desc.toLowerCase().includes(query));
        if (filtered.length === 0) {
            container.innerHTML = `<p class="col-span-full text-center text-xs font-bold text-brandBlack/40 py-8">لا توجد نتائج مطابقة لبحثك.</p>`;
            return;
        }

        container.innerHTML = `<div class="bose-dynamic-grid">${filtered.map(item => `
            <div class="bose-full-card cursor-pointer" onclick="BoseSweetsEngine.viewProductDetails('${item.id}')">
                <div class="relative w-full aspect-square bg-brandPinkLight overflow-hidden">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-4 flex flex-col justify-between flex-grow space-y-3">
                    <div class="space-y-1">
                        <h3 class="text-xs font-extrabold text-brandBlack line-clamp-1">${item.name}</h3>
                        <p class="text-[11px] text-brandBlack/50 font-medium line-clamp-2 leading-relaxed">${item.desc}</p>
                    </div>
                    <div class="flex items-center justify-between pt-1 border-t border-brandPink/5">
                        <span class="text-brandPink font-black text-sm tracking-tight">${item.price} ج.م</span>
                    </div>
                </div>
            </div>
        `).join('')}</div>`;
    }

    selectCakeBase(baseType) {
        this.cakeCustomState.base = baseType;
        ['فانيليا', 'شوكولاتة', 'نصف ونصف'].forEach(b => {
            const btn = UNIFIED_ENGINE.DOM.get(`cake-base-${b}`);
            if (!btn) return;
            if (b === baseType) {
                btn.className = "p-4 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold shadow-sm transition-all duration-300 text-center";
            } else {
                btn.className = "p-4 rounded-2xl border border-brandPink/10 bg-white hover:border-brandPink/30 text-brandBlack/70 text-xs font-extrabold transition-all duration-300 text-center";
            }
        });
    }

    selectCakeShape(shapeType) {
        this.cakeCustomState.shape = shapeType;
        ['دائرة', 'قلب', 'مربع', 'مستطيل'].forEach(s => {
            const btn = UNIFIED_ENGINE.DOM.get(`cake-shape-${s}`);
            if (!btn) return;
            if (s === shapeType) {
                btn.className = "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold transition-all duration-300 text-center";
            } else {
                btn.className = "p-3.5 rounded-2xl border border-brandPink/10 bg-white hover:border-brandPink/30 text-brandBlack/70 text-xs font-extrabold transition-all duration-300 text-center";
            }
        });
    }

    adjustCakePeople(amount) {
        let current = this.cakeCustomState.people;
        current += amount;
        if (current < 4) current = 4;
        if (current > 250) current = 250;
        this.cakeCustomState.people = current;

        const display = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PEOPLE_COUNT.id);
        if (display) display.textContent = current;

        const warning = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.COUNTER_WARNING.id);
        if (warning) {
            if (current >= 24) {
                warning.textContent = "⚠️ تنبيه: للمقاسات الكبرى فوق 24 فرد، يرجى تقديم الطلب قبل المناسبة بـ 48 ساعة على الأقل لضمان أعلى معايير الجودة.";
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        }
        this.updateCakePriceDisplay();
    }

    updateCakePriceDisplay() {
        const computedPrice = COMMERCE_ENGINE.PRICING.cake({
            people: this.cakeCustomState.people,
            printOption: this.cakeCustomState.print
        });
        const display = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PRICE_DISPLAY.id);
        if (display) display.textContent = `${computedPrice} ج.م`;
    }

    showCakePriceInfo() {
        if (!this.globalConfig) return;
        alert(`معايير التسعير المعتمدة في مطبخنا:\n- السعر الأساسي: ${this.globalConfig.cakeBasePricePerPerson || 145} جنيه مصري لكل فرد مستهدف شامل المكونات الطبيعية الفاخرة.`);
    }

    navigateCakeStep(step) {
        ['1', '2', '3'].forEach(s => {
            const screen = UNIFIED_ENGINE.DOM.get(`cake-screen-${s}`);
            if (screen) screen.classList.add('hidden');
            
            const indicator = UNIFIED_ENGINE.DOM.get(`cake-step-${s}-indicator`);
            const labelText = UNIFIED_ENGINE.DOM.get(`cake-text-step-${s}`);
            if (indicator) {
                if (parseInt(s) <= step) {
                    indicator.className = "w-10 h-10 rounded-full bg-brandPink text-white flex items-center justify-center font-extrabold text-sm shadow-md";
                    if (labelText) labelText.className = "text-[11px] font-extrabold text-brandBlack";
                } else {
                    indicator.className = "w-10 h-10 rounded-full bg-brandPinkLight text-brandBlack/40 border border-brandPink/15 flex items-center justify-center font-extrabold text-sm";
                    if (labelText) labelText.className = "text-[11px] font-extrabold text-brandBlack/40";
                }
            }
        });

        const currentScreen = UNIFIED_ENGINE.DOM.get(`cake-screen-${step}`);
        if (currentScreen) currentScreen.classList.remove('hidden');

        const line1 = UNIFIED_ENGINE.DOM.get('cake-line-1');
        const line2 = UNIFIED_ENGINE.DOM.get('cake-line-2');
        if (line1) line1.style.width = step >= 2 ? '100%' : '0%';
        if (line2) line2.style.width = step >= 3 ? '100%' : '0%';
    }

    handleCakeFileUpload(type) {
        if (type === 'design') {
            const label = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.DESIGN_LABEL.id);
            if (label) label.textContent = "✨ تم قراءة ملف التصميم المرجعي بنجاح وجاهز للمطابقة الطبيعية 100%.";
        } else {
            const label = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PRINT_LABEL.id);
            if (label) label.textContent = "✨ تم استقبال صورة الطباعة المباشرة بدقة أداء كاملة.";
        }
    }

    selectCakePrintOption(option) {
        this.cakeCustomState.print = option;
        ['none', 'edible', 'non-edible'].forEach(o => {
            const btn = UNIFIED_ENGINE.DOM.get(`cake-print-${o}`);
            if (!btn) return;
            if (o === option) {
                btn.className = "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center";
            } else {
                btn.className = "p-3.5 rounded-2xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-bold transition-all text-center hover:border-brandPink/30";
            }
        });

        const uploadArea = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.PRINT_UPLOAD_AREA.id);
        if (uploadArea) {
            if (option !== 'none') uploadArea.classList.remove('hidden');
            else uploadArea.classList.add('hidden');
        }
        this.updateCakePriceDisplay();
    }

    toggleCakeCardInput() {
        const checkbox = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_CHECK.id);
        const area = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_INPUT_AREA.id);
        if (area && checkbox) {
            if (checkbox.checked) area.classList.remove('hidden');
            else area.classList.add('hidden');
        }
    }

    addCakeToCart() {
        const text = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.TEXT_INPUT.id)?.value || '';
        const theme = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.THEME_DETAILS.id)?.value || '';
        const allergies = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.ALLERGIES.id)?.value || '';
        const cardText = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_TEXT.id)?.value || '';
        const cardEnabled = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CAKE.CARD_CHECK.id)?.checked || false;

        COMMERCE_ENGINE.CAKE.set({
            base: this.cakeCustomState.base,
            shape: this.cakeCustomState.shape,
            people: this.cakeCustomState.people,
            printOption: this.cakeCustomState.print,
            writing: text,
            theme: theme,
            allergies: allergies,
            cardEnabled: cardEnabled,
            cardText: cardText
        });

        COMMERCE_ENGINE.CAKE.addToCart();
        this.cart = COMMERCE_ENGINE.CART.getItems();
        SYSTEM_CORE.STATE.set(REGISTRY.STATE.CART.key, this.cart);
        this.updateCartBadge();
        this.navigateTo('cart');
        
        this.cakeCustomState = { base: 'فانيليا', shape: 'دائرة', people: 4, print: 'none' };
        this.navigateCakeStep(1);
    }

    handleRoseReferenceUpload() {
        const label = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.REFERENCE_LABEL.id);
        if (label) label.textContent = "✨ تم استقبال صورة البوكيه المستهدف للتنفيذ بدقة نهارية ممتازة.";
    }

    quickBuyRoseBouquet() {
        COMMERCE_ENGINE.ROSE.reset();
        COMMERCE_ENGINE.ROSE.addToCart();
        this.cart = COMMERCE_ENGINE.CART.getItems();
        SYSTEM_CORE.STATE.set(REGISTRY.STATE.CART.key, this.cart);
        this.updateCartBadge();
        this.navigateTo('cart');
    }

    adjustRoseCount(amount) {
        if (!this.globalConfig) return;
        let current = this.roseCustomState.count;
        current += amount;
        if (current < (this.globalConfig.roseMinCount || 15)) current = this.globalConfig.roseMinCount || 15;
        if (current > 500) current = 500;
        this.roseCustomState.count = current;

        const display = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.COUNT.id);
        if (display) display.textContent = current;

        this.updateRosePriceDisplay();
    }

    selectRoseType(type) {
        this.roseCustomState.type = type;
        ['ورد طبيعي', 'صناعي', 'ستان'].forEach(t => {
            const btn = UNIFIED_ENGINE.DOM.get(`rose-type-${t}`);
            if (!btn) return;
            if (t === type) {
                btn.className = "p-3.5 rounded-2xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-extrabold transition-all text-center";
            } else {
                btn.className = "p-3.5 rounded-2xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-extrabold transition-all text-center hover:border-brandPink/30";
            }
        });
    }

    updateRosePriceDisplay() {
        const computedPrice = COMMERCE_ENGINE.PRICING.rose({
            count: this.roseCustomState.count,
            photosCount: this.roseCustomState.photos,
            ribbonEnabled: this.roseCustomState.ribbon,
            cardEnabled: this.roseCustomState.card,
            chocBudget: this.roseCustomState.chocBudget,
            premiumBars: this.roseCustomState.premiumBars,
            cashAmount: this.roseCustomState.cash
        });

        const display = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.PRICE_DISPLAY.id);
        if (display) display.textContent = `${computedPrice} ج.م`;
    }

    adjustRosePhotos(amount) {
        let current = this.roseCustomState.photos;
        current += amount;
        if (current < 0) current = 0;
        if (current > 12) current = 12;
        this.roseCustomState.photos = current;

        const display = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.PHOTOS_COUNT.id);
        if (display) display.textContent = current;

        const container = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.PHOTO_UPLOADS_CONTAINER.id);
        if (container) {
            if (current > 0) {
                container.classList.remove('hidden');
                container.innerHTML = Array.from({ length: current }).map((_, i) => `
                    <div class="p-2 border border-brandPink/10 rounded-xl bg-brandPinkLight/30 text-center relative text-[10px] font-bold text-brandBlack/60">
                        رفع صورة ${i + 1}
                        <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer">
                    </div>
                `).join('');
            } else {
                container.classList.add('hidden');
            }
        }
        this.updateRosePriceDisplay();
    }

    toggleRoseRibbonInput() {
        const checkbox = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.RIBBON_CHECK.id);
        if (!checkbox) return;
        
        this.roseCustomState.ribbon = checkbox.checked;
        const area = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.RIBBON_INPUT_AREA.id);
        if (area) {
            if (checkbox.checked) area.classList.remove('hidden');
            else area.classList.add('hidden');
        }
        this.updateRosePriceDisplay();
    }

    calculateRoseChocolate() {
        const budget = Number(UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CHOC_BUDGET.id)?.value || 0);
        this.roseCustomState.chocBudget = budget;

        const output = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CHOC_OUTPUT.id);
        const calcText = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CHOC_CALC_TEXT.id);
        if (!output || !calcText) return;

        if (budget <= 0) {
            output.classList.add('hidden');
            this.updateRosePriceDisplay();
            return;
        }

        const piecePrice = this.roseCustomState.chocPiecePrice;
        const count = Math.floor(budget / piecePrice);

        calcText.textContent = `🍫 توزيع الشوكولاتة: سيتم تثبيت وإلصاق عدد ${count} قطعة شوكولاتة فاخرة وسط الزهور.`;
        output.classList.remove('hidden');
        this.updateRosePriceDisplay();
    }

    calculateRoseCash() {
        const amount = Number(UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CASH_AMOUNT.id)?.value || 0);
        this.roseCustomState.cash = amount;

        const output = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CASH_OUTPUT.id);
        const calcText = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CASH_CALC_TEXT.id);
        if (!output || !calcText) return;

        if (amount <= 0) {
            output.classList.add('hidden');
            this.updateRosePriceDisplay();
            return;
        }

        calcText.textContent = `💸 دمج الأموال: سيتم لف وتنسيق مبلغ ${amount} ج.م فئة ${this.roseCustomState.denomination} جنيه فنيًا داخل الباقة.`;
        output.classList.remove('hidden');
        this.updateRosePriceDisplay();
    }

    selectRoseDenomination(denom) {
        this.roseCustomState.denomination = denom;
        [5, 10, 20, 50, 100, 200].forEach(p => {
            const btn = UNIFIED_ENGINE.DOM.get(`rose-denom-${p}`);
            if (!btn) return;
            if (p === denom) {
                btn.className = "py-2 rounded-xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center";
            } else {
                btn.className = "py-2 rounded-xl border border-brandPink/10 bg-white text-brandBlack text-xs font-bold transition-all text-center hover:border-brandPink/20";
            }
        });
        this.calculateRoseCash();
    }

    selectRoseChocPiecePrice(price) {
        this.roseCustomState.chocPiecePrice = price;
        [20, 30, 50].forEach(p => {
            const btn = UNIFIED_ENGINE.DOM.get(`rose-choc-piece-${p}`);
            if (!btn) return;
            if (p === price) {
                btn.className = "py-2.5 rounded-xl border-2 border-brandPink bg-brandPink/5 text-brandPink text-xs font-bold transition-all text-center";
            } else {
                btn.className = "py-2.5 rounded-xl border border-brandPink/10 bg-white text-brandBlack/70 text-xs font-bold transition-all text-center hover:border-brandPink/20";
            }
        });
        this.calculateRoseChocolate();
    }

    adjustRosePremiumBar(price, amount) {
        let current = this.roseCustomState.premiumBars[price] || 0;
        current += amount;
        if (current < 0) current = 0;
        if (current > 10) current = 10;
        this.roseCustomState.premiumBars[price] = current;

        const display = UNIFIED_ENGINE.DOM.get(`rosePremiumBar${price}`);
        if (display) display.textContent = current;

        this.updateRosePriceDisplay();
    }

    toggleRoseCardInput() {
        const checkbox = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CARD_CHECK.id);
        if (!checkbox) return;
        
        this.roseCustomState.card = checkbox.checked;
        const area = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CARD_INPUT_AREA.id);
        if (area) {
            if (checkbox.checked) area.classList.remove('hidden');
            else area.classList.add('hidden');
        }
        this.updateRosePriceDisplay();
    }

    addRoseToCart() {
        const colorText = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.COLORS_INPUT.id)?.value || 'ميكس متناسق';
        const cardText = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.CARD_TEXT.id)?.value || '';
        const ribbonText = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.ROSE.RIBBON_TEXT.id)?.value || '';

        COMMERCE_ENGINE.ROSE.set({
            type: this.roseCustomState.type,
            count: this.roseCustomState.count,
            colors: colorText,
            cashAmount: this.roseCustomState.cash,
            cashDenomination: this.roseCustomState.denomination,
            photosCount: this.roseCustomState.photos,
            ribbonEnabled: this.roseCustomState.ribbon,
            ribbonText: ribbonText,
            chocBudget: this.roseCustomState.chocBudget,
            chocPiecePrice: this.roseCustomState.chocPiecePrice,
            premiumBar100: this.roseCustomState.premiumBars[100],
            premiumBar120: this.roseCustomState.premiumBars[120],
            cardEnabled: this.roseCustomState.card,
            cardText: cardText
        });

        COMMERCE_ENGINE.ROSE.addToCart();
        this.cart = COMMERCE_ENGINE.CART.getItems();
        SYSTEM_CORE.STATE.set(REGISTRY.STATE.CART.key, this.cart);
        this.updateCartBadge();
        this.navigateTo('cart');
    }

    async handleCheckoutSubmit(e) {
        e.preventDefault();
        
        const name = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.CUSTOMER_NAME.id)?.value || '';
        const phone = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.CUSTOMER_PHONE.id)?.value || '';
        const region = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SHIPPING_REGION.id)?.value || '';
        const address = UNIFIED_ENGINE.DOM.get(REGISTRY.DOM.CHECKOUT.SHIPPING_ADDRESS.id)?.value || '';

        if (this.cart.length === 0) {
            alert("سلة المشتريات خالية تماماً!");
            return;
        }

        COMMERCE_ENGINE.CHECKOUT.set({
            method: 'shipping',
            region: region
        });

        try {
            const orderPayload = {
                customerName: name,
                customerPhone: phone,
                shippingAddress: address
            };

            await COMMERCE_ENGINE.CHECKOUT.submit(orderPayload);
            
            let itemsDescription = this.cart.map((item, index) => {
                const spec = item.details?.identity || item.details || '';
                return `${index + 1}- ${item.name} [${spec}] -> السعر: ${item.price} ج.م`;
            }).join('\n');

            const calculations = COMMERCE_ENGINE.PRICING.calculateCartTotal();
            const whatsappText = encodeURIComponent(
                `*طلب جديد معتمد من منصة حلويات بوسي الإلكترونية 2026*\n\n` +
                `*بيانات العميل المعتمد:*\n` +
                `- الاسم بالكامل: ${name}\n` +
                `- رقم الهاتف: ${phone}\n` +
                `- قرية/منطقة التسليم: ${region}\n` +
                `- العنوان التفصيلي: ${address}\n\n` +
                `*المنتجات المحجوزة في الفاتورة:*\n${itemsDescription}\n\n` +
                `--------------------------------------\n` +
                `*قيمة المنتجات المعتمدة:* ${calculations.subtotal} ج.م\n` +
                `*تكلفة الشحن والتبريد للمنطقة:* ${calculations.shipping} ج.م\n` +
                `*إجمالي الفاتورة النهائي والمطابق:* ${calculations.total} ج.م\n\n` +
                `✨ _شكراً لاختياركم علامة حلويات بوسي - الإتقان الفني في صناعة الحلويات الطبيعية 100%_`
            );

            const cleanPhone = "201097238441";
            const apiURL = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${whatsappText}`;

            this.cart = [];
            SYSTEM_CORE.STATE.set(REGISTRY.STATE.CART.key, this.cart);
            this.updateCartBadge();
            this.navigateTo('home');
            
            if (typeof window !== 'undefined') window.open(apiURL, '_blank');
        } catch (err) {
            alert("حدث خطأ في الامتثال، يرجى مراجعة البيانات العنوانية للمنطقة.");
        }
    }

    handleRoseCleanup() {
        while (this.activeListeners.length > 0) {
            const unsubscribe = this.activeListeners.pop();
            if (typeof unsubscribe === 'function') unsubscribe();
        }
    }
}

// بناء وتشغيل المحرك الفوري
const manager = new BoseSweetsAppManager();
manager.init();

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (window.BoseSweetsEngine) window.BoseSweetsEngine.handleRoseCleanup();
    });
}
