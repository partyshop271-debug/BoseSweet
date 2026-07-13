/**
 * core-engine.js - المحرك المركزي العالمي وحارس البيانات والحسابات المالية
 * موقع حلويات بوسي (BoseSweets) - النسخة الاحترافية الشاملة والمطورة V6
 * مدمج بالكامل مع قاعدة البيانات المعتمدة لضمان التشغيل 100% على الاستضافات المجانية والموبايل
 */

(function() {
    // 📦 إدراج وضخ قاعدة البيانات المعتمدة كاملاً داخل المحرك لضمان عدم سقوط الموقع نهائياً وتحت أي ظرف
    window.BoseStoreData = {
      "store": {
        "id": "bose-sweets",
        "name": "حلويات بوسي",
        "slogan": "صنعناها بحب لتهديها لمن تحب",
        "currency": "EGP",
        "phone": "01097238441",
        "logo": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
        "theme": {
          "primary": "#FF91A4",
          "secondary": "#D4AF37",
          "text": "#111111",
          "background": "#FFFFFF"
        },
        "font": "Cairo",
        "priceIncrease": {
          "enabled": false,
          "percent": 0,
          "applyOn": "menu-only"
        },
        "pickup": {
          "address": "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور أحمد مجدي وبجوار عيادة الدكتور علي",
          "mapUrl": "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac",
          "shippingFee": 0,
          "message": "لا توجد رسوم شحن عند الاستلام من الفرع."
        }
      },
      "orderRules": {
        "minPreparationTimeHours": 24,
        "preparationTimeMessage": "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة من وقت تأكيد الطلب."
      },
      "seo": {
        "title": "حلويات بوسي | صنعناها بحب لتهديها لمن تحب",
        "description": "منصة بيع إلكترونية متكاملة لعلامة حلويات بوسي الفاخرة. استمتع بتجربة تسوق فريدة، صمم تورتتك الخاصة وبوكيه الورد المخصص عبر محاكياتنا التفاعلية الفريدة.",
        "keywords": ["حلويات", "تورت", "بوكس هدايا", "كاب كيك", "سينابون", "ورد", "دوناتس", "حلويات بوسي"],
        "ogImage": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
        "canonical": "https://bosesweets.com"
      },
      "social": {
        "facebook": "https://www.facebook.com/share/1H1vVMHyu9/",
        "instagram": "https://www.instagram.com/bose_sweets?igsh=amdkMmhxMXJyanYy",
        "tiktok": "https://www.tiktok.com/@bosesweets1?_r=1&_t=ZS-96lRDDHq9QK",
        "whatsapp": "01097238441"
      },
      "navigation": {
        "showSearch": true,
        "showCart": true,
        "topBarMessages": [
          "كل قطعة من حلويات بوسي صنعت يدوياً بحب وشغف لتليق بمناسباتكم السعيدة 🌸",
          "مكونات طبيعية 100% طازجة يومياً للحصول على الطعم الأصلي الفاخر ✨",
          "تميزوا بهداياكم وجلساتكم الفاخرة مع تشكيلة بوكس الروقان وكبات السعادة 👑"
        ],
        "menuItems": ["الرئيسية", "المنيو الشامل", "السلة", "محاكي التورت", "محاكي الورد"]
      },
      "coupons": [
        { "code": "BOSE10", "type": "percent", "value": 10 },
        { "code": "BOOSY", "type": "fixed", "value": 50 },
        { "code": "EID", "type": "percent", "value": 15 }
      ],
      "homepage": {
        "hero": {
          "title": "عقد من التميز في صناعة الحلويات",
          "description": "تم اختيار المكونات بعناية فائقة للحصول على أفضل جودة تليق بمناسباتكم السعيدة وتضمن ثقتكم الدائمة.",
          "video": "",
          "cta": "اطلب الآن"
        },
        "waterfall": {
          "columns": 2,
          "heightMobile": "700px",
          "heightDesktop": "1000px",
          "imageSize": "320px",
          "blurEffect": true,
          "leftColumnImages": [
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl1",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl2",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl3",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl4"
          ],
          "rightColumnImages": [
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr1",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr2",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr3",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr4"
          ]
        },
        "mostSelling": ["toort-custom-master", "gateaux-royal", "qashtota-lotus-new", "despacito-pistachio-new", "cinabon-classic", "donuts-matilda", "happiness-cups-nutella", "relax-box"],
        "newArrivals": ["despacito-pistachio-new", "qashtota-lotus-new", "donuts-pistachio-new", "cinabon-pistachio-new", "happiness-cups-kinder-new", "cupcake-mix-new"],
        "ourProducts": ["gateaux-classic", "qashtota-pistachio", "despacito-dark-nutella", "cinabon-dark-nutella", "donuts-white-nutella", "cupcake-chocolate", "mini-cake-two-person", "happiness-cups-nutella"],
        "categoriesSlider": [
          { "id": "taswaq-toort", "title": "التورت", "builderType": "cake-customizer", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-gatowat", "title": "الجاتوهات", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-qashtota", "title": "القشطوطة", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-despacito", "title": "الديسباسيتو", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-cinabon", "title": "السينابون", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-donuts", "title": "الدوناتس", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-red-velvet", "title": "الريدڤيلڤت", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-cupcake", "title": "الكب كيك", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-mini-cake", "title": "الميني تورت", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-flowers", "title": "الورد", "builderType": "flower-customizer", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-happiness-cups", "title": "كبات السعادة", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },
          { "id": "taswaq-relax-box", "title": "بوكس الروقان", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" }
        ],
        "excellence": {
          "title": "عقد من الإتقان",
          "description": "خلف كل قطعة حكاية شغف وتفاصيل محفورة بالدقة والمهارة الفائقة لتقديم تجربة تذوق ساحرة تأخذكم لعالم من الفخامة والروقان.",
          "images": [
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex1",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex2",
            "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex3"
          ]
        },
        "pride": {
          "title": "الفخر والاعتزاز",
          "text": "أكثر من 10 سنوات خبرة، أكثر من 10000 عميل، أكثر من 10000 طلب ناجح يروون قصة نجاحنا وفخرنا.",
          "stats": {
            "years": { "value": 10, "suffix": "+", "label": "سنوات خبرة" },
            "customers": { "value": 10000, "suffix": "+", "label": "عميل" },
            "orders": { "value": 10000, "suffix": "+", "label": "طلب ناجح" },
            "cakes": { "value": 5000, "suffix": "+", "label": "التورت المصممة" },
            "bouquets": { "value": 3000, "suffix": "+", "label": "منسقة بحب" }
          }
        },
        "cakePreview": {
          "title": "محاكي التورت",
          "description": "حلويات بوسي تتيح تصميم التورت حسب الطلب واختيار كافة التفاصيل التي تناسب ذوقكم ومناسباتكم الفريدة.",
          "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
          "cta": "تصميم التورتة الآن",
          "target": "cake-builder.html"
        },
        "flowerPreview": {
          "title": "محاكي الورد",
          "description": "تخصيص البوكيه واختيار الورد الطبيعي، الصناعي، أو الستان مع إضافة الهدايا والرسائل والصور الخاصة.",
          "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
          "cta": "تصميم البوكيه الآن",
          "target": "flower-builder.html"
        }
      },
      "footer": {
        "about": "صنعناها بحب لتهديها لمن تحب. خبرة أكثر من 10 سنوات في صناعة الحلويات الفاخرة وتنسيق الهدايا والورد لنوثق أسعد لحظاتكم.",
        "links": ["الرئيسية", "المنيو الشامل", "السلة"],
        "policies": ["سياسة الخصوصية", "سياسة الاسترجاع", "سياسة الطلبات", "الشروط والأحكام"],
        "socialLinks": ["facebook", "instagram", "tiktok", "whatsapp"]
      },
      "shippingZones": [
        { "id": "elkefah", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الكفاح", "price": 30 },
        { "id": "aboelhol", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو الهول", "price": 30 },
        { "id": "sanaye3", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الصنايع", "price": 40 },
        { "id": "abobakr", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو بكر", "price": 40 },
        { "id": "farafra", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الفرافرة", "price": 50 },
        { "id": "association", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الجمعية", "price": 50 },
        { "id": "alamal", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الأمل", "price": 50 },
        { "id": "zone-13", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "قرية 13", "price": 70 },
        { "id": "zone-17", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "قرية 17", "price": 70 },
        { "id": "abohoraira", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو هريرة", "price": 140 }
      ],
      "products": [
        {
          "id": "toort-custom-master",
          "slug": "toort-custom-master",
          "category": "taswaq-toort",
          "builderType": "cake-customizer",
          "title": "التورت",
          "flavorName": "تصميم خاص حسب الطلب",
          "flavorDesc": "تورتة مخصصة بالكامل تترجم تفاصيل يومك المميز لشكل بيبهر العين وطعم بيسعد القلب.",
          "layout": "full-card",
          "featured": true,
          "customBuilderUrl": "cake-builder.html",
          "searchTerms": ["تورتة", "تورت", "مناسبات", "عيد ميلاد", "زفاف", "تخصيص"],
          "description": "التورت عندنا مش مجرد حلوى للمناسبة، لكنها قطعة مصممة خصيصاً لصاحب المناسبة. كما تذهب الفتاة إلى مصمم أزياء محترف ليصنع لها فستاناً فريداً يخطف الأنظار، نحن نصمم كل تورتة بشكل يعبر عن شخصية صاحبها وذوقه وتفاصيل يومه المميز. لا نكرر نفس التورتة مرتين، لأن لكل عميل قصة مختلفة تستحق أن تُروى بشكل مختلف. كل تورتة تجمع بين الشكل الذي يحبه العميل والطعم الذي يفضله والتفاصيل التي تعبر عنه. لذلك كانت تورت حلويات بوسي نجمة العديد من المناسبات، وكانت دائماً سبباً في الإبهار قبل التذوق وبعده. ومن أكثر الجمل التي نسمعها من عملائنا: \"لسه حلاوتها في بوقي من يوم ما دوقتها.\"",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 580,
          "basePrice": 580,
          "prices": { "triangle": 580, "medium": 580, "large": 580 },
          "defaultSize": "triangle",
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "gateaux-royal",
          "slug": "gateaux-royal",
          "category": "taswaq-gatowat",
          "builderType": "standard",
          "title": "الجاتوهات",
          "flavorName": "جاتوه ملكي",
          "flavorDesc": "تجربة فخمة غنية بالموسات والصوصات الكثيفة، متنسقة بلمسة ملوكية مخصصة لضيافة تشرفك وتبهر ضيوفك.",
          "layout": "full-card",
          "featured": true,
          "searchTerms": ["جاتوه", "ملكي", "جاتوهات", "قطع"],
          "description": "الجاتوهات عندنا عبارة عن طبقات متوازنة من كيك الفانيليا أو الشوكولاتة مع حشوات غنية من الموسات والصوصات والكريمات المختارة بعناية. نوفر تشكيلة كبيرة ومتنوعة تناسب مختلف المناسبات والأذواق، بحيث يجد كل عميل الجاتوه الذي يناسب ذوقه ويكمل لحظته الجميلة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 638,
          "basePrice": 638,
          "prices": { "triangle": 638, "medium": 638, "large": 638 },
          "defaultSize": "triangle",
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "gateaux-classic",
          "slug": "gateaux-classic",
          "category": "taswaq-gatowat",
          "builderType": "standard",
          "title": "الجاتوهات",
          "flavorName": "جاتوه كلاسيك",
          "flavorDesc": "الطعم الأصيل الموزون والرايق.. طبقات كيك هشة مع كريمة خفيفة، مجهزة بامتياز لجمعاتكم الطيبة وأوقات الشاي الهادئة.",
          "layout": "full-card",
          "featured": false,
          "searchTerms": ["جاتوه", "كلاسيك", "ضيافة"],
          "description": "الجاتوهات عندنا عبارة عن طبقات متوازنة من كيك الفانيليا أو الشوكولاتة مع حشوات غنية من الموسات والصوصات والكريمات المختارة بعناية. نوفر تشكيلة كبيرة ومتنوعة تناسب مختلف المناسبات والأذواق، بحيث يجد كل عميل الجاتوه الذي يناسب ذوقه ويكمل لحظته الجميلة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 506,
          "basePrice": 506,
          "prices": { "triangle": 506, "medium": 506, "large": 506 },
          "defaultSize": "triangle",
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "gateaux-soiree",
          "slug": "gateaux-soiree",
          "category": "taswaq-gatowat",
          "builderType": "standard",
          "title": "الجاتوهات",
          "flavorName": "جاتوه سواريه",
          "flavorDesc": "قطع صغيرة مليانة لذة وأناقة، متنوعة الألوان والنكهات لتناسب الحفلات والاحتفالات الكبرى وتضفي بهجة على التقديم.",
          "layout": "full-card",
          "featured": false,
          "searchTerms": ["جاتوه", "سواريه", "قطع صغيرة"],
          "description": "الجاتوهات عندنا عبارة عن طبقات متوازنة من كيك الفانيليا أو الشوكولاتة مع حشوات غنية من الموسات والصوصات والكريمات المختارة بعناية. نوفر تشكيلة كبيرة ومتنوعة تناسب مختلف المناسبات والأذواق، بحيث يجد كل عميل الجاتوه الذي يناسب ذوقه ويكمل لحظته الجميلة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 374,
          "basePrice": 374,
          "prices": { "triangle": 374, "medium": 374, "large": 374 },
          "defaultSize": "triangle",
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "qashtota-lotus-new",
          "slug": "qashtota-lotus-new",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "لوتس",
          "flavorDesc": "قرمشة أصلية.. زبدة اللوتس الدايبة مع كسر البسكويت، توليفة معمولة بالمليم مع كيك الحليب الساقع عشان تظبط هرمون المزاج.",
          "layout": "two-cards",
          "featured": true,
          "searchTerms": ["وصل حديثا", "قشطوطة", "لوتس"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "qashtota-pistachio",
          "slug": "qashtota-pistachio",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "بيستاشيو",
          "flavorDesc": "فخامة كريمية.. صوص البيستاشيو الأصلي بملمسه الفاخر بيكسو السطح، ليعطي توازناً غنياً وراقياً مع طراوة الكريمة اللباني.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "بيستاشيو", "فستق"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 143,
          "basePrice": 143,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "qashtota-white-nutella",
          "slug": "qashtota-white-nutella",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "نوتيلا وايت",
          "flavorDesc": "نعومة كريمية استثنائية.. طعم نوتيلا الشوكولاتة البيضاء السلسة ينساب بسخاء، لمذاق مبهج يمنحك روقاناً تاماً وانتعاشاً خالصاً.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "نوتيلا وايت", "شوكولاتة بيضاء"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "qashtota-dark-nutella",
          "slug": "qashtota-dark-nutella",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "نوتيلا دارك",
          "flavorDesc": "لعشاق المزاج الصافي والموزون.. نوتيلا دارك بكثافتها الصريحة تكسر حلاوة كيك الحليب لتمنحك فصلاً وانسجاماً من أول معلقة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "نوتيلا دارك", "شوكولاتة غامقة"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "qashtota-kinder",
          "slug": "qashtota-kinder",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "كيندر",
          "flavorDesc": "مذاق طفولي ساحر.. صوص شوكولاتة كيندر الأصلي ينساب فوق طبقة الكريمة، ليملأ تجربتك بالبهجة والروقان الفريد.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "كيندر"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "qashtota-caramel",
          "slug": "qashtota-caramel",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "كراميل",
          "flavorDesc": "حلاوة دافئة وصافية.. صوص الكراميل المكثف بلمستنا الحصرية الحالية ينساب بنعومة، ليعطي كيك الحليب مذاقاً تقليدياً غنياً.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "كراميل"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.7,
          "reviews": []
        },
        {
          "id": "qashtota-mango",
          "slug": "qashtota-mango",
          "category": "taswaq-mango",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "مانجا",
          "flavorDesc": "انتعاش الفاكهة الطبيعية.. مكعبات المانجا الفريش بحلاوتها الغنية بتنزل تظبط الطعم وتفتح النفس فوراً مع غنى كيك الحليب.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "مانجو", "مانجا", "فواكه"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "qashtota-strawberry",
          "slug": "qashtota-strawberry",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "فراولة",
          "flavorDesc": "ميكس بارد منعش.. قطع الفراولة الطبيعية مغمورة بصوصها الخاص، تعطي حلاوة متوازنة وتكسر دسامة الحليب بلمسة مبهجة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "فراولة"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "qashtota-banana",
          "slug": "qashtota-banana",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "موز",
          "flavorDesc": "طعم بيتي دافئ.. شرائح الموز الطازجة المنسقة بعناية، تضفي قواماً ناعماً ومحبوباً يناسب أوقات التحلية العائلية الراقية.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "موز"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.7,
          "reviews": []
        },
        {
          "id": "qashtota-mix",
          "slug": "qashtota-mix",
          "category": "taswaq-qashtota",
          "builderType": "standard",
          "title": "القشطوطة",
          "flavorName": "ميكس نكهات",
          "flavorDesc": "لوحة فنية مبهجة تجمع قطع الفواكه الطازجة مع لمسات من أرقى الصوصات، لترضي كافة الأذواق في علبة واحدة فاخرة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["قشطوطة", "ميكس", "مشكل"],
          "description": "كيك فانيليا مشرب بالحليب بعناية ليحافظ على نعومته وغناه، يعلوه طبقة من الكريمة اللباني بتوليفتنا الخاصة التي تحمل بصمتنا المميزة. ثم تأتي طبقة المكسرات التي أعددناها لتكمل التجربة وتمنح المنتج شخصيته الخاصة، مع إمكانية اختيار التوبنج المفضل للعميل.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "despacito-pistachio-new",
          "slug": "despacito-pistachio-new",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "بيستاشيو",
          "flavorDesc": "فخامة اللقاء الملكي.. توبنج البيستاشيو الأصلي بكثافته وملمسه الفاخر بيمتزج مع موس الشوكولاتة؛ ليعطيك طعماً متوازناً يروق البال.",
          "layout": "tabs",
          "featured": true,
          "searchTerms": ["وصل حديثا", "ديسباسيتو", "بيستاشيو", "فستق"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 83,
          "basePrice": 83,
          "defaultSize": "triangle",
          "prices": { "triangle": 83, "medium": 165, "large": 297 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "despacito-dark-nutella",
          "slug": "despacito-dark-nutella",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "نوتيلا دارك",
          "flavorDesc": "شلال نوتيلا دارك أصلي بينزل يندمج مع كيك الفادج الغني والموس؛ عشان يديكي طعم شوكولاتة صريح ومكثف يظبط مزاجك فوراً.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "نوتيلا دارك"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "despacito-lotus",
          "slug": "despacito-lotus",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "لوتس",
          "flavorDesc": "تناغم القوام الموزون.. زبدة اللوتس الناعمة مع كسر البسكويت المقرمش بيلتقوا مع موس الشوكولاتة ليمنحوك تباين قوام ممتع وسعيد.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "لوتس"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا then طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "despacito-white-nutella",
          "slug": "despacito-white-nutella",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "نوتيلا وايت",
          "flavorDesc": "نعومة كريمية حريرية.. صوص نوتيلا الشوكولاتة البيضاء بيفيض بنعومة فوق الموس الفاخر، ليعطيك حلاوة متناسقة وراحة نفسية تامة.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["despacito", "white-nutella"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.7,
          "reviews": []
        },
        {
          "id": "despacito-caramel",
          "slug": "despacito-caramel",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "كراميل",
          "flavorDesc": "حلاوة دافئة منسابة.. صوص الكراميل الفاخر بملمسه الغني يتخلل الموس السائل؛ ليمنحك مذاقاً مريحاً تروق به النفس كلياً.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "كراميل"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "despacito-kinder",
          "slug": "despacito-kinder",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "كيندر",
          "flavorDesc": "رونق المذاق الفاخر.. صباغة شوكولاتة كيندر المميزة تتخلل قلب الموس الكثيف، لتعطيك إحساساً غنياً ومليئاً بالانسجام الصافي.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "كيندر"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "despacito-blueberry",
          "slug": "despacito-blueberry",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "بلوبيري",
          "flavorDesc": "انتعاش يكسر الدسامة.. حبات البلوبيري البري بنكهتها المركزة والمنعشة، تمنح طبقات الشوكولاتة الثقيلة طعماً متوازناً يلطف الحلاوة فوراً.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "بلوبيري", "توت"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "despacito-raspberry",
          "slug": "despacito-raspberry",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "راسبيري",
          "flavorDesc": "ميكس الأناقة والروقان.. حبات وصوص الراسبيري بنكهته المنعشة، تخطف عينك وتذوب برقة مع ثقل كيك الفادج الغني.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "راسبيري", "توت احمر"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "despacito-cherry",
          "slug": "despacito-cherry",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "كرز",
          "flavorDesc": "لمسة كلاسيكية فخمة.. قطع الكرز الطبيعي بنكهتها العميقة تمنحك توازناً حسياً مبهجاً مع حلاوة موس الشوكولاتة الساحر.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "كرز"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "despacito-snickers",
          "slug": "despacito-snickers",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "سنيكرز",
          "flavorDesc": "قرمشة غنية مضاعفة.. صوص الكراميل مدمج بالكامل مع قطع شوكولاتة سنيكرز وحبات الفول السوداني الفخم، لمزيج ملوكي وقوي القوام.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "سنيكرز", "اسنيكرز"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "despacito-mix",
          "slug": "despacito-mix",
          "category": "taswaq-despacito",
          "builderType": "standard",
          "title": "الديسباسيتو",
          "flavorName": "ميكس شوكليت",
          "flavorDesc": "مشاركة تشوق العين.. تجميعة منوعة ومبهجة من الصوصات والتوبنج الأكثر مبيعاً، مجهزة لترضي جميع الأذواق في جلساتكم الفاخرة.",
          "layout": "tabs",
          "featured": false,
          "searchTerms": ["ديسباسيتو", "ميكس", "شوكولاتة مشكل"],
          "description": "كيك فادج غني مغمور بالشوكولاتة، يعلوه طبقة من النوتيلا ثم طبقة من موس الشوكولاتة بتوليفتنا الخاصة التي تمنحه طعماً متوازناً وغنياً. بعد ذلك يختار العميل التوبنج الذي يفضله ليكمل التجربة بالطريقة التي تناسب ذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 66,
          "basePrice": 66,
          "defaultSize": "triangle",
          "prices": { "triangle": 66, "medium": 132, "large": 264 },
          "sizes": [{ "id": "triangle", "name": "مثلث فردي" }, { "id": "medium", "name": "وسط تشارك ممتع" }, { "id": "large", "name": "كبير جمعات فاخرة" }],
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "cinabon-pistachio-new",
          "slug": "cinabon-pistachio-new",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "بيستاشيو",
          "flavorDesc": "اللمسة الفخمة للشرق.. توبنج البيستاشيو الأصلي بكثافته الكريمية ومذاقه المميز، يذوب روعة فوق صوص التشيز الساخن ليعطيك روقاناً تاماً.",
          "layout": "two-cards",
          "featured": true,
          "searchTerms": ["وصل حديثا", "سينابون", "بيستاشيو", "فستق"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 143,
          "basePrice": 143,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "cinabon-dark-nutella",
          "slug": "cinabon-dark-nutella",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "نوتيلا دارك",
          "flavorDesc": "الميكس الأقرب للقلب.. نوتيلا دارك سايحة ودايبة بغزارة بفعل السخونة وتتمازج مع صوص التشيز، لتظبط هرمون السعادة والمزاج فوراً.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "نوتيلا دارك"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "cinabon-white-nutella",
          "slug": "cinabon-white-nutella",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "وايت نوتيلا",
          "flavorDesc": "نعومة الحليب المذوب.. صوص الوايت نوتيلا الغني ينساب بسلاسة فائقة فوق السطح المخبوز الدافئ، ليمنحك هدوءاً ناعماً ولطيفاً.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "وايت نوتيلا"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "cinabon-blueberry",
          "slug": "cinabon-blueberry",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "بلوبيري",
          "flavorDesc": "لمسة ذكية ومنعشة.. صوص حبات البلوبيري بلمسته اللاذعة الخفيفة يعطي لمسة مبهجة توازن قوام العجينة المخبوزة لراحة البال.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "بلوبيري", "توت"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.7,
          "reviews": []
        },
        {
          "id": "cinabon-raspberry",
          "slug": "cinabon-raspberry",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "راسبيري",
          "flavorDesc": "انتعاش مبهج دافئ.. حبات وصوص الراسبيري بنكهتها المبهجة، تضفي نضارة استثنائية تكسر دسامة الزبدة الفاخرة والقرفة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "rawberry"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "cinabon-raffaello",
          "slug": "cinabon-raffaello",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "رفايلو",
          "flavorDesc": "المذاق المخملي الأبيض.. صوص جوز الهند الكثيف مع جزيئات شوكولاتة الرفايلو الناعمة تمنح القطعة الساخنة نكهة فريدة بالغة الرقي.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "رفايلو"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "cinabon-oreo",
          "slug": "cinabon-oreo",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "اوريو",
          "flavorDesc": "تباين قوام مشوق.. بسكويت الأوريو المطحون يكسو الطبقة الساخنة، ليعطيك قرمشة محبوبة وممتعة مع طراوة العجينة الداكنة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "اوريو"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "cinabon-lotus",
          "slug": "cinabon-lotus",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "لوتس",
          "flavorDesc": "قرمشة بلون الذهب.. زبدة اللوتس الغنية مع كسر البسكويت تكسو السطح، لتمنحك روقاناً متكاملاً يريح النفس والعين.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "لوتس"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "cinabon-kinder",
          "slug": "cinabon-kinder",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "كيندر",
          "flavorDesc": "سلاسة ممتعة ومغشية.. صوص شوكولاتة كيندر الأصلي يذوب بانسيابية فائقة ليتخلل قلب العجينة المخبوزة في كل قطمة مباركة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "كيندر"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "cinabon-caramel",
          "slug": "cinabon-caramel",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "كراميل",
          "flavorDesc": "اللمسة التقليدية الدافئة.. خطوط صوص الكراميل المكثف تمنح صوص التشيز مذاقاً ناعماً ومحسناً يروق البال بامتياز.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "كراميل"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "cinabon-classic",
          "slug": "cinabon-classic",
          "category": "taswaq-cinabon",
          "builderType": "standard",
          "title": "السينابون",
          "flavorName": "كلاسيك",
          "flavorDesc": "الأصل التأسيسي الثابت.. مغطاة كلياً بلمستنا الحصرية من صوص التشيز الكريمي الطبيعي 100% الطازج يومياً بالفرع.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["سينابون", "كلاسيك"],
          "description": "عجينة طرية محشوة بالزبدة والقرفة والسكر، تُخبز بعناية ثم تُغطى بطبقة من صوص التشيز الكلاسيكي المحضر بمكوناتنا الخاصة. بعد ذلك يختار العميل التوبنج الذي يفضله ليحصل على التجربة الأقرب لذوقه.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 121,
          "basePrice": 121,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "donuts-pistachio-new",
          "slug": "donuts-pistachio-new",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "بيستاشيو",
          "flavorDesc": "فخامة كريمية مبهجة.. توبنج البيستاشيو الأصلي بكثافته وملمسه الفاخر، يكسو القطعة بالكامل ليمنح ضيافتك كاريزما فريدة.",
          "layout": "two-cards",
          "featured": true,
          "searchTerms": ["وصل حديثا", "دوناتس", "بيستاشيو", "فستق"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 110,
          "basePrice": 110,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "donuts-white-nutella",
          "slug": "donuts-white-nutella",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "نوتيلا وايت",
          "flavorDesc": "حشو داخلي غني وتغطية خارجية سخية بنكهة نوتيلا الشوكولاتة البيضاء المذوبة بدقة، لمذاق مبهج وسلس تماماً للعين.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "نوتيلا وايت"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "donuts-dark-nutella",
          "slug": "donuts-dark-nutella",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "نوتيلا دارك",
          "flavorDesc": "حشو غني وتغطية كاملة.. نوتيلا دارك مكثفة بتغمر قطعتك الطازة من برة وجوة؛ لمتعة حقيقية تملأ كل قطمة وتروّق البال.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "نوتيلا دارك"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "donuts-lotus",
          "slug": "donuts-lotus",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "لوتس",
          "flavorDesc": "تباين القوام الذهبي.. زبدة اللوتس الغنية مع كسر البسكويت تملأ الداخل وتغطي الوجه، لتمنحك روقاناً تاماً متكاملاً مع العجينة القطنية.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "لوتس"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "donuts-kinder",
          "slug": "donuts-kinder",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "كيندر",
          "flavorDesc": "مذاق كريمي ممتع.. صوص شوكولاتة كيندر الأصلي يملأ قلب قطعتك الفريش من الخارج والداخل، ليعطيك حلاوة خاطفة للأنظار بامتياز.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "كيندر"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "donuts-caramel",
          "slug": "donuts-caramel",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "كراميل",
          "flavorDesc": "حشوة دافئة ومترفة.. صوص الكراميل المكثف المجهز في الفرع يسيل بنعومة داخل وخارج القطعة، ليتناسب بامتياز مع طراوة العجينة مبهجة القوام.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "كراميل"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.7,
          "reviews": []
        },
        {
          "id": "donuts-red-velvet",
          "slug": "donuts-red-velvet",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "ريدفيلفت",
          "flavorDesc": "نعومة مخملية مترفة.. حشوة كريمة الريدفيلفت المتسقة تملأ التفاصيل الداخلية للدوناتس، لإضفاء مظهر ومذاق استثنائي يشرفك أمام ضيوفك.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "ريدفيلفت"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة in كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 99,
          "basePrice": 99,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "donuts-blue-raspberry",
          "slug": "donuts-blue-raspberry",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "بلوبيري + راسبيري",
          "flavorDesc": "مكس انتعاش الفواكه الحقيقي.. توليفة تجمع حبات البلوبيري والراسبيري البري لتعطي طعماً غنياً يزيل أي دسامة فوراً ويضمن راحة العين والنفس.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "بلوبيري", "توت"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 99,
          "basePrice": 99,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "donuts-strawberry",
          "slug": "donuts-strawberry",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "فراولة",
          "flavorDesc": "مذاق صيفي مبهج.. حشوة صوص الفراولة اللذيذ تملأ قطعتك بالكامل مع تغطية وردية ناعمة تفتح الشهية وتحفز على الشراء الفوري.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "فراولة"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "donuts-mango",
          "slug": "donuts-mango",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "مانجا",
          "flavorDesc": "انتعاش يذوب فوراً.. قطع المانجا الفريش بحلاوتها الاستوائية الطبيعية تغمر قطعتك من الداخل، لتجربة صيفية فريدة وخفيفة على المعدة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "مانجا", "مانجو"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 99,
          "basePrice": 99,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "donuts-matilda",
          "slug": "donuts-matilda",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "ماتيلدا",
          "flavorDesc": "الأسطورة الغنية والمكثفة.. القطعة مغمورة بالكامل بشلالات الشوكولاتة الغنية من الداخل والخارج لمتعة مضاعفة تروق البال تماماً.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "ماتيلدا", "شوكولاتة مكثفة"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 110,
          "basePrice": 110,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "donuts-oreo",
          "slug": "donuts-oreo",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "اوريو",
          "flavorDesc": "قرمشة محبوبة الأثر.. حشوة كريمة الأوريو بداخل القطعة الطازجة مع كسر البسكويت بالخارج لمذاق قوي ومبهج وممتع القوام.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "اوريو"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "donuts-cherry",
          "slug": "donuts-cherry",
          "category": "taswaq-donuts",
          "builderType": "standard",
          "title": "الدوناتس",
          "flavorName": "كرز",
          "flavorDesc": "مذاق دافئ متوازن حاد.. توبنج حبات الكرز البري المنتقى بعناية يملأ قلب قطعتك، ليمنحك توازناً استثنائياً في المذاق والطعم الأصلي.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["دوناتس", "كرز"],
          "description": "عجينة هشة وطرية يتم قليها بعناية حتى تصل للقوام المثالي، ثم تُحشى من الداخل بحشوات غنية ويضاف إليها التوبنج المختار من الخارج لتقديم تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 88,
          "basePrice": 88,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "red-velvet-triangle",
          "slug": "red-velvet-triangle",
          "category": "taswaq-red-velvet",
          "builderType": "standard",
          "title": "الريدڤيلڤت",
          "flavorName": "ريدڤيلڤت - كلاسيك مثلث",
          "flavorDesc": "نعومة مخملية ومظهر ساحر يعكس فخامة طبقات موس التشيز والراسبيري المتسق، مجهزة لتقديم فردي أنيق يبهج العين.",
          "layout": "full-card",
          "featured": true,
          "searchTerms": ["ريد فيلفت", "مثلث", "موس تشيز", "راسبيري"],
          "description": "طبقات من الريد ڤيلڤت الغني بقوامه الناعم ولونه المميز مع طبقات من موس التشيز والراسبيري التي تضيف توازناً رائعاً بين الحلاوة والانتعاش لتكوين تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 72,
          "basePrice": 72,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "red-velvet-cup",
          "slug": "red-velvet-cup",
          "category": "taswaq-red-velvet",
          "builderType": "standard",
          "title": "الريدڤيلڤت",
          "flavorName": "ريدڤيلڤت - كب السعادة",
          "flavorDesc": "كوب فردي مترف يجمع طبقات متسقة وموزونة من الريدفيلفت وموس التشيز، لإضفاء تجربة استثنائية تسعد قلبك ومزاجك في أي وقت.",
          "layout": "full-card",
          "featured": false,
          "searchTerms": ["ريد فيلفت", "كب", "موس تشيز", "راسبيري"],
          "description": "طبقات من الريد ڤيلڤت الغني بقوامه الناعم ولونه المميز مع طبقات من موس التشيز والراسبيري التي تضيف توازناً رائعاً بين الحلاوة والانتعاش لتكوين تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 99,
          "basePrice": 99,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "red-velvet-tray",
          "slug": "red-velvet-tray",
          "category": "taswaq-red-velvet",
          "builderType": "standard",
          "title": "الريدڤيلڤت",
          "flavorName": "ريدڤيلڤت - طاجن الروقان",
          "flavorDesc": "طاجن عائلي فاخر يعزز طعم اللمة والمشاركة، ويضفي لمسة فخامة حميمية على جمعاتكم السعيدة ومناسباتكم الكبيرة.",
          "layout": "full-card",
          "featured": false,
          "searchTerms": ["ريد فيلفت", "طاجن", "موس تشيز", "راسبيري", "عائلي"],
          "description": "طبقات من الريد ڤيلڤت الغني بقوامه الناعم ولونه المميز مع طبقات من موس التشيز والراسبيري التي تضيف توازناً رائعاً بين الحلاوة والانتعاش لتكوين تجربة متكاملة في كل قطعة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 165,
          "basePrice": 165,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "cupcake-mix-new",
          "slug": "cupcake-mix-new",
          "category": "taswaq-cupcake",
          "builderType": "standard",
          "title": "الكب كيك",
          "flavorName": "دستة ميكس",
          "flavorDesc": "لوحة مبهجة وموزونة تجمع تشكيلة من أفضل صوصات وحشوات علاماتنا، لتناسب الحفلات ومختلف أذواق المدعوين لراحة العين.",
          "layout": "two-cards",
          "featured": true,
          "searchTerms": ["وصل حديثا", "كب كيك", "ميكس", "مشكل"],
          "description": "قطع صغيرة من اللذة بطابع غني ومميز. يتم تحضير الكيك بنسبة زبدة مدروسة تمنحه قواماً وطعماً مختلفاً، ثم يتم حشو كل قطعة بحشوات وصوصات متنوعة قبل تزيينها بطبقة من الكريمة اللباني الغنية. يمكنك اختيار إضافة صور مطبوعة مميزة للدستة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 324,
          "basePrice": 324,
          "customizationOptions": {
            "printing": {
              "required": false,
              "options": [
                { "id": "none", "name": "بدون إضافة صور", "price": 0, "default": true },
                { "id": "edible", "name": "صور قابلة للأكل للدستة", "price": 60 },
                { "id": "non-edible", "name": "صور غير قابلة للأكل للدستة", "price": 15 }
              ]
            }
          },
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "cupcake-chocolate",
          "slug": "cupcake-chocolate",
          "category": "taswaq-cupcake",
          "builderType": "standard",
          "title": "الكب كيك",
          "flavorName": "دستة شوكولاتة",
          "flavorDesc": "عشاق الكاكاو الفاخر.. 12 قطعة مزينة بالكامل ومحشوة بصوص الشوكولاتة الغني، لتأمين روعة التذوق الصافي الحقيقي.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كب كيك", "شوكولاتة"],
          "description": "قطع صغيرة من اللذة بطابع غني ومميز. يتم تحضير الكيك بنسبة زبدة مدروسة تمنحه قواماً وطعماً مختلفاً، ثم يتم حشو كل قطعة بحشوات وصوصات متنوعة قبل تزيينها بطبقة من الكريمة اللباني الغنية. يمكنك اختيار إضافة صور مطبوعة مميزة للدستة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 324,
          "basePrice": 324,
          "customizationOptions": {
            "printing": {
              "required": false,
              "options": [
                { "id": "none", "name": "بدون إضافة صور", "price": 0, "default": true },
                { "id": "edible", "name": "صور قابلة للأكل للدستة", "price": 60 },
                { "id": "non-edible", "name": "صور غير قابلة للأكل للدستة", "price": 15 }
              ]
            }
          },
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "cupcake-vanilla",
          "slug": "cupcake-vanilla",
          "category": "taswaq-cupcake",
          "builderType": "standard",
          "title": "الكب كيك",
          "flavorName": "دستة فانيليا",
          "flavorDesc": "البساطة الراقية.. 12 قطعة مغطاة بالكريمة اللباني الفاخرة ومحشوة بصوصات الفانيليا الطبيعية، لحلاوة ناعمة ومبهجة تفتح النفس.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كب كيك", "فانيليا"],
          "description": "قطع صغيرة من اللذة بطابع غني ومميز. يتم تحضير الكيك بنسبة زبدة مدروسة تمنحه قواماً وطعماً مختلفاً، ثم يتم حشو كل قطعة بحشوات وصوصات متنوعة قبل تزيينها بطبقة من الكريمة اللباني الغنية. يمكنك اختيار إضافة صور مطبوعة مميزة للدستة.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 324,
          "basePrice": 324,
          "customizationOptions": {
            "printing": {
              "required": false,
              "options": [
                { "id": "none", "name": "بدون إضافة صور", "price": 0, "default": true },
                { "id": "edible", "name": "صور قابلة للأكل للدستة", "price": 60 },
                { "id": "non-edible", "name": "صور غير قابلة للأكل للدستة", "price": 15 }
              ]
            }
          },
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "mini-cake-two-person",
          "slug": "mini-cake-two-person",
          "category": "taswaq-mini-cake",
          "builderType": "standard",
          "title": "الميني تورت",
          "flavorName": "فانيليا وشوكولاتة كلاسيك",
          "flavorDesc": "ميني تورتة تكفي فردين، مغلفة بطبقة فاكيوم أنيقة تظهر عمق الحشوات والموس الموزون؛ لتمنحك احتفالاً ثنائياً شديد الخصوصية والروقان.",
          "layout": "full-card",
          "featured": true,
          "searchTerms": ["ميني تورتة", "فاكيوم", "تورتة صغيرة", "فردين"],
          "description": "طبقات غنية من كيك الفانيليا أو الشوكولاتة مع حشوات موس وصوصات ومكسرات وفواكه مختارة بعناية لتمنحك تجربة متكاملة في حجم صغير أنيق. تُغلف بطبقة فاكيوم شفافة تبرز جمال الطبقات والحشوات داخلها.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 154,
          "basePrice": 154,
          "prices": { "triangle": 154, "medium": 154, "large": 154 },
          "defaultSize": "triangle",
          "options": { "cakeTypes": ["فانيليا", "شوكولاتة", "نصف ونصف"], "customMessage": true, "allergyNote": true },
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "mini-cake-four-person",
          "slug": "mini-cake-four-person",
          "category": "taswaq-mini-cake",
          "builderType": "standard",
          "title": "الميني تورت",
          "flavorName": "فانيليا وشوكولاتة كلاسيك",
          "flavorDesc": "ميني تورتة تكفي 4 أفراد بتغليف الفاكيوم المميز، مخصصة للاحتفالات والمفاجآت العائلية السعيدة والهادئة لراحة النفس والعين.",
          "layout": "full-card",
          "featured": false,
          "searchTerms": ["ميني تورتة", "فاكيوم", "تورتة صغيرة", "اربع افراد"],
          "description": "طبقات غنية من كيك الفانيليا أو الشوكولاتة مع حشوات موس وصوصات ومكسرات وفواكه مختارة بعناية لتمنحك تجربة متكاملة في حجم صغير أنيق. تُغلف بطبقة فاكيوم شفافة تبرز جمال الطبقات والحشوات داخلها.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 308,
          "basePrice": 308,
          "prices": { "triangle": 308, "medium": 308, "large": 308 },
          "defaultSize": "triangle",
          "options": { "cakeTypes": ["فانيليا", "شوكولاتة", "نصف ونصف"], "customMessage": true, "allergyNote": true },
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "mini-cake-six-person",
          "slug": "mini-cake-six-person",
          "category": "taswaq-mini-cake",
          "builderType": "standard",
          "title": "الميني تورت",
          "flavorName": "فانيليا وشوكولاتة كلاسيك",
          "flavorDesc": "ميني تورتة تكفي 6 أفراد، مثالية للجمعات الاحتفالية الصغيرة واللقاءات الراقية لتبث في جلستكم طابع الفخامة والطعم الأصيل المكتمل.",
          "layout": "full-card",
          "featured": false,
          "searchTerms": ["ميني تورتة", "فاكيوم", "تورتة صغيرة", "ست افراد"],
          "description": "طبقات غنية من كيك الفانيليا أو الشوكولاتة مع حشوات موس وصوصات ومكسرات وفواكه مختارة بعناية لتمنحك تجربة متكاملة في حجم صغير أنيق. تُغلف بطبقة فاكيوم شفافة تبرز جمال الطبقات والحشوات داخلها.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 462,
          "basePrice": 462,
          "prices": { "triangle": 462, "medium": 462, "large": 462 },
          "defaultSize": "triangle",
          "options": { "cakeTypes": ["فانيليا", "شوكولاتة", "نصف ونصف"], "customMessage": true, "allergyNote": true },
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "flowers-master",
          "slug": "flowers-master",
          "category": "taswaq-flowers",
          "builderType": "flower-customizer",
          "title": "الورد",
          "flavorName": "تنسيقات وبوكيهات خاصة",
          "flavorDesc": "حضور طاغٍ ونضارة كاملة.. بوكيهات منسقة بأعلى اهتمام بالتفاصيل لتصل وكأنها قطفت للتو لتشرفك أمام من تحب.",
          "layout": "full-card",
          "featured": true,
          "customBuilderUrl": "flower-builder.html",
          "searchTerms": ["ورد طبيعي", "ورد صناعي", "ستان", "بوكيه", "بوكس ورد"],
          "description": "ننفرد بتقديم بوكيهات الورد الطبيعي والصناعي وورد الستان بأعلى مستوى من العناية والاهتمام بالتفاصيل. هدفنا أن يصل الورد للعميل وكأنه قُطف للتو، بكامل نضارته وجماله وحضوره. نوفر مختلف الألوان والأحجام والتنسيقات، سواء كنت تبحث عن بوكيه بسيط، بوكس فاخر، أو تصميم خاص يعبر عن شخص عزيز عليك. كل تفصيلة يتم تنفيذها بعناية حتى يصل الورد بالشكل الذي يشرفك أمام كل من تهديه له.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 400,
          "basePrice": 400,
          "prices": { "triangle": 400, "medium": 400, "large": 400 },
          "defaultSize": "triangle",
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "happiness-cups-kinder-new",
          "slug": "happiness-cups-kinder-new",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "كيندر",
          "flavorDesc": "مذاق سلس ولطيف.. صوص شوكولاتة كيندر الأصلي يغمر الوعاء الفردي ليعطيك حلاوة متسقة ومبهجة تروق بالك تماماً وتعدل المزاج.",
          "layout": "two-cards",
          "featured": true,
          "searchTerms": ["وصل حديثا", "كبات السعادة", "كيندر"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "happiness-cups-nutella",
          "slug": "happiness-cups-nutella",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "نوتيلا",
          "flavorDesc": "طعم النوتيلا الكثيفة والموزعة بسخاء فوق طبقة الموس الغنية، لتعطيك تحلية فردية سريعة تظبط يومك بالكامل وبشكل فوري.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "نوتيلا"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "happiness-cups-lotus",
          "slug": "happiness-cups-lotus",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "لوتس",
          "flavorDesc": "قرمشة الكب السعيد.. زبدة اللوتس الكثيفة مع كسر البسكويت تمنح الكب مذاقاً متوازناً وجذاباً يسعد أوقاتك الهادئة الفردية.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "لوتس"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "happiness-cups-oreo",
          "slug": "happiness-cups-oreo",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "أوريو",
          "flavorDesc": "تباين أسود مبهج.. جزيئات بسكويت الأوريو المقرمش مدمجة مع الموس، بطعم قوي وواضح يخطف حواسك تماماً مع كل معلقة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "اوريو"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "happiness-cups-snickers",
          "slug": "happiness-cups-snickers",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "سنيكرز",
          "flavorDesc": "مزيج مقرمش مكثف.. حبات الفول السوداني المحمص مع صوص الكراميل المكثف وموس علاماتنا الفاخر، لتجربة روقان فردية متكاملة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "سنيكرز", "اسنيكرز"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "happiness-cups-blueberry",
          "slug": "happiness-cups-blueberry",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "بلوبيري",
          "flavorDesc": "انتعاش فردي حاد.. صوص حبات البلوبيري بلمسته المنعشة يوازن قوام الحلوى الناعمة، ويضمن التميز التام وراحة العين والنفس.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "بلوبيري", "توت"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.7,
          "reviews": []
        },
        {
          "id": "happiness-cups-raspberry",
          "slug": "happiness-cups-raspberry",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "راسبيري",
          "flavorDesc": "ميكس الأناقة الفردية.. حبات وصوص الراسبيري بنكهتها المنعشة الطبيعية، تخطف عينك وتذوب برقة مع طبقات الموس السلسة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "راسبيري"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "happiness-cups-cherry",
          "slug": "happiness-cups-cherry",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "كرز",
          "flavorDesc": "لمسة توازن عميقة.. توبنج قطع الكرز البري الطبيعي يضفي نكهة حادة تبهج كبك وتسعد أوقاتك الفخمة والمنفردة بامتياز.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "كرز"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "happiness-cups-kitkat",
          "slug": "happiness-cups-kitkat",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "كيت كات",
          "flavorDesc": "تباين قوام مقرمش.. أصابع شوكولاتة كيت كات مدمجة بانسيابية مع الموس، لتمنحك تجربة تحلية خفيفة ومحبوبة وسريعة البهجة.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "كيت كات"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.8,
          "reviews": []
        },
        {
          "id": "happiness-cups-rocher",
          "slug": "happiness-cups-rocher",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "روشيه",
          "flavorDesc": "الفخامة والروقان الحقيقي.. طعم شوكولاتة روشيه الفاخرة مع حشوة البندق المتميزة بداخل الكب لمحبين المذاق الملوكي المترف.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "روشيه"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 5.0,
          "reviews": []
        },
        {
          "id": "happiness-cups-raffaello",
          "slug": "happiness-cups-raffaello",
          "category": "taswaq-happiness-cups",
          "builderType": "standard",
          "title": "كبات السعادة",
          "flavorName": "رفايلو",
          "flavorDesc": "الرحلة المخملية الناعمة.. صوص جوز الهند مع جزيئات شوكولاتة الرفايلو البيضاء الموزعة بنعومة لراحة العين ونقاء تذوق راقٍ فريد.",
          "layout": "two-cards",
          "featured": false,
          "searchTerms": ["كبات السعادة", "refaello"],
          "description": "أكواب حلوى مصممة لتمنحك تجربة غنية في كل ملعقة. يبدأ الأمر باختيار نوع الكيك المناسب للتوبنج: فانيليا، شوكولاتة، ثم نقوم بإضافة موس وحشوات مختارة بعناية لتتكامل مع النكهة المختارة وتمنح المنتج توازنه الخاص.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 61,
          "basePrice": 61,
          "rating": 4.9,
          "reviews": []
        },
        {
          "id": "relax-box",
          "slug": "relax-box",
          "category": "taswaq-relax-box",
          "builderType": "standard",
          "title": "بوكس الروقان",
          "flavorName": "تجميعة هدايا متكاملة",
          "flavorDesc": "تجميعة السعادة الشاملة والمكثفة.. صُمم ليجمع أكثر المنتجات طلباً في علبة فاخرة تبيض الوش وتسعد قلب أحبابك.",
          "layout": "full-card",
          "featured": true,
          "customBuilderUrl": "",
          "searchTerms": ["بوكس الروقان", "بوكس السعادة", "هدية", "تجميعة", "بوكسات"],
          "description": "تجربة متكاملة تجمع بين أكثر المنتجات التي يحبها عملاؤنا داخل بوكس واحد. يحتوي على: تورتة، 2 كب سعادة، 1 كب ديسباسيتو، 1 كب ريد ڤيلڤت. مناسب للهدايا والجلسات الخاصة والمفاجآت الجميلة ليروق بالك ويسعد قلبك وقلب أحبابك.",
          "images": ["https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"],
          "price": 550,
          "basePrice": 550,
          "prices": { "triangle": 550, "medium": 550, "large": 550 },
          "defaultSize": "triangle",
          "components": { "cake": 1, "happinessCups": 2, "despacitoCup": 1, "redVelvetCup": 1 },
          "rating": 5.0,
          "reviews": []
        }
      ],
      "cakeBuilder": {
        "enabled": true,
        "url": "cake-builder.html",
        "basePrice": 580,
        "pricePerPerson": 145,
        "persons": { "minimum": 4, "maximum": 250, "step": 2 },
        "cakeTypes": [{ "id": "vanilla", "name": "فانيليا" }, { "id": "chocolate", "name": "شوكولاتة" }, { "id": "half-half", "name": "نصف ونصف" }],
        "shapes": [
          { "id": "circle", "name": "دائرة", "minimumPersons": 4 },
          { "id": "heart", "name": "قلب", "minimumPersons": 4 },
          { "id": "square", "name": "مربع", "minimumPersons": 16 },
          { "id": "rectangle", "name": "مستطيل", "minimumPersons": 20 }
        ],
        "printingOptions": [{ "id": "edible", "name": "صورة قابلة للأكل", "price": 60 }, { "id": "non-edible", "name": "صورة غير قابلة للأكل", "price": 15 }],
        "images": {
          "squareMinimum": "المقاس المربع يبدأ من 16 فرد",
          "rectangleMinimum": "المقاس المستطيل يبدأ من 20 فرد",
          "rectangleUpgrade": "عشان تطلع معاك التورتة المستطيلة مظبوطة وبأفضل تنسيق، أقل مقاس بنقدر ننفذه للشكل ده هو 20 فرد.",
          "pricingInfo": "الحسبة هنا قايمة على خامات طبيعية ممتازة ومضمونة 100% عشان تطلع لك تورتة تشرفك قدام ضيوفك وتبسطهم بالطعم الأصلي."
        }
      },
      "flowerBuilder": {
        "enabled": true,
        "url": "flower-builder.html",
        "basePrice": 400,
        "baseFlowers": 15,
        "extraFlowerPrice": 35,
        "flowerTypes": [{ "id": "natural", "name": "ورد طبيعي" }, { "id": "artificial", "name": "ورد صناعي" }, { "id": "satin", "name": "ورد ستان" }],
        "moneyCategories": [{ "amount": 5, "fee": 5 }, { "amount": 10, "fee": 5 }, { "amount": 20, "fee": 10 }, { "amount": 50, "fee": 15 }, { "amount": 100, "fee": 20 }, { "amount": 200, "fee": 30 }],
        "photoPrintPrice": 15,
        "giftCardPrice": 20,
        "chocolateTypes": [{ "id": "local", "name": "شوكولاتة كلاسيك", "price": 20 }, { "id": "premium", "name": "شوكولاتة فاخرة", "price": 30 }, { "id": "rocher", "name": "روشيه مستورد", "price": 50 }],
        "wrappingTypes": [{ "id": "satin", "name": "تغليف ستان فاخر", "price": 50 }, { "id": "classic", "name": "تغليف كلاسيك راقٍ", "price": 30 }, { "id": "box", "name": "بوكس هدايا فاخر", "price": 100 }],
        "largeChocolateMinimumPrice": 100
      }
    };

    window.boseServerTimeOffset = 0;

    function initializeSystemCore() {
        injectEarlyDependencies();
        applyGlobalSEOAndBranding();
        buildAndInjectGlobalComponents();
        window.updateGlobalCartCounter();
        
        // تفعيل حدث الجاهزية الفوري لبقية الملفات
        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
    }

    /**
     * الحسابات وحظر الثغرات المالية
     */
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = product ? (product.price || product.basePrice || 0) : 0;

        if (product && product.prices && opts.size) {
            price = product.prices[opts.size] || price;
        }

        const selectedPrinting = opts.printing || opts.printingType || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (product && product.customizationOptions && product.customizationOptions.printing) {
                const printOptions = product.customizationOptions.printing.options;
                if (Array.isArray(printOptions)) {
                    const printingOpt = printOptions.find(opt => opt.id === selectedPrinting || opt.type === selectedPrinting);
                    if (printingOpt) printingFee = printingOpt.price;
                }
            }
            if (printingFee === 0) {
                if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') printingFee = 60;
                else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') printingFee = 15;
            }
            price += printingFee;
        }
        return window.calculateBosePrice(price, "menu-only");
    };

    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        const isCustomizable = product.isMiniCake || product.type === "custom-cake" || product.type === "custom-flower" || (product.customizationOptions && Object.keys(opts).length > 0);
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        
        return {
            id: finalId, productSlug: product.slug, title: product.title,
            flavorName: opts.flavorName || opts.cakeType || product.flavor || "افتراضي",
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)), quantity: parseInt(quantity, 10) || 1,
            image: product.image || "", type: product.type || "standard",
            customDetails: { cakeType: opts.cakeType || "فانيليا", shape: opts.shape || "circle" }
        };
    };

    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        return /^01[0125][0-9]{8}$/.test(cleaned);
    };

    window.updateGlobalCartCounter = function() {
        const cartCountBadge = document.getElementById('nav-cart-count');
        if (!cartCountBadge) return;
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        let total = 0;
        cart.forEach(item => total += (parseInt(item.quantity, 10) || 1));
        cartCountBadge.textContent = total;
    };

    window.onBoseDatabaseReady = function(callback) {
        callback(window.BoseStoreData);
    };

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.appendChild(font);
        }
    }

    function applyGlobalSEOAndBranding() {
        document.title = window.BoseStoreData.seo.title;
    }

    function buildAndInjectGlobalComponents() {
        const data = window.BoseStoreData;
        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector) {
            let marqueeHtml = data.navigation.topBarMessages.map(msg => `<span class="bose-marquee-item">${msg} ✨</span>`).join('');
            headerInjector.innerHTML = `
                <div id="top-bar-marquee" class="bose-top-bar-marquee-container">
                    <div class="bose-top-bar-marquee-track">${marqueeHtml} ${marqueeHtml}</div>
                </div>
                <header class="bose-sticky-header">
                    <div class="header-right-side">
                        <button id="mobile-menu-toggle" class="bose-nav-btn"><i class="fa-solid fa-bars-staggered"></i></button>
                        <a href="index.html" class="brand-logo-container">
                            <img src="${data.store.logo}" class="brand-logo-img" />
                            <span class="brand-name-display">حلويات بوسي</span>
                        </a>
                    </div>
                    <div class="header-left-side">
                        <button id="nav-search-btn" class="bose-nav-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
                        <a href="cart.html" class="nav-cart-icon-wrapper">
                            <i class="fa-solid fa-bag-shopping bose-nav-btn" style="padding:0;"></i>
                            <span id="nav-cart-count" class="nav-cart-count-badge">0</span>
                        </a>
                    </div>
                </header>
                <div id="bose-sidebar-drawer" class="bose-sidebar-drawer">
                    <div class="sidebar-header">
                        <span class="sidebar-brand-name">قائمة الأقسام الفاخرة</span>
                        <button id="sidebar-close-btn" class="sidebar-close-btn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <ul class="sidebar-links-list">
                        <li class="sidebar-link-item"><a href="index.html">الرئيسية</a></li>
                        <li class="sidebar-link-item"><a href="menu.html">المنيو الشامل</a></li>
                        <li class="sidebar-link-item"><a href="cart.html">سلة التسوق</a></li>
                    </ul>
                </div>
                <div id="bose-sidebar-overlay" class="bose-sidebar-overlay"></div>
            `;
            setupHeaderEvents();
        }

        const footerInjector = document.getElementById('bose-footer-injector');
        if (footerInjector) {
            footerInjector.innerHTML = `
                <footer class="bose-footer">
                    <div class="footer-grid-layout">
                        <div class="footer-column-block">
                            <span class="footer-title">حلويات بوسي</span>
                            <p class="footer-about-paragraph">${data.footer.about}</p>
                        </div>
                    </div>
                    <p class="footer-copyright-block">جميع الحقوق محفوظة &copy; 2026 لعلامة حلويات بوسي الفاخرة.</p>
                </footer>
            `;
        }
    }

    function setupHeaderEvents() {
        const toggle = document.getElementById('mobile-menu-toggle');
        const close = document.getElementById('sidebar-close-btn');
        const drawer = document.getElementById('bose-sidebar-drawer');
        const overlay = document.getElementById('bose-sidebar-overlay');
        if(toggle && drawer && overlay) {
            toggle.addEventListener('click', () => { drawer.classList.add('open'); overlay.classList.add('show'); });
            const closeAll = () => { drawer.classList.remove('open'); overlay.classList.remove('show'); };
            if(close) close.addEventListener('click', closeAll);
            overlay.addEventListener('click', closeAll);
        }
    }

    window.initializeExcellenceSectionSlider = function() {
        const track = document.getElementById('excellence-images-track');
        if (!track) return;
        track.innerHTML = window.BoseStoreData.homepage.excellence.images.map(imgUrl => `
            <div class="perfection-slide-node"><img src="${imgUrl}" alt="إتقان بوسي" /></div>
        `).join('');
    };

    window.setupBoseInteractiveSlider = function(trackId, dotsContainerId) {
        const track = document.getElementById(trackId);
        const dotsContainer = document.getElementById(dotsContainerId);
        if (!track) return;
        let items = Array.from(track.children);
        if (dotsContainer && items.length > 0) {
            dotsContainer.innerHTML = items.map((_, idx) => `<span class="bose-dot-node ${idx===0?'active':''}" data-index="${idx}"></span>`).join('');
            const dots = Array.from(dotsContainer.children);
            track.addEventListener('scroll', () => {
                let activeIndex = Math.round(Math.abs(track.scrollLeft) / items[0].offsetWidth);
                dots.forEach((dot, idx) => dot.classList.toggle('active', idx === activeIndex));
            });
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    let idx = parseInt(e.target.getAttribute('data-index'), 10);
                    track.scrollTo({ left: -(idx * items[0].offsetWidth), behavior: 'smooth' });
                });
            });
        }
    };

    // التشغيل الفوري والآمن للنظام فور تحميل الملف دون انتظار الـ Fetch الخارجي
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSystemCore);
    } else {
        initializeSystemCore();
    }
})();

/**
 * 🛡️ حارس التمهيد لملء شبكة الأصناف الملتزمة والامتثال الحتمي لزر إضافة للسلة
 */
document.addEventListener("DOMContentLoaded", () => {
    window.onBoseDatabaseReady && window.onBoseDatabaseReady((data) => {
        if(document.getElementById('hero-description')) document.getElementById('hero-description').textContent = data.homepage.hero.description;
        if(document.getElementById('excellence-title')) document.getElementById('excellence-title').textContent = data.homepage.excellence.title;
        if(document.getElementById('excellence-description')) document.getElementById('excellence-description').textContent = data.homepage.excellence.description;
        if(document.getElementById('most-selling-title')) document.getElementById('most-selling-title').textContent = "الأكثر مبيعاً";
        if(document.getElementById('most-selling-description')) document.getElementById('most-selling-description').textContent = "تشكيلة مختارة بعناية فائقة تبرز فخامة الاختيارات المعتمدة.";
        if(document.getElementById('new-arrivals-title')) document.getElementById('new-arrivals-title').textContent = "وصل حديثاً";
        if(document.getElementById('new-arrivals-description')) document.getElementById('new-arrivals-description').textContent = "استكشف توليفاتنا الجديدة والمبتكرة الحصرية التي تحمل بصمة الجودة وعراقة الإتقان.";
        if(document.getElementById('our-products-title')) document.getElementById('our-products-title').textContent = "منتجاتنا";
        if(document.getElementById('our-products-description')) document.getElementById('our-products-description').textContent = "تشكيلة غنية ومتنوعة من الحلويات الطازجة يومياً بمكونات طبيعية 100%.";
        if(document.getElementById('categories-section-title')) document.getElementById('categories-section-title').textContent = "تسوق حسب الفئة";
        if(document.getElementById('categories-section-subtitle')) document.getElementById('categories-section-subtitle').textContent = "انتقل مباشرة وبكل سهولة إلى الصنف المفضل لديك عبر فئاتنا الشاملة.";

        function buildProductCardHTML(p) {
            let isCake = (p.id === 'toort-custom-master' || p.slug === 'toort-custom-master');
            let isFlower = (p.id === 'flowers-master' || p.slug === 'flowers-master');
            let url = isCake ? 'cake-builder.html' : (isFlower ? 'flower-builder.html' : `product.html?slug=${p.slug}`);
            return `
                <div class="product-card-unified">
                    <img src="${p.images[0]}" class="product-card-img" alt="${p.title}" loading="lazy" />
                    <h3 class="product-card-title">${p.title}</h3>
                    <span class="product-card-flavor-name">${p.flavorName}</span>
                    <p class="product-card-desc">${p.flavorDesc}</p>
                    <div class="product-card-price">${Math.round(p.price)} جنيه</div>
                    <button class="btn-add-to-cart" onclick="location.href='${url}'">إضافة للسلة</button>
                </div>
            `;
        }

        const msgGrid = document.getElementById('most-selling-grid');
        if (msgGrid) {
            msgGrid.innerHTML = data.products.filter(p => data.homepage.mostSelling.includes(p.id)).map(p => buildProductCardHTML(p)).join('');
            window.setupBoseInteractiveSlider('most-selling-grid', 'most-selling-dots');
        }

        const arrGrid = document.getElementById('new-arrivals-grid');
        if (arrGrid) {
            arrGrid.innerHTML = data.products.filter(p => data.homepage.newArrivals.includes(p.id)).map(p => buildProductCardHTML(p)).join('');
            window.setupBoseInteractiveSlider('new-arrivals-grid', 'new-arrivals-dots');
        }

        const ourGrid = document.getElementById('our-products-grid');
        if (ourGrid) {
            let all = data.products.filter(p => data.homepage.ourProducts.includes(p.id));
            ourGrid.innerHTML = all.slice(0, 4).map(p => buildProductCardHTML(p)).join('');
            const btn = document.getElementById('our-products-show-more');
            if(btn && all.length > 4) {
                btn.textContent = "استعرض المزيد";
                btn.addEventListener('click', () => {
                    ourGrid.innerHTML = all.map(p => buildProductCardHTML(p)).join('');
                    btn.style.display = 'none';
                });
            }
        }

        const catTrack = document.getElementById('categories-track');
        if (catTrack) {
            catTrack.className = "categories-track-scrollable";
            catTrack.innerHTML = data.homepage.categoriesSlider.map(cat => `
                <div class="bose-category-slider-card" onclick="location.href='menu.html'">
                    <img src="${cat.image}" class="category-img" alt="${cat.title}" />
                    <div class="category-title-display">${cat.title}</div>
                </div>
            `).join('');
            window.setupBoseInteractiveSlider('categories-track', 'categories-dots');
        }

        if (document.getElementById('excellence-images-track')) {
            window.initializeExcellenceSectionSlider();
        }
    });
});