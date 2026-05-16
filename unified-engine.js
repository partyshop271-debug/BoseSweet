/**
 * ============================================================================
 * 👑 BoseSweets Sovereign Unified Engine | المحرك السيادي الموحد (V33.0)
 * ============================================================================
 * الإدارة المرجعية: إدارة علامة حلويات بوسي (The Management)
 * الحالة: دمج شامل، توحيد مسارات الفايربيز، ودعم كامل للهوية البصرية الموحدة.
 * التحديث الأخير: الترقية الكاملة للإصدار 33 مع الاحتفاظ الشامل بكافة وظائف السحابة والمزامنة.
 * ============================================================================
 */

// ============================================================================
// 🔒 القسم الأول: التهيئة السحابية (V33.0)
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager, 
    doc, 
    setDoc, 
    deleteDoc,
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc, 
    onSnapshot,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 👑 الإعدادات السيادية والمفاتيح الخاصة بقاعدة بيانات حلويات بوسي
export const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-6S8EXY7Y4P" 
};

// 🛡️ التهيئة الآمنة والمطلقة للنظام السحابي (Modern V10 Architecture)
let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });
    
    auth = getAuth(app);
    
    // تثبيت المراجع في النطاق العام
    if (typeof window !== 'undefined') {
        window.firebaseApp = app;
        window.db = db;
        window.auth = auth;
        window.BoseSweets_Engine_Version = "V33.0";
    }
} catch (error) {
    console.error("🔒 قرار إداري أمني: فشل تهيئة السحابة، يرجى مراجعة الخوادم فوراً.", error);
}

export { app, db, auth };

// ============================================================================
// 🛡️ القسم الثاني: محركات المزامنة والطوارئ (ReverseSync & CloudQueue)
// ============================================================================

export const ReverseSyncEngine = {
    triggerOrderWebhook(orderData) {
        try {
            const webhookUrl = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureReverseSync';
            if (orderData && orderData.status === 'pending') {
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'BoseSweets_Engine_Sovereign_V33',
                        engine_status: 'Active_Sovereign',
                        type: 'new_order_fallback',
                        orderId: orderData.id,
                        customerName: orderData.customerName || orderData.name,
                        customerPhone: orderData.customerPhone || orderData.phone,
                        area: orderData.deliveryMode || orderData.area || 'غير محدد',
                        total: orderData.total,
                        timestamp: orderData.timestamp,
                        itemsCount: orderData.itemsArray ? orderData.itemsArray.length : 0
                    })
                }).catch(e => console.warn('تنويه هندسي: تأمين العملية عبر المسار البديل.'));
            }
        } catch (error) {
            console.warn("BoseSweets 👑: عائق في المزامنة العكسية وتم تجاوزه.");
        }
    },
    async broadcastGlobalUpdate() {
        try {
            if (db) {
                const syncDocRef = doc(db, 'system', 'syncFlag');
                await setDoc(syncDocRef, { lastAdminUpdate: Date.now(), version: 'V33.0', forceRefresh: true }, { merge: true });
            }
        } catch (error) {}
    }
};

export const CloudQueueDB = {
    dbName: 'BoseSweetsCloudQueue', storeName: 'Operations', version: 4,
    isSupported() { return typeof window !== 'undefined' && window.indexedDB != null; },
    getFallbackQueue() { try { return JSON.parse(localStorage.getItem('BoseSweets_Emergency_Queue') || '[]'); } catch (e) { return []; } },
    setFallbackQueue(queue) { try { localStorage.setItem('BoseSweets_Emergency_Queue', JSON.stringify(queue)); } catch (e) {} },
    init() {
        return new Promise((resolve) => {
            if (!this.isSupported()) return resolve(null);
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(this.storeName)) database.createObjectStore(this.storeName, { keyPath: 'queueId' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    },
    async enqueue(operation) {
        try {
            const database = await this.init();
            if (!database) {
                let fallbackQ = this.getFallbackQueue();
                fallbackQ.push({ ...operation, queueId: 'op_' + Date.now().toString(36), createdAt: Date.now() });
                this.setFallbackQueue(fallbackQ);
                return true;
            }
            const tx = database.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).put({ ...operation, queueId: 'op_' + Date.now().toString(36), createdAt: Date.now() });
            return true;
        } catch (e) { return false; }
    },
    async getAll() {
        try {
            let results = this.getFallbackQueue();
            const database = await this.init();
            if (!database) return results;
            return new Promise((resolve) => {
                const tx = database.transaction(this.storeName, 'readonly');
                const request = tx.objectStore(this.storeName).getAll();
                request.onsuccess = () => resolve([...results, ...(request.result || [])]);
                request.onerror = () => resolve(results); 
            });
        } catch (e) { return []; }
    },
    async remove(queueId) {
        try {
            let fallbackQ = this.getFallbackQueue();
            fallbackQ = fallbackQ.filter(op => op.queueId !== queueId);
            this.setFallbackQueue(fallbackQ);
            const database = await this.init();
            if (!database) return false;
            const tx = database.transaction(this.storeName, 'readwrite');
            tx.objectStore(this.storeName).delete(queueId);
            return true;
        } catch (e) { return false; }
    }
};

export const NetworkEngine = {
    async safeWrite(collectionName, docId, data) {
        try {
            if (collectionName === 'settings' && docId === 'main') {
                if (!auth || !auth.currentUser) throw new Error("🔒 توثيق الإدارة مطلوب.");
            }
            if (!db) throw new Error("Database not ready.");
            await setDoc(doc(db, collectionName, String(docId)), data, { merge: true });
            if (collectionName === 'orders') ReverseSyncEngine.triggerOrderWebhook(data);
            else if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) ReverseSyncEngine.broadcastGlobalUpdate();
            return true;
        } catch (error) {
            await CloudQueueDB.enqueue({ type: 'write', collectionName, docId, data });
            return true; 
        }
    },
    async safeDelete(collectionName, docId) {
        try {
            if (!db) throw new Error("Database not ready.");
            await deleteDoc(doc(db, collectionName, String(docId)));
            if (['settings', 'catalog', 'shipping', 'gallery'].includes(collectionName)) ReverseSyncEngine.broadcastGlobalUpdate();
            return true;
        } catch (error) {
            await CloudQueueDB.enqueue({ type: 'delete', collectionName, docId });
            return true;
        }
    },
    async processQueue() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        const queue = await CloudQueueDB.getAll();
        if (queue.length === 0 || !db) return;
        for (const op of queue) {
            try {
                if (op.type === 'write') await setDoc(doc(db, op.collectionName, String(op.docId)), op.data, { merge: true });
                else if (op.type === 'delete') await deleteDoc(doc(db, op.collectionName, String(op.docId)));
                await CloudQueueDB.remove(op.queueId);
            } catch (e) { break; }
        }
    }
};

if (typeof window !== 'undefined') {
    window.ReverseSyncEngine = ReverseSyncEngine;
    window.CloudQueueDB = CloudQueueDB;
    window.NetworkEngine = NetworkEngine;
    window.addEventListener('online', () => NetworkEngine.processQueue());
    setTimeout(() => NetworkEngine.processQueue(), 5000);
}

// ============================================================================
// 🧠 القسم الثالث: الذاكرة المركزية والعقل المدبر 
// ============================================================================

const BOSE_LOGO_FALLBACK = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1712586716/logo_bose_gold.jpg";
const CLOUDINARY_CLOUD_NAME = "dyx4w0dr1";

export const processBoseImage = (imgPath) => {
    if (!imgPath) return BOSE_LOGO_FALLBACK;
    if (imgPath.startsWith('http') || imgPath.startsWith('data:')) return imgPath;
    const cleanPath = imgPath.replace(/^\//, '');
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cleanPath}`;
};

const boseConfig = {
    firebase: firebaseConfig, db: db, auth: auth, network: NetworkEngine, sync: ReverseSyncEngine, queue: CloudQueueDB,
    cloudinary: { cloudName: CLOUDINARY_CLOUD_NAME, baseDeliveryUrl: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/` },
    branding: { colors: { pink: "#ff91a4", dark: "#1a1a1a", white: "#FFFFFF" }, typography: { titleWeight: "700", lineHeight: "1.7" } },
    location: { address: "الكفاح، شارع الوحدة المحلية، بجوار صيدلية د. أحمد مجدي وعيادة د. علي" },
    layoutRules: {
        twoCardsGrid: ['الديسباسيتو', 'القشطوطة', 'كبات السعادة', 'الدوناتس', 'السينابون'],
        oneCardFull: ['التورت', 'الجاتوهات', 'الورد', 'بوكس الروقان', 'الميني تورت', 'الكب كيك', 'الريدفيلفت']
    },
    pricingRules: { cake: { basePersons: 4, basePrice: 580, pricePerPerson: 145, incrementStep: 2 }, printing: { edible: 60, decoration: 20, none: 0 } }
};

export const BoseState = {
    siteSettings: {}, shippingZones: [], catalog: [], galleryData: [], catMenu: [], activeCat: 'الرئيسية', isAppReady: false,         
    cart: [], currentShippingFee: 0, appliedPromo: null,
    catalogMap: new Map(),
    securityLayer: {
        validateCartPrices: function(cartArray) {
            if (!Array.isArray(cartArray) || BoseState.catalogMap.size === 0) return cartArray;
            return cartArray.map(item => {
                const referenceItem = BoseState.catalogMap.get(String(item.id));
                if (referenceItem && item.price !== referenceItem.price) item.price = referenceItem.price;
                return item;
            });
        }
    },
    checkoutState: {
        deliveryMethod: 'الاستلام من المقر', deliveryDate: null, deliveryTime: null, customerName: '', primaryPhone: '', secondaryPhone: '', detailedAddress: '', nearestLandmark: '',
        setDeliveryMethod(method) { const mapping = { 'pickup': 'الاستلام من المقر', 'delivery': 'الشحن للمنزل' }; this.deliveryMethod = mapping[method] || method; }
    },
    cakeState: { flavor: 'فانيليا', shape: 'دائري', persons: 4, printingOption: 'بدون', notes: '', refImage: null, allergies: '', hasCard: false, cardText: '', occasionTheme: '', designStyle: 'تصميم محدد', currentCalculatedPrice: 580 },
    currentBuilderStep: 1
};

export function syncCatalogMap() {
    try {
        BoseState.catalogMap.clear();
        if (Array.isArray(BoseState.catalog)) {
            BoseState.catalog.forEach(p => { if (p && p.id) BoseState.catalogMap.set(String(p.id), p); });
        }
    } catch (error) {}
}

export function saveToLocalMemory(key, data) { try { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} }
export function getFromLocalMemory(key) { try { if (typeof window !== 'undefined') { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : null; } } catch (e) { return null; } }

export function setAppReady() {
    try {
        BoseState.isAppReady = true;
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { 
                loader.style.display = 'none'; 
                const mc = document.getElementById('main-content'); if(mc) mc.style.opacity = '1';
            }, 700);
        }
        window.dispatchEvent(new CustomEvent('BoseSweets_Engine_Ready', { detail: { timestamp: Date.now(), status: 'Sovereign_Ready' } }));
    } catch (e) {}
}

if (typeof window !== 'undefined') {
    window.boseConfig = boseConfig; window.BoseState = BoseState; window.syncCatalogMap = syncCatalogMap;
    window.saveToLocalMemory = saveToLocalMemory; window.getFromLocalMemory = getFromLocalMemory; window.setAppReady = setAppReady;
    window.processBoseImage = processBoseImage;
}

// ============================================================================
// 🛒 القسم الرابع: محرك السلة السيادي (Cart System)
// ============================================================================

export const cartSystem = {
    getAdjustedPrice: function(basePrice) { return Math.round(parseFloat(basePrice)); },
    getCart: function() {
        const localCart = localStorage.getItem('BoseSweets_Cart') || localStorage.getItem('bose_cart_items');
        if (localCart) { 
            const parsed = JSON.parse(localCart); 
            BoseState.cart = parsed; 
            return parsed; 
        }
        return BoseState.cart || [];
    },
    saveCartToStorage: function() { 
        saveToLocalMemory('BoseSweets_Cart', BoseState.cart);
        this.updateCartDisplay();
        if(typeof window !== 'undefined') window.dispatchEvent(new Event('BoseSweets_Cart_Updated'));
    },
    clearCartStorage: function() { 
        BoseState.cart = []; 
        this.saveCartToStorage(); 
        if(typeof this.syncCartUI === 'function') this.syncCartUI(); 
    },
    calculateCartTotal: function(deliveryMode = 'الاستلام من المقر') {
        this.getCart();
        if (BoseState.securityLayer?.validateCartPrices) BoseState.cart = BoseState.securityLayer.validateCartPrices(BoseState.cart);
        let subtotal = 0;
        
        BoseState.cart.forEach(item => {
            const product = BoseState.catalogMap.get(String(item.id)) || BoseState.catalog.find(p => String(p.id) === String(item.id));
            let finalPrice = this.getAdjustedPrice(product ? product.price : item.price);
            let qty = parseInt(item.quantity || item.qty) || 1;
            let addonsPrice = 0;
            if (item.isCustomCake || item.isCustom) {
                if (item.printing?.includes('أكل') || item.details?.printType === 'edible') addonsPrice = 60;
                else if (item.printing?.includes('غير قابلة') || item.details?.printType === 'non_edible') addonsPrice = 20;
            }
            subtotal += ((finalPrice + addonsPrice) * qty);
        });

        let shippingFee = 0;
        const isPickup = deliveryMode === 'pickup' || deliveryMode === 'الاستلام من المقر' || deliveryMode === 'استلام';
        if (!isPickup) {
            const zone = BoseState.shippingZones.find(z => z.id === deliveryMode || z.name === deliveryMode);
            shippingFee = zone ? parseFloat(zone.fee) : (deliveryMode.includes('الفرافرة') ? 25 : (deliveryMode.includes('الكفاح') ? 10 : 20));
        }
        
        return { subtotal, shippingFee, total: subtotal + shippingFee };
    },
    updateCartDisplay: function() {
        this.getCart();
        const totalItems = BoseState.cart.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);
        
        if (typeof document !== 'undefined') {
            const badges = document.querySelectorAll('#cart-count-badge, #mobile-cart-badge, .cart-badge-global');
            badges.forEach(el => {
                el.innerText = totalItems;
                if(totalItems > 0) {
                    el.classList.remove('hidden');
                    el.style.display = 'flex';
                } else {
                    el.classList.add('hidden');
                    el.style.display = 'none';
                }
            });
        }
    },
    syncCartUI: function() {
        const cartList = document.getElementById('cart-items-list');
        if (!cartList) return;
        if (BoseState.securityLayer?.validateCartPrices) BoseState.cart = BoseState.securityLayer.validateCartPrices(BoseState.cart);
        if (BoseState.cart.length === 0) {
            cartList.innerHTML = `<div class="empty-cart flex flex-col items-center justify-center p-12 text-center"><i data-lucide="shopping-bag" class="w-20 h-20 mb-4 opacity-20" style="color: ${boseConfig.branding.colors.pink};"></i><h3 class="text-xl font-black mb-2">سلة المشتريات فارغة</h3></div>`;
            ['summary-subtotal', 'summary-total'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = '0 ج.م'; });
            if (window.lucide) window.lucide.createIcons(); return;
        }
        let html = '';
        BoseState.cart.forEach((item, index) => {
            let finalPrice = this.getAdjustedPrice(item.price);
            let qty = parseInt(item.quantity || item.qty) || 1;
            if (item.isCustomCake || item.isCustom) {
                finalPrice += (item.printing?.includes('أكل') || item.details?.printType === 'edible') ? 60 : ((item.printing?.includes('غير قابلة') || item.details?.printType === 'non_edible') ? 20 : 0);
            }
            const imgUrl = processBoseImage(item.image);
            html += `<div class="cart-item bg-white p-4 rounded-2xl border mb-4 flex gap-4 items-center" style="border-color: ${boseConfig.branding.colors.pink}20;">
                        <img src="${imgUrl}" class="w-20 h-20 rounded-xl object-cover" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
                        <div class="flex-1 text-right"><h4 class="font-black text-sm">${item.name}</h4><div class="font-black mt-2" style="color: ${boseConfig.branding.colors.pink};">${finalPrice} ج.م</div></div>
                        <div class="flex flex-col items-center gap-2">
                            <button onclick="window.cartSystem.modQ(${index}, 1)" class="w-8 h-8 rounded-full border text-black bg-white">+</button>
                            <span class="font-black text-sm">${qty}</span>
                            <button onclick="window.cartSystem.modQ(${index}, -1)" class="w-8 h-8 rounded-full border text-black bg-white">-</button>
                        </div>
                    </div>`;
        });
        cartList.innerHTML = html;
        const totals = this.calculateCartTotal(document.getElementById('checkout-area')?.value || BoseState.checkoutState.deliveryMethod);
        if(document.getElementById('summary-subtotal')) document.getElementById('summary-subtotal').innerText = `${totals.subtotal} ج.م`;
        if(document.getElementById('summary-total')) document.getElementById('summary-total').innerText = `${totals.total} ج.م`;
    },
    modQ: function(index, delta) {
        this.getCart();
        if (BoseState.cart[index]) {
            let qty = BoseState.cart[index].quantity || BoseState.cart[index].qty || 1;
            qty += delta;
            if (qty <= 0) {
                BoseState.cart.splice(index, 1);
            } else {
                if (qty > 50) qty = 50;
                BoseState.cart[index].quantity = qty;
                BoseState.cart[index].qty = qty; 
            }
            this.saveCartToStorage(); 
            this.syncCartUI();
        }
    },
    addWithQtyContext: function(btn, productId) {
        const container = btn.closest('.royal-card') || btn.closest('.product-card') || btn.closest('.product-info-content') || btn.parentElement.parentElement;
        const qty = parseInt(container.querySelector('.temp-qty-display')?.innerText) || 1;
        const product = BoseState.catalogMap.get(String(productId));
        if (!product) return;
        const existing = BoseState.cart.find(i => String(i.id) === String(productId) && !i.isCustomCake && !i.isCustom);
        if (existing) {
            existing.quantity = (existing.quantity || existing.qty || 1) + qty;
            existing.qty = existing.quantity;
        } else {
            BoseState.cart.push({ id: product.id, name: product.name, price: product.price, image: product.img || product.image, quantity: qty, qty: qty, isCustomCake: false, isCustom: false });
        }
        this.saveCartToStorage();
        if(typeof window.showSystemToast === 'function') window.showSystemToast(`تمت إضافة [${product.name}] لطلب سيادتكم.`, 'success');
    }
};

if (typeof window !== 'undefined') {
    window.cartSystem = cartSystem;
    window.addEventListener('BoseSweets_Order_Secured', () => cartSystem.clearCartStorage());
    document.addEventListener('DOMContentLoaded', () => cartSystem.updateCartDisplay());
    window.addEventListener('BoseSweets_Cart_Updated', () => cartSystem.updateCartDisplay());
}

// ============================================================================
// 🔗 القسم الخامس: جسر البيانات السيادي (Data Bridge)
// ============================================================================

export const defaultSettingsFallback = {
    brandName: "حلويات بوسي", heroTitle: "أهلاً بسيادتكم في حلويات بوسي", heroDesc: "نخبة المختارات من أجود الخامات العالمية.",
    brandColorHex: "#ff91a4", catMenu: ["الرئيسية", "ديسباسيتو", "سينابون", "تورت", "ورد"]
};

export async function fetchSystemSettings() {
    try {
        const sSnap = await getDoc(doc(db, 'settings', 'main'));
        if (sSnap.exists()) { Object.assign(BoseState.siteSettings, sSnap.data()); saveToLocalMemory('bosesweets_settings', BoseState.siteSettings); }
    } catch (e) { Object.assign(BoseState.siteSettings, getFromLocalMemory('bosesweets_settings') || defaultSettingsFallback); }
}

export async function fetchShippingZones() {
    try {
        const shipSnap = await getDocs(collection(db, 'shipping'));
        if (!shipSnap.empty) { BoseState.shippingZones = shipSnap.docs.map(d => ({id: d.id, ...d.data()})); saveToLocalMemory('bosesweets_shipping', BoseState.shippingZones); }
    } catch (e) { BoseState.shippingZones = getFromLocalMemory('bosesweets_shipping') || []; }
}

export async function fetchProductsCatalog() {
    try {
        const q = query(collection(db, 'catalog'));
        const snapshot = await getDocs(q);
        
        const products = snapshot.docs.map(d => {
            const raw = d.data();
            return {
                id: d.id,
                name: raw.name || "صنف فاخر",
                price: parseFloat(raw.price) || 0,
                category: raw.category || "عام",
                img: raw.img || raw.image || "",
                description: raw.description || raw.desc || "",
                inStock: raw.inStock !== false,
                ...raw 
            };
        });

        BoseState.catalog = products; 
        syncCatalogMap(); 
        saveToLocalMemory('bosesweets_catalog', products);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('catalogDataReady', { detail: products }));
        return products;

    } catch (e) { 
        console.error("اعتماد الذاكرة المحلية بسبب انقطاع الاتصال:", e);
        BoseState.catalog = getFromLocalMemory('bosesweets_catalog') || []; 
        syncCatalogMap(); 
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('catalogDataReady', { detail: BoseState.catalog }));
        return BoseState.catalog; 
    }
}

export async function initializeDataBridge() {
    if (window.__BoseBridgeInitialized) return; window.__BoseBridgeInitialized = true;
    const emergencyTimeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 4000));
    const operations = Promise.all([fetchSystemSettings(), fetchShippingZones(), fetchProductsCatalog()]);
    await Promise.race([operations, emergencyTimeout]);
    const uniqueCats = [...new Set(BoseState.catalog.map(p => p.category))].filter(Boolean);
    BoseState.catMenu = BoseState.siteSettings.catMenu?.map(c => c.name || c) || uniqueCats;
    setAppReady(); window.dispatchEvent(new CustomEvent('catalogDataReady'));
}

export function listenToSovereignUpdates() {
    if (!db || window.__BoseListenersActive) return; window.__BoseListenersActive = true;
    onSnapshot(query(collection(db, 'catalog'), where('isActive', '==', true)), (snap) => {
        BoseState.catalog = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        syncCatalogMap(); saveToLocalMemory('bosesweets_catalog', BoseState.catalog);
        window.dispatchEvent(new Event('catalogDataReady'));
        if (window.distributeProductsToUI) window.distributeProductsToUI(BoseState.catalog);
    });
}

if (typeof window !== 'undefined') {
    window.initializeDataBridge = initializeDataBridge; window.listenToSovereignUpdates = listenToSovereignUpdates;
    const startBridge = () => { if (!window.location.pathname.includes('admin')) { initializeDataBridge(); listenToSovereignUpdates(); } };
    if (document.readyState === 'complete') {
        startBridge();
        fetchProductsCatalog();
    } else {
        document.addEventListener('DOMContentLoaded', () => { startBridge(); fetchProductsCatalog(); });
    }
}

// ============================================================================
// 🎨 القسم السادس: واجهة المستخدم والتحكم البصري (UI Logic)
// ============================================================================

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;
    
    if (sidebar.classList.contains('translate-x-full')) {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        document.body.style.overflow = 'hidden'; 
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300); 
        document.body.style.overflow = '';
    }
};

export const showInfo = function(type) {
    let title = "", content = "";
    if (type === 'about') {
        title = "عن علامة حلويات بوسي";
        content = `تأسست حلويات بوسي عام 2014 في مدينة الكفاح... نحن نلتزم بأعلى معايير المهنية والجودة العالمية.`;
    }
    const modalId = 'bose-info-modal'; let modal = document.getElementById(modalId);
    if (!modal) { modal = document.createElement('div'); modal.id = modalId; modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300'; document.body.appendChild(modal); }
    modal.innerHTML = `<div class="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden p-8 border-4" style="border-color: ${boseConfig.branding.colors.pink}20;">
        <h3 class="text-2xl font-black mb-6 text-center">${title}</h3>
        <p class="text-base font-bold text-right">${content}</p>
        <button onclick="document.getElementById('${modalId}').remove()" class="w-full mt-8 py-4 rounded-full font-black text-white" style="background: ${boseConfig.branding.colors.pink};">تم الاستيعاب</button>
    </div>`;
};

export function renderProductCardsUI(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = products.map(p => {
        const isOut = p.inStock === false;
        const img = processBoseImage(p.img || p.image);
        return `<div class="royal-card flex flex-col p-4 bg-white rounded-2xl shadow-sm">
            <img src="${img}" class="w-full aspect-square object-cover rounded-xl ${isOut ? 'grayscale' : ''}" onerror="this.src='${BOSE_LOGO_FALLBACK}';">
            <h4 class="mt-4 font-black">${p.name}</h4>
            <div class="mt-2 text-[#ff91a4] font-black">${p.price} ج.م</div>
            <div class="flex items-center gap-2 mt-4">
                <div class="flex items-center gap-2 bg-gray-50 rounded-full px-2">
                    <button onclick="window.updateTempQtyContext(this, -1)" class="w-6 h-6">-</button>
                    <span class="temp-qty-display">1</span>
                    <button onclick="window.updateTempQtyContext(this, 1)" class="w-6 h-6">+</button>
                </div>
                <button onclick="window.cartSystem.addWithQtyContext(this, '${p.id}')" class="flex-1 py-2 bg-[#ff91a4] text-white rounded-full text-xs font-black">إضافة لطلب سيادتكم 🛍️</button>
            </div>
        </div>`;
    }).join('');
}

export function distributeProductsToUI(products = BoseState.catalog) {
    ['new-arrivals-container', 'best-sellers-container', 'menuGrid'].forEach(id => {
        const el = document.getElementById(id); if (el) renderProductCardsUI(products.slice(0, 12), id);
    });
}

window.updateTempQtyContext = function(btn, delta) {
    const display = btn.parentElement.querySelector('.temp-qty-display');
    if (display) {
        let val = parseInt(display.innerText) + delta;
        if (val < 1) val = 1;
        if (val > 50) val = 50;
        display.innerText = val;
    }
};

if (typeof window !== 'undefined') {
    window.renderProductCards = renderProductCardsUI; window.distributeProductsToUI = distributeProductsToUI;
    window.showInfo = showInfo;
}

console.log("👑 BoseSweets Engine: تم ترقية المحرك الموحد إلى الإصدار السيادي (V33.0) بنجاح والمزامنة التامة مفعلة.");
