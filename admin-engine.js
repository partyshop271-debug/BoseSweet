```javascript
/**
 * @file admin-engine.js
 * @description المحرك البرمجي الموحد المغلق كلياً لإدارة ومراقبة كابينة حلويات بوسي (BoseMonitor)
 * @version 2.1.0
 * @compliance BoseSweets Unified Engine Specification
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. الإعدادات والتحقق السحابي الفريد لـ حلويات بوسي
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBLIrbV_mzttQYwFzs5OYfq7w7pc0UvvLc",
    authDomain: "bosy-sweets.firebaseapp.com",
    projectId: "bosy-sweets",
    storageBucket: "bosy-sweets.firebasestorage.app",
    messagingSenderId: "473615735083",
    appId: "1:473615735083:web:f09c6001c72640b2588d6e",
    measurementId: "G-46D1CS3WLB"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'bosy-sweets';

const cloudinaryConfig = { 
    cloudName: 'dyx4w0dr1', 
    uploadPreset: 'gct8i28h' 
};

// ==========================================
// 2. الذاكرة الحية لحفظ الحالة (Global State) ومصائد الاستماع
// ==========================================
window.globalConfig = {
    cakeBasePricePerPerson: 145,
    cakeBasePrice: 145,
    cakePrintEdiblePrice: 60,
    cakePrintEdible: 60,
    cakePrintNonEdiblePrice: 20,
    cakePrintNonEdible: 20,
    roseBasePrice: 400,
    roseMinCount: 15,
    rosePricePerAdditional: 35,
    rosePhotoPrice: 15,
    roseRibbonPrice: 50,
    roseCardPrice: 20,
    shippingRates: {
        'الفرافرة': 50, '13': 70, 'الجمعية': 50, 'الصنايع': 40, 'ابوبكر': 40,
        'ابوالهول': 30, 'الكفاح': 30, 'الامل': 50, '17': 70, 'ابوهريرة': 140
    },
    marqueeText: "✨ عقد من التميز والاتقان الفني في صناعة الحلويات الطبيعية 100% بمكونات فاخرة خالية تماماً من الإضافات الكيميائية",
    marqueeSpeed: 30,
    orderPrepTimeHours: 24,
    prepTime: 24,
    phone: "01097238441",
    bgVideoUrl: "",
    promoImageUrl: "",
    outOfStockItems: [],
    catalogItems: {}, 
    displayMode: 'grid2',
    homepageSections: [
        { id: 'sec-cakes', name: 'قسم تورت وكيك دسم 👑', active: true, items: ['tortes', 'mini-tortes', 'red-velvet', 'despacito'] },
        { id: 'sec-pastries', name: 'قسم مخبوزات وغربيات 🥐', active: true, items: ['cinnabon', 'donuts', 'bambolini'] },
        { id: 'sec-classics', name: 'قسم جاتوه وقشطوطة 🍰', active: true, items: ['gateaux', 'qashtoota'] },
        { id: 'sec-boxes', name: 'قسم بوكسات وكبات السعادة 🧁', active: true, items: ['box-rowaqan', 'happiness-cups', 'cupcakes'] },
        { id: 'sec-roses', name: 'قسم باقات وتنسيق الورد 💐', active: true, items: ['roses'] }
    ]
};

const staticCatalogItems = [
    { id: 'tortes', name: 'التورت الأساسية', category: 'cakes' },
    { id: 'mini-tortes', name: 'الميني تورتة', category: 'cakes' },
    { id: 'red-velvet', name: 'الريد فيلفت كيك', category: 'cakes' },
    { id: 'despacito', name: 'الديسباسيتو الفاخر', category: 'cakes' },
    { id: 'cinnabon', name: 'السينابون الدافئ', category: 'pastries' },
    { id: 'donuts', name: 'الدوناتس الملونة', category: 'pastries' },
    { id: 'bambolini', name: 'البامبوليني الإيطالي', category: 'pastries' },
    { id: 'gateaux', name: 'الجاتوه السويسري', category: 'classics' },
    { id: 'qashtoota', name: 'القشطوطة الغنية', category: 'classics' },
    { id: 'box-rowaqan', name: 'البوكس الروقان السريع', category: 'boxes' },
    { id: 'happiness-cups', name: 'كبات السعادة اللذيذة', category: 'boxes' },
    { id: 'cupcakes', name: 'الكب كيك المزين', category: 'boxes' },
    { id: 'roses', name: 'باقات وتنسيق الورد', category: 'roses' }
];

const catalogCategories = {
    'cakes': 'تورت وكيك دسم 🎂',
    'pastries': 'مخبوزات وغربيات 🥐',
    'classics': 'جاتوه وقشطوطة 🍰',
    'boxes': 'بوكسات وكبات السعادة 🧁',
    'roses': 'باقات وتنسيق الورد 💐'
};

// حاوية مركزية لتخزين دوال إلغاء الاستماع السحابي للحفاظ على الذاكرة الحية وقنوات الاتصال
const adminActiveListeners = [];

let allOrders = [];
let systemLogs = [];
let currentTab = 'dashboard';
let activeOrderFilter = 'all';
let activeProductionFilter = 'all'; 
let activeMenuCategoryTab = 'cakes';

let currentTargetInputId = null;
let currentTargetButtonId = null;
let currentTargetItemId = null;

// دالة تفريغ وإلغاء الاستماع لجميع القنوات السحابية المفتوحة مسبقاً لمنع تسريب الموارد
function clearActiveListeners() {
    while (adminActiveListeners.length > 0) {
        const unsubscribe = adminActiveListeners.pop();
        if (typeof unsubscribe === 'function') {
            try {
                unsubscribe();
            } catch (err) {
                console.error("فشل إلغاء تنشيط مستمع سحابي محدد:", err);
            }
        }
    }
}

// ==========================================
// 3. التحقق الأمني من الصلاحيات والتحضير للعمل
// ==========================================
onAuthStateChanged(auth, async (user) => {
    const guard = document.getElementById('loadingGuard');
    if (!user) {
        clearActiveListeners();
        window.location.href = 'login.html';
        return;
    }
    try {
        const globalRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global_config');
        await getDoc(globalRef);
        
        const displayEmail = document.getElementById('adminEmailDisplay');
        if (displayEmail) displayEmail.textContent = user.email;
        
        if (guard) {
            guard.classList.add('opacity-0');
            setTimeout(() => guard.classList.add('hidden'), 500);
        }
        
        if (window.lucide) window.lucide.createIcons();
        initAppLifecycle();
    } catch (err) {
        console.error("فشل التحقق الأمني الأساسي كابينة المراقبة:", err);
        await reportSystemError("خطأ حرج في الصلاحيات", err.message, "admin-monitor.html");
        clearActiveListeners();
        await signOut(auth);
        window.location.href = 'login.html';
    }
});

// ==========================================
// 4. نظام BoseMonitor لاستقبال وإرسال التقارير التشخيصية
// ==========================================
async function reportSystemError(type, message, source) {
    try {
        const logRef = doc(collection(db, 'system_logs'));
        await setDoc(logRef, {
            type: type,
            message: message,
            source: source,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("فشل إرسال تقرير العطل محلياً:", e);
    }
}

async function initAppLifecycle() {
    // التطهير الإلزامي لأي مستمع نشط سابقاً قبل إعادة التهيئة
    clearActiveListeners();

    await fetchConfigSettings();
    subscribeToOrders();
    subscribeToLogs();
    
    const speedSlider = document.getElementById('cfg-marqueeSpeed');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            updateSpeedLabel(e.target.value);
        });
    }
}

// ==========================================
// 5. جلب وتحديث محددات الإعدادات ومزامنة المنيو الحقيقي
// ==========================================
async function fetchConfigSettings() {
    try {
        const globalRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global_config');
        const globalSnap = await getDoc(globalRef);
        
        const shippingRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'shipping_rates');
        const shippingSnap = await getDoc(shippingRef);

        let fetchedGlobal = globalSnap.exists() ? globalSnap.data() : {};
        let fetchedShipping = shippingSnap.exists() ? shippingSnap.data() : {};

        window.globalConfig = { 
            ...window.globalConfig, 
            ...fetchedGlobal, 
            shippingRates: fetchedShipping.shippingRates || fetchedShipping.rates || window.globalConfig.shippingRates 
        };

        // المحاذاة الثنائية الصارمة للمسميات في المحرك الموحد لمنع حدوث فجوة في القراءة
        window.globalConfig.cakeBasePricePerPerson = fetchedGlobal.cakeBasePricePerPerson || fetchedGlobal.cakeBasePrice || 145;
        window.globalConfig.cakePrintEdiblePrice = fetchedGlobal.cakePrintEdiblePrice || fetchedGlobal.cakePrintEdible || 60;
        window.globalConfig.cakePrintNonEdiblePrice = fetchedGlobal.cakePrintNonEdiblePrice || fetchedGlobal.cakePrintNonEdible || 20;
        window.globalConfig.orderPrepTimeHours = fetchedGlobal.orderPrepTimeHours || fetchedGlobal.prepTime || 24;

        if (!window.globalConfig.catalogItems) window.globalConfig.catalogItems = {};
        if (!window.globalConfig.homepageSections) window.globalConfig.homepageSections = [];
        if (!window.globalConfig.displayMode) window.globalConfig.displayMode = 'grid2';

        staticCatalogItems.forEach(item => {
            if (!window.globalConfig.catalogItems[item.id]) {
                window.globalConfig.catalogItems[item.id] = {
                    price: item.id === 'roses' ? 400 : 150,
                    desc: `صنف حلويات فاخر طبيعي ومحضّر يدوياً بدقة تامة في مطبخ حلويات بوسي لضمان أعلى مستويات الفخامة والجودة.`,
                    image: ''
                };
            }
        });

        // مراقبة المنيو السحابي الحقيقي لعدم حدوث ثغرات في تفاوت الأسعار مع حفظ المستمع لتجنب تسريبه
        const menuCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'menu');
        const unsubscribeMenu = onSnapshot(menuCollectionRef, (snap) => {
            snap.forEach(doc => {
                const mData = doc.data();
                if (window.globalConfig.catalogItems[doc.id]) {
                    if (mData.desc) window.globalConfig.catalogItems[doc.id].desc = mData.desc;
                    if (mData.img) window.globalConfig.catalogItems[doc.id].image = mData.img;
                    if (mData.flavors && mData.flavors[0]) {
                        window.globalConfig.catalogItems[doc.id].price = mData.flavors[0].price;
                    } else if (mData.sizes && mData.sizes[0] && mData.sizes[0].flavors && mData.sizes[0].flavors[0]) {
                        window.globalConfig.catalogItems[doc.id].price = mData.sizes[0].flavors[0].price;
                    }
                }
            });
            renderMenuAvailabilityList();
        });
        adminActiveListeners.push(unsubscribeMenu);

        populateUIFromConfig();
        renderShippingRates();
        renderMenuCategoryTabs();
        renderLayoutSectionsManager();
        updateGlobalDisplayModeUI();
    } catch (err) {
        console.error("فشل قراءة محددات الإعدادات العامة لموقع حلويات بوسي:", err);
        await reportSystemError("فشل قراءة الإعدادات", err.message, "fetchConfigSettings");
    }
}

function populateUIFromConfig() {
    const elCakeBase = document.getElementById('cfg-cakeBasePrice');
    const elEdible = document.getElementById('cfg-cakePrintEdible');
    const elNonEdible = document.getElementById('cfg-cakePrintNonEdible');
    
    if (elCakeBase) elCakeBase.value = window.globalConfig.cakeBasePricePerPerson || 145;
    if (elEdible) elEdible.value = window.globalConfig.cakePrintEdiblePrice || 60;
    if (elNonEdible) elNonEdible.value = window.globalConfig.cakePrintNonEdiblePrice || 20;
    
    const elRoseBase = document.getElementById('cfg-roseBasePrice');
    const elRoseMin = document.getElementById('cfg-roseMinCount');
    const elRoseAdd = document.getElementById('cfg-rosePricePerAdditional');
    const elRosePhoto = document.getElementById('cfg-rosePhotoPrice');
    const elRoseRibbon = document.getElementById('cfg-roseRibbonPrice');
    const elRoseCard = document.getElementById('cfg-roseCardPrice');

    if (elRoseBase) elRoseBase.value = window.globalConfig.roseBasePrice || 400;
    if (elRoseMin) elRoseMin.value = window.globalConfig.roseMinCount || 15;
    if (elRoseAdd) elRoseAdd.value = window.globalConfig.rosePricePerAdditional || 35;
    if (elRosePhoto) elRosePhoto.value = window.globalConfig.rosePhotoPrice || 15;
    if (elRoseRibbon) elRoseRibbon.value = window.globalConfig.roseRibbonPrice || 50;
    if (elRoseCard) elRoseCard.value = window.globalConfig.roseCardPrice || 20;
    
    const elMarqueeText = document.getElementById('cfg-marqueeText');
    if (elMarqueeText) elMarqueeText.value = window.globalConfig.marqueeText || "";
    
    const speedVal = window.globalConfig.marqueeSpeed || 30;
    const elMarqueeSpeed = document.getElementById('cfg-marqueeSpeed');
    if (elMarqueeSpeed) elMarqueeSpeed.value = speedVal;
    updateSpeedLabel(speedVal);

    const elPhone = document.getElementById('cfg-phone');
    const elPrepTime = document.getElementById('cfg-prepTime');
    const elBgVideo = document.getElementById('cfg-bgVideoUrl');
    const elPromoImg = document.getElementById('cfg-promoImageUrl');

    if (elPhone) elPhone.value = window.globalConfig.phone || "01097238441";
    if (elPrepTime) elPrepTime.value = window.globalConfig.orderPrepTimeHours || 24;
    if (elBgVideo) elBgVideo.value = window.globalConfig.bgVideoUrl || "";
    if (elPromoImg) elPromoImg.value = window.globalConfig.promoImageUrl || "";
}

function updateSpeedLabel(val) {
    const label = document.getElementById('marqueeSpeedLabel');
    if (!label) return;
    if (val <= 20) { 
        label.textContent = 'سريع جداً (قد يشتت العين)';
    } else if (val <= 40) { 
        label.textContent = 'متوسط (تصفح طبيعي مريح)';
    } else { 
        label.textContent = 'بطيء جداً وهادئ ومريح للعين 👁️';
    }
}

// ==========================================
// 6. تتبع المزامنة الحية للطلبات والتدفقات المالية
// ==========================================
function subscribeToOrders() {
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
        allOrders = [];
        snapshot.forEach(doc => { allOrders.push({ id: doc.id, ...doc.data() }); });
        allOrders.sort((a, b) => {
            const dateA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
            const dateB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
            return dateB - dateA;
        });
        renderOrdersPipeline();
        updateDashboardCounters();
    }, (err) => {
        console.error("فشل الاتصال بخط إنتاج الطلبات السحابية الحية لـ حلويات بوسي:", err);
    });
    adminActiveListeners.push(unsubscribeOrders);
}

function subscribeToLogs() {
    const logsRef = collection(db, 'system_logs');
    const unsubscribeLogs = onSnapshot(logsRef, (snapshot) => {
        systemLogs = [];
        snapshot.forEach(doc => { systemLogs.push({ id: doc.id, ...doc.data() }); });
        systemLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderSystemLogsTable();
    }, (err) => {
        console.error("فشل جلب سجلات تشخيص نظام بوسي مونيتور لتتبع الأعطال:", err);
    });
    adminActiveListeners.push(unsubscribeLogs);
}

function updateDashboardCounters() {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.deliveryMethod && (!o.status || o.status === 'pending')).length;
    const active = allOrders.filter(o => o.status === 'processing' || o.status === 'shipping').length;
    const completed = allOrders.filter(o => o.status === 'completed').length;

    const elTotal = document.getElementById('stat-total-orders');
    const elPending = document.getElementById('stat-pending-orders');
    const elActive = document.getElementById('stat-active-orders');
    const elCompleted = document.getElementById('stat-completed-orders');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elActive) elActive.textContent = active;
    if (elCompleted) elCompleted.textContent = completed;

    const bPending = document.getElementById('badge-count-pending');
    const bProcessing = document.getElementById('badge-count-processing');
    const bShipping = document.getElementById('badge-count-shipping');

    if (bPending) bPending.textContent = pending;
    if (bProcessing) bProcessing.textContent = allOrders.filter(o => o.status === 'processing').length;
    if (bShipping) bShipping.textContent = allOrders.filter(o => o.status === 'shipping').length;

    const completedOrdersList = allOrders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrdersList.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalShipping = completedOrdersList.reduce((sum, o) => sum + (o.shippingFee || 0), 0);
    const netRevenue = totalRevenue - totalShipping;

    const elRevTotal = document.getElementById('stat-revenue-total');
    const elRevShip = document.getElementById('stat-revenue-shipping');
    const elRevNet = document.getElementById('stat-revenue-net');

    if (elRevTotal) elRevTotal.textContent = `${totalRevenue} ج.م`;
    if (elRevShip) elRevShip.textContent = `${totalShipping} ج.م`;
    if (elRevNet) elRevNet.textContent = `${netRevenue} ج.م`;
}

// ==========================================
// 7. صياغة وعرض شلال وحركة معالجة الطلبات بالتفصيل
// ==========================================
function getOrderSummary(order) {
    if (!order.items || order.items.length === 0) return 'طلب مجهول الهوية';
    const count = order.items.length;
    const primaryItem = order.items[0];
    let summary = ``;

    if (primaryItem.isCustom) {
        if (primaryItem.id === 'roses' || primaryItem.name.includes('ورد')) {
            summary = `باقة تنسيق ورد فاخرة`;
            if (primaryItem.details && primaryItem.details['عدد الورد الإجمالي']) {
                summary += ` (${primaryItem.details['عدد الورد الإجمالي']} وردة)`;
            }
        } else {
            summary = `تورتة وبناء كيك مخصص`;
            if (primaryItem.details && primaryItem.details['حجم الكيك والمدعوين']) {
                summary += ` (${primaryItem.details['حجم الكيك والمدعوين']})`;
            }
        }
    } else {
        summary = `${primaryItem.name}`;
        if (primaryItem.qty > 1) summary += ` (عدد ${primaryItem.qty})`;
    }
    if (count > 1) summary += ` + ${count - 1} منتجات أخرى`;
    summary += order.deliveryMethod === 'ship' ? ` - شحن لقرية ${order.shippingRegion || 'الفرافرة'}` : ` - استلام فرعي بالمطبخ`;
    return summary;
}

function renderOrdersPipeline() {
    const container = document.getElementById('ordersCardsContainer');
    if (!container) return;
    
    let filtered = [...allOrders];

    if (activeOrderFilter !== 'all') {
        if (activeOrderFilter === 'pending') {
            filtered = filtered.filter(o => !o.status || o.status === 'pending');
        } else {
            filtered = filtered.filter(o => o.status === activeOrderFilter);
        }
    }

    if (activeProductionFilter !== 'all') {
        filtered = filtered.filter(order => {
            const hasCakes = order.items.some(item => item.isCustom && item.id !== 'roses');
            const hasRoses = order.items.some(item => item.id === 'roses');
            if (activeProductionFilter === 'cakes') return hasCakes;
            if (activeProductionFilter === 'roses') return hasRoses;
            if (activeProductionFilter === 'classic') return !hasCakes && !hasRoses;
            return true;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 text-center space-y-4 rounded-3xl bg-brandSurface border border-brandBorder shadow-sm">
                <div class="w-14 h-14 rounded-full bg-brandPinkLight text-brandPink flex items-center justify-center mx-auto">
                    <i data-lucide="inbox" class="w-6 h-6"></i>
                </div>
                <p class="text-xs font-bold text-brandTextMuted">لا يوجد شحنات أو معاملات مسجلة في هذا التصنيف حالياً.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    container.innerHTML = filtered.map((order, idx) => {
        const status = order.status || 'pending';
        const createdDate = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString('ar-EG') : 'توقيت غير مسجل';
        let urgencyClass = "p-6 rounded-3xl bg-brandSurface border border-brandBorder flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-sm";
        let urgencyBadge = "";
        
        if (status === 'pending' || status === 'processing') {
            if (order.deliveryDate) {
                const targetTime = new Date(`${order.deliveryDate}T${order.deliveryTime || '00:00'}`);
                const now = new Date();
                const hoursDiff = (targetTime - now) / (1000 * 60 * 60);
                if (hoursDiff <= 24 && hoursDiff > 0) {
                    urgencyClass += " urgent-order-card border-brandPink";
                    urgencyBadge = `
                        <span class="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-brandPinkLight text-brandPink animate-pulse border border-brandPink/20">
                            <i data-lucide="alert-triangle" class="w-3 h-3"></i> تسليم عاجل
                        </span>
                    `;
                }
            }
        }

        let statusBadge = '';
        if (status === 'pending') statusBadge = '<span class="px-3 py-1 rounded-full text-[10px] font-black border border-amber-900/40 text-amber-400 bg-amber-950/30">وارد جديداً 🆕</span>';
        else if (status === 'processing') statusBadge = '<span class="px-3 py-1 rounded-full text-[10px] font-black border border-indigo-900/40 text-indigo-400 bg-indigo-950/30">قيد التحضير 👩‍🍳</span>';
        else if (status === 'shipping') statusBadge = '<span class="px-3 py-1 rounded-full text-[10px] font-black border border-sky-900/40 text-sky-400 bg-sky-950/30">مع المندوب 🚚</span>';
        else if (status === 'completed') statusBadge = '<span class="px-3 py-1 rounded-full text-[10px] font-black border border-emerald-900/40 text-emerald-400 bg-emerald-950/30">مكتمل ✅</span>';
        else if (status === 'cancelled') statusBadge = '<span class="px-3 py-1 rounded-full text-[10px] font-black border border-red-900/40 text-red-400 bg-red-950/30">ملغى ❌</span>';

        let controlButtons = '';
        if (status === 'pending') {
            controlButtons = `
                <button data-id="${order.id}" data-target="processing" class="btn-change-status flex-grow py-3.5 bg-brandPink hover:bg-brandPinkDark text-brandBg text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <i data-lucide="play" class="w-4 h-4"></i> تأكيد وبدء المطبخ
                </button>
            `;
        } else if (status === 'processing') {
            controlButtons = `
                <button data-id="${order.id}" data-target="shipping" class="btn-change-status flex-grow py-3.5 bg-brandPink hover:bg-brandPinkDark text-brandBg text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <i data-lucide="truck" class="w-4 h-4"></i> تسليم للمندوب
                </button>
            `;
        } else if (status === 'shipping') {
            controlButtons = `
                <button data-id="${order.id}" data-target="completed" class="btn-change-status flex-grow py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <i data-lucide="check-circle-2" class="w-4 h-4"></i> إتمام التسليم النهائي
                </button>
            `;
        }

        return `
            <div class="${urgencyClass}">
                ${urgencyBadge}
                <div class="space-y-4">
                    <div class="flex items-start justify-between border-b border-brandBorder pb-4">
                        <div>
                            <h3 class="text-base font-black text-brandTextMain">${order.customerName}</h3>
                            <p class="text-[11px] text-brandTextMuted mt-1" dir="ltr">${order.customerPhone}</p>
                            <span class="text-[10px] text-brandTextMuted/70 block mt-1">تاريخ الحجز: ${createdDate}</span>
                        </div>
                        <div class="flex flex-col items-end gap-1.5">
                            ${statusBadge}
                            <span class="text-[10px] text-brandPink font-bold">${order.deliveryMethod === 'pickup' ? 'استلام فرعي 🏬' : 'توصيل شحنة 📍'}</span>
                        </div>
                    </div>

                    <div class="p-3.5 rounded-xl bg-brandPinkLight/60 border border-brandPink/10 text-xs font-black text-brandPink leading-relaxed">
                        <span class="text-[9px] text-brandTextMuted/50 font-bold block mb-1">ملخص الشحنة السريع:</span>
                        🚀 ${getOrderSummary(order)}
                    </div>

                    <div class="space-y-2">
                        <span class="text-[10px] text-brandTextMuted font-black tracking-wider block">الأصناف المطلوبة بالتفصيل:</span>
                        <div class="space-y-2.5">
                            ${order.items.map((item, itemIdx) => {
                                let customToggleBtn = '';
                                if (item.isCustom && item.details) {
                                    customToggleBtn = `
                                        <button data-panel="${order.id}-${itemIdx}" class="btn-toggle-details text-[10px] text-brandPink font-black flex items-center gap-1 mt-1 outline-none">
                                            <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform" id="detailsChevron-${order.id}-${itemIdx}"></i> استعراض تفاصيل التصميم وبناء المطبخ
                                        </button>
                                        <div id="detailsPanel-${order.id}-${itemIdx}" class="hidden mt-2 p-4 rounded-xl bg-brandBg border border-brandBorder text-[11px] font-semibold text-brandTextMain space-y-3">
                                            ${Object.entries(item.details).map(([key, val]) => {
                                                const isUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
                                                const isImage = isUrl && (val.match(/\.(jpeg|jpg|gif|png|webp)/i) || val.includes('cloudinary.com'));
                                                if (isImage) {
                                                    return `
                                                        <div class="flex flex-col gap-1 border-b border-brandBorder/40 pb-1.5">
                                                            <span class="text-brandTextMuted">${key}:</span>
                                                            <a href="${val}" target="_blank" class="mt-1 block max-w-xs rounded-xl overflow-hidden border border-brandBorder bg-brandSurface hover:opacity-80 transition-all">
                                                                <img src="${val}" alt="${key}" class="w-full h-auto max-h-40 object-cover">
                                                            </a>
                                                        </div>
                                                    `;
                                                } else if (isUrl) {
                                                    return `
                                                        <div class="flex justify-between border-b border-brandBorder/40 pb-1.5 items-center">
                                                            <span class="text-brandTextMuted">${key}:</span>
                                                            <a href="${val}" target="_blank" class="text-brandPink hover:underline font-bold truncate max-w-[200px]" dir="ltr">${val}</a>
                                                        </div>
                                                    `;
                                                } else {
                                                    return `
                                                        <div class="flex justify-between border-b border-brandBorder/40 pb-1.5">
                                                            <span class="text-brandTextMuted">${key}:</span>
                                                            <span class="text-brandTextMain font-bold text-left">${val}</span>
                                                        </div>
                                                    `;
                                                }
                                            }).join('')}
                                        </div>
                                    `;
                                }
                                return `
                                    <div class="p-4 rounded-2xl bg-brandSurfaceChild border border-brandBorder flex flex-col justify-between">
                                        <div class="flex justify-between items-center text-xs font-black">
                                            <span class="text-brandTextMain text-sm">${item.name}</span>
                                            <span class="text-brandPink bg-brandBg px-2 py-1 rounded-md border border-brandBorder text-[11px]">الكمية: ${item.qty}</span>
                                        </div>
                                        ${customToggleBtn}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="p-4 bg-brandSurfaceChild border border-brandBorder rounded-2xl text-xs font-bold text-brandTextMain space-y-1.5">
                        <p class="flex items-center gap-2"><i data-lucide="calendar" class="w-4 h-4 text-brandPink"></i> موعد التسليم المطلوب: ${order.deliveryDate || 'غير محدد'}</p>
                        <p class="flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4 text-brandPink"></i> ساعة التسليم: ${order.deliveryTime || 'غير محدد'}</p>
                        ${order.deliveryMethod === 'ship' ? `<p class="flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-brandPink"></i> العنوان: قرية ${order.shippingRegion} - ${order.shippingAddress}</p>` : ''}
                    </div>

                    <div class="flex justify-between items-center bg-brandPinkLight p-4 rounded-2xl border border-brandPink/15 text-xs font-black">
                        <span class="text-brandTextMuted">إجمالي الحساب النهائي:</span>
                        <span class="text-base text-brandPink font-black">${order.grandTotal} ج.م</span>
                    </div>
                </div>

                <div class="pt-6 border-t border-brandBorder mt-6 flex gap-3.5">
                    <a href="https://wa.me/20${order.customerPhone}?text=${generateWhatsAppStatusMessage(order)}" target="_blank" class="p-3 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 rounded-xl transition-all flex items-center justify-center">
                        <i data-lucide="message-square" class="w-5 h-5"></i>
                    </a>
                    ${controlButtons}
                    ${status !== 'completed' && status !== 'cancelled' ? `
                        <button data-id="${order.id}" class="btn-cancel-order px-4 py-3 bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 text-red-400 rounded-xl text-xs font-extrabold transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    attachOrdersViewEventListeners();
}

function generateWhatsAppStatusMessage(order) {
    const status = order.status || 'pending';
    let txt = '';
    if (status === 'pending') {
        txt = `نود إخطارك بأنه تم استقبال طلبك بنجاح وجاري البدء في تحضيره بمكونات طبيعية 100% في مطبخ حلويات بوسي لضمان أعلى مستويات الفخامة والجودة العالية ليكون جاهزاً في الميعاد المحدد تماماً.`;
    } else if (status === 'processing') {
        txt = `نود إبلاغك بأن طلبك المعتمد يمر الآن بمراحل التحضير الأخيرة في مطبخ حلويات بوسي لضمان أعلى مستويات الفخامة والجودة العالية التي تستحقها.`;
    } else if (status === 'shipping') {
        txt = `يسعدنا إخطارك بأن طلبك المميز قد غادر مطبخ حلويات بوسي الآن مع المندوب وهو في طريقه للتسليم قريباً جداً بالصحة والعافية.`;
    } else {
        txt = `نسعد دائماً بخدمتك ونتمنى أن ينال منتجنا الفاخر رضاك وصنع لك ذكريات لا تُنسى.`;
    }
    return encodeURIComponent(txt);
}

function attachOrdersViewEventListeners() {
    document.querySelectorAll('.btn-toggle-details').forEach(btn => {
        btn.onclick = () => {
            const panelId = btn.getAttribute('data-panel');
            const panel = document.getElementById(`detailsPanel-${panelId}`);
            const chevron = document.getElementById(`detailsChevron-${panelId}`);
            if (panel && panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                if (chevron) chevron.classList.add('rotate-180');
            } else if (panel) {
                panel.classList.add('hidden');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        };
    });

    document.querySelectorAll('.btn-change-status').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            const target = btn.getAttribute('data-target');
            await updateOrderStatus(id, target);
        };
    });

    document.querySelectorAll('.btn-cancel-order').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            cancelAndRefundOrder(id);
        };
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const orderDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
        await updateDoc(orderDocRef, { status: newStatus });
        showToastNotification('عملية ناجحة', `تم ترحيل وتحديث حالة الطلب بنجاح سحابياً.`, 'check');
    } catch (err) {
        console.error("فشل ترحيل حالة الطلب السحابي لـ حلويات بوسي:", err);
        showToastNotification('خطأ بالشبكة', 'فشل تحديث حالة الطلب على السحابة.', 'alert-triangle');
    }
}

function cancelAndRefundOrder(orderId) {
    showGlobalDialogModal(
        'تأكيد إلغاء المعاملة', 
        'هل أنتِ متأكدة من إلغاء هذا الطلب بالكامل وترحيله لقسم الملغاة؟ لا يمكن التراجع عن هذا الإجراء.',
        [
            { text: 'نعم، إلغاء الطلب', primary: true, action: async () => {
                window.closeGlobalDialogModal();
                await updateOrderStatus(orderId, 'cancelled');
            }},
            { text: 'تراجع', primary: false, action: () => window.closeGlobalDialogModal() }
        ]
    );
}

// ==========================================
// 8. تهيئة أقسام وتوفر السلع بالمنيو الكلاسيكي
// ==========================================
function renderMenuCategoryTabs() {
    const container = document.getElementById('menuTabsContainer');
    if (!container) return;
    
    container.innerHTML = Object.entries(catalogCategories).map(([key, name]) => {
        const isActive = activeMenuCategoryTab === key;
        return `
            <button data-cat="${key}" class="btn-menu-cat-tab px-5 py-2.5 rounded-full text-xs font-black transition-all ${isActive ? 'bg-brandPink text-brandBg' : 'bg-brandBg hover:bg-brandPinkLight text-brandTextMuted border border-brandBorder'}">
                ${name}
            </button>
        `;
    }).join('');

    document.querySelectorAll('.btn-menu-cat-tab').forEach(btn => {
        btn.onclick = () => {
            activeMenuCategoryTab = btn.getAttribute('data-cat');
            renderMenuCategoryTabs();
            renderMenuAvailabilityList();
        };
    });
}

function renderMenuAvailabilityList() {
    const container = document.getElementById('outOfStockContainer');
    if (!container) return;
    
    const filteredItems = staticCatalogItems.filter(item => item.category === activeMenuCategoryTab);
    
    if (filteredItems.length === 0) {
        container.innerHTML = `<p class="text-xs text-brandTextMuted font-bold py-6 text-center">لا توجد أصناف تابعة لهذا القسم.</p>`;
        return;
    }

    container.innerHTML = filteredItems.map(item => {
        const isOutOfStock = window.globalConfig.outOfStockItems.includes(item.id);
        const itemDetails = window.globalConfig.catalogItems?.[item.id] || { price: 150, desc: '', image: '' };
        const currentPrice = itemDetails.price;
        const currentDesc = itemDetails.desc || '';
        const currentImg = itemDetails.image || '';

        return `
            <div class="p-6 rounded-3xl bg-brandSurface border border-brandBorder space-y-4 pink-clean-shadow relative transition-all">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-brandBorder">
                    <div>
                        <span class="text-sm font-black text-brandTextMain">${item.name}</span>
                        <p class="text-[10px] text-brandTextMuted font-bold mt-1">الرمز السحابي المعرف: ${item.id}</p>
                    </div>
                    <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <span class="text-[11px] font-black ${isOutOfStock ? 'text-red-400 bg-red-950/40 border border-red-900/50 px-3 py-1 rounded-full' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1 rounded-full'}">
                            ${isOutOfStock ? 'نفد مؤقتاً 🛑' : 'متوفر بالمطبخ ✅'}
                        </span>
                        <button data-id="${item.id}" class="btn-toggle-stock px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isOutOfStock ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/60 text-red-400 border border-red-900/50'}">
                            ${isOutOfStock ? 'إتاحة المنتج' : 'تجميد مؤقت'}
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                    <div class="md:col-span-8 space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="space-y-1.5">
                                <label class="block text-[10px] text-brandTextMuted font-bold">السعر الافتراضي (ج.م):</label>
                                <input type="number" id="menuPrice-${item.id}" data-id="${item.id}" class="input-menu-price w-full bg-brandBg border border-brandBorder rounded-xl py-2.5 px-4 text-brandTextMain text-xs outline-none bose-input-glow transition-all font-black" value="${currentPrice}">
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-[10px] text-brandTextMuted font-bold">رابط صورة الصنف بالموقع:</label>
                                <div class="flex gap-1.5">
                                    <input type="text" id="menuImg-${item.id}" class="input-menu-img flex-grow bg-brandBg border border-brandBorder rounded-xl py-2.5 px-4 text-brandTextMain text-[10px] outline-none bose-input-glow transition-all" value="${currentImg}" data-id="${item.id}">
                                    <button data-input="menuImg-${item.id}" data-btn="menuBtn-${item.id}" data-item="${item.id}" id="menuBtn-${item.id}" class="btn-trigger-upload px-3 bg-brandPink text-brandBg hover:bg-brandPinkDark text-[10px] font-black rounded-xl transition-all shadow-sm">رفع</button>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-[10px] text-brandTextMuted font-bold">الوصف والتفاصيل الحسية (مكونات طبيعية 100%):</label>
                            <textarea id="menuDesc-${item.id}" data-id="${item.id}" rows="2" class="textarea-menu-desc w-full bg-brandBg border border-brandBorder rounded-xl p-3 text-brandTextMain text-xs outline-none bose-input-glow transition-all leading-relaxed" placeholder="أدخل تفاصيل مكونات الصنف...">${currentDesc}</textarea>
                        </div>
                    </div>
                    <div class="md:col-span-4 flex flex-col justify-center items-center p-3 rounded-2xl border border-brandBorder bg-brandSurface">
                        <span class="text-[9px] text-brandTextMuted font-bold mb-2">معاينة نهارية طبيعية للمنتج</span>
                        <div class="w-full h-28 rounded-xl bg-brandBg border border-brandBorder overflow-hidden flex items-center justify-center">
                            ${currentImg ? `<img src="${currentImg}" alt="${item.name}" class="w-full h-full object-cover">` : `<div class="text-center p-3 text-brandTextMuted/40 text-[10px]"><i data-lucide="image" class="w-5 h-5 mx-auto mb-1"></i> لا يوجد صورة مسجلة</div>`}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    if (window.lucide) window.lucide.createIcons();
    attachMenuAvailabilityEventListeners();
}

function attachMenuAvailabilityEventListeners() {
    document.querySelectorAll('.btn-toggle-stock').forEach(btn => {
        btn.onclick = () => {
            const itemId = btn.getAttribute('data-id');
            let list = [...window.globalConfig.outOfStockItems];
            if (list.includes(itemId)) list = list.filter(id => id !== itemId);
            else list.push(itemId);
            window.globalConfig.outOfStockItems = list;
            renderMenuAvailabilityList();
        };
    });

    document.querySelectorAll('.input-menu-price').forEach(input => {
        input.onchange = () => { updateLocalCatalogItem(input.getAttribute('data-id'), 'price', input.value); };
    });

    document.querySelectorAll('.input-menu-img').forEach(input => {
        input.onchange = () => { 
            updateLocalCatalogItem(input.getAttribute('data-id'), 'image', input.value); 
            renderMenuAvailabilityList();
        };
    });

    document.querySelectorAll('.textarea-menu-desc').forEach(textarea => {
        textarea.onchange = () => { updateLocalCatalogItem(textarea.getAttribute('data-id'), 'desc', textarea.value); };
    });

    document.querySelectorAll('.btn-trigger-upload').forEach(btn => {
        btn.onclick = () => {
            triggerCloudinaryUpload(
                btn.getAttribute('data-input'),
                btn.getAttribute('data-btn'),
                btn.getAttribute('data-item')
            );
        };
    });
}

function updateLocalCatalogItem(itemId, field, val) {
    if (!window.globalConfig.catalogItems[itemId]) {
        window.globalConfig.catalogItems[itemId] = { price: 150, desc: '', image: '' };
    }
    if (field === 'price') window.globalConfig.catalogItems[itemId].price = parseFloat(val) || 0;
    else window.globalConfig.catalogItems[itemId][field] = val;
}

// ==========================================
// 9. هندسة وترتيب أقسام واجهة العرض للعملاء
// ==========================================
function renderLayoutSectionsManager() {
    const container = document.getElementById('layoutSectionsContainer');
    if (!container) return;
    
    if (!window.globalConfig.homepageSections || window.globalConfig.homepageSections.length === 0) {
        container.innerHTML = `<p class="text-xs text-brandTextMuted font-bold text-center py-4">لم يتم تعيين أي أقسام هيكلية بعد.</p>`;
        return;
    }

    container.innerHTML = window.globalConfig.homepageSections.map((section, idx) => {
        return `
            <div class="p-5 rounded-2xl bg-brandSurfaceChild border border-brandBorder flex flex-col gap-4 relative transition-all">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-brandBg border border-brandBorder rounded-lg text-brandTextMuted">
                            <i data-lucide="grip-vertical" class="w-4 h-4 cursor-move"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-black text-brandTextMain">${section.name}</h4>
                            <span class="text-[9px] text-brandTextMuted tracking-tight block mt-0.5" dir="ltr">المعرف البرمجي: ${section.id}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-idx="${idx}" class="btn-toggle-layout-status px-3 py-1.5 rounded-lg text-[10px] font-black border ${section.active ? 'border-emerald-900/40 text-emerald-400 bg-emerald-950/20' : 'border-red-900/40 text-red-400 bg-red-950/20'}">
                            ${section.active ? 'نشط بالواجهة' : 'مخفي مؤقتاً'}
                        </button>
                        <button data-idx="${idx}" class="btn-duplicate-layout p-2 bg-brandBg hover:bg-brandBorder rounded-lg text-brandPink border border-brandBorder" title="نسخ هذا القسم">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                        <div class="flex flex-col gap-1">
                            <button data-idx="${idx}" data-dir="-1" class="btn-move-layout p-1 bg-brandBg hover:bg-brandBorder rounded border border-brandBorder text-brandTextMain ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}">
                                <i data-lucide="chevron-up" class="w-3 h-3"></i>
                            </button>
                            <button data-idx="${idx}" data-dir="1" class="btn-move-layout p-1 bg-brandBg hover:bg-brandBorder rounded border border-brandBorder text-brandTextMain ${idx === window.globalConfig.homepageSections.length - 1 ? 'opacity-30 pointer-events-none' : ''}">
                                <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="pt-3 border-t border-brandBorder/40">
                    <span class="text-[10px] text-brandTextMuted font-bold block mb-2">المنتجات المرتبطة والمحقونة داخل هذا القسم:</span>
                    <div class="flex flex-wrap gap-1.5" id="sectionItemsContainer-${idx}">
                        ${section.items && section.items.length > 0 ? section.items.map(itemId => {
                            const staticMatch = staticCatalogItems.find(si => si.id === itemId);
                            const itemName = staticMatch ? staticMatch.name : itemId;
                            return `
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brandBg border border-brandBorder text-[10px] text-brandTextMain font-semibold">
                                    ${itemName}
                                    <button data-sec="${idx}" data-item="${itemId}" class="btn-remove-item-from-sec text-brandPink hover:text-red-400 font-bold ml-1">×</button>
                                </span>
                            `;
                        }).join('') : `<span class="text-[9px] text-brandTextMuted/50 font-bold">لا يوجد منتجات محقونة حالياً</span>`}
                        <button data-idx="${idx}" class="btn-add-product-to-sec px-2 py-1 rounded-md bg-brandPink/10 hover:bg-brandPink/20 text-brandPink border border-brandPink/20 text-[9px] font-black flex items-center gap-0.5">
                            + ربط منتج
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    if (window.lucide) window.lucide.createIcons();
    attachLayoutSectionEventListeners();
}

function attachLayoutSectionEventListeners() {
    document.querySelectorAll('.btn-toggle-layout-status').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            toggleLayoutSectionStatus(idx);
        };
    });
    document.querySelectorAll('.btn-move-layout').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            const direction = parseInt(btn.getAttribute('data-dir'));
            moveSectionOrder(idx, direction);
        };
    });
    document.querySelectorAll('.btn-duplicate-layout').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            duplicateLayoutSection(idx);
        };
    });
    document.querySelectorAll('.btn-remove-item-from-sec').forEach(btn => {
        btn.onclick = () => {
            const secIdx = parseInt(btn.getAttribute('data-sec'));
            const itemId = btn.getAttribute('data-item');
            removeItemFromSection(secIdx, itemId);
        };
    });
    document.querySelectorAll('.btn-add-product-to-sec').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            addProductToSectionPrompt(idx);
        };
    });
}

function addProductToSectionPrompt(sectionIdx) {
    let optionsHtml = staticCatalogItems.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
    const customBody = `
        <div class="space-y-4">
            <p class="text-xs text-brandTextMuted font-bold">واجهة ربط وحقن المنتجات بالقسم:</p>
            <select id="popupAddProductSelect" class="w-full bg-brandBg border border-brandBorder text-brandTextMain rounded-xl p-3 text-xs font-bold outline-none">
                ${optionsHtml}
            </select>
        </div>
    `;
    showGlobalCustomContentDialogModal('ربط منتج جديد بالقسم', customBody, [
        { text: 'تأكيد وحقن المنتج', primary: true, action: () => {
            const selectedId = document.getElementById('popupAddProductSelect').value;
            if (!window.globalConfig.homepageSections[sectionIdx].items) window.globalConfig.homepageSections[sectionIdx].items = [];
            if (!window.globalConfig.homepageSections[sectionIdx].items.includes(selectedId)) {
                window.globalConfig.homepageSections[sectionIdx].items.push(selectedId);
            }
            window.closeGlobalDialogModal();
            renderLayoutSectionsManager();
        }},
        { text: 'إلغاء', primary: false, action: () => window.closeGlobalDialogModal() }
    ]);
}

function addNewLayoutSectionPrompt() {
    const customBody = `
        <div class="space-y-4 text-xs font-bold">
            <div class="space-y-1.5">
                <label class="block text-brandTextMuted">اسم القسم باللغة العربية الظاهرة للعميل:</label>
                <input type="text" id="popupNewSecName" class="w-full bg-brandBg border border-brandBorder text-brandTextMain rounded-xl p-3 outline-none" placeholder="مثال: قسم بوكسات السعادة الفاخرة">
            </div>
            <div class="space-y-1.5">
                <label class="block text-brandTextMuted">المعرف البرمجي الفريد (ID بالإنجليزية دون مسافات):</label>
                <input type="text" id="popupNewSecId" class="w-full bg-brandBg border border-brandBorder text-brandTextMain rounded-xl p-3 outline-none" placeholder="مثال: sec-custom-boxes">
            </div>
        </div>
    `;
    showGlobalCustomContentDialogModal('إنشاء قسـم جديد بالكامل للواجهة', customBody, [
        { text: 'تأكيد وإنشاء القسم', primary: true, action: () => {
            const name = document.getElementById('popupNewSecName').value.trim();
            const id = document.getElementById('popupNewSecId').value.trim();
            if(!name || !id) {
                showToastNotification('حقول فارغة', 'يرجى إكمال البيانات المطلوبة لإنشاء القسم.', 'alert-triangle');
                return;
            }
            window.globalConfig.homepageSections.push({ id: id, name: name, active: true, items: [] });
            window.closeGlobalDialogModal();
            renderLayoutSectionsManager();
            showToastNotification('عملية ناجحة', 'تم إنشاء القسم السيادي وتجهيز مسار بنائه التلقائي للعميل.', 'check');
        }},
        { text: 'إلغاء', primary: false, action: () => window.closeGlobalDialogModal() }
    ]);
}

function updateGlobalDisplayMode(mode) {
    window.globalConfig.displayMode = mode;
    updateGlobalDisplayModeUI();
}

function updateGlobalDisplayModeUI() {
    const gridBtn = document.getElementById('btn-mode-grid2');
    const cardBtn = document.getElementById('btn-mode-fullCard');
    if (!gridBtn || !cardBtn) return;

    if (window.globalConfig.displayMode === 'grid2') {
        gridBtn.className = "py-3 px-4 rounded-xl font-black text-center transition-all border border-brandPink bg-brandPinkLight text-brandPink shadow-sm";
        cardBtn.className = "py-3 px-4 rounded-xl font-black text-center transition-all border border-brandBorder bg-brandBg text-brandTextMuted";
    } else {
        cardBtn.className = "py-3 px-4 rounded-xl font-black text-center transition-all border border-brandPink bg-brandPinkLight text-brandPink shadow-sm";
        gridBtn.className = "py-3 px-4 rounded-xl font-black text-center transition-all border border-brandBorder bg-brandBg text-brandTextMuted";
    }
}

async function saveLayoutsStructureToCloud() {
    try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global_config');
        await updateDoc(docRef, {
            homepageSections: window.globalConfig.homepageSections,
            displayMode: window.globalConfig.displayMode
        });
        showToastNotification('تمت المزامنة بنجاح', 'تم حفظ وتعميم هندسة ترتيب أقسام الواجهة وطرق العرض سحابياً للعملاء.', 'check');
    } catch (err) {
        console.error("فشل إرسال هيكلة أقسام واجهات حلويات بوسي لسطح المكتب والموبايل:", err);
        showToastNotification('خطأ بالحفظ', 'فشل إرسال هيكلة الأقسام لخادم البيانات السحابي.', 'alert-triangle');
    }
}

// ==========================================
// 10. تحديث جغرافيا خطوط الشحن والتسعير
// ==========================================
function renderShippingRates() {
    const container = document.getElementById('shippingRatesContainer');
    if (!container) return;
    
    container.innerHTML = Object.entries(window.globalConfig.shippingRates).map(([region, price]) => `
        <div class="p-4 rounded-2xl bg-brandSurface border border-brandBorder space-y-2">
            <span class="text-xs font-black text-brandTextMain">${region}</span>
            <div class="relative">
                <input type="number" id="rate-${region}" class="input-shipping-rate w-full bg-brandBg border border-brandBorder rounded-xl py-2.5 px-4 text-brandTextMain text-xs outline-none bose-input-glow transition-all" value="${price}" data-region="${region}">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] text-brandTextMuted font-bold">ج.م</span>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.input-shipping-rate').forEach(inp => {
        inp.onchange = () => {
            const r = inp.getAttribute('data-region');
            window.globalConfig.shippingRates[r] = parseFloat(inp.value) || 0;
        };
    });
}

// ==========================================
// 11. ضغط ومعالجة الصور المرفوعة لـ Cloudinary
// ==========================================
function triggerCloudinaryUpload(inputId, buttonId, itemId = null) {
    currentTargetInputId = inputId;
    currentTargetButtonId = buttonId;
    currentTargetItemId = itemId;
    
    const fileInput = document.getElementById('cloudinaryFileInput');
    if (fileInput) fileInput.click();
}

const fileInputEl = document.getElementById('cloudinaryFileInput');
if (fileInputEl) {
    fileInputEl.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const btn = document.getElementById(currentTargetButtonId);
        const originalText = btn ? btn.textContent : 'رفع';
        if (btn) {
            btn.textContent = 'جاري الضغط والرفع...';
            btn.disabled = true;
        }

        try {
            const compressedFile = await compressImageClientSide(file);
            const url = await uploadToCloudinary(compressedFile);
            
            const inputEl = document.getElementById(currentTargetInputId);
            if (inputEl) inputEl.value = url;
            
            if (currentTargetItemId) {
                updateLocalCatalogItem(currentTargetItemId, 'image', url);
                renderMenuAvailabilityList();
            }
            showToastNotification('تم الرفع بنجاح', 'تم ضغط ورفع الوسائط بجودة نهارية فائقة الدقة.', 'check');
        } catch (err) {
            console.error("فشل محاولة معالجة ورفع الصورة لخادم التخزين:", err);
            showToastNotification('فشل الرفع السحابي', 'يرجى مراجعة الاتصال بالإنترنت والتحول لشبكة مستقرة.', 'alert-triangle');
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
            e.target.value = '';
        }
    });
}

function compressImageClientSide(file) {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) { resolve(file); return; }
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                const maxBound = 1200;
                if (width > height) { if (width > maxBound) { height = Math.round((height * maxBound) / width); width = maxBound; } } 
                else { if (height > maxBound) { width = Math.round((width * maxBound) / height); height = maxBound; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) { resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })); } 
                    else { resolve(file); }
                }, 'image/jpeg', 0.82);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('فشل إرسال كتل البيانات لخادم كلاوديناري');
    const data = await response.json();
    return data.secure_url;
}

// ==========================================
// 12. عرض وإدارة سجلات الفحص (BoseMonitor Logs)
// ==========================================
function renderSystemLogsTable() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    
    if (systemLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-[10px] text-brandTextMuted/40 font-black">لا يوجد محاضر أو أخطاء برمجية مسجلة حالياً.</td></tr>`;
        return;
    }
    tbody.innerHTML = systemLogs.map(log => {
        const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('ar-EG') : 'غير محدد';
        let severityClass = 'text-amber-400 bg-amber-950/40 border border-amber-900/30';
        if (log.type && log.type.includes('حرج')) severityClass = 'text-red-400 bg-red-950/40 border border-red-900/30';
        return `
            <tr class="border-b border-brandBorder hover:bg-brandPinkLight/30 transition-colors">
                <td class="py-4 px-4 font-black"><span class="px-2 py-1 rounded-md text-[10px] ${severityClass}">${log.type || 'تشخيص'}</span></td>
                <td class="py-4 px-4 max-w-xs truncate" title="${log.message}">${log.message || 'لا يوجد تفاصيل'}</td>
                <td class="py-4 px-4 text-[10px] font-black" dir="ltr">${log.source || 'نافذة المتصفح'}</td>
                <td class="py-4 px-4 text-[10px]" dir="ltr">${dateStr}</td>
            </tr>
        `;
    }).join('');
}

async function clearAllSystemLogs() {
    showGlobalDialogModal(
        'تأكيد تطهير تشخيص النظام',
        'هل ترغبين في تطهير ومسح كافة سجلات الأعطال البرمجية الحالية نهائياً من قاعدة البيانات السحابية؟',
        [
            { text: 'نعم، تطهير السجل', primary: true, action: async () => {
                window.closeGlobalDialogModal();
                try {
                    const batch = writeBatch(db);
                    systemLogs.forEach(log => {
                        const logDocRef = doc(db, 'system_logs', log.id);
                        batch.delete(logDocRef);
                    });
                    await batch.commit();
                    showToastNotification('تم التطهير', 'تم تفريغ كافة سجلات الأخطاء بنجاح.', 'check');
                } catch (err) {
                    console.error("فشل تنفيذ حزمة حذف سجل الأخطاء السحابي لـ BoseMonitor:", err);
                }
            }},
            { text: 'تراجع', primary: false, action: () => window.closeGlobalDialogModal() }
        ]
    );
}

// ==========================================
// 13. دالة الحفظ السحابية الفائقة والموحدة كلياً
// ==========================================
async function saveConfigSettings() {
    try {
        const cakeBase = parseFloat(document.getElementById('cfg-cakeBasePrice').value) || 145;
        const ediblePrice = parseFloat(document.getElementById('cfg-cakePrintEdible').value) || 60;
        const nonEdiblePrice = parseFloat(document.getElementById('cfg-cakePrintNonEdible').value) || 20;
        
        window.globalConfig.cakeBasePricePerPerson = cakeBase;
        window.globalConfig.cakeBasePrice = cakeBase; 
        window.globalConfig.cakePrintEdiblePrice = ediblePrice;
        window.globalConfig.cakePrintEdible = ediblePrice;
        window.globalConfig.cakePrintNonEdiblePrice = nonEdiblePrice;
        window.globalConfig.cakePrintNonEdible = nonEdiblePrice;
        
        window.globalConfig.roseBasePrice = parseFloat(document.getElementById('cfg-roseBasePrice').value) || 400;
        window.globalConfig.roseMinCount = parseInt(document.getElementById('cfg-roseMinCount').value) || 15;
        window.globalConfig.rosePricePerAdditional = parseFloat(document.getElementById('cfg-rosePricePerAdditional').value) || 35;
        window.globalConfig.rosePhotoPrice = parseFloat(document.getElementById('cfg-rosePhotoPrice').value) || 15;
        window.globalConfig.roseRibbonPrice = parseFloat(document.getElementById('cfg-roseRibbonPrice').value) || 50;
        window.globalConfig.roseCardPrice = parseFloat(document.getElementById('cfg-roseCardPrice').value) || 20;

        window.globalConfig.marqueeText = document.getElementById('cfg-marqueeText').value;
        window.globalConfig.marqueeSpeed = parseInt(document.getElementById('cfg-marqueeSpeed').value) || 30;
        window.globalConfig.phone = document.getElementById('cfg-phone').value;
        
        const prepHours = parseInt(document.getElementById('cfg-prepTime').value) || 24;
        window.globalConfig.orderPrepTimeHours = prepHours;
        window.globalConfig.prepTime = prepHours; 

        window.globalConfig.bgVideoUrl = document.getElementById('cfg-bgVideoUrl').value;
        window.globalConfig.promoImageUrl = document.getElementById('cfg-promoImageUrl').value;

        const batch = writeBatch(db);
        
        staticCatalogItems.forEach(item => {
            const priceInp = document.getElementById(`menuPrice-${item.id}`);
            const descInp = document.getElementById(`menuDesc-${item.id}`);
            const imgInp = document.getElementById(`menuImg-${item.id}`);
            
            if (priceInp || descInp || imgInp) {
                const menuDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'menu', item.id);
                let updateData = {};
                if (descInp && descInp.value) updateData.desc = descInp.value;
                if (imgInp && imgInp.value) updateData.img = imgInp.value;
                
                if (priceInp && parseFloat(priceInp.value)) {
                    const pVal = parseFloat(priceInp.value);
                    
                    if (!window.globalConfig.catalogItems[item.id]) {
                        window.globalConfig.catalogItems[item.id] = {};
                    }
                    window.globalConfig.catalogItems[item.id].price = pVal;
                    if (descInp && descInp.value) window.globalConfig.catalogItems[item.id].desc = descInp.value;
                    if (imgInp && imgInp.value) window.globalConfig.catalogItems[item.id].image = imgInp.value;

                    // الحفاظ الصارم على هندسة فدج كيك الشوكولاتة البلجيكية لـ ديسباسيتو حلويات بوسي
                    if (item.id === 'despacito') {
                        updateData.sizes = [
                            { label: 'عائلي', flavors: [{ name: 'نوتيلا بندق غنية', price: pVal }, { name: 'لوتس بلجيكي مقرمش', price: pVal + 40 }, { name: 'كيندر بوينو مخملية', price: pVal + 40 }] },
                            { label: 'ميني ميكس', flavors: [{ name: 'نوتيلا بندق غنية', price: Math.round(pVal/2) }, { name: 'لوتس بلجيكي مقرمش', price: Math.round(pVal/2) + 20 }] }
                        ];
                        updateData.healthSection = "مصنوعة كلياً بفدج كيك غني بالشوكولاتة البلجيكية الطبيعية الفاخرة وخالية تماماً من الإضافات الإسفنجية الجافة لضمان ذوبان متكامل.";
                    } else if (item.id === 'tortes' || item.id === 'roses') {
                        updateData.isCustomBuilder = true;
                    } else {
                        updateData.flavors = [{ name: 'التجهيز الفاخر المعتمد كلاسيكياً', price: pVal }];
                    }
                }
                batch.set(menuDocRef, updateData, { merge: true });
            }
        });
        await batch.commit();

        document.querySelectorAll('.input-shipping-rate').forEach(inp => {
            const r = inp.getAttribute('data-region');
            window.globalConfig.shippingRates[r] = parseFloat(inp.value) || 0;
        });

        const { shippingRates, ...cleanGlobalConfig } = window.globalConfig;
        
        cleanGlobalConfig.homepageSections = window.globalConfig.homepageSections || [];
        cleanGlobalConfig.displayMode = window.globalConfig.displayMode || 'grid2';
        cleanGlobalConfig.outOfStockItems = window.globalConfig.outOfStockItems || [];

        const globalRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global_config');
        await setDoc(globalRef, cleanGlobalConfig, { merge: true });

        const shippingRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'shipping_rates');
        await setDoc(shippingRef, { shippingRates: window.globalConfig.shippingRates }, { merge: true });

        showToastNotification('تمت المزامنة بنجاح', 'تم تحديث كافة متغيرات ومحددات النظام وتعميمها على السحابة لتتطابق مع العميل فوراً.', 'check');
        fetchConfigSettings();
    } catch (err) {
        console.error("فشل إتمام عملية الحفظ السحابية الموحدة لأدمن حلويات بوسي:", err);
        await reportSystemError("فشل الحفظ السحابي للأدمن", err.message, "saveConfigSettings");
        showToastNotification('خطأ بالحفظ', 'فشل إرسال البيانات المحدثة لقاعدة البيانات.', 'alert-triangle');
    }
}

// ==========================================
// 14. نظام تنبيهات التفاعل الفوري والإشعارات الراقية
// ==========================================
function showToastNotification(title, message, iconType) {
    const toast = document.getElementById('toastNotification');
    const icon = document.getElementById('toastIcon');
    const tTitle = document.getElementById('toastTitle');
    const tBody = document.getElementById('toastBody');

    if (!toast || !icon || !tTitle || !tBody) return;

    tTitle.textContent = title;
    tBody.textContent = message;
    icon.innerHTML = iconType === 'check' ?
        '<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i>' : '<i data-lucide="alert-triangle" class="w-5 h-5 text-brandPink"></i>';
    
    if (window.lucide) window.lucide.createIcons();
    
    toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-28');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-28');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }, 4000);
}

function showGlobalDialogModal(title, body, buttons = [], icon = 'alert-triangle') {
    const modal = document.getElementById('globalDialogModal');
    const mBodyContainer = document.getElementById('globalDialogModalBodyContainer');
    if (!modal || !mBodyContainer) return;

    mBodyContainer.innerHTML = `<p id="globalDialogModalBody" class="text-xs text-brandTextMuted leading-relaxed font-bold"></p>`;
    const mBody = document.getElementById('globalDialogModalBody');
    if (mBody) mBody.textContent = body;
    
    const mTitle = document.getElementById('globalDialogModalTitle');
    if (mTitle) mTitle.textContent = title;
    
    const mIcon = document.getElementById('globalDialogModalIcon');
    if (mIcon) mIcon.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i>`;
    
    const mButtons = document.getElementById('globalDialogModalButtons'); 
    if (mButtons) {
        mButtons.innerHTML = '';
        buttons.forEach(btn => {
            const bEl = document.createElement('button'); bEl.textContent = btn.text;
            bEl.className = btn.primary ? "px-5 py-3 bg-brandPink hover:bg-brandPinkDark text-brandBg text-xs font-black rounded-full transition-all duration-200 shadow-sm" : "px-5 py-3 bg-brandSurfaceChild hover:bg-brandPinkLight text-brandTextMuted text-xs font-black rounded-full transition-all duration-200 border border-brandBorder";
            bEl.onclick = btn.action; mButtons.appendChild(bEl);
        });
    }
    modal.classList.remove('hidden'); 
    modal.classList.add('flex'); 
    if (window.lucide) window.lucide.createIcons();
}

function showGlobalCustomContentDialogModal(title, innerHtmlContent, buttons = [], icon = 'sliders') {
    const modal = document.getElementById('globalDialogModal');
    const mBodyContainer = document.getElementById('globalDialogModalBodyContainer');
    if (!modal || !mBodyContainer) return;

    mBodyContainer.innerHTML = innerHtmlContent;
    
    const mTitle = document.getElementById('globalDialogModalTitle');
    if (mTitle) mTitle.textContent = title;
    
    const mIcon = document.getElementById('globalDialogModalIcon');
    if (mIcon) mIcon.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i>`;
    
    const mButtons = document.getElementById('globalDialogModalButtons'); 
    if (mButtons) {
        mButtons.innerHTML = '';
        buttons.forEach(btn => {
            const bEl = document.createElement('button'); bEl.textContent = btn.text;
            bEl.className = btn.primary ? "px-5 py-3 bg-brandPink hover:bg-brandPinkDark text-brandBg text-xs font-black rounded-full transition-all duration-200 shadow-sm" : "px-5 py-3 bg-brandSurfaceChild hover:bg-brandPinkLight text-brandTextMuted text-xs font-black rounded-full transition-all duration-200 border border-brandBorder";
            bEl.onclick = btn.action; mButtons.appendChild(bEl);
        });
    }
    modal.classList.remove('hidden'); 
    modal.classList.add('flex'); 
    if (window.lucide) window.lucide.createIcons();
}

window.closeGlobalDialogModal = function() {
    const modal = document.getElementById('globalDialogModal');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

async function executeLogout() {
    showGlobalDialogModal(
        'تأكيد تسجيل الخروج الآمن', 'هل ترغبين في إغلاق الجلسة الحالية وتسجيل الخروج الآمن من كابينة الإدارة؟',
        [
            { text: 'تسجيل خروج', primary: true, action: async () => {
                window.closeGlobalDialogModal();
                try { 
                    clearActiveListeners(); // تطهير المستمعات النشطة فوراً قبل الخروج
                    await signOut(auth); 
                    window.location.href = 'login.html'; 
                } 
                catch (err) { console.error("فشل تأمين عملية تسجيل الخروج الآمن لمديري المنصة:", err); }
            }},
            { text: 'إلغاء', primary: false, action: () => window.closeGlobalDialogModal() }
        ]
    );
}

// ==========================================
// 15. دالات الانتقال والتنقل الداخلي وهندسة الأقسام
// ==========================================
function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    const targetSection = document.getElementById(`section-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('aside nav button').forEach(btn => {
        btn.className = "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-brandTextMuted hover:bg-brandPinkLight text-xs font-bold text-right border-r-4 border-transparent transition-all";
    });

    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.className = "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-brandPinkLight text-brandPink border-r-4 border-brandPink text-xs font-bold text-right transition-all";
    }
    toggleSidebar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
}

function toggleSidebar(isOpen) {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;

    if (isOpen) {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('pointer-events-none', 'opacity-0');
        overlay.classList.add('opacity-100');
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('pointer-events-none', 'opacity-0');
        overlay.classList.remove('opacity-100');
    }
}

function filterOrdersBy(filterType) {
    activeOrderFilter = filterType;
    document.querySelectorAll('#orders-filter-bar button').forEach(btn => {
        btn.className = "px-5 py-3 rounded-full text-xs font-black transition-all bg-brandSurface hover:bg-brandPinkLight text-brandTextMuted border border-brandBorder flex items-center gap-2";
    });
    const activeFilterBtn = document.getElementById(`btn-filter-${filterType}`);
    if (activeFilterBtn) {
        activeFilterBtn.className = "px-5 py-3 rounded-full text-xs font-black transition-all bg-brandPink text-white border border-brandPink flex items-center gap-2";
    }
    renderOrdersPipeline();
}

function filterProductionBy(productionType) {
    activeProductionFilter = productionType;
    document.querySelectorAll('#production-filter-bar button').forEach(btn => {
        btn.className = "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all bg-brandSurface hover:bg-brandPinkLight text-brandTextMuted border border-brandBorder";
    });
    const activeBtn = document.getElementById(`prod-filter-${productionType}`);
    if (activeBtn) {
        activeBtn.className = "px-4 py-1.5 rounded-lg text-[11px] font-black transition-all bg-brandPink/15 text-brandPink";
    }
    renderOrdersPipeline();
}

function switchMenuCategoryTab(catId) {
    activeMenuCategoryTab = catId;
    renderMenuCategoryTabs();
    renderMenuAvailabilityList();
}

function toggleLayoutSectionStatus(idx) {
    if (!window.globalConfig.homepageSections || !window.globalConfig.homepageSections[idx]) return;
    window.globalConfig.homepageSections[idx].active = !window.globalConfig.homepageSections[idx].active;
    renderLayoutSectionsManager();
}

function moveSectionOrder(idx, direction) {
    const targetIdx = idx + direction;
    if (!window.globalConfig.homepageSections) return;
    if (targetIdx < 0 || targetIdx >= window.globalConfig.homepageSections.length) return;
    
    const temp = window.globalConfig.homepageSections[idx];
    window.globalConfig.homepageSections[idx] = window.globalConfig.homepageSections[targetIdx];
    window.globalConfig.homepageSections[targetIdx] = temp;
    
    renderLayoutSectionsManager();
}

function duplicateLayoutSection(idx) {
    if (!window.globalConfig.homepageSections || !window.globalConfig.homepageSections[idx]) return;
    const source = window.globalConfig.homepageSections[idx];
    const duplicate = {
        id: `${source.id}-نسخة-${Math.floor(Math.random() * 1000)}`,
        name: `${source.name} (نسخة مكررة)`,
        active: false,
        items: [...(source.items || [])]
    };
    window.globalConfig.homepageSections.splice(idx + 1, 0, duplicate);
    renderLayoutSectionsManager();
    showToastNotification('عملية ناجحة', 'تم نسخ وتكرار قسم الواجهة بنجاح كمسودة مخفية.', 'check');
}

function removeItemFromSection(sectionIdx, itemId) {
    if (!window.globalConfig.homepageSections || !window.globalConfig.homepageSections[sectionIdx]) return;
    window.globalConfig.homepageSections[sectionIdx].items = window.globalConfig.homepageSections[sectionIdx].items.filter(id => id !== itemId);
    renderLayoutSectionsManager();
}

// ==========================================
// 16. ربط الأحداث بنافذة المتصفح العالمية (Global Namespace)
// ==========================================
window.switchTab = switchTab;
window.triggerCloudinaryUpload = triggerCloudinaryUpload;
window.updateLocalCatalogItem = updateLocalCatalogItem;
window.cancelAndRefundOrder = cancelAndRefundOrder;
window.switchMenuCategoryTab = switchMenuCategoryTab;
window.toggleLayoutSectionStatus = toggleLayoutSectionStatus;
window.moveSectionOrder = moveSectionOrder;
window.duplicateLayoutSection = duplicateLayoutSection;
window.removeItemFromSection = removeItemFromSection;
window.addNewLayoutSectionPrompt = addNewLayoutSectionPrompt;
window.addProductToSectionPrompt = addProductToSectionPrompt;
window.updateGlobalDisplayMode = updateGlobalDisplayMode;

// عناصر التحكم العامة في الهيكل
const closeSidebarBtn = document.getElementById('btn-close-sidebar');
const sidebarOverlayEl = document.getElementById('sidebarOverlay');
const openSidebarBtn = document.getElementById('btn-open-sidebar');
const logoutBtn = document.getElementById('btn-sidebar-logout');

if (closeSidebarBtn) closeSidebarBtn.onclick = () => toggleSidebar(false);
if (sidebarOverlayEl) sidebarOverlayEl.onclick = () => toggleSidebar(false);
if (openSidebarBtn) openSidebarBtn.onclick = () => toggleSidebar(true);
if (logoutBtn) logoutBtn.onclick = executeLogout;

// ربط أزرار القائمة الجانبية للتنقل
const navDashboard = document.getElementById('nav-dashboard');
const navOrders = document.getElementById('nav-orders');
const navMenu = document.getElementById('nav-menu');
const navLayouts = document.getElementById('nav-layoutsManager');
const navCakeBuilder = document.getElementById('nav-cakeBuilderSettings');
const navRoseBuilder = document.getElementById('nav-roseBuilderSettings');
const navShipping = document.getElementById('nav-shippingRates');
const navGlobal = document.getElementById('nav-globalConfig');
const navLogs = document.getElementById('nav-systemLogs');

if (navDashboard) navDashboard.onclick = () => switchTab('dashboard');
if (navOrders) navOrders.onclick = () => switchTab('orders');
if (navMenu) navMenu.onclick = () => switchTab('menu');
if (navLayouts) navLayouts.onclick = () => switchTab('layoutsManager');
if (navCakeBuilder) navCakeBuilder.onclick = () => switchTab('cakeBuilderSettings');
if (navRoseBuilder) navRoseBuilder.onclick = () => switchTab('roseBuilderSettings');
if (navShipping) navShipping.onclick = () => switchTab('shippingRates');
if (navGlobal) navGlobal.onclick = () => switchTab('globalConfig');
if (navLogs) navLogs.onclick = () => switchTab('systemLogs');

// ربط أزرار الفرز للطلبات
const fAll = document.getElementById('btn-filter-all');
const fPending = document.getElementById('btn-filter-pending');
const fProc = document.getElementById('btn-filter-processing');
const fShip = document.getElementById('btn-filter-shipping');
const fComp = document.getElementById('btn-filter-completed');
const fCanc = document.getElementById('btn-filter-cancelled');

if (fAll) fAll.onclick = () => filterOrdersBy('all');
if (fPending) fPending.onclick = () => filterOrdersBy('pending');
if (fProc) fProc.onclick = () => filterOrdersBy('processing');
if (fShip) fShip.onclick = () => filterOrdersBy('shipping');
if (fComp) fComp.onclick = () => filterOrdersBy('completed');
if (fCanc) fCanc.onclick = () => filterOrdersBy('cancelled');

// ربط فلاتر خطوط الإنتاج
const pAll = document.getElementById('prod-filter-all');
const pCakes = document.getElementById('prod-filter-cakes');
const pRoses = document.getElementById('prod-filter-roses');
const pClass = document.getElementById('prod-filter-classic');

if (pAll) pAll.onclick = () => filterProductionBy('all');
if (pCakes) pCakes.onclick = () => filterProductionBy('cakes');
if (pRoses) pRoses.onclick = () => filterProductionBy('roses');
if (pClass) pClass.onclick = () => filterProductionBy('classic');

// أزرار المزامنة والحفظ المباشر
const saveMenuBtn = document.getElementById('btn-save-menu');
const saveCakeBtn = document.getElementById('btn-save-cake-config');
const saveRoseBtn = document.getElementById('btn-save-rose-config');
const saveShippingBtn = document.getElementById('btn-save-shipping');
const saveGlobalBtn = document.getElementById('btn-save-global-config');
const clearLogsBtn = document.getElementById('btn-clear-logs');

if (saveMenuBtn) saveMenuBtn.onclick = saveConfigSettings;
if (saveCakeBtn) saveCakeBtn.onclick = saveConfigSettings;
if (saveRoseBtn) saveRoseBtn.onclick = saveConfigSettings;
if (saveShippingBtn) saveShippingBtn.onclick = saveConfigSettings;
if (saveGlobalBtn) saveGlobalBtn.onclick = saveConfigSettings;
if (clearLogsBtn) clearLogsBtn.onclick = clearAllSystemLogs;

// التحكم في أقسام العرض وهندسة الواجهات
const addLayoutSecBtn = document.getElementById('btn-add-layout-section');
const saveLayoutsBtn = document.getElementById('btn-save-layouts');
const modeGridBtn = document.getElementById('btn-mode-grid2');
const modeCardBtn = document.getElementById('btn-mode-fullCard');

if (addLayoutSecBtn) addLayoutSecBtn.onclick = addNewLayoutSectionPrompt;
if (saveLayoutsBtn) saveLayoutsBtn.onclick = saveLayoutsStructureToCloud;

if (modeGridBtn) {
    modeGridBtn.onclick = async () => { 
        updateGlobalDisplayMode('grid2');
        await saveLayoutsStructureToCloud(); 
    };
}
if (modeCardBtn) {
    modeCardBtn.onclick = async () => { 
        updateGlobalDisplayMode('fullCard');
        await saveLayoutsStructureToCloud(); 
    };
}
