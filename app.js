// ⚡ Engine Upgrade: Ultimate Dynamic Catalog Engine (V. Infinity)
const PreloadEngine = {
    loadedUrls: new Set(),
    ignite(catalogData, galleryData = []) {
        setTimeout(() => {
            const allUrls = [];
            catalogData.forEach(i => {
                if(i.images && i.images.length > 0) i.images.forEach(img => allUrls.push(img));
                else allUrls.push(i.img || getImgFallback(i.category));
            });
            galleryData.forEach(g => allUrls.push(g.url));
            allUrls.forEach(url => { if(url && !this.loadedUrls.has(url)) { const img = new Image(); img.src = url; this.loadedUrls.add(url); } });
        }, 3000); 
    }
};

// 🌟 القاموس التفصيلي (خطة الطوارئ للكروت الكبيرة)
const detailedDescriptions = {
    'جاتوه سواريه': 'الجاتوه السواريه مش مجرد حلويات ده عنوان للشياكة والرقي قطع فنية صغيرة معمولة بدقة متناهية علشان تخطف العين وتدوب في البق فورا حجمها المثالي بيخليها الاختيار الأول للضيافة الراقية والمناسبات المهمة علشان ضيوفك يدوقوا أكتر من نكهة بدون إحراج لو مجربتيش السواريه في مناسبتك الجاية فايتك كتير من الفخامة 🎀👑',
    'جاتوه ملكي': 'الجاتوه الملكي من حلويات بوسي هو الترجمة الحرفية للفخامة مش مجرد كيك وكريمة دي خامات مستوردة وتفاصيل بتتعمل بحب علشان تليق بضيوفك الـ VIP طعم غني جدا وتوازن سكر يظبط المزاج لو بتدوري على حاجة ترفع الراس وتشرفك بجد الجاتوه الملكي هو اختيارك اللي مفيش فيه تنازل 👑✨',
    'جاتوه كلاسيك': 'قطعة الجاتوه الأصيلة اللي بترجعنا لأحلى الذكريات بس بلمسة حلويات بوسي الفاخرة كيك اسفنجي هش جدا بيدوب مع كريمة غنية متوازنة السكر اختيار آمن ومضمون يرضي كل الأذواق ويليق بأي عزومة سريعة أو قعدة عائلية دافية 🍰🎉',
    'حجم (فرد - فردين)': 'ليه تستني مناسبة كبيرة علشان تفرحي؟ الميني تورتة دي معمولة مخصوص للحظات الحلوة المفاجئة حجمها كيوت ومثالي جدا يكفي من فرد لفردين مليانة حشوات غنية وتفاصيل تفرح القلب لو ناوية تصالحي حد أو تحتفلي بنجاح صغير أو حتى تدلعي نفسك هي الحل السحري والأسرع 🎂🥰',
    'حجم (3 - 4 أفراد)': 'التورتة دي هي الاختيار الذهبي للمة العيلة الصغيرة أو احتفال الأصدقاء بتكفي من 3 لـ 4 أفراد وبتجمع بين الشكل الشيك اللي يخطف العين والطعم الغني اللي يرضي كل الأذواق مناسبة جدا توثقوا بيها لحظاتكم الحلوة بصور وطعم ميتنسيش 🎂✨',
    'حجم (5 - 6 أفراد)': 'لو عندكم احتفال أو عيد ميلاد وعايزين تورتة تشرف وتكفي العيلة التورتة دي بتكفي من 5 لـ 6 أفراد معمولة بخامات بريميوم وحشوات غنية جدا علشان كل ضيف ياخد قطعته ويدعي لمزاجك الراقي وتكمل فرحتكم 🎂🎉',
    'تورتة': 'تورتة حلويات بوسي مش مجرد كيكة دي الملكة اللي بتتربع على عرش مناسبتك تصميم بيخطف العين من أول نظرة وكيك هش جدا مع حشوات غنية ومقادير مظبوطة بالمللي تضمنلك إن كل ضيوفك هيسألوا عنها مناسبتك متكملش من غير التورتة اللي تليق باسمك 👑🎂',
    'بوكس الروقان': 'ليه تحتار تختار إيه لما ممكن تاخد كل حاجة حلوة في بوكس واحد؟ بوكس الروقان تجميعة من ألذ وأرقى أصنافنا معمول مخصوص علشان يفصلك عن دوشة العالم ويدخلك في حالة روقان تام اختيار مثالي لهدية قيمة أو لقعدة صحاب عايزين يتبسطوا بجد 🎁✨',
    'قشطوطة': 'سر القشطوطة الحقيقي في الهشاشة اللي بتدوب بمجرد ما تلمسها كيكة سحابية غرقانة في حليب فريش وقشطة طبيعية بتطبطب على القلب تجربة حسية متكاملة تخليك تفصل عن الدنيا وتعيش اللحظة بكل تفاصيلها الحلوة اختاري النكهة اللي تدلع مزاجك ☁️🤍',
    'ديسباسيتو': 'القنبلة البرازيلية اللي خطفت قلوب عشاق الشيكولاتة كيكة اسفنجية خفيفة لأبعد حد غرقانة في صوص شيكولاتة غني جدا بتركيبة سرية طعمها بيعدل المود فوراً ويطبطب على القلب لو يومك كان طويل وصعب الديسباسيتو هي المكافأة اللي تستحقيها 🍫🤤',
    'سينابون': 'سر السينابون عندنا في العجينة القطنية الطرية اللي مخبوزة بحب ومحشية بأجود أنواع القرفة والسكر البني بمجرد ما تفتح العلبة الريحة كفيلة تدفيك الصوص الكريمي الغني اللي بيغطيها بيكمل اللوحة الفنية طعم يخليك تحس بالدفا والاحتواء 🤎✨',
    'دوناتس': 'انسوا أي دوناتس دوقته قبل كده العجينة عندنا مقلية باحترافية علشان تكون خفيفة وهشة زي القطنة ومش شاربة زيت نهائيا متغطية بطبقات من الصوصات المبهجة اللي بتفرح الكبار قبل الصغيرين قطعة واحدة منها قادرة تغير مسار يومك بالكامل 🍩😍',
    'بامبوليني': 'النسخة الإيطالية الفاخرة من الدوناتس كورة من العجينة السحابية الغنية متدحرجة في السكر ومحشية من جوة بقلب بينبض بالكريمة الغنية أو النوتيلا أول ما تقطمها الحشوة بتبظ في البق وتغمر حواسك تجربة استثنائية لازم تعيشيها 🥯🍯'
};

// 🌟 القاموس الكبسولة (خطة الطوارئ للكروت الصغيرة)
function getCapsuleDescription(p) {
    let n = (p.name || '').trim().toLowerCase();
    let c = (p.category || '').trim().toLowerCase();
    
    if (c.includes('دوناتس') || n.includes('دوناتس') || c.includes('بامبوليني') || n.includes('بامبوليني')) {
        let base = c.includes('بامبوليني') || n.includes('بامبوليني') ? 'دوناتس إيطالي محشي كورة سحابية' : 'عجينة مقلية خفيفة زي القطنة';
        if (n.includes('نوتيلا')) return `${base} بتبظ نوتيلا أصلية سايحة.. سعادة مستحيل تقاومها 🍩🍫`;
        if (n.includes('لوتس')) return `${base} محشية زبدة لوتس وبسكوت.. قرمشة بتدوب في البق 🍩🤎`;
        if (n.includes('كراميل')) return `${base} بصوص كراميل دافي وغني.. روقان بيعدل المود 🍩🍮`;
        if (n.includes('فراول')) return `${base} بصوص فراولة فريش.. ميكس المزازة والحلاوة اللي يجنن 🍩🍓`;
        if (n.includes('راسبيري')) return `${base} بصوص الراسبيري (التوت الأحمر).. مزازة تخطف القلب 🍩🍓`;
        if (n.includes('بلوبيري')) return `${base} بصوص البلوبيري الغني.. طعم مميز بيعدل المود 🍩🫐`;
        if (n.includes('كندر')) return `${base} بصوص كندر غني.. طعم بيفرح الكبار والصغيرين 🍩💛`;
        if (n.includes('دارك')) return `شيكولاتة دارك إيطالية في قلب دوناتس خفيفة.. للذواقة وبس 🍩🖤`;
        if (n.includes('وايت') || n.includes('ابيض')) return `${base} متغطية نوتيلا بيضاء مستوردة.. تجربة رقيقة 🍩🤍`;
        return `${base} بصوصات مبهجة.. مستحيل تكتفي بواحدة 🍩😍`;
    }

    if (c.includes('سينابون') || n.includes('سينابون')) {
        let base = 'عجينة قطنية بقرفة وصوص جبنة غني';
        if (n.includes('نوتيلا')) return `${base} وغرقانة نوتيلا سايحة.. دفا وسعادة 🤎🍫`;
        if (n.includes('لوتس')) return `${base} بصوص اللوتس الساحر.. ميكس يدلع حواسك 🤎✨`;
        if (n.includes('كراميل') || n.includes('بيكان')) return `قرمشة البيكان مع الكراميل الغني على عجينة قطنية 🤎🍮`;
        if (n.includes('راسبيري')) return `عجينة قطنية غرقانة صوص راسبيري.. مزازة وحلاوة تخطف القلب 🍓✨`;
        if (n.includes('بلوبيري')) return `عجينة قطنية بصوص البلوبيري (التوت الأزرق).. طعم يوديك حتة تانية 🫐💜`;
        if (n.includes('كرز')) return `عجينة قطنية بصوص وحبات الكرز.. تجربة كلاسيكية فخمة 🍒❤️`;
        return `عجينة قطنية طرية غرقانة قرفة وصوص جبنة.. ريحتها هتدفيك 🤎✨`;
    }

    if (c.includes('قشطوط') || n.includes('قشطوط')) {
        if (n.includes('نوتيلا وايت')) return 'سحابة نوتيلا بيضاء على قشطوطة هشة غرقانة حليب.. دلع صافي ☁️🤍';
        if (n.includes('نوتيلا')) return 'نوتيلا أصلية سايحة على قشطوطة بتدوب في الحليب.. لعشاق الشيكولاتة 🍫🤤';
        if (n.includes('لوتس')) return 'زبدة وبسكوت لوتس على قشطوطة غرقانة حليب.. ميكس السعادة 🤎✨';
        if (n.includes('مانجا') || n.includes('مانجو')) return 'مانجا فريش وكريمة على قشطوطة بتدوب.. انتعاش الصيف في قطمة 🥭💛';
        if (n.includes('فراول')) return 'صوص وقطع فراولة فريش على قشطوطة هشة.. مزازة وحلاوة تجنن 🍓❤️';
        if (n.includes('راسبيري')) return 'صوص الراسبيري (التوت الأحمر) على قشطوطة هشة.. مزازة تلذذ القلب 🍓✨';
        if (n.includes('بلوبيري')) return 'صوص البلوبيري الغني على قشطوطة بتدوب.. طعم مميز وراقي 🫐💜';
        if (n.includes('كرز')) return 'صوص وحبات الكرز اللذيذة على قشطوطة غرقانة حليب.. فخامة الطعم 🍒❤️';
        if (n.includes('رفايلو') || n.includes('رافيلو')) return 'دلع جوز هند ولوز غرقانين في قشطة كريمي.. توديك حتة تانية خالص 🥥🤍';
        if (n.includes('كراميل')) return 'صوص كراميل دافي على قشطوطة غرقانة حليب.. روقان بيطبطب عالقلب 🍮🤎';
        if (n.includes('موز')) return 'موز فريش وصوصات غنية على قشطوطة بتدوب.. ميكس كلاسيكي مبهج 🍌🥞';
        if (n.includes('فستق') || n.includes('مكسرات')) return 'قرمشة مكسرات فاخرة مع نعومة القشطوطة.. تباين يمتع حواسك 🌰💚';
        if (n.includes('اوريو') || n.includes('أوريو')) return 'أوريو أصلي غرقان في قشطوطة بتدوب وحليب طازة.. طعم مايتنسيش 🍪🥛';
        if (n.includes('مكس') || n.includes('ميكس') || n.includes('نكهات')) return 'ميكس نكهات عالمية في قشطوطة واحدة.. تجربة غنية تخطف العين 🤩🎨';
        return 'كيكة هشة بتدوب غرقانة حليب وقشطة طبيعية.. تطبطب على قلبك ☁️🤍';
    }

    if (c.includes('ديسباسيتو') || n.includes('ديسباسيتو')) {
        let base = 'كيكة اسفنجية غرقانة صوص شيكولاتة برازيلي';
        if (n.includes('نوتيلا')) return `${base} ونوتيلا.. دمار لذيذ 🍫🤤`;
        if (n.includes('لوتس')) return `${base} ولمسة لوتس.. بيعدل المود فوراً 🤎✨`;
        return `${base}.. بتطبطب عالقلب 🍫🤤`;
    }

    if (n.includes('كبات') || c.includes('كبات')) {
        if (n.includes('نوتيلا')) return 'طبقات كيك هش وكريمة نوتيلا في كب شيك.. جرعة سعادة سريعة 🧁🍫';
        if (n.includes('لوتس')) return 'زبدة لوتس وبسكوت مع طبقات الكيك.. طعم ياخدك لعالم تاني 🧁🤎';
        if (n.includes('مانجا')) return 'انتعاش المانجا الفريش مع الكيك والكريمة.. صيفك أحلى في كب 🧁🥭';
        return 'طبقات كيك وكريمة وصوصات لذيذة.. كب السعادة في أي مكان 🧁🤩';
    }

    if (c.includes('تشيز كيك') || n.includes('تشيز')) return 'بسكوت مقرمش وجبنة كريمية ناعمة بصوص فريش.. توازن بيذوب 🍓🧀';
    if (c.includes('ريد فيلفت') || n.includes('فيلفت')) return 'كيكة مخملية حمراء بكريمة تشيز غنية.. رقي وذوق عالي 🍒♥️';
    if (c.includes('ميل فاي') || n.includes('ميل فاي')) return 'طبقات مورقة مقرمشة بباستري كريم غني.. سيمفونية قرمشة 🥐💛';
    if (c.includes('إكلير') || n.includes('إكلير')) return 'عجينة شو فرنسية بكريمة غنية وشيكولاتة بتلمع.. كلاسيكية باريسية 🥖🍫';
    if (c.includes('كب كيك') || n.includes('كب كيك')) return '12 قطعة كب كيك هش بكريمة وتفاصيل شيك.. تكمل حلاوة مناسبتك 🧁✨';
    
    if (c.includes('جاتوه') || n.includes('جاتوه')) {
        if (n.includes('سواريه')) return 'قطع فنية صغيرة شيك جداً بتدوب في البق.. للضيافة الراقية 🎀👑';
        if (n.includes('ملكي') || n.includes('فاخر')) return 'جاتوه فاخر بخامات مستوردة.. طعم ملكي يبهر ضيوفك 👑✨';
        return 'كيك اسفنجي وكريمة غنية.. قطعة الجاتوه اللي اتربينا عليها 🍰🎉';
    }
    
    if (c.includes('تورت') || n.includes('تورت')) {
        if (n.includes('فرد - فردين') || n.includes('فردين')) return 'تورتة ميني كيوت تكفي فردين.. مثالية للمفاجآت السريعة والرومانسية 🎂🥰';
        if (n.includes('3 - 4') || n.includes('4 أفراد')) return 'حجم وسط ممتاز يكفي 4 أفراد.. الاختيار الذهبي للمة الصغيرة 🎂✨';
        if (n.includes('5 - 6') || n.includes('6 أفراد')) return 'تورتة عائلية تكفي 6 أفراد.. علشان تشرفك وتكمل فرحتكم في أي احتفال 🎂🎉';
        if (n.includes('ميني')) return 'تورتة صغيرة مليانة حب تكفي 3 أفراد.. للمفاجآت السريعة 🎂🥰';
        return 'تورتة ملكية كيك هش وحشوات غنية.. تتربع على عرش مناسبتك 👑🎂';
    }
    
    if (c.includes('بوكس') || n.includes('بوكس') || c.includes('عروض')) return 'تجميعة ألذ الأصناف في بوكس متكامل.. بيفصلك عن العالم 🎁✨';

    return 'قطعة فنية معمولة بحب ومقادير مظبوطة.. تدلع مزاجك وتليق بيك ✨';
}

// ⚡ ⚡ الحل الجذري والنهائي: السيادة المطلقة لوصف الإدارة من قاعدة البيانات
function getFinalDescription(p, isFullWidth) {
    if (p.desc && p.desc.trim().length > 3) return escapeHTML(p.desc.trim());
    if (!isFullWidth) return getCapsuleDescription(p);
    let n = (p.name || '').trim().toLowerCase();
    let c = (p.category || '').trim().toLowerCase();
    for (let key in detailedDescriptions) {
        if (n.includes(key.toLowerCase()) || c.includes(key.toLowerCase())) return detailedDescriptions[key];
    }
    return getCapsuleDescription(p);
}

function hexToMathHSL(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } 
    else if (hex.length == 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0;
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60); if (h < 0) h += 360;
    return h;
}

let catalogMap = new Map();
function syncCatalogMap() { catalogMap.clear(); catalog.forEach(p => catalogMap.set(String(p.id), p)); }

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function generateUniqueID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function showSystemToast(message, type = 'info') {
    const toast = document.getElementById('system-toast');
    if(!toast) return;
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    msgEl.innerText = message;
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-gray-700 toast-enter ${type === 'error' ? 'bg-red-900' : (type === 'success' ? 'bg-emerald-800' : 'bg-gray-900')}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    if(window.lucide) lucide.createIcons();
    setTimeout(() => { toast.classList.replace('flex', 'hidden'); toast.classList.remove('toast-enter'); }, 4000);
}

// 👑 المفتاح السري المطور - توجيه لصفحة الأمان
let adminClicksCounter = 0;
let adminClickTimer;

window.triggerAdminAccess = function(e) {
    if(e) e.stopPropagation(); 
    adminClicksCounter++;
    clearTimeout(adminClickTimer);
    
    if (adminClicksCounter >= 5) {
        adminClicksCounter = 0;
        showSystemToast('جاري التحويل لبوابة الحماية 🛡️...', 'success');
        setTimeout(() => {
            // التوجيه الصحيح لصفحة تسجيل الدخول
            window.location.href = 'login.html';
        }, 800);
    }
    
    adminClickTimer = setTimeout(() => { adminClicksCounter = 0; }, 1500); 
};

// الربط الاحترافي بالمعرف الموحد في القائمة الجانبية
function autoBindAdminAccess() {
    const portal = document.getElementById('admin-secret-portal');
    if (portal) {
        portal.addEventListener('click', window.triggerAdminAccess);
        console.log("BoseSweets: Secret portal bound to Sidebar Header.");
    }
}

const defaultSettings = {
    brandName: "حلويات بوسي", announcement: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب",
    heroTitle: "أهلاً بكم في <br class='hidden md:block'/> <span class='text-white relative inline-block mt-1 md:mt-2 drop-shadow-md'>حلويات بوسي</span>",
    heroDesc: "يسر إدارة حلويات بوسي استعراض تشكيلتها الحصرية من الأصناف الفاخرة والمُعدة بعناية فائقة لتليق بذوقكم الرفيع ومناسباتكم السعيدة.",
    footerPhone: "01097238441", footerAddress: "الكفاح، مركز الفرافرة، <br> محافظة الوادي الجديد",
    footerQuote: `"نؤمن أن الحلويات لغة للتعبير عن المحبة، لذا نصنع كل قطعة بشغف لنكون شركاءكم في أجمل اللحظات."`,
    productLayout: "grid", brandColorHex: "#ec4899", bgColor: "#ffffff", textColor: "#663b3b",
    fontFamily: "'Cairo', sans-serif", baseFontSize: 16, baseFontWeight: 400,
    tickerActive: true, tickerText: "حلويات بوسي: صنعناها بحب لتهديها لمن تحب ✨", tickerSpeed: 20, tickerFont: "'Cairo', sans-serif", tickerColor: "#ffffff",
    cakeBuilder: { basePrice: 145, desc: "نمنحكم حرية اختيار أدق التفاصيل لتصميم تورتة المناسبة السعيدة.", minSquare: 16, minRect: 20, flavors: ['فانيليا', 'شيكولاتة', 'نص ونص', 'ريد فيلفت'], images: [], imagePrinting: [{ label: 'بدون', price: 0 }, { label: 'صورة قابلة للأكل', price: 60 }, { label: 'صورة غير قابلة للأكل', price: 20 }] }
};

const defaultShipping = [ { id: 'sh_1', name: 'الكفاح', fee: 0 }, { id: 'sh_2', name: 'أبو منقار', fee: 50 }, { id: 'sh_3', name: 'النهضة', fee: 30 }, { id: 'sh_4', name: 'مركز الفرافرة', fee: 20 } ];

// ⚡ قائمة الديسباسيتو المحدثة حصرياً (النكهات الجديدة بزيادة السعر 10%)
let defaultCatalog = [
    // --- ديسباسيتو مثلث ---
    { id: 'dp_tri_dark', name: 'ديسباسيتو نوتيلا دارك', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_lotus', name: 'ديسباسيتو لوتس', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_white', name: 'ديسباسيتو نوتيلا وايت', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_caramel', name: 'ديسباسيتو كراميل', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_kinder', name: 'ديسباسيتو كيندر', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_blueb', name: 'ديسباسيتو بلوبيري', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_raspb', name: 'ديسباسيتو راسبيري', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_cherry', name: 'ديسباسيتو كرز', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_snick', name: 'ديسباسيتو اسنيكرز', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_mix', name: 'ديسباسيتو ميكس شوكليت', category: 'ديسباسيتو', size: 'مثلث', price: 66, inStock: true },
    { id: 'dp_tri_pist', name: 'ديسباسيتو بيستاشيو', category: 'ديسباسيتو', size: 'مثلث', price: 83, inStock: true },

    // --- ديسباسيتو وسط ---
    { id: 'dp_med_dark', name: 'ديسباسيتو نوتيلا دارك', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_lotus', name: 'ديسباسيتو لوتس', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_white', name: 'ديسباسيتو نوتيلا وايت', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_caramel', name: 'ديسباسيتو كراميل', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_kinder', name: 'ديسباسيتو كيندر', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_blueb', name: 'ديسباسيتو بلوبيري', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_raspb', name: 'ديسباسيتو راسبيري', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_cherry', name: 'ديسباسيتو كرز', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_snick', name: 'ديسباسيتو اسنيكرز', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_mix', name: 'ديسباسيتو ميكس شوكليت', category: 'ديسباسيتو', size: 'وسط', price: 132, inStock: true },
    { id: 'dp_med_pist', name: 'ديسباسيتو بيستاشيو', category: 'ديسباسيتو', size: 'وسط', price: 165, inStock: true },

    // --- ديسباسيتو كبير ---
    { id: 'dp_lrg_dark', name: 'ديسباسيتو نوتيلا دارك', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_lotus', name: 'ديسباسيتو لوتس', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_white', name: 'ديسباسيتو نوتيلا وايت', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_caramel', name: 'ديسباسيتو كراميل', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_kinder', name: 'ديسباسيتو كيندر', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_blueb', name: 'ديسباسيتو بلوبيري', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_raspb', name: 'ديسباسيتو راسبيري', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_cherry', name: 'ديسباسيتو كرز', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_snick', name: 'ديسباسيتو اسنيكرز', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_mix', name: 'ديسباسيتو ميكس شوكليت', category: 'ديسباسيتو', size: 'كبير', price: 264, inStock: true },
    { id: 'dp_lrg_pist', name: 'ديسباسيتو بيستاشيو', category: 'ديسباسيتو', size: 'كبير', price: 297, inStock: true }
];

async function fetchDefaultCatalog() {
    try { const response = await fetch('data.json'); const fetchedData = await response.json(); if(fetchedData && fetchedData.length > 0) defaultCatalog = [...defaultCatalog, ...fetchedData]; } 
    catch (error) { console.error("تعذر تحميل الكتالوج الافتراضي الإضافي:", error); }
}

let siteSettings = { ...defaultSettings };
let shippingZones = [ ...defaultShipping ];
let catalog = []; let globalOrders = []; let galleryData = []; let catMenu = [];

const dSizes = ['مثلث', 'وسط', 'كبير']; const fTypes = ['ورد طبيعي', 'ورد صناعي', 'ورد ستان', 'ورد بالصور', 'ورد بالفلوس'];
let state = { activeCat: 'تورت', dSize: 'مثلث', fType: 'ورد طبيعي', cart: [], currentShippingFee: 0, cakeBuilder: { flv: 'فانيليا', ps: 4, sh: 'دائري', trd: false, img: 'بدون', msg: '', alg: '', occ: '', refImgUrl: '', hasRefImg: false, crd: false, dlg: false } };

async function loadEngineMemory() {
    try {
        await fetchDefaultCatalog(); catalog = [...defaultCatalog];
        const catSnap = await db.collection('catalog').get();
        if (catSnap.empty) { for (let p of catalog) await NetworkEngine.safeWrite('catalog', String(p.id), p); } 
        else { 
            catalog = []; 
            catSnap.forEach(doc => {
                const p = doc.data();
                if (p.category !== 'ديسباسيتو') catalog.push(p);
            });
            const freshDespacito = defaultCatalog.filter(p => p.category === 'ديسباسيتو');
            catalog = [...catalog, ...freshDespacito];
        }
        const orderSnap = await db.collection('orders').orderBy('timestamp', 'desc').get();
        if (!orderSnap.empty) { globalOrders = []; orderSnap.forEach(doc => globalOrders.push(doc.data())); }
        const gallerySnap = await db.collection('gallery').orderBy('timestamp', 'desc').get();
        if (!gallerySnap.empty) { galleryData = []; gallerySnap.forEach(doc => galleryData.push(doc.data())); }
        const settingsSnap = await db.collection('settings').doc('main').get();
        if (settingsSnap.exists) { siteSettings = { ...defaultSettings, ...settingsSnap.data() }; }
        const shipSnap = await db.collection('shipping').get();
        if (!shipSnap.empty) { shippingZones = []; shipSnap.forEach(doc => shippingZones.push(doc.data())); }
        if (siteSettings.catMenu && siteSettings.catMenu.length > 0) catMenu = siteSettings.catMenu;
        else catMenu = [...new Set(catalog.map(p => p.category))].filter(Boolean);
        if (!catMenu.includes('تورت')) catMenu.unshift('تورت');
        syncCatalogMap(); 
    } catch(err) { catalog = [...defaultCatalog]; syncCatalogMap(); }
    try { const savedCart = localStorage.getItem('boseSweets_cart_data'); if (savedCart) state.cart = JSON.parse(savedCart); } catch (e) { state.cart = []; }
}

async function saveEngineMemory(type) {
    try {
        if (type === 'cat' || type === 'all') localStorage.setItem('bSweets_catalog', JSON.stringify(catalog));
        if (type === 'set' || type === 'all') localStorage.setItem('bSweets_settings', JSON.stringify(siteSettings));
        if (type === 'ship' || type === 'all') localStorage.setItem('bSweets_shipping', JSON.stringify(shippingZones));
        if (type === 'gal' || type === 'all') localStorage.setItem('bSweets_gallery', JSON.stringify(galleryData));
    } catch (e) {}
}

function saveCartToStorage() { try { localStorage.setItem('boseSweets_cart_data', JSON.stringify(state.cart)); } catch (e) {} }
function clearCartStorage() { try { localStorage.removeItem('boseSweets_cart_data'); } catch (e) {} }

function applySettingsToUI() {
    const root = document.documentElement;
    const computedHue = hexToMathHSL(siteSettings.brandColorHex || '#ec4899');
    root.style.setProperty('--brand-hue', computedHue);
    root.style.setProperty('--brand-font', siteSettings.fontFamily || "'Cairo', sans-serif");
    root.style.setProperty('--base-font-size', (siteSettings.baseFontSize || 16) + 'px');
    root.style.setProperty('--base-font-weight', siteSettings.baseFontWeight || 400);
    root.style.setProperty('--site-bg', siteSettings.bgColor || '#ffffff');
    root.style.setProperty('--site-text', siteSettings.textColor || '#663b3b');
    const isTickerActive = siteSettings.tickerActive !== false; 
    const tickerContainer = document.getElementById('ticker-container');
    if(tickerContainer) {
        if (isTickerActive) {
            tickerContainer.classList.remove('hidden'); tickerContainer.classList.add('flex');
            root.style.setProperty('--ticker-color', siteSettings.tickerColor || '#ffffff');
            root.style.setProperty('--ticker-font', siteSettings.tickerFont || "'Cairo', sans-serif");
            root.style.setProperty('--ticker-speed', (siteSettings.tickerSpeed || 20) + 's');
            document.getElementById('dyn-ticker-text').innerText = siteSettings.tickerText || siteSettings.announcement;
        } else { tickerContainer.classList.add('hidden'); tickerContainer.classList.remove('flex'); }
    }
    if(document.getElementById('dyn-page-title')) document.getElementById('dyn-page-title').innerText = `${siteSettings.brandName} | القائمة الرسمية`;
    if(document.getElementById('dyn-brand-name')) document.getElementById('dyn-brand-name').innerText = siteSettings.brandName;
    if(document.getElementById('dyn-hero-title')) document.getElementById('dyn-hero-title').innerHTML = siteSettings.heroTitle;
    if(document.getElementById('dyn-hero-desc')) document.getElementById('dyn-hero-desc').innerText = siteSettings.heroDesc;
    if(document.getElementById('dyn-footer-brand')) document.getElementById('dyn-footer-brand').innerText = siteSettings.brandName;
    if(document.getElementById('dyn-footer-quote')) document.getElementById('dyn-footer-quote').innerText = siteSettings.footerQuote;
    if(document.getElementById('dyn-footer-phone')) document.getElementById('dyn-footer-phone').innerText = siteSettings.footerPhone;
    if(document.getElementById('dyn-footer-address')) document.getElementById('dyn-footer-address').innerHTML = siteSettings.footerAddress;
    const areaSelect = document.getElementById('cust-area');
    if(areaSelect) areaSelect.innerHTML = `<option value="" disabled selected>اختر المنطقة...</option>` + shippingZones.map(z => `<option value="${z.id}">${escapeHTML(z.name)} (+${Number(z.fee)} ج.م توصيل)</option>`).join('');
    if(document.getElementById('sidebar-categories')) renderCustomerSidebarCategories();
}

async function initApp() {
    await loadEngineMemory();
    const loader = document.getElementById('global-loader');
    if(loader) { loader.style.opacity = '0'; loader.style.visibility = 'hidden'; setTimeout(() => loader.style.display = 'none', 500); }
    applySettingsToUI();
    
    if(document.getElementById('gallery-customer-section')) renderCustomerGallery(); 
    if(document.getElementById('categories-nav')) renderCategories();
    if(document.getElementById('display-container')) renderMainDisplay();
    syncCartUI(); 
    if(window.lucide) lucide.createIcons();
    PreloadEngine.ignite(catalog, galleryData);
    const urlParams = new URLSearchParams(window.location.search);
    const sharedProductId = urlParams.get('product');
    if(sharedProductId && document.getElementById('display-container')) {
        const prod = catalogMap.get(sharedProductId);
        if(prod) {
            setCategory(prod.category); 
            setTimeout(() => {
                const el = document.getElementById('product-card-' + sharedProductId);
                if(el) { el.scrollIntoView({behavior: 'smooth', block: 'center'}); el.classList.add('highlight-target'); setTimeout(() => el.classList.remove('highlight-target'), 2500); }
            }, 500);
        }
    }
}

function toggleLiveSearch(show) {
    const overlay = document.getElementById('live-search-overlay'); const input = document.getElementById('live-search-input'); const results = document.getElementById('live-search-results');
    if (show) { overlay.classList.remove('hidden'); setTimeout(() => { overlay.classList.add('opacity-100'); input.focus(); }, 10); input.value = ''; results.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); } 
    else { overlay.classList.remove('opacity-100'); setTimeout(() => overlay.classList.add('hidden'), 300); }
}

function performLiveSearch(query) {
    const resultsContainer = document.getElementById('live-search-results'); const q = query.trim().toLowerCase();
    if (!q) { resultsContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-white/50 font-bold mt-10"><i data-lucide="cake" class="w-16 h-16 mb-4 opacity-30"></i><p>ابدأ البحث في قائمة حلويات بوسي...</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    const matches = catalog.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)) || (p.desc && p.desc.toLowerCase().includes(q)));
    if (matches.length === 0) { resultsContainer.innerHTML = `<div class="flex flex-col items-center justify-center text-white/70 font-bold mt-10 bg-white/5 p-8 rounded-2xl"><i data-lucide="search-x" class="w-12 h-12 mb-4 text-pink-400"></i><p>لم نجد تطابق للبحث عن "${escapeHTML(query)}"</p><p class="text-xs opacity-70 mt-2">جرب البحث بكلمة مختلفة مثل "تورتة"، "نوتيلا"، "لوتس"</p></div>`; if(window.lucide) lucide.createIcons(); return; }
    resultsContainer.innerHTML = matches.map(p => {
        const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category)); const isOutOfStock = p.inStock === false;
        return `<div class="flex items-center gap-4 p-3 rounded-2xl bg-white shadow-sm border border-pink-100 transition-all hover:shadow-md cursor-pointer ${isOutOfStock ? 'opacity-70' : ''}" onclick="toggleLiveSearch(false); setCategory('${p.category}'); setTimeout(()=> { const el = document.getElementById('product-card-${p.id}'); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('highlight-target'); setTimeout(()=>el.classList.remove('highlight-target'), 2500);} }, 500);"><img src="${imgUrl}" class="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100 ${isOutOfStock ? 'grayscale' : ''}"><div class="flex-1"><h4 class="font-bold text-sm text-gray-800">${escapeHTML(p.name)}</h4><div class="flex items-center gap-2 mt-1"><span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">${p.category}</span><span class="font-bold text-pink-600 text-sm">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span></div></div><div class="px-2">${isOutOfStock ? `<span class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100"><i data-lucide="ban" class="w-3 h-3 inline"></i> نفدت</span>` : `<button class="w-10 h-10 bg-pink-50 text-pink-500 hover:bg-pink-500 hover:text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>`}</div></div>`;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

function shareProduct(id, name) {
    const url = window.location.origin + window.location.pathname + '?product=' + id;
    if (navigator.share) { navigator.share({ title: siteSettings.brandName + ' - ' + name, text: 'شوف المنتج الروعة ده من حلويات بوسي!', url: url }).catch(console.error); } 
    else { navigator.clipboard.writeText(url).then(() => { showSystemToast('تم نسخ رابط المنتج بنجاح!', 'success'); }).catch(() => { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showSystemToast('تم نسخ الرابط!', 'success'); }); }
}

function toggleCustomerMenu(show) {
    const ov = document.getElementById('customer-menu-overlay'); const sd = document.getElementById('customer-menu-sidebar');
    if (show) { ov.classList.remove('hidden'); setTimeout(() => { ov.classList.add('opacity-100'); sd.classList.remove('translate-x-full'); }, 10); } 
    else { ov.classList.remove('opacity-100'); sd.classList.add('translate-x-full'); setTimeout(() => ov.classList.add('hidden'), 500); }
}

function renderCustomerSidebarCategories() {
    const container = document.getElementById('sidebar-categories');
    if(!container) return;
    container.innerHTML = catMenu.map(c => `<button onclick="toggleCustomerMenu(false); setCategory('${c}')" class="text-right w-full p-3 rounded-xl font-bold text-sm transition-all hover:bg-gray-50 flex items-center justify-between" style="border: 1px solid hsl(var(--brand-hue), 80%, 95%); color: var(--site-text);"><span>${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}</span><i data-lucide="chevron-left" class="w-4 h-4 opacity-50"></i></button>`).join('');
    if(window.lucide) lucide.createIcons();
}

function renderCustomerGallery() {
    const sec = document.getElementById('gallery-customer-section'); const slider = document.getElementById('gallery-slider');
    if(!sec) return;
    if (galleryData.length === 0) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    slider.innerHTML = galleryData.map(g => `<div class="shrink-0 cursor-pointer hover:scale-105 transition-transform" onclick="openLightbox('${g.url}')"><div class="w-32 h-40 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-sm border" style="border-color: hsl(var(--brand-hue), 80%, 90%);"><img src="${g.url}" class="w-full h-full object-cover" loading="lazy" alt="سابقة أعمال حلويات بوسي"></div></div>`).join('');
}

function openLightbox(url) { const lb = document.getElementById('gallery-lightbox'); document.getElementById('lightbox-img').src = url; lb.classList.remove('hidden'); lb.classList.add('flex'); if(window.lucide) lucide.createIcons(); }
function closeLightbox() { const lb = document.getElementById('gallery-lightbox'); lb.classList.add('hidden'); lb.classList.remove('flex'); }

function renderCategories() {
    const el = document.getElementById('categories-nav');
    if(!el) return;
    el.innerHTML = catMenu.map(c => `<button id="cat-btn-${c.replace(/\s+/g, '-')}" onclick="setCategory('${c}')" class="whitespace-nowrap px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold transition-all border-2 text-sm sm:text-base ${state.activeCat === c ? 'text-white shadow-lg scale-105 brand-gradient border-transparent' : 'border-pink-100 hover:border-pink-300'}" style="${state.activeCat === c ? '' : `background-color: var(--site-bg); color: var(--site-text); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${c === 'ورد' ? 'ورد وهدايا 💐' : (c === 'تورت' ? 'تورت وتصميم 🎂' : c)}</button>`).join('');
}

function setCategory(c) { state.activeCat = c; renderCategories(); renderMainDisplay(); setTimeout(() => { const activeBtn = document.getElementById(`cat-btn-${c.replace(/\s+/g, '-')}`); if (activeBtn) { activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); } }, 50); }

function renderFlowerTabs(container) {
    container.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex flex-wrap justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${fTypes.map(f => `<button onclick="setSub('f', '${f}')" class="flex-1 min-w-[100px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.fType === f ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.fType === f ? '' : 'color: var(--site-text);'}">${f}</button>`).join('')}</div>`;
}

function setSub(t, v) { 
    if(t === 's') { state.dSize = v; renderMainDisplay(); } 
    if(t === 'f') {
        state.fType = v;
        const targetSection = document.getElementById(`flower-group-${v.replace(/\s+/g, '-')}`);
        if(targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const subTabs = document.getElementById('sub-tabs-area');
        if(subTabs) renderFlowerTabs(subTabs); 
    }
}

function renderMainDisplay() {
    const container = document.getElementById('display-container'); const subTabs = document.getElementById('sub-tabs-area');
    if(!container) return;
    subTabs.classList.add('hidden'); container.innerHTML = '';
    if (state.activeCat === 'تورت') { renderCakeBuilder(container); } 
    else if (state.activeCat === 'ورد') {
        subTabs.classList.remove('hidden'); renderFlowerTabs(subTabs);
        let flowerHtml = `<div class="flex flex-col gap-12 w-full">`;
        fTypes.forEach(type => {
            const list = catalog.filter(p => p.category === 'ورد' && (p.flowerType === type || (p.desc && p.desc.includes(type))));
            if(list.length > 0) { flowerHtml += `<div id="flower-group-${type.replace(/\s+/g, '-')}" class="space-y-6 animate-fade-in"><div class="flex items-center gap-4 mb-4"><h3 class="font-black text-xl text-pink-600 shrink-0">${type}</h3><div class="h-[1px] w-full bg-pink-100"></div></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${list.map(p => drawProductCard(p, 'full')).join('')}</div></div>`; }
        });
        flowerHtml += `</div>`; container.innerHTML = flowerHtml;
    }
    else {
        if (state.activeCat === 'ديسباسيتو') {
            subTabs.classList.remove('hidden');
            subTabs.innerHTML = `<div class="p-2 rounded-2xl shadow-sm border flex justify-center gap-2" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);">${dSizes.map(s => `<button onclick="setSub('s', '${s}')" class="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${state.dSize === s ? 'text-white shadow-md brand-gradient' : 'opacity-80 hover:opacity-100'}" style="${state.dSize === s ? '' : 'color: var(--site-text);'}">${s}</button>`).join('')}</div>`;
        }
        let list = catalog.filter(p => p.category === state.activeCat);
        if (state.activeCat === 'ديسباسيتو') list = list.filter(p => p.size === state.dSize || p.subType === state.dSize || (p.desc && p.desc.includes(state.dSize)));
        const userLayout = siteSettings.productLayout || 'grid';
        container.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 items-stretch">${list.map(p => drawProductCard(p, userLayout)).join('')}</div>`;
    }
    if(window.lucide) lucide.createIcons();
}

window.updateTempQty = function(id, delta) {
    const el = document.getElementById('temp-qty-' + id);
    if(el) {
        let val = parseInt(el.innerText.replace(/[^0-9]/g, '')) + delta;
        if(val < 1) val = 1; if(val > 50) val = 50;
        el.innerText = val; 
    }
};

window.addWithQty = function(id) {
    const el = document.getElementById('temp-qty-' + id);
    let qty = 1; if(el) qty = parseInt(el.innerText) || 1;
    const safeId = String(id); const prod = catalogMap.get(safeId); 
    if (!prod) return;
    if (prod.inStock === false) { showSystemToast('نأسف، هذا المنتج غير متوفر حالياً.', 'error'); return; }
    const exist = state.cart.find(i => String(i.id) === safeId);
    if (exist) { exist.quantity = Number(exist.quantity) + qty; } 
    else { const newCartItem = JSON.parse(JSON.stringify(prod)); newCartItem.quantity = qty; newCartItem.cartItemId = generateUniqueID(); state.cart.push(newCartItem); }
    saveCartToStorage(); syncCartUI(); updateCardUI(safeId); calculateCartTotal(); 
    showSystemToast(`تم إضافة الكمية (${qty}) للسلة بنجاح 🛍️`, 'success');
};

function drawProductCard(p, layoutMode = 'grid') {
    const pIdSafe = String(p.id); 
    let itemLayout = (p.layout && p.layout !== 'default') ? p.layout : layoutMode;
    let isFullWidth = (itemLayout === 'full');
    const isOutOfStock = p.inStock === false;
    const imageList = (p.images && p.images.length > 0) ? p.images : [p.img || getImgFallback(p.category)];
    
    const finalDesc = getFinalDescription(p, isFullWidth);

    const renderActionArea = () => {
        if (isOutOfStock) return `<div class="w-full py-2.5 mt-auto text-[11px] font-bold text-pink-500 bg-pink-50 rounded-xl text-center border border-pink-100">نفدت الكمية 😔</div>`;
        return `
        <div class="mt-auto flex flex-col gap-2 w-full pt-1">
            <div class="flex items-center justify-center bg-pink-50/80 rounded-full py-1 px-3 border border-pink-100 mx-auto min-w-[70%] shadow-sm">
                <span class="font-black text-[14px] sm:text-[16px] text-pink-700">${Number(p.price) > 0 ? p.price + ' ج.م' : 'حسب الطلب'}</span>
            </div>
            
            <div class="flex items-center justify-between gap-2 w-full">
                <div class="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-100 shadow-inner">
                    <button onclick="updateTempQty('${p.id}', -1)" class="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-pink-600 bg-white rounded shadow-sm hover:bg-pink-50 active:scale-90 transition-all"><i data-lucide="minus" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
                    <span id="temp-qty-${p.id}" class="text-[11px] sm:text-[13px] font-black text-gray-700 w-3 sm:w-4 text-center">1</span>
                    <button onclick="updateTempQty('${p.id}', 1)" class="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-pink-600 bg-white rounded shadow-sm hover:bg-pink-50 active:scale-90 transition-all"><i data-lucide="plus" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
                </div>
                
                <button onclick="addWithQty('${p.id}')" class="flex-1 py-1.5 sm:py-2 bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-lg font-bold text-[11px] sm:text-[13px] shadow-sm shadow-pink-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-pink-400/50">
                    <i data-lucide="shopping-basket" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i> إضافة
                </button>
            </div>
        </div>`;
    };

    const titleClass = isFullWidth ? 'text-[15px] sm:text-[18px] mb-2' : 'text-[13px] sm:text-[15px] mb-1';
    
    const descClass = isFullWidth 
        ? 'text-[12px] sm:text-[14px] font-bold text-gray-600 leading-relaxed mb-4 px-2' 
        : 'text-[10px] sm:text-[11px] font-bold text-gray-600 leading-tight mb-2 px-0.5';

    return `
    <div id="product-card-${p.id}" class="${isFullWidth ? 'col-span-full' : ''} bg-white flex flex-col h-full overflow-hidden border border-pink-100/80 rounded-[1.2rem] sm:rounded-[1.5rem] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
        <div class="relative aspect-square overflow-hidden bg-pink-50/30 shrink-0">
            <button onclick="shareProduct('${p.id}', '${escapeHTML(p.name)}')" class="absolute top-2 left-2 z-20 w-7 h-7 sm:w-9 sm:h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-pink-500 shadow-sm transition-all hover:scale-110"><i data-lucide="share-2" class="w-3 h-3 sm:w-4 sm:h-4"></i></button>
            <div id="slider-${p.id}" class="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar snap-slider">
                ${imageList.map(url => `<img src="${url}" class="min-w-full h-full object-cover snap-slide transition-transform duration-700 hover:scale-105" loading="lazy" alt="${escapeHTML(p.name)}">`).join('')}
            </div>
        </div>
        
        <div class="p-2.5 sm:p-4 flex flex-col flex-1 text-center bg-white">
            <h4 class="${titleClass} font-black leading-tight" style="color: hsl(var(--brand-hue), 70%, 40%);">${escapeHTML(p.name)}</h4>
            <p class="${descClass}">${finalDesc}</p>
            ${renderActionArea()}
        </div>
    </div>`;
}

function getImgFallback(cat) {
    const m = { 'تورت': 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80', 'جاتوهات': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 'قشطوطة': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80', 'بامبوليني': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 'دوناتس': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80', 'ديسباسيتو': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=800&q=80', 'سينابون': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80', 'ريد فيلفت': 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80', 'كبات السعادة': 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80', 'ميل فاي': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80', 'إكلير': 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=800&q=80', 'تشيز كيك': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 'عروض وبوكسات': 'https://images.unsplash.com/photo-1558326567-98ae2405596b?auto=format&fit=crop&w=800&q=80', 'ميني تورتة': 'https://images.unsplash.com/photo-1562777717-b6aff3dacd65?auto=format&fit=crop&w=800&q=80', 'ورد': 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=800&q=80' };
    return m[cat] || m['جاتوهات'];
}

function renderCakeBuilder(target) {
    const c = state.cakeBuilder; const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145; const imgOpts = settings.imagePrinting || defaultSettings.cakeBuilder.imagePrinting;
    const selectedImgOption = imgOpts.find(opt => opt.label === c.img) || {price: 0};
    const price = Number(c.ps) * baseP + Number(selectedImgOption.price);
    const flavors = settings.flavors || ['فانيليا']; const imagesList = (settings.images && settings.images.length > 0) ? settings.images : [getImgFallback('تورت')];
    const descText = settings.desc || defaultSettings.cakeBuilder.desc;
    let sliderHtml = `<div class="w-full md:w-2/5 aspect-[3/4] md:aspect-square rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-2 shadow-xl relative flex snap-slider hide-scrollbar bg-white group" style="border-color: hsl(var(--brand-hue), 80%, 90%);">${imagesList.map(url => `<img src="${url}" class="w-full h-full object-cover shrink-0 snap-slide transition-transform duration-700 group-hover:scale-105">`).join('')}</div>`;
    target.innerHTML = `<div class="rounded-[2.5rem] shadow-xl border overflow-hidden animate-fade-in relative" style="background-color: var(--site-bg); border-color: hsl(var(--brand-hue), 80%, 90%);"><div class="p-6 md:p-10 border-b flex flex-col md:flex-row items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);">${sliderHtml}<div class="flex-1 text-center md:text-right"><h2 class="text-2xl md:text-4xl font-bold mb-4 uppercase tracking-tight" style="color: hsl(var(--brand-hue), 70%, 50%);">تخصيص التورت الملكية 👑</h2><p class="text-sm md:text-base font-bold leading-loose opacity-80" style="color: var(--site-text);">${escapeHTML(descText)}</p></div></div><div class="p-6 md:p-12 space-y-12"><div class="grid grid-cols-1 lg:grid-cols-2 gap-10"><div class="space-y-4"><label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="cake" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> نكهة الكيك المفضلة</label><div class="grid grid-cols-2 md:grid-cols-4 gap-3">${flavors.map(fl => `<button onclick="uCake('flv', '${escapeHTML(fl)}')" class="py-3 rounded-xl font-bold border-2 text-sm transition-all ${c.flv === fl ? 'text-white shadow-md scale-105 brand-gradient border-transparent' : 'hover:opacity-80'}" style="${c.flv === fl ? '' : `background-color: var(--site-bg); color: hsl(var(--brand-hue), 70%, 50%); border-color: hsl(var(--brand-hue), 80%, 90%);`}">${escapeHTML(fl)}</button>`).join('')}</div></div><div class="space-y-4"><label class="font-bold text-lg flex items-center gap-2" style="color: var(--site-text);"><i data-lucide="heart" style="color: hsl(var(--brand-hue), 70%, 60%);"></i> عدد الأفراد</label><div class="flex items-center justify-between border rounded-2xl p-2 shadow-inner h-full max-h-[80px]" style="background-color: hsl(var(--brand-hue), 80%, 97%); border-color: hsl(var(--brand-hue), 80%, 90%);"><button onclick="adjP(-2)" class="p-3 rounded-xl border hover:scale-105 transition-all"><i data-lucide="minus"></i></button><span class="text-3xl font-bold">${c.ps}</span><button onclick="adjP(2)" class="p-3 rounded-xl border hover:scale-105 transition-all"><i data-lucide="plus"></i></button></div></div></div></div><div class="p-8 md:p-14 border-t-2 flex flex-col md:flex-row justify-between items-center gap-8" style="background-color: hsl(var(--brand-hue), 80%, 95%);"><div class="text-center md:text-right"><span class="block font-bold mb-2">الإجمالي التقديري</span><span class="text-4xl md:text-6xl font-bold">${price} ج.م</span></div><button onclick="commitCakeBuilder()" class="w-full md:w-auto text-white font-bold text-xl md:text-2xl py-5 px-12 rounded-2xl shadow-xl brand-gradient">إضافة للمراجعة</button></div></div>`;
    if(window.lucide) lucide.createIcons();
}

function uCake(k, v) { state.cakeBuilder[k] = v; renderMainDisplay(); }
function adjP(d) {
    let n = Number(state.cakeBuilder.ps) + Number(d); if (n < 4) n = 4;
    state.cakeBuilder.ps = n; renderMainDisplay();
}

function updateCardUI(id) {
    const safeId = String(id); const cardEl = document.getElementById(`product-card-${safeId}`);
    const prod = catalogMap.get(safeId); const userLayout = siteSettings.productLayout || 'grid';
    if (cardEl && prod) { cardEl.outerHTML = drawProductCard(prod, userLayout); if(window.lucide) lucide.createIcons(); }
}

function renderCartCrossSell() {
    const cartIds = state.cart.map(i => String(i.id)); 
    let available = catalog.filter(p => !cartIds.includes(String(p.id)) && p.inStock !== false);
    if (available.length === 0) return '';
    let suggestions = available.slice(0, 3);
    return `<div class="mt-8 animate-fade-in border-t border-dashed border-pink-200 pt-6"><p class="text-sm font-black text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="sparkles"></i> كملي اللحظة الحلوة بمنتجات تليق بيكي</p><div class="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-slider">${suggestions.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.img || getImgFallback(p.category));
        return `<div class="shrink-0 w-[260px] snap-slide bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col group"><div class="relative w-full h-36 mb-4 rounded-xl overflow-hidden bg-gray-50"><img src="${img}" class="w-full h-full object-cover"></div><div class="flex-1 flex flex-col"><h5 class="text-[14px] font-bold mb-1">${escapeHTML(p.name)}</h5><div class="flex items-center justify-between mt-auto"><span class="text-pink-600 font-black">${p.price} ج.م</span><button onclick="addWithQty('${p.id}')" class="px-4 py-2 border border-pink-200 text-pink-500 rounded-xl text-[11px] font-bold">إضافة</button></div></div></div>`;
    }).join('')}</div></div>`;
}

function renderCartList() {
    const container = document.getElementById('cart-list'); const crossSellArea = document.getElementById('cross-sell-area'); const totalDisplay = document.getElementById('cart-total-display');
    if (!container) return;
    if (state.cart.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center py-12 px-4 text-center"><i data-lucide="shopping-bag" class="w-10 h-10 text-pink-300 mb-4"></i><h3 class="font-bold">سلة حلويات بوسي في انتظارك 🌸</h3><button onclick="toggleCart(false)" class="mt-6 bg-pink-500 text-white px-8 py-3 rounded-2xl font-bold">يلا نتسوق</button></div>`;
        if (crossSellArea) crossSellArea.innerHTML = ''; if (totalDisplay) totalDisplay.innerText = "0 ج.م"; if (window.lucide) lucide.createIcons(); return;
    }
    let total = 0;
    container.innerHTML = state.cart.map(item => {
        const identifier = item.cartItemId || item.id; const q = Number(item.quantity); const p = Number(item.price); total += (p * q);
        const renderImg = (item.images && item.images.length > 0) ? item.images[0] : (item.img || getImgFallback(item.category));
        return `<div class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl mb-3 shadow-sm"><div class="w-16 h-16 rounded-xl overflow-hidden"><img src="${renderImg}" class="w-full h-full object-cover"></div><div class="flex-1 text-right"><h4 class="font-bold text-[13px]">${escapeHTML(item.name)}</h4><p class="text-pink-500 font-bold">${p} ج.م</p></div><div class="flex flex-col items-end gap-2"><button onclick="modQ('${identifier}', -${q})" class="p-1 text-gray-300 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button><div class="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border"><button onclick="modQ('${identifier}', -1)"><i data-lucide="minus" class="w-3 h-3"></i></button><span>${q}</span><button onclick="modQ('${identifier}', 1)"><i data-lucide="plus" class="w-3 h-3"></i></button></div></div></div>`;
    }).join('');
    if (totalDisplay) totalDisplay.innerText = total + " ج.م";
    if (crossSellArea) crossSellArea.innerHTML = renderCartCrossSell();
    if (window.lucide) lucide.createIcons();
}

function modQ(cartId, d) {
    const safeCartId = String(cartId); const it = state.cart.find(x => String(x.cartItemId) === safeCartId || String(x.id) === safeCartId);
    if (it) { it.quantity = Number(it.quantity) + Number(d); if (it.quantity <= 0) state.cart = state.cart.filter(x => String(x.cartItemId) !== safeCartId && String(x.id) !== safeCartId); }
    saveCartToStorage(); syncCartUI(); if(it && it.id) updateCardUI(it.id); calculateCartTotal();
}

function commitCakeBuilder() {
    const c = state.cakeBuilder; const settings = siteSettings.cakeBuilder || defaultSettings.cakeBuilder;
    const baseP = Number(settings.basePrice) || 145;
    const pr = Number(c.ps) * baseP;
    let ds = `النكهة: ${c.flv} | العدد: ${c.ps} أفراد | الشكل: ${c.sh}`;
    const customId = generateUniqueID();
    state.cart.push({ id: customId, cartItemId: customId, name: 'تورتة الفئة الملكية (تصميم خاص)', price: pr, desc: ds, quantity: 1, isCustom: true });
    saveCartToStorage(); toggleCart(true); calculateCartTotal();
    state.cakeBuilder.msg = ''; renderMainDisplay(); showSystemToast('تم تسجيل التورتة في السلة بنجاح', 'success');
}

function toggleDeliveryMethod() {
    const method = document.querySelector('input[name="delivery_method"]:checked').value;
    const areaContainer = document.getElementById('delivery-area-container'); const pickupInfo = document.getElementById('pickup-info');
    if (method === 'pickup') { areaContainer.classList.add('hidden'); pickupInfo.classList.remove('hidden'); } 
    else { areaContainer.classList.remove('hidden'); pickupInfo.classList.add('hidden'); }
    calculateCartTotal();
}

function calculateCartTotal() {
    let sub = 0; state.cart.forEach(i => sub += (Number(i.price) * Number(i.quantity)));
    let shipFee = 0; const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'delivery';
    if (deliveryMethod === 'delivery') { const areaSelect = document.getElementById('cust-area'); if(areaSelect && areaSelect.value) { const zone = shippingZones.find(z => String(z.id) === String(areaSelect.value)); if(zone) shipFee = Number(zone.fee); } }
    state.currentShippingFee = shipFee;
    if(document.getElementById('cart-subtotal-text')) document.getElementById('cart-subtotal-text').innerText = sub + ' ج.م';
    if(document.getElementById('cart-shipping-text')) document.getElementById('cart-shipping-text').innerText = (shipFee > 0 ? '+' + shipFee : '0') + ' ج.م';
    
    // ✅ السطر اللي تم إصلاحه لضمان عدم حدوث Syntax Error ويحسب التكلفة الإجمالية بدقة
    if(document.getElementById('cart-total-text')) document.getElementById('cart-total-text').innerText = (sub + shipFee) + ' ج.م';
}

function syncCartUI() {
    const b = document.getElementById('cart-count-badge'); if(!b) return;
    const totalCount = state.cart.reduce((s, i) => s + Number(i.quantity), 0);
    if (totalCount > 0) { b.innerText = totalCount; b.classList.remove('hidden'); } else { b.classList.add('hidden'); }
    renderCartList(); calculateCartTotal();
}

function toggleCart(show) {
    const sd = document.getElementById('cart-sidebar'); if (!sd) return;
    if (show) { sd.classList.remove('-translate-x-full'); backToCart(); renderCartList(); document.body.style.overflow = 'hidden'; } 
    else { sd.classList.add('-translate-x-full'); document.body.style.overflow = 'auto'; }
}

function goToCheckout() {
    const step1 = document.getElementById('step-1-cart'); const step2 = document.getElementById('step-2-checkout');
    if (state.cart.length === 0) { showSystemToast("المشتريات لسه فاضية يا سكر 🌸", "info"); return; }
    step1.classList.add('hidden'); step2.classList.remove('hidden'); step2.scrollTop = 0;
}

function backToCart() {
    const step1 = document.getElementById('step-1-cart'); const step2 = document.getElementById('step-2-checkout');
    step2.classList.add('hidden'); step1.classList.remove('hidden');
}

async function submitOrder() {
    if (state.cart.length === 0) return;
    const cName = document.getElementById('cust-name').value.trim(); const cPhone = document.getElementById('cust-phone').value.trim();
    if (!cName || !cPhone) { showSystemToast('يرجى كتابة الاسم والموبايل.', 'error'); return; }
    const orderId = 'BS-' + Math.floor(10000 + Math.random() * 90000);
    let m = `*طلب جديد من حلويات بوسي* 🧁\n*رقم الطلب:* ${orderId}\n\n👤 الاسم: ${cName}\n📞 الموبايل: ${cPhone}\n`;
    state.cart.forEach((i, idx) => m += `\n*${idx+1}. ${i.name}* (x${i.quantity}) = ${i.price * i.quantity} ج\n`);
    window.open(`https://wa.me/201097238441?text=${encodeURIComponent(m)}`, '_blank');
    state.cart = []; clearCartStorage(); syncCartUI(); toggleCart(false); renderMainDisplay();
    showSystemToast('تم إرسال طلبك بنجاح! 🎂', 'success');
}

function showInfo(t) {
    const d = { about: { t: 'من نحن', b: siteSettings.footerQuote }, privacy: { t: 'سياسة الخصوصية والأمان', b: 'تلتزم إدارة حلويات بوسي بالسرية التامة.' }, refund: { t: 'سياسة الاسترجاع والتعديل', b: 'نسعى دائماً لرضاكم التام في حلويات بوسي.' } };
    if(!d[t]) return;
    document.getElementById('info-title').innerText = d[t].t; document.getElementById('info-body').innerText = d[t].b;
    const m = document.getElementById('info-modal'); m.classList.remove('hidden'); m.classList.add('flex'); if(window.lucide) lucide.createIcons();
}

function closeInfo() { const m = document.getElementById('info-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }

// ⚡ تحسين أداء السكرول والـ Navbar (تقليل استهلاك المعالج)
let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            const n = document.getElementById('navbar');
            if (n) { if (window.scrollY > 30) n.classList.add('nav-scrolled'); else n.classList.remove('nav-scrolled'); }
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

// ⚡ تشغيل وبدء التطبيق مع نظام الإقلاع الآمن المطور (Failsafe Boot)
window.onload = () => {
    // 🛡️ طبقة حماية إضافية: إجبار شاشة التحميل على الاختفاء بعد 8 ثوانٍ كحد أقصى لضمان عدم تعطل تجربة العميل
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader && loader.style.display !== 'none') {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            setTimeout(() => loader.style.display = 'none', 500);
            console.warn("BoseSweets Failsafe: Loader timeout triggered to protect UX.");
        }
    }, 8000);

    initApp();
    autoBindAdminAccess();
};