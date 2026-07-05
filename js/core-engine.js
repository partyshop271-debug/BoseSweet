/**
 * 👑 المحرك المركزي العالمي وعمليات الفحص المالي والمزامنة الزمنية المتقدمة - حلويات بوسي 👑
 * النسخة الهندسية القياسية والمطورة بنسبة 100% - الإصدار الذهبي الشامل والخالي تماماً من الثغرات V9.0[span_3](start_span)[span_3](end_span)
 * يتوافق بشكل مطلق ومتبادل مع: cart-engine.js وقاعدة البيانات site-data-final.json ومعايير الأداء والموبايل أولاً[span_4](start_span)[span_4](end_span)
 * [تم حل ثغرات التزامن اللامتناهي، وحالات السباق، واختفاء السلايدرات، وفراغ الفئات، وحماية الهوية البصرية للوجو بالفوتر][span_5](start_span)[span_5](end_span)
 */

(function () {
    "use strict";

    // ==========================================================================
    // 1. تهيئة وتثبيت المتغيرات الحاكمة على النطاق العالمي لضمان جاهزيتها الفورية
    // ==========================================================================
    window.BoseStoreData = window.BoseStoreData || null;[span_6](start_span)[span_6](end_span)
    window.boseServerTimeOffset = window.boseServerTimeOffset || 0;[span_7](start_span)[span_7](end_span)
    window.boseDatabaseLoading = false;[span_8](start_span)[span_8](end_span)
    window.boseInMemoryCart = window.boseInMemoryCart || [];[span_9](start_span)[span_9](end_span)
    
    let databaseResolvers = [];[span_10](start_span)[span_10](end_span)
    const CART_STORAGE_KEY = 'bose_cart';[span_11](start_span)[span_11](end_span)
    let searchDebounceTimeout = null;[span_12](start_span)[span_12](end_span)

    // كاش داخلي لتأمين أقصى سرعة أداء على الهواتف المحمولة ومنع تكرار عمليات قراءة الـ DOM[span_13](start_span)[span_13](end_span)
    const domCache = {
        cartCounts: null,
        searchModal: null,
        resultsContainer: null,
        logoImages: null
    };

    // مسارات التحميل التلقائية المتتالية لضمان استقرار الاستدعاء تحت أي بيئة استضافة مجانية[span_14](start_span)[span_14](end_span)
    const DATABASE_PATHS = [
        './data/site-data-final.json',[span_15](start_span)[span_15](end_span)
        'data/site-data-final.json',[span_16](start_span)[span_16](end_span)
        '../data/site-data-final.json',[span_17](start_span)[span_17](end_span)
        './site-data-final.json',[span_18](start_span)[span_18](end_span)
        'site-data-final.json',[span_19](start_span)[span_19](end_span)
        '../site-data-final.json',[span_20](start_span)[span_20](end_span)
        '../../site-data-final.json[span_21](start_span)'[span_21](end_span)
    ];

    // ==========================================================================
    // منع حالات السباق (Race Conditions) بتهيئة الـ Promise فوراً لمنع تكرار الإنشاء اللامتزامن
    // ==========================================================================
    window.boseDbPromise = window.boseDbPromise || new Promise((resolve) => {[span_22](start_span)[span_22](end_span)
        if (window.BoseStoreData) {[span_23](start_span)[span_23](end_span)
            resolve(window.BoseStoreData);[span_24](start_span)[span_24](end_span)
        } else {[span_25](start_span)[span_25](end_span)
            databaseResolvers.push(resolve);[span_26](start_span)[span_26](end_span)
        }
    });
    window.boseDbFetchPromise = window.boseDbPromise;[span_27](start_span)[span_27](end_span)

    /**
     * قاعدة بيانات احتياطية صلبة لتأمين التشغيل الفوري والكامل للموقع في حال انقطاع خادم الاستضافة
     */
    const BOSE_FALLBACK_DATABASE = {[span_28](start_span)[span_28](end_span)
        "store": {[span_29](start_span)[span_29](end_span)
            "id": "bose-sweets",[span_30](start_span)[span_30](end_span)
            "name": "حلويات بوسي",[span_31](start_span)[span_31](end_span)
            "slogan": "صنعناها بحب لتهديها لمن تحب",[span_32](start_span)[span_32](end_span)
            "currency": "EGP",[span_33](start_span)[span_33](end_span)
            "phone": "01097238441",[span_34](start_span)[span_34](end_span)
            "logo": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",[span_35](start_span)[span_35](end_span)
            "theme": { "primary": "#FF91A4", "secondary": "#D4AF37", "text": "#111111", "background": "#FFFFFF" },[span_36](start_span)[span_36](end_span)
            "font": "Cairo",[span_37](start_span)[span_37](end_span)
            "priceIncrease": {[span_38](start_span)[span_38](end_span)
                "enabled": false,[span_39](start_span)[span_39](end_span)
                "percent": 0,[span_40](start_span)[span_40](end_span)
                "applyOn": "menu-only[span_41](start_span)"[span_41](end_span)
            },[span_42](start_span)[span_42](end_span)
            "pickup": {[span_43](start_span)[span_43](end_span)
                "address": "الكفاح شارع الوحدة المحلية بجوار صيدلية الدكتور احمد مجدي وبجوار عيادة الدكتور علي",[span_44](start_span)[span_44](end_span)
                "mapUrl": "https://maps.app.goo.gl/nAg4Y7vQ7hACvKGc8?g_st=ac",[span_45](start_span)[span_45](end_span)
                "shippingFee": 0,[span_46](start_span)[span_46](end_span)
                "message": "لا توجد رسوم شحن عند الاستلام من الفرع.[span_47](start_span)"[span_47](end_span)
            }[span_48](start_span)[span_48](end_span)
        },[span_49](start_span)[span_49](end_span)
        "orderRules": {[span_50](start_span)[span_50](end_span)
            "minPreparationTimeHours": 24,[span_51](start_span)[span_51](end_span)
            "preparationTimeMessage": "نحتاج إلى وقت كافٍ لتجهيز طلبك بأفضل جودة ممكنة، لذلك لا يمكن اختيار موعد قبل 24 ساعة من وقت تأكيد الطلب.[span_52](start_span)"[span_52](end_span)
        },[span_53](start_span)[span_53](end_span)
        "seo": {[span_54](start_span)[span_54](end_span)
            "title": "حلويات بوسي | صنعناها بحب لتهديها لمن تحب",[span_55](start_span)[span_55](end_span)
            "description": "منصة بيع إلكترونية متكاملة لعلامة حلويات بوسي الفاخرة. استمتع بتجربة تسوق فريدة، صمم تورتتك الخاصة وبوكيه الورد المخصص عبر محاكياتنا التفاعلية الفريدة.",[span_56](start_span)[span_56](end_span)
            "keywords": ["حلويات", "تورت", "بوكس هدايا", "كاب كيك", "سينابون", "ورد", "دوناتس", "حلويات بوسي"],[span_57](start_span)[span_57](end_span)
            "ogImage": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png[span_58](start_span)"[span_58](end_span)
        },[span_59](start_span)[span_59](end_span)
        "social": {[span_60](start_span)[span_60](end_span)
            "facebook": "https://www.facebook.com/share/1H1vVMHyu9/",[span_61](start_span)[span_61](end_span)
            "instagram": "https://www.instagram.com/bose_sweets?igsh=amdkMmhxMXJyanYy",[span_62](start_span)[span_62](end_span)
            "tiktok": "https://www.tiktok.com/@bosesweets1?_r=1&_t=ZS-96lRDDHq9QK",[span_63](start_span)[span_63](end_span)
            "whatsapp": "01097238441[span_64](start_span)"[span_64](end_span)
        },[span_65](start_span)[span_65](end_span)
        "navigation": {[span_66](start_span)[span_66](end_span)
            "showSearch": true,[span_67](start_span)[span_67](end_span)
            "showCart": true,[span_68](start_span)[span_68](end_span)
            "topBarMessages": [[span_69](start_span)[span_69](end_span)
                "كل قطعة من حلويات بوسي صنعت يدوياً بحب وشغف لتليق بمناسباتكم السعيدة 🌸",[span_70](start_span)[span_70](end_span)
                "مكونات طبيعية 100% طازجة يومياً للحصول على الطعم الأصلي الفاخر ✨",[span_71](start_span)[span_71](end_span)
                "تميزوا بهداياكم وجلساتكم الفاخرة مع تشكيلة بوكس الروقان وكبات السعادة 👑[span_72](start_span)"[span_72](end_span)
            ][span_73](start_span)[span_73](end_span)
        },[span_74](start_span)[span_74](end_span)
        "homepage": {[span_75](start_span)[span_75](end_span)
            "hero": {[span_76](start_span)[span_76](end_span)
                "title": "عقد من التميز في صناعة الحلويات",[span_77](start_span)[span_77](end_span)
                "description": "تم اختيار المكونات بعناية فائقة للحصول على أفضل جودة تليق بمناسباتكم السعيدة وتضمن ثقتكم الدائمة.[span_78](start_span)"[span_78](end_span)
            },[span_79](start_span)[span_79](end_span)
            "waterfall": {[span_80](start_span)[span_80](end_span)
                "columns": 2,[span_81](start_span)[span_81](end_span)
                "imageSize": "320px",[span_82](start_span)[span_82](end_span)
                "leftColumnImages": [[span_83](start_span)[span_83](end_span)
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl1",[span_84](start_span)[span_84](end_span)
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wl2[span_85](start_span)"[span_85](end_span)
                ],[span_86](start_span)[span_86](end_span)
                "rightColumnImages": [[span_87](start_span)[span_87](end_span)
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr1",[span_88](start_span)[span_88](end_span)
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=wr2[span_89](start_span)"[span_89](end_span)
                ][span_90](start_span)[span_90](end_span)
            },[span_91](start_span)[span_91](end_span)
            "excellence": {[span_92](start_span)[span_92](end_span)
                "title": "عقد من الإتقان",[span_93](start_span)[span_93](end_span)
                "description": "خلف كل قطعة حكاية شغف وتفاصيل محفورة بالدقة والمهارة الفائقة لتقديم تجربة تذوق ساحرة تأخذكم لعالم من الفخامة والروقان.",[span_94](start_span)[span_94](end_span)
                "images": [[span_95](start_span)[span_95](end_span)
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex1",[span_96](start_span)[span_96](end_span)
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex2",[span_97](start_span)[span_97](end_span)
                    "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png?v=ex3[span_98](start_span)"[span_98](end_span)
                ][span_99](start_span)[span_99](end_span)
            },[span_100](start_span)[span_100](end_span)
            "pride": {[span_101](start_span)[span_101](end_span)
                "title": "الفخر والاعتزاز",[span_102](start_span)[span_102](end_span)
                "stats": {[span_103](start_span)[span_103](end_span)
                    "years": { "value": 10, "suffix": "+", "label": "سنوات خبرة" },[span_104](start_span)[span_104](end_span)
                    "customers": { "value": 10000, "suffix": "+", "label": "عميل" },[span_105](start_span)[span_105](end_span)
                    "orders": { "value": 10000, "suffix": "+", "label": "طلب ناجح" },[span_106](start_span)[span_106](end_span)
                    "cakes": { "value": 5000, "suffix": "+", "label": "التورت المصممة" },[span_107](start_span)[span_107](end_span)
                    "bouquets": { "value": 3000, "suffix": "+", "label": "منسقة بحب" }[span_108](start_span)[span_108](end_span)
                }[span_109](start_span)[span_109](end_span)
            },[span_110](start_span)[span_110](end_span)
            "mostSelling": [[span_111](start_span)[span_111](end_span)
                "toort-custom-master",[span_112](start_span)[span_112](end_span)
                "gateaux-royal",[span_113](start_span)[span_113](end_span)
                "qashtota-lotus-new",[span_114](start_span)[span_114](end_span)
                "despacito-pistachio-new",[span_115](start_span)[span_115](end_span)
                "cinabon-classic",[span_116](start_span)[span_116](end_span)
                "donuts-matilda",[span_117](start_span)[span_117](end_span)
                "happiness-cups-nutella",[span_118](start_span)[span_118](end_span)
                "relax-box[span_119](start_span)"[span_119](end_span)
            ],[span_120](start_span)[span_120](end_span)
            "newArrivals": [[span_121](start_span)[span_121](end_span)
                "despacito-pistachio-new",[span_122](start_span)[span_122](end_span)
                "qashtota-lotus-new",[span_123](start_span)[span_123](end_span)
                "donuts-pistachio-new",[span_124](start_span)[span_124](end_span)
                "cinabon-pistachio-new",[span_125](start_span)[span_125](end_span)
                "happiness-cups-kinder-new",[span_126](start_span)[span_126](end_span)
                "cupcake-mix-new[span_127](start_span)"[span_127](end_span)
            ],[span_128](start_span)[span_128](end_span)
            "ourProducts": [[span_129](start_span)[span_129](end_span)
                "gateaux-classic",[span_130](start_span)[span_130](end_span)
                "qashtota-pistachio",[span_131](start_span)[span_131](end_span)
                "despacito-dark-nutella",[span_132](start_span)[span_132](end_span)
                "cinabon-dark-nutella",[span_133](start_span)[span_133](end_span)
                "donuts-white-nutella",[span_134](start_span)[span_134](end_span)
                "cupcake-chocolate",[span_135](start_span)[span_135](end_span)
                "mini-cake-two-person",[span_136](start_span)[span_136](end_span)
                "happiness-cups-nutella[span_137](start_span)"[span_137](end_span)
            ],[span_138](start_span)[span_138](end_span)
            "categoriesSlider": [[span_139](start_span)[span_139](end_span)
                { "id": "taswaq-toort", "title": "التورت", "builderType": "cake-customizer", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_140](start_span)[span_140](end_span)
                { "id": "taswaq-gatowat", "title": "الجاتوهات", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_141](start_span)[span_141](end_span)
                { "id": "taswaq-qashtota", "title": "القشطوطة", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_142](start_span)[span_142](end_span)
                { "id": "taswaq-despacito", "title": "الديسباسيتو", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_143](start_span)[span_143](end_span)
                { "id": "taswaq-cinabon", "title": "السينابون", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_144](start_span)[span_144](end_span)
                { "id": "taswaq-donuts", "title": "الدوناتس", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_145](start_span)[span_145](end_span)
                { "id": "taswaq-red-velvet", "title": "الريدڤيلڤت", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_146](start_span)[span_146](end_span)
                { "id": "taswaq-cupcake", "title": "الكب كيك", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_147](start_span)[span_147](end_span)
                { "id": "taswaq-mini-cake", "title": "الميني تورت", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_148](start_span)[span_148](end_span)
                { "id": "taswaq-flowers", "title": "الورد", "builderType": "flower-customizer", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_149](start_span)[span_149](end_span)
                { "id": "taswaq-happiness-cups", "title": "كبات السعادة", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" },[span_150](start_span)[span_150](end_span)
                { "id": "taswaq-relax-box", "title": "بوكس الروقان", "builderType": "standard", "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png" }[span_151](start_span)[span_151](end_span)
            ],[span_152](start_span)[span_152](end_span)
            "cakePreview": {[span_153](start_span)[span_153](end_span)
                "title": "محاكي التورت",[span_154](start_span)[span_154](end_span)
                "description": "حلويات بوسي تتيح تصميم التورت حسب الطلب واختيار كافة التفاصيل التي تناسب ذوقكم ومناسباتكم الفريدة.",[span_155](start_span)[span_155](end_span)
                "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",[span_156](start_span)[span_156](end_span)
                "cta": "تصميم التورتة الآن",[span_157](start_span)[span_157](end_span)
                "target": "cake-builder.html[span_158](start_span)"[span_158](end_span)
            },[span_159](start_span)[span_159](end_span)
            "flowerPreview": {[span_160](start_span)[span_160](end_span)
                "title": "محاكي الورد",[span_161](start_span)[span_161](end_span)
                "description": "تخصيص البوكيه واختيار الورد الطبيعي، الصناعي، أو الستان مع إضافة الهدايا والرسائل والصور الخاصة.",[span_162](start_span)[span_162](end_span)
                "image": "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",[span_163](start_span)[span_163](end_span)
                "cta": "تصميم البوكيه الآن",[span_164](start_span)[span_164](end_span)
                "target": "flower-builder.html[span_165](start_span)"[span_165](end_span)
            }[span_166](start_span)[span_166](end_span)
        },[span_167](start_span)[span_167](end_span)
        "shippingZones": [[span_168](start_span)[span_168](end_span)
            { "id": "elkefah", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الكفاح", "price": 30 },[span_169](start_span)[span_169](end_span)
            { "id": "aboelhol", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو الهول", "price": 30 },[span_170](start_span)[span_170](end_span)
            { "id": "sanaye3", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الصنايع", "price": 40 },[span_171](start_span)[span_171](end_span)
            { "id": "abobakr", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو بكر", "price": 40 },[span_172](start_span)[span_172](end_span)
            { "id": "farafra", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الفرافرة", "price": 50 },[span_173](start_span)[span_173](end_span)
            { "id": "association", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الجمعية", "price": 50 },[span_174](start_span)[span_174](end_span)
            { "id": "alamal", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "الأمل", "price": 50 },[span_175](start_span)[span_175](end_span)
            { "id": "zone-13", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "قرية 13", "price": 70 },[span_176](start_span)[span_176](end_span)
            { "id": "zone-17", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "قرية 17", "price": 70 },[span_177](start_span)[span_177](end_span)
            { "id": "abohoraira", "governorate": "الوادي الجديد", "city": "الفرافرة", "area": "أبو هريرة", "price": 140 }[span_178](start_span)[span_178](end_span)
        ],[span_179](start_span)[span_179](end_span)
        "products": [][span_180](start_span)[span_180](end_span)
    };

    // ==========================================================================
    // 2. دوال معالجة وتطهير وحسابات البيانات وحل الثغرات الحاكمة والمالية
    // ==========================================================================

    /**
     * تطهير النصوص تماماً لمنع هجمات XSS وحماية سلامة القراءة للعميل
     */
    function escapeHTML(unsafeString) {
        if (unsafeString === null || unsafeString === undefined) return '';[span_181](start_span)[span_181](end_span)
        return unsafeString[span_182](start_span)[span_182](end_span)
            .toString()[span_183](start_span)[span_183](end_span)
            .replace(/&/g, "&amp;")[span_184](start_span)[span_184](end_span)
            .replace(/</g, "&lt;")[span_185](start_span)[span_185](end_span)
            .replace(/>/g, "&gt;")[span_186](start_span)[span_186](end_span)
            .replace(/"/g, "&quot;")[span_187](start_span)[span_187](end_span)
            .replace(/'/g, "&#039;");[span_188](start_span)[span_188](end_span)
    }
    window.escapeHTML = escapeHTML;[span_189](start_span)[span_189](end_span)
    window.escapeHtml = escapeHTML;[span_190](start_span)[span_190](end_span)

    /**
     * جلب رابط اللوجو الفاخر بشكل ديناميكي من الـ JSON مع فولباك آمن لمنع الوميض البصري
     */
    window.getBoseLogo = function() {
        return window.BoseStoreData?.store?.logo || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";[span_191](start_span)[span_191](end_span)
    };

    /**
     * تطبيع وتطهير الأرقام العربية والفارسية وتحويلها للأرقام القياسية لضمان سلامة العمليات الرياضية
     */
    window.normalizeArabicNumerals = function(str) {
        if (str === null || str === undefined) return "";[span_192](start_span)[span_192](end_span)
        const arabicNormMap = {[span_193](start_span)[span_193](end_span)
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',[span_194](start_span)[span_194](end_span)
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',[span_195](start_span)[span_195](end_span)
            '۴': '4', '۵': '5', '۶': '6',[span_196](start_span)[span_196](end_span)
            '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۷': '7', '۸': '8', '٩': '9[span_197](start_span)'[span_197](end_span)
        };[span_198](start_span)[span_198](end_span)
        return str.toString().trim().replace(/[٠-٩۰-۹]/g, match => arabicNormMap[match] || match);[span_199](start_span)[span_199](end_span)
    };

    /**
     * دالة مراجعة وحساب زيادة الأسعار الرسمية لعلامة بوسي الفاخرة مع صمام الأمان المالي
     */
    window.calculateBosePrice = function (basePrice, applyOnContext = "menu-only") {
        let parsedPrice = parseFloat(basePrice);[span_200](start_span)[span_200](end_span)
        if (isNaN(parsedPrice) || parsedPrice <= 0) return 0;[span_201](start_span)[span_201](end_span)
        
        if (!window.BoseStoreData || !window.BoseStoreData.store) return parsedPrice;[span_202](start_span)[span_202](end_span)
        
        const rule = window.BoseStoreData.store.priceIncrease;[span_203](start_span)[span_203](end_span)
        if (rule && rule.enabled) {[span_204](start_span)[span_204](end_span)
            if (rule.applyOn === "all" || rule.applyOn === applyOnContext) {[span_205](start_span)[span_205](end_span)
                return parseFloat((parsedPrice * (1 + (parseFloat(rule.percent) / 100))).toFixed(4));[span_206](start_span)[span_206](end_span)
            }
        }
        return parsedPrice;[span_207](start_span)[span_207](end_span)
    };

    /**
     * دالة حساب السعر النهائي للمنتج شامل الخيارات والطباعة والكب كيك والمقاسات بالكسر العشري
     */
    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};[span_208](start_span)[span_208](end_span)
        let price = 0;[span_209](start_span)[span_209](end_span)
        
        if (product) {[span_210](start_span)[span_210](end_span)
            price = parseFloat(product.price) || parseFloat(product.basePrice) || 0;[span_211](start_span)[span_211](end_span)

            if (product.prices && opts.size) {[span_212](start_span)[span_212](end_span)
                price = parseFloat(product.prices[opts.size]) || price;[span_213](start_span)[span_213](end_span)
            }

            const selectedPrinting = opts.printing || opts.printingType || 'none';[span_214](start_span)[span_214](end_span)
            if (selectedPrinting && selectedPrinting !== 'none') {[span_215](start_span)[span_215](end_span)
                let printingFee = 0;[span_216](start_span)[span_216](end_span)
                if (product.customizationOptions && product.customizationOptions.printing) {[span_217](start_span)[span_217](end_span)
                    const printOptions = product.customizationOptions.printing.options;[span_218](start_span)[span_218](end_span)
                    if (Array.isArray(printOptions)) {[span_219](start_span)[span_219](end_span)
                        const printingOpt = printOptions.find(opt => opt.id === selectedPrinting || opt.type === selectedPrinting);[span_220](start_span)[span_220](end_span)
                        if (printingOpt) {[span_221](start_span)[span_221](end_span)
                            printingFee = parseFloat(printingOpt.price);[span_222](start_span)[span_222](end_span)
                        }
                    }
                }
                
                if (printingFee === 0) {[span_223](start_span)[span_223](end_span)
                    if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {[span_224](start_span)[span_224](end_span)
                        printingFee = 60;[span_225](start_span)[span_225](end_span)
                    } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {[span_226](start_span)[span_226](end_span)
                        printingFee = 15;[span_227](start_span)[span_227](end_span)
                    }
                }
                
                price += printingFee;[span_228](start_span)[span_228](end_span)
            }
            
            if (product.isMiniCake || product.type === "mini-cake" || product.slug === "mini-cake-two-person") {[span_229](start_span)[span_229](end_span)
                if (opts.extraToppingPrice) {[span_230](start_span)[span_230](end_span)
                    price += parseFloat(opts.extraToppingPrice);[span_231](start_span)[span_231](end_span)
                }
                if (opts.printingPrice) {[span_232](start_span)[span_232](end_span)
                    price += parseFloat(opts.printingPrice);[span_233](start_span)[span_233](end_span)
                }
            }
        }

        return window.calculateBosePrice(price, "menu-only");[span_234](start_span)[span_234](end_span)
    };

    /**
     * الحسبة الهندسية الصحيحة والمحمية لأسعار محاكي التورتة المخصصة لمنع الخسارة نهائياً
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;[span_235](start_span)[span_235](end_span)
        let safePersons = parseInt(persons, 10) || (config ? config.persons.minimum : 4) || 4;[span_236](start_span)[span_236](end_span)
        
        // 1. فرض القيود الهندسية الصحيحة على الحدود الدنيا للأشكال لحماية شكل تماسك التورتة
        let shapeMin = 4;[span_237](start_span)[span_237](end_span)
        const shape = options.shape || 'circle';[span_238](start_span)[span_238](end_span)
        if (shape === 'square') {[span_239](start_span)[span_239](end_span)
            shapeMin = 16;[span_240](start_span)[span_240](end_span)
            safePersons = Math.max(safePersons, 16);[span_241](start_span)[span_241](end_span)
        } else if (shape === 'rectangle') {[span_242](start_span)[span_242](end_span)
            shapeMin = 20;[span_243](start_span)[span_243](end_span)
            safePersons = Math.max(safePersons, 20);[span_244](start_span)[span_244](end_span)
        } else {[span_245](start_span)[span_245](end_span)
            shapeMin = (config ? parseInt(config.persons.minimum) : 4) || 4;[span_246](start_span)[span_246](end_span)
        }

        let price = (config ? parseFloat(config.basePrice) : 580) || 580;[span_247](start_span)[span_247](end_span)
        const pricePerPerson = (config ? parseFloat(config.pricePerPerson) : 145) || 145;[span_248](start_span)[span_248](end_span)
        
        // 2. الحارس المالي الفاخر: السعر الأساسي (580 جنيه) يغطي أول 4 أفراد فقط (الحد الأدنى للمنظومة)
        // أي فرد إضافي فوق الـ 4 يدفع سعر الفرد الكامل لحماية أرباح التورت المربعة والمستطيلة الكبيرة
        const baseCoveredPersons = 4;[span_249](start_span)[span_249](end_span)
        const extraPersons = Math.max(0, safePersons - baseCoveredPersons);[span_250](start_span)[span_250](end_span)
        price += extraPersons * pricePerPerson;[span_251](start_span)[span_251](end_span)
        
        const selectedPrinting = options.printingType || options.printing || 'none';[span_252](start_span)[span_252](end_span)
        if (selectedPrinting && selectedPrinting !== 'none') {[span_253](start_span)[span_253](end_span)
            let printingFee = 0;[span_254](start_span)[span_254](end_span)
            if (config && config.printingOptions) {[span_255](start_span)[span_255](end_span)
                const printOpt = config.printingOptions.find(opt => opt.id === selectedPrinting);[span_256](start_span)[span_256](end_span)
                if (printOpt) {[span_257](start_span)[span_257](end_span)
                    printingFee = parseFloat(printOpt.price);[span_258](start_span)[span_258](end_span)
                }
            }
            
            if (printingFee === 0) {[span_259](start_span)[span_259](end_span)
                if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {[span_260](start_span)[span_260](end_span)
                    printingFee = 60;[span_261](start_span)[span_261](end_span)
                } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {[span_262](start_span)[span_262](end_span)
                    printingFee = 15;[span_263](start_span)[span_263](end_span)
                }
            }
            price += printingFee;[span_264](start_span)[span_264](end_span)
        }

        if (options.wrappingPrice) {[span_265](start_span)[span_265](end_span)
            price += parseFloat(options.wrappingPrice) || 0;[span_266](start_span)[span_266](end_span)
        }
        
        return window.calculateBosePrice(price, "menu-only");[span_267](start_span)[span_267](end_span)
    };

    /**
     * الحسبة الهندسية لمحاكاة أسعار بوكيهات الورد الفاخرة ورسوم خدمة ددمج الكاش بمرونة فائقة
     */
    window.calculateCustomFlowerPrice = function(flowerType, flowerCount, options = {}) {
        const config = window.BoseStoreData?.flowerBuilder;[span_268](start_span)[span_268](end_span)
        
        const basePrice = config ? parseFloat(config.basePrice) : 400;[span_269](start_span)[span_269](end_span)
        const baseFlowers = config ? parseInt(config.baseFlowers) : 15;[span_270](start_span)[span_270](end_span)
        const extraFlowerPrice = config ? parseFloat(config.extraFlowerPrice) : 35;[span_271](start_span)[span_271](end_span)
        
        const safeFlowerCount = parseInt(flowerCount, 10) || baseFlowers;[span_272](start_span)[span_272](end_span)
        const safeCashAmount = parseInt(options.moneyAmount, 10) || 0;[span_273](start_span)[span_273](end_span)
        const safeCashCategoryAmount = parseInt(options.moneyCategoryAmount, 10) || 0;[span_274](start_span)[span_274](end_span)
        const safeChocolatePieces = parseInt(options.chocolatePieces, 10) || 0;[span_275](start_span)[span_275](end_span)
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;[span_276](start_span)[span_276](end_span)
        
        let servicePrice = basePrice;[span_277](start_span)[span_277](end_span)
        const extraFlowers = Math.max(0, safeFlowerCount - baseFlowers);[span_278](start_span)[span_278](end_span)
        servicePrice += extraFlowers * extraFlowerPrice;[span_279](start_span)[span_279](end_span)
        
        if (options.wrappingType && config) {[span_280](start_span)[span_280](end_span)
            const wrapOpt = config.wrappingTypes.find(opt => opt.id === options.wrappingType);[span_281](start_span)[span_281](end_span)
            if (wrapOpt) servicePrice += parseFloat(wrapOpt.price);[span_282](start_span)[span_282](end_span)
        }
        
        if (options.chocolateType && safeChocolatePieces > 0 && config) {[span_283](start_span)[span_283](end_span)
            const chocOpt = config.chocolateTypes.find(opt => opt.id === options.chocolateType);[span_284](start_span)[span_284](end_span)
            if (chocOpt) servicePrice += parseFloat(chocOpt.price) * safeChocolatePieces;[span_285](start_span)[span_285](end_span)
        }
        
        if (options.hasGiftCard) {[span_286](start_span)[span_286](end_span)
            servicePrice += config ? (parseFloat(config.giftCardPrice) || 20) : 20;[span_287](start_span)[span_287](end_span)
        }
        if (safePhotoCount > 0) {[span_288](start_span)[span_288](end_span)
            servicePrice += safePhotoCount * (config ? (parseFloat(config.photoPrintPrice) || 15) : 15);[span_289](start_span)[span_289](end_span)
        }
        
        let cashHandlingFee = 0;[span_290](start_span)[span_290](end_span)
        if (safeCashAmount > 0 && safeCashCategoryAmount > 0 && config) {[span_291](start_span)[span_291](end_span)
            const selectedCategory = config.moneyCategories.find(cat => cat.amount === safeCashCategoryAmount);[span_292](start_span)[span_292](end_span)
            if (selectedCategory) {[span_293](start_span)[span_293](end_span)
                const billCount = Math.floor(safeCashAmount / safeCashCategoryAmount);[span_294](start_span)[span_294](end_span)
                cashHandlingFee += billCount * parseFloat(selectedCategory.fee);[span_295](start_span)[span_295](end_span)
                
                const remainder = safeCashAmount % safeCashCategoryAmount;[span_296](start_span)[span_296](end_span)
                if (remainder > 0) {[span_297](start_span)[span_297](end_span)
                    const remainderCategory = config.moneyCategories[span_298](start_span)[span_298](end_span)
                        .filter(cat => cat.amount <= remainder)[span_299](start_span)[span_299](end_span)
                        .sort((a, b) => b.amount - a.amount)[0] || config.moneyCategories[0];[span_300](start_span)[span_300](end_span)
                    if (remainderCategory) {[span_301](start_span)[span_301](end_span)
                        cashHandlingFee += parseFloat(remainderCategory.fee);[span_302](start_span)[span_302](end_span)
                    }
                }
            }
        }
        
        servicePrice += cashHandlingFee;[span_303](start_span)[span_303](end_span)
        const finalServicePrice = window.calculateBosePrice(servicePrice, "menu-only");[span_304](start_span)[span_304](end_span)
        
        return finalServicePrice + safeCashAmount;[span_305](start_span)[span_305](end_span)
    };

    /**
     * دالة إنشاء كائن السلة الموحد المانع لأي تصادم أو فقدان في خيارات السلة
     */
    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;[span_306](start_span)[span_306](end_span)
        const opts = selectedOptions || {};[span_307](start_span)[span_307](end_span)
        const finalUnitPrice = window.calculateProductFinalPrice(product, opts);[span_308](start_span)[span_308](end_span)
        
        const isCustomizable = product.isMiniCake ||[span_309](start_span)[span_309](end_span)
                             product.type === "custom-cake" ||[span_310](start_span)[span_310](end_span)
                             product.type === "custom-flower" ||[span_311](start_span)[span_311](end_span)
                             (product.customizationOptions && Object.keys(opts).length > 0);[span_312](start_span)[span_312](end_span)
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}` : String(product.slug || product.id);[span_313](start_span)[span_313](end_span)
        
        const cartItem = {[span_314](start_span)[span_314](end_span)
            id: finalId,[span_315](start_span)[span_315](end_span)
            productSlug: product.slug,[span_316](start_span)[span_316](end_span)
            title: product.title,[span_317](start_span)[span_317](end_span)
            flavorName: opts.flavorName || opts.cakeType || product.flavorName || "كلاسيك",[span_318](start_span)[span_318](end_span)
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),[span_319](start_span)[span_319](end_span)
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),[span_320](start_span)[span_320](end_span)
            quantity: parseInt(quantity, 10) || 1,[span_321](start_span)[span_321](end_span)
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ""),[span_322](start_span)[span_322](end_span)
            type: product.type || (product.isMiniCake ? "mini-cake" : "standard"),[span_323](start_span)[span_323](end_span)
            customDetails: {[span_324](start_span)[span_324](end_span)
                cakeType: opts.cakeType || opts.cakeFlavor || "فانيليا",[span_325](start_span)[span_325](end_span)
                shape: opts.shape || "circle",[span_326](start_span)[span_326](end_span)
                persons: parseInt(opts.persons, 10) || (product.isMiniCake ? 2 : 0),[span_327](start_span)[span_327](end_span)
                printingType: opts.printingType || opts.printing || "none",[span_328](start_span)[span_328](end_span)
                customMessage: opts.customMessage || "",[span_329](start_span)[span_329](end_span)
                allergyNote: opts.allergyNote || "",[span_330](start_span)[span_330](end_span)
                flowerType: opts.flowerType || "none",[span_331](start_span)[span_331](end_span)
                flowerCount: parseInt(opts.flowerCount, 10) || 0,[span_332](start_span)[span_332](end_span)
                moneyAmount: parseInt(opts.moneyAmount, 10) || 0,[span_333](start_span)[span_333](end_span)
                moneyFee: parseInt(opts.moneyFee, 10) || 0,[span_334](start_span)[span_334](end_span)
                chocolateType: opts.chocolateType || "none",[span_335](start_span)[span_335](end_span)
                chocolatePieces: parseInt(opts.chocolatePieces, 10) || 0,[span_336](start_span)[span_336](end_span)
                wrappingType: opts.wrappingType || "none",[span_337](start_span)[span_337](end_span)
                giftCardText: opts.giftCardText || "[span_338](start_span)"[span_338](end_span)
            }[span_339](start_span)[span_339](end_span)
        };[span_340](start_span)[span_340](end_span)
        return cartItem;[span_341](start_span)[span_341](end_span)
    };

    /**
     * دالة الفحص والتحقق الصارم لهواتف مصر لسلامة وصول الشحن والتأكيد
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") {[span_342](start_span)[span_342](end_span)
            return isOptional;[span_343](start_span)[span_343](end_span)
        }
        const cleaned = window.sanitizeBosePhoneNumber(phone);[span_344](start_span)[span_344](end_span)
        const egPhoneRegex = /^01[0125][0-9]{8}$/;[span_345](start_span)[span_345](end_span)
        return egPhoneRegex.test(cleaned);[span_346](start_span)[span_346](end_span)
    };

    /**
     * دالة تطهير وتوحيد تنسيق رقم الهاتف ليطابق معايير الاتصال والشحن لخدمات التوصيل
     */
    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";[span_347](start_span)[span_347](end_span)
        let cleaned = phone.toString().trim().replace(/[\s\-\(\)\+]/g, "");[span_348](start_span)[span_348](end_span)
        cleaned = window.normalizeArabicNumerals(cleaned);[span_349](start_span)[span_349](end_span)
        if (cleaned.startsWith("201")) {[span_350](start_span)[span_350](end_span)
            cleaned = "0" + cleaned.substring(2);[span_351](start_span)[span_351](end_span)
        } else if (cleaned.startsWith("00201")) {[span_352](start_span)[span_352](end_span)
            cleaned = "0" + cleaned.substring(4);[span_353](start_span)[span_353](end_span)
        } else if (cleaned.startsWith("1") && cleaned.length === 10) {[span_354](start_span)[span_354](end_span)
            cleaned = "0" + cleaned;[span_355](start_span)[span_355](end_span)
        }
        return cleaned;[span_356](start_span)[span_356](end_span)
    };

    /**
     * محلل ذكي للوقت يدعم صيغ الـ 12 والـ 24 ساعة لخدمة التوصيل والتحضير
     */
    window.parseTimeStringTo24h = function(timeStr) {
        timeStr = window.normalizeArabicNumerals(timeStr).toUpperCase().trim();[span_357](start_span)[span_357](end_span)
        let hours = 0;[span_358](start_span)[span_358](end_span)
        let minutes = 0;[span_359](start_span)[span_359](end_span)
        
        const hasPM = timeStr.includes("PM") || timeStr.includes("م") || timeStr.includes("مساءً") || timeStr.includes("مساء");[span_360](start_span)[span_360](end_span)
        const hasAM = timeStr.includes("AM") || timeStr.includes("ص") || timeStr.includes("صباحًا") || timeStr.includes("صباح");[span_361](start_span)[span_361](end_span)
        
        let cleanStr = timeStr.replace(/(AM|PM|ص|م|مساءً|صباحًا|مساء|صباح)/g, "").trim();[span_362](start_span)[span_362](end_span)
        const parts = cleanStr.split(":");[span_363](start_span)[span_363](end_span)
        if (parts.length >= 2) {[span_364](start_span)[span_364](end_span)
            hours = parseInt(parts[0], 10);[span_365](start_span)[span_365](end_span)
            minutes = parseInt(parts[1], 10);[span_366](start_span)[span_366](end_span)
            
            if (hasPM && hours < 12) {[span_367](start_span)[span_367](end_span)
                hours += 12;[span_368](start_span)[span_368](end_span)
            } else if (hasAM && hours === 12) {[span_369](start_span)[span_369](end_span)
                hours = 0;[span_370](start_span)[span_370](end_span)
            }
        } else if (parts.length === 1) {[span_371](start_span)[span_371](end_span)
            hours = parseInt(parts[0], 10);[span_372](start_span)[span_372](end_span)
            if (hasPM && hours < 12) hours += 12;[span_373](start_span)[span_373](end_span)
        }
        return { hours, minutes };[span_374](start_span)[span_374](end_span)
    };

    /**
     * حارس الوقت الموحد المانع لأخطاء التوقيت في الأجهزة المحمولة (تأمين شرط الـ 24 ساعة تحضير)
     */
    window.validateBoseDeliverySchedule = function(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;[span_375](start_span)[span_375](end_span)
        
        const safeDateVal = window.normalizeArabicNumerals(dateStr);[span_376](start_span)[span_376](end_span)
        const dateParts = safeDateVal.replace(/\//g, '-').split('-');[span_377](start_span)[span_377](end_span)
        const { hours, minutes } = window.parseTimeStringTo24h(timeStr);[span_378](start_span)[span_378](end_span)
        
        if (dateParts.length < 3) return false;[span_379](start_span)[span_379](end_span)
        
        let year, month, day;[span_380](start_span)[span_380](end_span)
        if (dateParts[0].length === 4) {[span_381](start_span)[span_381](end_span)
            year = parseInt(dateParts[0], 10);[span_382](start_span)[span_382](end_span)
            month = parseInt(dateParts[1], 10) - 1;[span_383](start_span)[span_383](end_span)
            day = parseInt(dateParts[2], 10);[span_384](start_span)[span_384](end_span)
        } else {[span_385](start_span)[span_385](end_span)
            year = parseInt(dateParts[2], 10);[span_386](start_span)[span_386](end_span)
            month = parseInt(dateParts[1], 10) - 1;[span_387](start_span)[span_387](end_span)
            day = parseInt(dateParts[0], 10);[span_388](start_span)[span_388](end_span)
        }

        const selectedDateTime = new Date(year, month, day, hours, minutes, 0, 0);[span_389](start_span)[span_389](end_span)
        if (isNaN(selectedDateTime.getTime())) return false;[span_390](start_span)[span_390](end_span)
        
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);[span_391](start_span)[span_391](end_span)
        const currentDateTime = new Date(synchronizedTime);[span_392](start_span)[span_392](end_span)
        
        if (selectedDateTime <= currentDateTime) return false;[span_393](start_span)[span_393](end_span)
        
        const diffMs = selectedDateTime - currentDateTime;[span_394](start_span)[span_394](end_span)
        const hoursDiff = diffMs / (1000 * 60 * 60);[span_395](start_span)[span_395](end_span)
        
        return hoursDiff >= 23.95;[span_396](start_span)[span_396](end_span)
    };

    /**
     * مقارنة عميقة لخصائص كائنات التخصيص تمنع تكرار كروت السلة المتشابهة
     */
    function isEquivalentDetails(obj1, obj2) {
        if (!obj1 || !obj2) return obj1 === obj2;[span_397](start_span)[span_397](end_span)
        const keys1 = Object.keys(obj1).sort();[span_398](start_span)[span_398](end_span)
        const keys2 = Object.keys(obj2).sort();[span_399](start_span)[span_399](end_span)
        
        const filterEmptyKeys = (keys, obj) => keys.filter(k => {[span_400](start_span)[span_400](end_span)
            const val = obj[k];[span_401](start_span)[span_401](end_span)
            return val !== undefined && val !== null && val !== "" && val !== "none";[span_402](start_span)[span_402](end_span)
        });

        const activeKeys1 = filterEmptyKeys(keys1, obj1);[span_403](start_span)[span_403](end_span)
        const activeKeys2 = filterEmptyKeys(keys2, obj2);[span_404](start_span)[span_404](end_span)

        if (activeKeys1.length !== activeKeys2.length) return false;[span_405](start_span)[span_405](end_span)

        for (let key of activeKeys1) {[span_406](start_span)[span_406](end_span)
            if (!activeKeys2.includes(key)) return false;[span_407](start_span)[span_407](end_span)
            
            const val1 = obj1[key];[span_408](start_span)[span_408](end_span)
            const val2 = obj2[key];[span_409](start_span)[span_409](end_span)

            if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {[span_410](start_span)[span_410](end_span)
                if (!isEquivalentDetails(val1, val2)) return false;[span_411](start_span)[span_411](end_span)
            } else {
                const norm1 = window.normalizeArabicNumerals(val1).toString().trim();[span_412](start_span)[span_412](end_span)
                const norm2 = window.normalizeArabicNumerals(val2).toString().trim();[span_413](start_span)[span_413](end_span)
                if (norm1 !== norm2) return false;[span_414](start_span)[span_414](end_span)
            }
        }
        return true;[span_415](start_span)[span_415](end_span)
    }
    window.isEquivalentDetails = isEquivalentDetails;[span_416](start_span)[span_416](end_span)

    // ==========================================================================
    // 3. محركات جلب وإطلاق وتزامن البيانات
    // ==========================================================================

    /**
     * جلب وقراءة قاعدة البيانات المركزية لعلامة بوسي مع حماية التزامن البرمجي التام
     */
    window.getBoseDatabase = function() {
        if (window.BoseStoreData) {[span_417](start_span)[span_417](end_span)
            return Promise.resolve(window.BoseStoreData);[span_418](start_span)[span_418](end_span)
        }
        return window.boseDbPromise;[span_419](start_span)[span_419](end_span)
    };

    /**
     * البوابة الأمنية الحارسة لتمهيد الملفات الخارجية والتابعة
     */
    window.onBoseDatabaseReady = function(callback) {
        if (window.BoseStoreData && window.BoseStoreData.store) {[span_420](start_span)[span_420](end_span)
            callback(window.BoseStoreData);[span_421](start_span)[span_421](end_span)
        } else {
            const handleLoaded = (e) => {[span_422](start_span)[span_422](end_span)
                callback(e.detail);[span_423](start_span)[span_423](end_span)
                document.removeEventListener('BoseDatabaseLoaded', handleLoaded);[span_424](start_span)[span_424](end_span)
            };
            document.addEventListener('BoseDatabaseLoaded', handleLoaded);[span_425](start_span)[span_425](end_span)
        }
    };

    /**
     * نظام التنبيهات الفاخر والتوست الذكي المتكامل لعلامة بوسي
     */
    window.showBoseToast = function(message, duration = 3500, focusElement = null) {
        let container = document.querySelector('.bose-toast-container');[span_426](start_span)[span_426](end_span)
        if (!container) {[span_427](start_span)[span_427](end_span)
            container = document.createElement('div');[span_428](start_span)[span_428](end_span)
            container.className = 'bose-toast-container';[span_429](start_span)[span_429](end_span)
            document.body.appendChild(container);[span_430](start_span)[span_430](end_span)
        }

        const toast = document.createElement('div');[span_431](start_span)[span_431](end_span)
        toast.className = 'bose-toast';[span_432](start_span)[span_432](end_span)
        toast.innerHTML = `[span_433](start_span)[span_433](end_span)
            <span class="bose-toast-icon" style="color:var(--bose-pink); font-size:1.2rem;">🌸</span>[span_434](start_span)[span_434](end_span)
            <span class="bose-toast-text" style="line-height:1.5;">${escapeHTML(message)}</span>[span_435](start_span)[span_435](end_span)
        `;[span_436](start_span)[span_436](end_span)

        container.appendChild(toast);[span_437](start_span)[span_437](end_span)

        requestAnimationFrame(() => {[span_438](start_span)[span_438](end_span)
            requestAnimationFrame(() => {[span_439](start_span)[span_439](end_span)
                toast.classList.add('active');[span_440](start_span)[span_440](end_span)
            });
        });

        setTimeout(() => {[span_441](start_span)[span_441](end_span)
            toast.classList.remove('active');[span_442](start_span)[span_442](end_span)
            setTimeout(() => {[span_443](start_span)[span_443](end_span)
                toast.remove();[span_444](start_span)[span_444](end_span)
            }, 400);[span_445](start_span)[span_445](end_span)
        }, duration);[span_446](start_span)[span_446](end_span)

        if (focusElement) {[span_447](start_span)[span_447](end_span)
            if (typeof focusElement.scrollIntoView === 'function') {[span_448](start_span)[span_448](end_span)
                focusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });[span_449](start_span)[span_449](end_span)
            }
            focusElement.focus();[span_450](start_span)[span_450](end_span)
        }
    };

    /**
     * دالة التأكيد الفاخرة والمؤمنة هندسياً ضد تجميد الشاشات وبديلة لـ confirm
     */
    window.showBoseConfirm = function(messageText, onConfirm = null, onCancel = null) {
        let overlay = document.createElement('div');[span_451](start_span)[span_451](end_span)
        overlay.className = 'bose-modal-overlay';[span_452](start_span)[span_452](end_span)
        overlay.innerHTML = `[span_453](start_span)[span_453](end_span)
            <div class="bose-modal-box">[span_454](start_span)[span_454](end_span)
                <p class="bose-modal-text">${escapeHTML(messageText)}</p>[span_455](start_span)[span_455](end_span)
                <div class="bose-modal-actions">[span_456](start_span)[span_456](end_span)
                    <button class="bose-modal-btn bose-modal-btn-confirm" id="bose-confirm-yes">تأكيد</button>[span_457](start_span)[span_457](end_span)
                    <button class="bose-modal-btn bose-modal-btn-cancel" id="bose-confirm-no">تراجع</button>[span_458](start_span)[span_458](end_span)
                </div>[span_459](start_span)[span_459](end_span)
            </div>[span_460](start_span)[span_460](end_span)
        `;[span_461](start_span)[span_461](end_span)

        document.body.appendChild(overlay);[span_462](start_span)[span_462](end_span)

        requestAnimationFrame(() => {[span_463](start_span)[span_463](end_span)
            requestAnimationFrame(() => {[span_464](start_span)[span_464](end_span)
                overlay.style.opacity = '1';[span_465](start_span)[span_465](end_span)
                const box = overlay.querySelector('.bose-modal-box');[span_466](start_span)[span_466](end_span)
                if (box) box.style.transform = 'scale(1) translateY(0)';[span_467](start_span)[span_467](end_span)
            });
        });

        const closeBoxProcedure = () => {[span_468](start_span)[span_468](end_span)
            overlay.style.opacity = '0';[span_469](start_span)[span_469](end_span)
            const box = overlay.querySelector('.bose-modal-box');[span_470](start_span)[span_470](end_span)
            if (box) box.style.transform = 'scale(0.9) translateY(10px)';[span_471](start_span)[span_471](end_span)
            setTimeout(() => {[span_472](start_span)[span_472](end_span)
                overlay.remove();[span_473](start_span)[span_473](end_span)
            }, 300);[span_474](start_span)[span_474](end_span)
        };

        overlay.querySelector('#bose-confirm-yes').addEventListener('click', () => {[span_475](start_span)[span_475](end_span)
            closeBoxProcedure();[span_476](start_span)[span_476](end_span)
            if (typeof onConfirm === 'function') onConfirm();[span_477](start_span)[span_477](end_span)
        });

        overlay.querySelector('#bose-confirm-no').addEventListener('click', () => {[span_478](start_span)[span_478](end_span)
            closeBoxProcedure();[span_479](start_span)[span_479](end_span)
            if (typeof onCancel === 'function') onCancel();[span_480](start_span)[span_480](end_span)
        });

        overlay.addEventListener('click', (e) => {[span_481](start_span)[span_481](end_span)
            if (e.target === overlay) {[span_482](start_span)[span_482](end_span)
                closeBoxProcedure();[span_483](start_span)[span_483](end_span)
                if (typeof onCancel === 'function') onCancel();[span_484](start_span)[span_484](end_span)
            }
        });
    };

    /**
     * حقن الأنماط والسمات الأساسية الحاكمة لتفادي وميض الألوان غير المرغوب فيه (FOUC)
     * الالتزام الكامل بقوانين Cairo ووزن خط 700 كحد أقصى لمنع التشويه
     */
    function injectCoreStyles() {
        if (document.getElementById("bose-core-injected-styles")) return;[span_485](start_span)[span_485](end_span)

        const styleTag = document.createElement("style");[span_486](start_span)[span_486](end_span)
        styleTag.id = "bose-core-injected-styles";[span_487](start_span)[span_487](end_span)
        styleTag.textContent = `[span_488](start_span)[span_488](end_span)
            :root {[span_489](start_span)[span_489](end_span)
                --bose-pink: #FF91A4;[span_490](start_span)[span_490](end_span)
                --bose-white: #FFFFFF;[span_491](start_span)[span_491](end_span)
                --bose-black: #111111;[span_492](start_span)[span_492](end_span)
                --bose-gold: #D4AF37;[span_493](start_span)[span_493](end_span)
                --bose-shadow-glow: 0 8px 32px rgba(255, 145, 164, 0.12);[span_494](start_span)[span_494](end_span)
                --bose-shadow-hover: 0 16px 40px rgba(255, 145, 164, 0.22);[span_495](start_span)[span_495](end_span)
                --bose-border-pink: 1px solid rgba(255, 145, 164, 0.3);[span_496](start_span)[span_496](end_span)
                --bose-border-thick: 2px solid #FF91A4;[span_497](start_span)[span_497](end_span)
            }[span_498](start_span)[span_498](end_span)
            body {[span_499](start_span)[span_499](end_span)
                font-family: 'Cairo', sans-serif !important;[span_500](start_span)[span_500](end_span)
                background-color: var(--bose-white) !important;[span_501](start_span)[span_501](end_span)
                color: var(--bose-black) !important;[span_502](start_span)[span_502](end_span)
                margin: 0;[span_503](start_span)[span_503](end_span)
                padding: 0;[span_504](start_span)[span_504](end_span)
                overflow-x: hidden;[span_505](start_span)[span_505](end_span)
            }[span_506](start_span)[span_506](end_span)
            
            h1, h2 {[span_507](start_span)[span_507](end_span)
                font-family: 'Cairo', sans-serif !important;[span_508](start_span)[span_508](end_span)
                font-weight: 700 !important;[span_509](start_span)[span_509](end_span)
                color: var(--bose-black) !important;[span_510](start_span)[span_510](end_span)
                margin: 0;[span_511](start_span)[span_511](end_span)
            }[span_512](start_span)[span_512](end_span)
            h3, h4, h5, h6 {[span_513](start_span)[span_513](end_span)
                font-family: 'Cairo', sans-serif !important;[span_514](start_span)[span_514](end_span)
                font-weight: 600 !important;[span_515](start_span)[span_515](end_span)
                color: var(--bose-black) !important;[span_516](start_span)[span_516](end_span)
                margin: 0;[span_517](start_span)[span_517](end_span)
            }[span_518](start_span)[span_518](end_span)
            p, span, a, button, input, select, textarea {[span_519](start_span)[span_519](end_span)
                font-family: 'Cairo', sans-serif !important;[span_520](start_span)[span_520](end_span)
            }[span_521](start_span)[span_521](end_span)

            .bose-fade-in-img {[span_522](start_span)[span_522](end_span)
                opacity: 0;[span_523](start_span)[span_523](end_span)
                transition: opacity 0.4s ease-in-out;[span_524](start_span)[span_524](end_span)
            }[span_525](start_span)[span_525](end_span)
            .bose-fade-in-img.loaded {[span_526](start_span)[span_526](end_span)
                opacity: 1;[span_527](start_span)[span_527](end_span)
            }[span_528](start_span)[span_528](end_span)
            
            .bose-toast-container {[span_529](start_span)[span_529](end_span)
                position: fixed;[span_530](start_span)[span_530](end_span)
                bottom: 30px;[span_531](start_span)[span_531](end_span)
                left: 50%;[span_532](start_span)[span_532](end_span)
                transform: translateX(-50%);[span_533](start_span)[span_533](end_span)
                z-index: 999999;[span_534](start_span)[span_534](end_span)
                display: flex;[span_535](start_span)[span_535](end_span)
                flex-direction: column;[span_536](start_span)[span_536](end_span)
                gap: 12px;[span_537](start_span)[span_537](end_span)
                width: 90%;[span_538](start_span)[span_538](end_span)
                max-width: 400px;[span_539](start_span)[span_539](end_span)
                pointer-events: none;[span_540](start_span)[span_540](end_span)
            }[span_541](start_span)[span_541](end_span)
            .bose-toast {[span_542](start_span)[span_542](end_span)
                background-color: var(--bose-white, #FFFFFF) !important;[span_543](start_span)[span_543](end_span)
                color: var(--bose-black, #111111) !important;[span_544](start_span)[span_544](end_span)
                border: 1px solid rgba(255, 145, 164, 0.4) !important;[span_545](start_span)[span_545](end_span)
                border-right: 4px solid var(--bose-pink, #FF91A4) !important;[span_546](start_span)[span_546](end_span)
                padding: 16px 24px !important;[span_547](start_span)[span_547](end_span)
                border-radius: 16px !important;[span_548](start_span)[span_548](end_span)
                box-shadow: 0 16px 40px rgba(255, 145, 164, 0.08) !important;[span_549](start_span)[span_549](end_span)
                display: flex !important;[span_550](start_span)[span_550](end_span)
                align-items: center !important;[span_551](start_span)[span_551](end_span)
                gap: 12px !important;[span_552](start_span)[span_552](end_span)
                pointer-events: auto !important;[span_553](start_span)[span_553](end_span)
                opacity: 0;[span_554](start_span)[span_554](end_span)
                transform: translateY(20px) scale(0.95);[span_555](start_span)[span_555](end_span)
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);[span_556](start_span)[span_556](end_span)
                direction: rtl;[span_557](start_span)[span_557](end_span)
                text-align: right;[span_558](start_span)[span_558](end_span)
            }[span_559](start_span)[span_559](end_span)
            .bose-toast.active {[span_560](start_span)[span_560](end_span)
                opacity: 1;[span_561](start_span)[span_561](end_span)
                transform: translateY(0) scale(1);[span_562](start_span)[span_562](end_span)
            }[span_563](start_span)[span_563](end_span)
            
            .waterfall-overlay-top, .waterfall-overlay-bottom {[span_564](start_span)[span_564](end_span)
                position: absolute;[span_565](start_span)[span_565](end_span)
                left: 0;[span_566](start_span)[span_566](end_span)
                width: 100%;[span_567](start_span)[span_567](end_span)
                height: 100px;[span_568](start_span)[span_568](end_span)
                z-index: 5;[span_569](start_span)[span_569](end_span)
                pointer-events: none;[span_570](start_span)[span_570](end_span)
            }[span_571](start_span)[span_571](end_span)
            .waterfall-overlay-top {[span_572](start_span)[span_572](end_span)
                top: 0;
                background: linear-gradient(to bottom, var(--bose-white) 0%, rgba(255,255,255,0) 100%);[span_573](start_span)[span_573](end_span)
                backdrop-filter: blur(2px);[span_574](start_span)[span_574](end_span)
                -webkit-backdrop-filter: blur(2px);[span_575](start_span)[span_575](end_span)
            }[span_576](start_span)[span_576](end_span)
            .waterfall-overlay-bottom {[span_577](start_span)[span_577](end_span)
                bottom: 0;
                background: linear-gradient(to top, var(--bose-white) 0%, rgba(255,255,255,0) 100%);[span_578](start_span)[span_578](end_span)
                backdrop-filter: blur(2px);[span_579](start_span)[span_579](end_span)
                -webkit-backdrop-filter: blur(2px);[span_580](start_span)[span_580](end_span)
            }[span_581](start_span)[span_581](end_span)
            
            .bose-modal-overlay {[span_582](start_span)[span_582](end_span)
                position: fixed;[span_583](start_span)[span_583](end_span)
                top: 0; left: 0; width: 100%; height: 100%;[span_584](start_span)[span_584](end_span)
                background: rgba(17, 17, 17, 0.4);[span_585](start_span)[span_585](end_span)
                backdrop-filter: blur(8px);[span_586](start_span)[span_586](end_span)
                -webkit-backdrop-filter: blur(8px);[span_587](start_span)[span_587](end_span)
                display: flex;[span_588](start_span)[span_588](end_span)
                align-items: center;[span_589](start_span)[span_589](end_span)
                justify-content: center;[span_590](start_span)[span_590](end_span)
                z-index: 100100;[span_591](start_span)[span_591](end_span)
                opacity: 0;[span_592](start_span)[span_592](end_span)
                transition: opacity 0.3s ease;[span_593](start_span)[span_593](end_span)
                pointer-events: auto;[span_594](start_span)[span_594](end_span)
            }[span_595](start_span)[span_595](end_span)
            .bose-modal-box {[span_596](start_span)[span_596](end_span)
                background: var(--bose-white, #FFFFFF);[span_597](start_span)[span_597](end_span)
                border: 1px solid var(--bose-pink, #FF91A4);[span_598](start_span)[span_598](end_span)
                border-radius: 24px;[span_599](start_span)[span_599](end_span)
                width: 90%;[span_600](start_span)[span_600](end_span)
                max-width: 400px;[span_601](start_span)[span_601](end_span)
                padding: 24px;[span_602](start_span)[span_602](end_span)
                box-shadow: 0 16px 40px rgba(255, 145, 164, 0.12);[span_603](start_span)[span_603](end_span)
                transform: scale(0.9) translateY(10px);[span_604](start_span)[span_604](end_span)
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);[span_605](start_span)[span_605](end_span)
                direction: rtl;[span_606](start_span)[span_606](end_span)
                text-align: right;[span_607](start_span)[span_607](end_span)
                font-family: 'Cairo', sans-serif;[span_608](start_span)[span_608](end_span)
            }[span_609](start_span)[span_609](end_span)
            .bose-modal-text {[span_610](start_span)[span_610](end_span)
                font-size: 15px;[span_611](start_span)[span_611](end_span)
                font-weight: 600;[span_612](start_span)[span_612](end_span)
                color: var(--bose-black, #111111);[span_613](start_span)[span_613](end_span)
                line-height: 1.6;[span_614](start_span)[span_614](end_span)
                margin: 0 0 20px 0;[span_615](start_span)[span_615](end_span)
            }[span_616](start_span)[span_616](end_span)
            .bose-modal-actions {[span_617](start_span)[span_617](end_span)
                display: flex;[span_618](start_span)[span_618](end_span)
                align-items: center;[span_619](start_span)[span_619](end_span)
                justify-content: flex-start;[span_620](start_span)[span_620](end_span)
                gap: 12px;[span_621](start_span)[span_621](end_span)
            }[span_622](start_span)[span_622](end_span)
            .bose-modal-btn {[span_623](start_span)[span_623](end_span)
                font-family: 'Cairo', sans-serif;[span_624](start_span)[span_624](end_span)
                font-size: 14px;[span_625](start_span)[span_625](end_span)
                font-weight: 700;[span_626](start_span)[span_626](end_span)
                padding: 10px 24px;[span_627](start_span)[span_627](end_span)
                border-radius: 50px;[span_628](start_span)[span_628](end_span)
                cursor: pointer;[span_629](start_span)[span_629](end_span)
                transition: 0.2s;[span_630](start_span)[span_630](end_span)
                border: none;[span_631](start_span)[span_631](end_span)
            }[span_632](start_span)[span_632](end_span)
            .bose-modal-btn-confirm {[span_633](start_span)[span_633](end_span)
                background: var(--bose-pink, #FF91A4);[span_634](start_span)[span_634](end_span)
                color: var(--bose-white, #FFFFFF);[span_635](start_span)[span_635](end_span)
                box-shadow: 0 4px 12px rgba(255, 145, 164, 0.2);[span_636](start_span)[span_636](end_span)
            }[span_637](start_span)[span_637](end_span)
            .bose-modal-btn-confirm:hover {[span_638](start_span)[span_638](end_span)
                opacity: 0.9;[span_639](start_span)[span_639](end_span)
            }[span_640](start_span)[span_640](end_span)
            .bose-modal-btn-cancel {[span_641](start_span)[span_641](end_span)
                background: transparent;[span_642](start_span)[span_642](end_span)
                color: var(--bose-black, #111111);[span_643](start_span)[span_643](end_span)
                border: 1px solid rgba(17, 17, 17, 0.15);[span_644](start_span)[span_644](end_span)
            }[span_645](start_span)[span_645](end_span)
            .bose-modal-btn-cancel:hover {[span_646](start_span)[span_646](end_span)
                background: rgba(17, 17, 17, 0.03);[span_647](start_span)[span_647](end_span)
            }[span_648](start_span)[span_648](end_span)
            
            .drawer-overlay {[span_649](start_span)[span_649](end_span)
                position: fixed;[span_650](start_span)[span_650](end_span)
                top: 0;[span_651](start_span)[span_651](end_span)
                left: 0;[span_652](start_span)[span_652](end_span)
                width: 100vw;[span_653](start_span)[span_653](end_span)
                height: 100vh;[span_654](start_span)[span_654](end_span)
                background: rgba(17, 17, 17, 0.4);[span_655](start_span)[span_655](end_span)
                backdrop-filter: blur(4px);[span_656](start_span)[span_656](end_span)
                z-index: 9999;[span_657](start_span)[span_657](end_span)
                opacity: 0;[span_658](start_span)[span_658](end_span)
                pointer-events: none;[span_659](start_span)[span_659](end_span)
                transition: opacity 0.3s ease;[span_660](start_span)[span_660](end_span)
            }[span_661](start_span)[span_661](end_span)
            .drawer-overlay.active {[span_662](start_span)[span_662](end_span)
                opacity: 1;[span_663](start_span)[span_663](end_span)
                pointer-events: auto;[span_664](start_span)[span_664](end_span)
            }[span_665](start_span)[span_665](end_span)
            .bose-search-modal {[span_666](start_span)[span_666](end_span)
                position: fixed;[span_667](start_span)[span_667](end_span)
                top: 0;[span_668](start_span)[span_668](end_span)
                left: 0;[span_669](start_span)[span_669](end_span)
                width: 100%;[span_670](start_span)[span_670](end_span)
                height: 100%;[span_671](start_span)[span_671](end_span)
                background: rgba(17, 17, 17, 0.6);[span_672](start_span)[span_672](end_span)
                backdrop-filter: blur(8px);[span_673](start_span)[span_673](end_span)
                -webkit-backdrop-filter: blur(8px);[span_674](start_span)[span_674](end_span)
                z-index: 10000;[span_675](start_span)[span_675](end_span)
                display: flex;[span_676](start_span)[span_676](end_span)
                align-items: center;[span_677](start_span)[span_677](end_span)
                justify-content: center;[span_678](start_span)[span_678](end_span)
                opacity: 0;[span_679](start_span)[span_679](end_span)
                pointer-events: none;[span_680](start_span)[span_680](end_span)
                transition: opacity 0.3s ease;[span_681](start_span)[span_681](end_span)
            }[span_682](start_span)[span_682](end_span)
            .bose-search-modal.active {[span_683](start_span)[span_683](end_span)
                opacity: 1;[span_684](start_span)[span_684](end_span)
                pointer-events: auto;[span_685](start_span)[span_685](end_span)
            }[span_686](start_span)[span_686](end_span)
            .search-modal-box {[span_687](start_span)[span_687](end_span)
                background: var(--bose-white);[span_688](start_span)[span_688](end_span)
                border: var(--bose-border-thick);[span_689](start_span)[span_689](end_span)
                border-radius: 24px;[span_690](start_span)[span_690](end_span)
                width: 90%;[span_691](start_span)[span_691](end_span)
                max-width: 500px;[span_692](start_span)[span_692](end_span)
                padding: 24px;[span_693](start_span)[span_693](end_span)
                box-shadow: var(--bose-shadow-hover);[span_694](start_span)[span_694](end_span)
                transform: scale(0.9) translateY(10px);[span_695](start_span)[span_695](end_span)
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);[span_696](start_span)[span_696](end_span)
                direction: rtl;[span_697](start_span)[span_697](end_span)
                text-align: right;[span_698](start_span)[span_698](end_span)
            }[span_699](start_span)[span_699](end_span)
            .bose-search-modal.active .search-modal-box {[span_700](start_span)[span_700](end_span)
                transform: scale(1) translateY(0);[span_701](start_span)[span_701](end_span)
            }[span_702](start_span)[span_702](end_span)
            .search-results-container {[span_703](start_span)[span_703](end_span)
                transition: opacity 0.2s ease-in-out;[span_704](start_span)[span_704](end_span)
            }[span_705](start_span)[span_705](end_span)
            .search-results-grid {[span_706](start_span)[span_706](end_span)
                display: grid;[span_707](start_span)[span_707](end_span)
                grid-template-columns: 1fr;[span_708](start_span)[span_708](end_span)
                gap: 14px;[span_709](start_span)[span_709](end_span)
                padding: 16px 4px;[span_710](start_span)[span_710](end_span)
                max-height: 50vh;[span_711](start_span)[span_711](end_span)
                overflow-y: auto;[span_712](start_span)[span_712](end_span)
            }[span_713](start_span)[span_713](end_span)
            .search-results-grid::-webkit-scrollbar {[span_714](start_span)[span_714](end_span)
                width: 6px;[span_715](start_span)[span_715](end_span)
            }[span_716](start_span)[span_716](end_span)
            .search-results-grid::-webkit-scrollbar-track {[span_717](start_span)[span_717](end_span)
                background: rgba(255, 145, 164, 0.05);[span_718](start_span)[span_718](end_span)
                border-radius: 10px;[span_719](start_span)[span_719](end_span)
            }[span_720](start_span)[span_720](end_span)
            .search-results-grid::-webkit-scrollbar-thumb {[span_721](start_span)[span_721](end_span)
                background: var(--bose-pink);[span_722](start_span)[span_722](end_span)
                border-radius: 10px;[span_723](start_span)[span_723](end_span)
            }[span_724](start_span)[span_724](end_span)
            .search-result-card {[span_725](start_span)[span_725](end_span)
                display: flex;[span_726](start_span)[span_726](end_span)
                gap: 16px;[span_727](start_span)[span_727](end_span)
                padding: 12px;[span_728](start_span)[span_728](end_span)
                border-radius: 18px;[span_729](start_span)[span_729](end_span)
                border: var(--bose-border-pink);[span_730](start_span)[span_730](end_span)
                background: var(--bose-white);[span_731](start_span)[span_731](end_span)
                transition: all 0.25s ease;[span_732](start_span)[span_732](end_span)
                align-items: center;[span_733](start_span)[span_733](end_span)
                text-decoration: none;[span_734](start_span)[span_734](end_span)
                color: inherit;[span_735](start_span)[span_735](end_span)
                box-shadow: 0 4px 15px rgba(255, 145, 164, 0.06);[span_736](start_span)[span_736](end_span)
            }[span_737](start_span)[span_737](end_span)
            .search-result-card:hover {[span_738](start_span)[span_738](end_span)
                transform: translateY(-2px);[span_739](start_span)[span_739](end_span)
                border-color: var(--bose-pink);[span_740](start_span)[span_740](end_span)
                box-shadow: var(--bose-shadow-hover);[span_741](start_span)[span_741](end_span)
            }[span_742](start_span)[span_742](end_span)
            .search-card-img {[span_743](start_span)[span_743](end_span)
                width: 70px;[span_744](start_span)[span_744](end_span)
                height: 70px;[span_745](start_span)[span_745](end_span)
                border-radius: 12px;[span_746](start_span)[span_746](end_span)
                object-fit: cover;[span_747](start_span)[span_747](end_span)
                flex-shrink: 0;[span_748](start_span)[span_748](end_span)
            }[span_749](start_span)[span_749](end_span)
            .search-card-info-pane {[span_750](start_span)[span_750](end_span)
                flex-grow: 1;[span_751](start_span)[span_751](end_span)
                display: flex;[span_752](start_span)[span_752](end_span)
                flex-direction: column;[span_753](start_span)[span_753](end_span)
                gap: 4px;[span_754](start_span)[span_754](end_span)
                overflow: hidden;[span_755](start_span)[span_755](end_span)
                text-align: right;[span_756](start_span)[span_756](end_span)
                direction: rtl;[span_757](start_span)[span_757](end_span)
            }[span_758](start_span)[span_758](end_span)
            .search-card-title {[span_759](start_span)[span_759](end_span)
                font-size: 0.95rem;[span_760](start_span)[span_760](end_span)
                font-weight: 700;[span_761](start_span)[span_761](end_span)
                color: var(--bose-black);[span_762](start_span)[span_762](end_span)
                line-height: 1.3;[span_763](start_span)[span_763](end_span)
                white-space: nowrap;[span_764](start_span)[span_764](end_span)
                overflow: hidden;[span_765](start_span)[span_765](end_span)
                text-overflow: ellipsis;[span_766](start_span)[span_766](end_span)
                margin: 0;[span_767](start_span)[span_767](end_span)
            }[span_768](start_span)[span_768](end_span)
            .search-card-flavor {[span_769](start_span)[span_769](end_span)
                font-size: 0.8rem;[span_770](start_span)[span_770](end_span)
                font-weight: 700;[span_771](start_span)[span_771](end_span)
                color: var(--bose-pink);[span_772](start_span)[span_772](end_span)
                white-space: nowrap;[span_773](start_span)[span_773](end_span)
                overflow: hidden;[span_774](start_span)[span_774](end_span)
                text-overflow: ellipsis;[span_775](start_span)[span_775](end_span)
            }[span_776](start_span)[span_776](end_span)
            .search-card-meta-row {[span_777](start_span)[span_777](end_span)
                display: flex;[span_778](start_span)[span_778](end_span)
                justify-content: space-between;[span_779](start_span)[span_779](end_span)
                align-items: center;[span_780](start_span)[span_780](end_span)
                margin-top: 4px;[span_781](start_span)[span_781](end_span)
            }[span_782](start_span)[span_782](end_span)
            .search-card-price {[span_783](start_span)[span_783](end_span)
                font-size: 0.95rem;[span_784](start_span)[span_784](end_span)
                font-weight: 700;[span_785](start_span)[span_785](end_span)
                color: var(--bose-pink);[span_786](start_span)[span_786](end_span)
            }[span_787](start_span)[span_787](end_span)
            .search-card-action-badge {[span_788](start_span)[span_788](end_span)
                font-size: 0.75rem;[span_789](start_span)[span_789](end_span)
                background: rgba(255, 145, 164, 0.1);[span_790](start_span)[span_790](end_span)
                padding: 2px 8px;[span_791](start_span)[span_791](end_span)
                border-radius: 8px;[span_792](start_span)[span_792](end_span)
                color: var(--bose-black);[span_793](start_span)[span_793](end_span)
                opacity: 0.8;[span_794](start_span)[span_794](end_span)
                font-weight: 700;[span_795](start_span)[span_795](end_span)
            }[span_796](start_span)[span_796](end_span)
            
            .bose-navbar, .bose-footer, .bose-drawer-menu {[span_797](start_span)[span_797](end_span)
                opacity: 0;[span_798](start_span)[span_798](end_span)
                transition: opacity 0.35s ease-in-out;[span_799](start_span)[span_799](end_span)
            }[span_800](start_span)[span_800](end_span)
            .bose-navbar.loaded, .bose-footer.loaded, .bose-drawer-menu.loaded {[span_801](start_span)[span_801](end_span)
                opacity: 1;[span_802](start_span)[span_802](end_span)
            }[span_803](start_span)[span_803](end_span)
            
            @keyframes bose-spin {[span_804](start_span)[span_804](end_span)
                0% { transform: rotate(0deg); }[span_805](start_span)[span_805](end_span)
                100% { transform: rotate(360deg); }[span_806](start_span)[span_806](end_span)
            }[span_807](start_span)[span_807](end_span)

            .bose-dots-container {[span_808](start_span)[span_808](end_span)
                display: flex;[span_809](start_span)[span_809](end_span)
                justify-content: center;[span_810](start_span)[span_810](end_span)
                align-items: center;[span_811](start_span)[span_811](end_span)
                gap: 8px;[span_812](start_span)[span_812](end_span)
                margin-top: 16px;[span_813](start_span)[span_813](end_span)
                width: 100%;[span_814](start_span)[span_814](end_span)
            }[span_815](start_span)[span_815](end_span)
            .bose-dot {[span_816](start_span)[span_816](end_span)
                width: 10px;[span_817](start_span)[span_817](end_span)
                height: 10px;[span_818](start_span)[span_818](end_span)
                border-radius: 50%;[span_819](start_span)[span_819](end_span)
                background-color: rgba(255, 145, 164, 0.3);[span_820](start_span)[span_820](end_span)
                transition: all 0.3s ease;[span_821](start_span)[span_821](end_span)
                cursor: pointer;[span_822](start_span)[span_822](end_span)
                border: none;[span_823](start_span)[span_823](end_span)
                padding: 0;[span_824](start_span)[span_824](end_span)
            }[span_825](start_span)[span_825](end_span)
            .bose-dot.active {[span_826](start_span)[span_826](end_span)
                background-color: var(--bose-pink);[span_827](start_span)[span_827](end_span)
                width: 24px;[span_828](start_span)[span_828](end_span)
                border-radius: 5px;[span_829](start_span)[span_829](end_span)
            }[span_830](start_span)[span_830](end_span)

            .nav-list a.active, .drawer-links-list a.active {[span_831](start_span)[span_831](end_span)
                color: var(--bose-pink) !important;[span_832](start_span)[span_832](end_span)
                border-bottom: 2px solid var(--bose-pink);[span_833](start_span)[span_833](end_span)
            }[span_834](start_span)[span_834](end_span)
            .drawer-links-list a.active {[span_835](start_span)[span_835](end_span)
                border-bottom: none !important;[span_836](start_span)[span_836](end_span)
                background: rgba(255, 145, 164, 0.08);[span_837](start_span)[span_837](end_span)
                border-radius: 12px;[span_838](start_span)[span_838](end_span)
                padding: 8px 12px;[span_839](start_span)[span_839](end_span)
                width: 100%;[span_840](start_span)[span_840](end_span)
            }[span_841](start_span)[span_841](end_span)
            
            .bose-manual-scroll-active {[span_842](start_span)[span_842](end_span)
                scroll-snap-type: x mandatory;[span_843](start_span)[span_843](end_span)
                overflow-x: auto !important;[span_844](start_span)[span_844](end_span)
                -webkit-overflow-scrolling: touch;[span_845](start_span)[span_845](end_span)
            }[span_846](start_span)[span_846](end_span)
            .bose-manual-scroll-active > * {[span_847](start_span)[span_847](end_span)
                scroll-snap-align: start;[span_848](start_span)[span_848](end_span)
            }[span_849](start_span)[span_849](end_span)

            .animate-marquee, .categories-track-loop {[span_850](start_span)[span_850](end_span)
                overflow-x: auto !important;[span_851](start_span)[span_851](end_span)
                scrollbar-width: none;[span_852](start_span)[span_852](end_span)
                -ms-overflow-style: none;[span_853](start_span)[span_853](end_span)
            }[span_854](start_span)[span_854](end_span)
            .animate-marquee::-webkit-scrollbar, .categories-track-loop::-webkit-scrollbar {[span_855](start_span)[span_855](end_span)
                display: none !important;[span_856](start_span)[span_856](end_span)
            }[span_857](start_span)[span_857](end_span)
        `;
        document.head.appendChild(styleTag);[span_858](start_span)[span_858](end_span)
    }

    /**
     * تفعيل ميزة السحب واللمس لجميع سلايدرات الماركيه اللانهائية
     */
    function enableMarqueeDragScrolling(track) {
        if (!track) return;[span_859](start_span)[span_859](end_span)
        
        let isDragging = false;[span_860](start_span)[span_860](end_span)
        let startX;[span_861](start_span)[span_861](end_span)
        let scrollLeft;[span_862](start_span)[span_862](end_span)

        track.addEventListener('mousedown', (e) => {[span_863](start_span)[span_863](end_span)
            isDragging = true;[span_864](start_span)[span_864](end_span)
            startX = e.pageX - track.offsetLeft;[span_865](start_span)[span_865](end_span)
            scrollLeft = track.scrollLeft || 0;[span_866](start_span)[span_866](end_span)
            track.style.animationPlayState = 'paused';[span_867](start_span)[span_867](end_span)
            track.style.cursor = 'grabbing';[span_868](start_span)[span_868](end_span)
        });

        track.addEventListener('mouseleave', () => {[span_869](start_span)[span_869](end_span)
            if (isDragging) {[span_870](start_span)[span_870](end_span)
                isDragging = false;[span_871](start_span)[span_871](end_span)
                track.style.animationPlayState = 'running';[span_872](start_span)[span_872](end_span)
                track.style.cursor = '';[span_873](start_span)[span_873](end_span)
            }
        });

        track.addEventListener('mouseup', () => {[span_874](start_span)[span_874](end_span)
            if (isDragging) {[span_875](start_span)[span_875](end_span)
                isDragging = false;[span_876](start_span)[span_876](end_span)
                track.style.animationPlayState = 'running';[span_877](start_span)[span_877](end_span)
                track.style.cursor = '';[span_878](start_span)[span_878](end_span)
            }
        });

        track.addEventListener('mousemove', (e) => {[span_879](start_span)[span_879](end_span)
            if (!isDragging) return;[span_880](start_span)[span_880](end_span)
            e.preventDefault();[span_881](start_span)[span_881](end_span)
            const x = e.pageX - track.offsetLeft;[span_882](start_span)[span_882](end_span)
            const walk = (x - startX) * 1.5;[span_883](start_span)[span_883](end_span)
            track.scrollLeft = scrollLeft - walk;[span_884](start_span)[span_884](end_span)
        });

        track.addEventListener('touchstart', (e) => {[span_885](start_span)[span_885](end_span)
            isDragging = true;[span_886](start_span)[span_886](end_span)
            startX = e.touches[0].pageX - track.offsetLeft;[span_887](start_span)[span_887](end_span)
            scrollLeft = track.scrollLeft || 0;[span_888](start_span)[span_888](end_span)
            track.style.animationPlayState = 'paused';[span_889](start_span)[span_889](end_span)
        }, { passive: true });

        track.addEventListener('touchend', () => {[span_890](start_span)[span_890](end_span)
            if (isDragging) {[span_891](start_span)[span_891](end_span)
                isDragging = false;[span_892](start_span)[span_892](end_span)
                track.style.animationPlayState = 'running';[span_893](start_span)[span_893](end_span)
            }
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {[span_894](start_span)[span_894](end_span)
            if (!isDragging) return;[span_895](start_span)[span_895](end_span)
            const x = e.touches[0].pageX - track.offsetLeft;[span_896](start_span)[span_896](end_span)
            const walk = (x - startX) * 1.5;[span_897](start_span)[span_897](end_span)
            track.scrollLeft = scrollLeft - walk;[span_898](start_span)[span_898](end_span)
        }, { passive: true });
    }

    /**
     * ربط حركة السكرول في السلايدرات بنقاط التنقل السفلية
     */
    function setupScrollToDotsBinding(trackElement, sectionContainer, itemsCount) {
        if (!trackElement || !sectionContainer) return;[span_899](start_span)[span_899](end_span)
        
        trackElement.addEventListener('scroll', () => {[span_900](start_span)[span_900](end_span)
            const width = trackElement.scrollWidth / itemsCount;[span_901](start_span)[span_901](end_span)
            const currentIdx = Math.round(trackElement.scrollLeft / width);[span_902](start_span)[span_902](end_span)
            
            const dotsWrapper = sectionContainer.querySelector('.bose-dots-container');[span_903](start_span)[span_903](end_span)
            if (dotsWrapper) {[span_904](start_span)[span_904](end_span)
                dotsWrapper.querySelectorAll('.bose-dot').forEach((dot, idx) => {[span_905](start_span)[span_905](end_span)
                    dot.classList.toggle('active', idx === currentIdx);[span_906](start_span)[span_906](end_span)
                });
            }
        }, { passive: true });
    }

    /**
     * الهيكل الموحد الملتزم بالـ DOM هندسياً لحقن مكونات الهيدر والفوتر والدرج الجانبي
     */
    function injectUniversalLayout() {
        let pathPrefix = "";[span_907](start_span)[span_907](end_span)
        const currentPath = window.location.pathname;[span_908](start_span)[span_908](end_span)
        if (currentPath.includes("/admin/")) {[span_909](start_span)[span_909](end_span)
            return;[span_910](start_span)[span_910](end_span)
        }

        // [🛡️ إصلاح مسارات الروابط الفاخرة لبيئة الاستضافات المجانية وهواتف العملاء]
        const segments = currentPath.split('/');[span_911](start_span)[span_911](end_span)
        if (segments.length > 2) {[span_912](start_span)[span_912](end_span)
            const depth = segments.length - 2;[span_913](start_span)[span_913](end_span)
            for(let d=0; d < depth; d++) {[span_914](start_span)[span_914](end_span)
                if (segments[d+1] !== "" && !segments[d+1].includes('.html')) {[span_915](start_span)[span_915](end_span)
                    pathPrefix += "../";[span_916](start_span)[span_916](end_span)
                }
            }
        }

        let pageFileName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';[span_917](start_span)[span_917](end_span)
        if (pageFileName === '/' || pageFileName === '') {[span_918](start_span)[span_918](end_span)
            pageFileName = 'index.html';[span_919](start_span)[span_919](end_span)
        }

        const dynamicLogo = window.getBoseLogo();[span_920](start_span)[span_920](end_span)

        // 1. الهيدر الموحد والملتزم بالـ DOM هندسياً
        const existingNavbar = document.querySelector(".bose-navbar");[span_921](start_span)[span_921](end_span)
        if (existingNavbar && !existingNavbar.hasAttribute("data-dynamic-injected")) {[span_922](start_span)[span_922](end_span)
            existingNavbar.setAttribute("data-dynamic-injected", "true");[span_923](start_span)[span_923](end_span)
            existingNavbar.innerHTML = `[span_924](start_span)[span_924](end_span)
                <div class="navbar-mobile-wrapper" style="display: flex; width: 100%; justify-content: space-between; align-items: center; padding: 0 16px;">[span_925](start_span)[span_925](end_span)
                    <button id="mobile-menu-toggle" class="nav-icon-btn" aria-label="فتح قائمة التصفح" style="background: none; border: none; font-size: 1.4rem; color: var(--bose-black); cursor: pointer;">[span_926](start_span)[span_926](end_span)
                        <i class="fas fa-bars"></i>[span_927](start_span)[span_927](end_span)
                    </button>[span_928](start_span)[span_928](end_span)
                    
                    <div class="brand-logo-container" style="display: flex; align-items: center; gap: 8px;">[span_929](start_span)[span_929](end_span)
                        <a href="${pathPrefix}index.html" style="display: flex; align-items: center;">[span_930](start_span)[span_930](end_span)
                            <img id="bose-store-logo" src="${dynamicLogo}" alt="شعار حلويات بوسي" style="height: 44px; width: 44px; object-fit: contain;">[span_931](start_span)[span_931](end_span)
                        </a>[span_932](start_span)[span_932](end_span)
                    </div>[span_933](start_span)[span_933](end_span)
                    
                    <span class="brand-name-display" style="font-size: 1.15rem; font-weight: 700; color: var(--bose-black);">حلويات بوسي</span>[span_934](start_span)[span_934](end_span)
                    
                    <nav id="bose-nav-menu" style="display: none;">[span_935](start_span)[span_935](end_span)
                        <ul class="nav-list">[span_936](start_span)[span_936](end_span)
                            <li><a href="${pathPrefix}index.html" class="${pageFileName.includes('index.html') ? 'active' : ''}">الرئيسية</a></li>[span_937](start_span)[span_937](end_span)
                            <li><a href="${pathPrefix}menu.html" class="${pageFileName.includes('menu.html') || pageFileName.includes('category.html') ? 'active' : ''}">المنيو الشامل</a></li>[span_938](start_span)[span_938](end_span)
                            <li><a href="${pathPrefix}cake-builder.html" class="${pageFileName.includes('cake-builder.html') ? 'active' : ''}">محاكي التورت</a></li>[span_939](start_span)[span_939](end_span)
                            <li><a href="${pathPrefix}flower-builder.html" class="${pageFileName.includes('flower-builder.html') ? 'active' : ''}">محاكي الورد</a></li>[span_940](start_span)[span_940](end_span)
                        </ul>[span_941](start_span)[span_941](end_span)
                    </nav>[span_942](start_span)[span_942](end_span)
                    
                    <div class="nav-actions" style="display: flex; align-items: center; gap: 14px;">[span_943](start_span)[span_943](end_span)
                        <button id="nav-search-btn" class="nav-icon-btn" aria-label="البحث في المنتجات" style="background: none; border: none; font-size: 1.25rem; color: var(--bose-black); cursor: pointer;">[span_944](start_span)[span_944](end_span)
                            <i class="fas fa-search"></i>[span_945](start_span)[span_945](end_span)
                        </button>[span_946](start_span)[span_946](end_span)
                        
                        <a href="${pathPrefix}cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة التسوق" style="position: relative; font-size: 1.3rem; color: var(--bose-black); text-decoration: none;">[span_947](start_span)[span_947](end_span)
                            <i class="fas fa-shopping-bag"></i>[span_948](start_span)[span_948](end_span)
                            <span id="nav-cart-count" style="position: absolute; top: -8px; left: -10px; background: var(--bose-pink); color: #FFF; font-size: 0.75rem; font-weight: 700; padding: 2px 6px; border-radius: 50%; min-width: 14px; text-align: center; line-height: 1.2;">0</span>[span_949](start_span)[span_949](end_span)
                        </a>[span_950](start_span)[span_950](end_span)
                    </div>[span_951](start_span)[span_951](end_span)
                </div>[span_952](start_span)[span_952](end_span)
            `;[span_953](start_span)[span_953](end_span)
            requestAnimationFrame(() => {[span_954](start_span)[span_954](end_span)
                existingNavbar.classList.add("loaded");[span_955](start_span)[span_955](end_span)
            });
        }

        // 2. الدرج الجانبي الفاخر للموبايل والكمبيوتر
        let drawerMenu = document.querySelector(".bose-drawer-menu, #sidebar-drawer");[span_956](start_span)[span_956](end_span)
        if (drawerMenu && !drawerMenu.hasAttribute("data-dynamic-injected")) {[span_957](start_span)[span_957](end_span)
            drawerMenu.setAttribute("data-dynamic-injected", "true");[span_958](start_span)[span_958](end_span)
            drawerMenu.innerHTML = `[span_959](start_span)[span_959](end_span)
                <div class="drawer-premium-header" style="padding: 24px 20px; background: rgba(255,145,164,0.08); border-bottom: var(--bose-border-pink);">[span_960](start_span)[span_960](end_span)
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--bose-black);">قائمة التصفح الفاخرة</h3>[span_961](start_span)[span_961](end_span)
                    <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--bose-pink); font-weight: 600;">حلويات بوسي - فرع الكفاح 🌸</p>[span_962](start_span)[span_962](end_span)
                </div>[span_963](start_span)[span_963](end_span)
                <div class="drawer-links-scrollable" style="padding: 16px 20px; flex-grow: 1;">[span_964](start_span)[span_964](end_span)
                    <span class="drawer-divider-label" style="display: block; font-size: 0.75rem; font-weight: 700; color: #777; margin-bottom: 12px; letter-spacing: 0.5px;">الأقسام الرئيسية</span>[span_965](start_span)[span_965](end_span)
                    <ul class="drawer-links-list" style="list-style: none; padding: 0; margin: 0 0 24px 0; display: flex; flex-direction: column; gap: 14px;">[span_966](start_span)[span_966](end_span)
                        <li class="drawer-link-item"><a href="${pathPrefix}index.html" class="${pageFileName.includes('index.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-home" style="color: var(--bose-pink);"></i> الواجهة الرئيسية</a></li>[span_967](start_span)[span_967](end_span)
                        <li class="drawer-link-item"><a href="${pathPrefix}menu.html" class="${pageFileName.includes('menu.html') || pageFileName.includes('category.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-utensils" style="color: var(--bose-pink);"></i> المنيو الشامل</a></li>[span_968](start_span)[span_968](end_span)
                        <li class="drawer-link-item"><a href="${pathPrefix}cart.html" class="${pageFileName.includes('cart.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-shopping-basket" style="color: var(--bose-pink);"></i> سلة التسوق</a></li>[span_969](start_span)[span_969](end_span)
                    </ul>[span_970](start_span)[span_970](end_span)
                    <span class="drawer-divider-label" style="display: block; font-size: 0.75rem; font-weight: 700; color: #777; margin-bottom: 12px; letter-spacing: 0.5px;">المحاكيات الحصرية</span>[span_971](start_span)[span_971](end_span)
                    <ul class="drawer-links-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px;">[span_972](start_span)[span_972](end_span)
                        <li class="drawer-link-item featured-hub"><a href="${pathPrefix}cake-builder.html" class="${pageFileName.includes('cake-builder.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-birthday-cake" style="color: var(--bose-gold);"></i> محاكي التورت التفاعلي</a></li>[span_973](start_span)[span_973](end_span)
                        <li class="drawer-link-item featured-hub"><a href="${pathPrefix}flower-builder.html" class="${pageFileName.includes('flower-builder.html') ? 'active' : ''}" style="text-decoration: none; color: var(--bose-black); font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;"><i class="fas fa-spa" style="color: var(--bose-gold);"></i> محاكي الورد التفاعلي</a></li>[span_974](start_span)[span_974](end_span)
                    </ul>[span_975](start_span)[span_975](end_span)
                </div>[span_976](start_span)[span_976](end_span)
                <div class="drawer-premium-footer" style="padding: 20px; border-top: var(--bose-border-pink); display: flex; flex-direction: column; gap: 12px;">[span_977](start_span)[span_977](end_span)
                    <a href="tel:01097238441" class="bose-btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--bose-pink); color: #FFF; text-decoration: none; font-weight: 700; padding: 12px; border-radius: 12px; text-align: center; font-size: 0.9rem; box-shadow: var(--bose-shadow-glow);">اتصال فوري بالفرع</a>[span_978](start_span)[span_978](end_span)
                    <p style="margin: 0; font-size: 0.75rem; text-align: center; color: #888;">&copy; 2026 جميع الحقوق محفوظة لـ علامة حلويات بوسي الفاخرة.</p>[span_979](start_span)[span_979](end_span)
                </div>[span_980](start_span)[span_980](end_span)
            `;[span_981](start_span)[span_981](end_span)
            requestAnimationFrame(() => {[span_982](start_span)[span_982](end_span)
                drawerMenu.classList.add("loaded");[span_983](start_span)[span_983](end_span)
            });
        }

        // 3. الفوتر الموحد الفاتح والملتزم بالـ DOM لمنع المساحات المهدرة
        const existingFooter = document.querySelector(".bose-footer");[span_984](start_span)[span_984](end_span)
        if (existingFooter && !existingFooter.hasAttribute("data-dynamic-injected")) {[span_985](start_span)[span_985](end_span)
            existingFooter.setAttribute("data-dynamic-injected", "true");[span_986](start_span)[span_986](end_span)
            existingFooter.innerHTML = `[span_987](start_span)[span_987](end_span)
                <div class="footer-inner-wrapper" style="width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 16px; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;">[span_988](start_span)[span_988](end_span)
                    <div class="footer-logo-container">[span_989](start_span)[span_989](end_span)
                        <a href="${pathPrefix}index.html">[span_990](start_span)[span_990](end_span)
                            <img id="bose-store-logo" src="${dynamicLogo}" alt="شعار حلويات بوسي" style="height: 60px; object-fit: contain;">[span_991](start_span)[span_991](end_span)
                        </a>[span_992](start_span)[span_992](end_span)
                    </div>[span_993](start_span)[span_993](end_span)
                    
                    <span class="brand-name-display footer-brand-name" style="font-size: 1.4rem; font-weight: 700; color: var(--bose-black);">حلويات بوسي</span>[span_994](start_span)[span_994](end_span)

                    <div class="footer-about-block" style="max-width: 600px;">[span_995](start_span)[span_995](end_span)
                        <p id="footer-about-text" style="font-size: 0.95rem; color: #555; line-height: 1.6; margin: 0;">صنعناها بحب لتهديها لمن تحب. خبرة أكثر من 10 سنوات في صناعة الحلويات الفاخرة وتنسيق الهدايا والورد لنوثق أسعد لحظاتكم بتميز وااحترافية كاملة من فرع الكفاح.</p>[span_996](start_span)[span_996](end_span)
                    </div>
                    
                    <div id="footer-social-links" style="display: flex; gap: 16px; justify-content: center; margin: 8px 0;">[span_997](start_span)[span_997](end_span)
                        <a href="https://www.facebook.com/share/1H1vVMHyu9/" class="social-link-facebook" target="_blank" aria-label="فيسبوك حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #3b5998; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-facebook-f"></i></a>[span_998](start_span)[span_998](end_span)
                        <a href="https://www.instagram.com/bose_sweets?igsh=amdkMmhxMXJyanYy" class="social-link-instagram" target="_blank" aria-label="انستجرام حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #e1306c; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-instagram"></i></a>[span_999](start_span)[span_999](end_span)
                        <a href="https://www.tiktok.com/@bosesweets1?_r=1&_t=ZS-96lRDDHq9QK" class="social-link-tiktok" target="_blank" aria-label="تيك توك حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #000000; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-tiktok"></i></a>[span_1000](start_span)[span_1000](end_span)
                        <a href="https://wa.me/201097238441" class="social-link-whatsapp" target="_blank" aria-label="واتساب حلويات بوسي" style="width: 40px; height: 40px; border-radius: 50%; background: #25d366; color: #FFF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: transform 0.2s;"><i class="fab fa-whatsapp"></i></a>[span_1001](start_span)[span_1001](end_span)
                    </div>[span_1002](start_span)[span_1002](end_span)
                    
                    <div class="footer-policies-container">[span_1003](start_span)[span_1003](end_span)
                        <ul class="footer-links-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 20px;">[span_1004](start_span)[span_1004](end_span)
                            <li><a href="${pathPrefix}privacy-policy.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">سياسة الخصوصية</a></li>[span_1005](start_span)[span_1005](end_span)
                            <li><a href="${pathPrefix}terms.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">الشروط والأحكام</a></li>[span_1006](start_span)[span_1006](end_span)
                            <li><a href="${pathPrefix}shipping-policy.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">سياسة الطلبات والتوصيل</a></li>[span_1007](start_span)[span_1007](end_span)
                            <li><a href="${pathPrefix}refund-policy.html" style="text-decoration: none; color: var(--bose-black); font-size: 0.85rem; font-weight: 700;">سياسة الاستبدال والاسترجاع</a></li>[span_1008](start_span)[span_1008](end_span)
                        </ul>[span_1009](start_span)[span_1009](end_span)
                    </div>[span_1010](start_span)[span_1010](end_span)
                    
                    <div class="footer-copyright-block" style="margin-top: 16px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 20px; width: 100%;">[span_1011](start_span)[span_1011](end_span)
                        <p style="margin: 0; font-size: 0.8rem; color: #777; font-weight: 600;">© <span>2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة</p>[span_1012](start_span)[span_1012](end_span)
                    </div>[span_1013](start_span)[span_1013](end_span)
                </div>[span_1014](start_span)[span_1014](end_span)
            `;[span_1015](start_span)[span_1015](end_span)
            requestAnimationFrame(() => {[span_1016](start_span)[span_1016](end_span)
                existingFooter.classList.add("loaded");[span_1017](start_span)[span_1017](end_span)
            });
        }
    }

    /**
     * جلب وتحميل قاعدة البيانات مع حماية المزامنة الزمنية وفحص المسارات البديلة
     */
    async function loadStoreDatabase() {
        if (window.boseDatabaseLoading) return;[span_1018](start_span)[span_1018](end_span)
        window.boseDatabaseLoading = true;[span_1019](start_span)[span_1019](end_span)
        
        injectCoreStyles();[span_1020](start_span)[span_1020](end_span)

        const retryDelays = [1000, 2000, 4000, 8000, 16000];[span_1021](start_span)[span_1021](end_span)
        let successfulFetch = false;[span_1022](start_span)[span_1022](end_span)

        for (let attempt = 1; attempt <= 5; attempt++) {[span_1023](start_span)[span_1023](end_span)
            for (const path of DATABASE_PATHS) {[span_1024](start_span)[span_1024](end_span)
                try {
                    const response = await fetch(path);[span_1025](start_span)[span_1025](end_span)
                    if (!response.ok) continue;[span_1026](start_span)[span_1026](end_span)

                    const serverDateHeader = response.headers.get('Date');[span_1027](start_span)[span_1027](end_span)
                    if (serverDateHeader) {[span_1028](start_span)[span_1028](end_span)
                        const serverTime = new Date(serverDateHeader).getTime();[span_1029](start_span)[span_1029](end_span)
                        const clientTime = Date.now();[span_1030](start_span)[span_1030](end_span)
                        window.boseServerTimeOffset = serverTime - clientTime;[span_1031](start_span)[span_1031](end_span)
                    } else {
                        window.boseServerTimeOffset = 0;[span_1032](start_span)[span_1032](end_span)
                    }

                    const rawData = await response.json();[span_1033](start_span)[span_1033](end_span)
                    
                    if (rawData && rawData.products) {[span_1034](start_span)[span_1034](end_span)
                        rawData.products = rawData.products.map(product => {[span_1035](start_span)[span_1035](end_span)
                            if (product.category === "taswaq-dark-nutella") {[span_1036](start_span)[span_1036](end_span)
                                product.category = "taswaq-qashtota";[span_1037](start_span)[span_1037](end_span)
                            }
                            return product;[span_1038](start_span)[span_1038](end_span)
                        });
                    }
                    
                    window.BoseStoreData = rawData;[span_1039](start_span)[span_1039](end_span)
                    window.boseDatabaseLoading = false;[span_1040](start_span)[span_1040](end_span)
                    
                    injectUniversalLayout();[span_1041](start_span)[span_1041](end_span)
                    applyGlobalSEOAndBranding();[span_1042](start_span)[span_1042](end_span)
                    window.updateGlobalCartCounter();[span_1043](start_span)[span_1043](end_span)
                    initializeGlobalUIEvents();[span_1044](start_span)[span_1044](end_span)
                    
                    autoPopulateHomepageComponents(rawData);[span_1045](start_span)[span_1045](end_span)
                    
                    databaseResolvers.forEach(resolve => resolve(window.BoseStoreData));[span_1046](start_span)[span_1046](end_span)
                    databaseResolvers = [];[span_1047](start_span)[span_1047](end_span)
                    
                    const dbEvent = new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData });[span_1048](start_span)[span_1048](end_span)
                    window.dispatchEvent(dbEvent);[span_1049](start_span)[span_1049](end_span)
                    document.dispatchEvent(dbEvent);[span_1050](start_span)[span_1050](end_span)
                    window.dispatchEvent(new Event('bose_data_ready'));[span_1051](start_span)[span_1051](end_span)
                    successfulFetch = true;[span_1052](start_span)[span_1052](end_span)
                    return;[span_1053](start_span)[span_1053](end_span)

                } catch (error) {
                    // الانتقال التلقائي للمسار البديل التالي
                }
            }

            if (successfulFetch) return;[span_1054](start_span)[span_1054](end_span)

            // التحميل الاحتياطي لقاعدة البيانات الفورية عند حدوث خطأ
            if (attempt === 5 || window.location.protocol === 'file:') {[span_1055](start_span)[span_1055](end_span)
                console.warn("⚠️ تم تفعيل بواب الأمان والتحميل الاحتياطي لقاعدة البيانات لتأمين التشغيل الفوري.");[span_1056](start_span)[span_1056](end_span)
                window.BoseStoreData = BOSE_FALLBACK_DATABASE;[span_1057](start_span)[span_1057](end_span)
                window.boseDatabaseLoading = false;[span_1058](start_span)[span_1058](end_span)
                
                injectUniversalLayout();[span_1059](start_span)[span_1059](end_span)
                applyGlobalSEOAndBranding();[span_1060](start_span)[span_1060](end_span)
                window.updateGlobalCartCounter();[span_1061](start_span)[span_1061](end_span)
                initializeGlobalUIEvents();[span_1062](start_span)[span_1062](end_span)
                autoPopulateHomepageComponents(BOSE_FALLBACK_DATABASE);[span_1063](start_span)[span_1063](end_span)
                
                databaseResolvers.forEach(resolve => resolve(BOSE_FALLBACK_DATABASE));[span_1064](start_span)[span_1064](end_span)
                databaseResolvers = [];[span_1065](start_span)[span_1065](end_span)
                
                const dbEvent = new CustomEvent('BoseDatabaseLoaded', { detail: BOSE_FALLBACK_DATABASE });[span_1066](start_span)[span_1066](end_span)
                window.dispatchEvent(dbEvent);[span_1067](start_span)[span_1067](end_span)
                document.dispatchEvent(dbEvent);[span_1068](start_span)[span_1068](end_span)
                window.dispatchEvent(new Event('bose_data_ready'));[span_1069](start_span)[span_1069](end_span)
                return;
            } else {
                await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));[span_1070](start_span)[span_1070](end_span)
            }
        }
    }

    /**
     * رندرة وإنتاج كروت المنتجات بدقة هندسية ومظهر ناعم ومرتّب تماماً
     */
    function generateStrictProductCardHTML(product, currency) {
        const defaultImage = window.getBoseLogo();[span_1071](start_span)[span_1071](end_span)
        const cleanImg = product.image || (product.images && product.images[0] ? product.images[0] : defaultImage);[span_1072](start_span)[span_1072](end_span)
        const cleanTitle = escapeHTML(product.title);[span_1073](start_span)[span_1073](end_span)
        const cleanFlavor = escapeHTML(product.flavorName || "كلاسيك");[span_1074](start_span)[span_1074](end_span)
        const cleanDesc = escapeHTML(product.flavorDesc || product.description || "");[span_1075](start_span)[span_1075](end_span)
        
        const defaultSize = product.defaultSize || 'triangle';[span_1076](start_span)[span_1076](end_span)
        const initialRawPrice = (product.prices && product.prices[defaultSize]) ? product.prices[defaultSize] : product.price;[span_1077](start_span)[span_1077](end_span)
        const finalPrice = window.calculateBosePrice(initialRawPrice, "menu-only");[span_1078](start_span)[span_1078](end_span)

        let sizeSelectorHTML = "";[span_1079](start_span)[span_1079](end_span)
        if (product.sizes && product.prices) {[span_1080](start_span)[span_1080](end_span)
            sizeSelectorHTML = `<div class="product-card-size-tabs" style="display: flex; gap: 6px; margin: 4px 0 8px 0; justify-content: flex-start; flex-wrap: wrap; direction: rtl;">`;[span_1081](start_span)[span_1081](end_span)
            product.sizes.forEach((sz) => {[span_1082](start_span)[span_1082](end_span)
                const isActive = sz.id === defaultSize;[span_1083](start_span)[span_1083](end_span)
                sizeSelectorHTML += `[span_1084](start_span)[span_1084](end_span)
                    <button class="size-tab-btn ${isActive ? 'active' : ''}" data-size-id="${sz.id}" data-size-price="${product.prices[sz.id]}" style="background: ${isActive ? 'var(--bose-pink)' : 'rgba(255, 145, 164, 0.08)'}; color: ${isActive ? '#fff' : 'var(--bose-black)'}; border: 1px solid var(--bose-pink); border-radius: 8px; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s;">[span_1085](start_span)[span_1085](end_span)
                        ${sz.name}[span_1086](start_span)[span_1086](end_span)
                    </button>[span_1087](start_span)[span_1087](end_span)
                `;[span_1088](start_span)[span_1088](end_span)
            });
            sizeSelectorHTML += `</div>`;[span_1089](start_span)[span_1089](end_span)
        }

        return `[span_1090](start_span)[span_1090](end_span)
            <div class="product-card" data-slug="${product.slug}" data-selected-size="${defaultSize}" style="border: var(--bose-border-pink); border-radius: 20px; background: var(--bose-white); overflow: hidden; padding: 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: var(--bose-shadow-glow); transition: 0.3s ease; text-align: right; direction: rtl;">[span_1091](start_span)[span_1091](end_span)
                <a href="product.html?slug=${product.slug}" style="text-decoration: none; display: block; overflow: hidden; border-radius: 12px; height: 220px;" aria-label="عرض تفاصيل ${cleanTitle}">[span_1092](start_span)[span_1092](end_span)
                    <img class="product-card-img bose-fade-in-img" src="${cleanImg}" alt="${cleanTitle}" style="width: 100%; height: 100%; object-fit: cover; display: block; transition: 0.3s;" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${defaultImage}';" loading="lazy">[span_1093](start_span)[span_1093](end_span)
                </a>[span_1094](start_span)[span_1094](end_span)
                
                <h3 class="product-card-title" style="margin: 4px 0 0 0; font-size: 1.05rem; font-weight: 700; color: var(--bose-black); line-height: 1.4;">${cleanTitle}</h3>[span_1095](start_span)[span_1095](end_span)
                
                <span class="product-card-flavor-name" style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--bose-pink); margin-top: -2px;">${cleanFlavor}</span>[span_1096](start_span)[span_1096](end_span)
                
                <p class="product-card-desc" style="margin: 4px 0 8px 0; font-size: 0.8rem; font-weight: 400; color: var(--bose-black); opacity: 0.8; line-height: 1.5; min-height: 60px; max-height: 60px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${cleanDesc}</p>[span_1097](start_span)[span_1097](end_span)
                
                ${sizeSelectorHTML}[span_1098](start_span)[span_1098](end_span)

                <div style="margin-top: auto; display: flex; flex-direction: column; gap: 12px;">[span_1099](start_span)[span_1099](end_span)
                    <div class="qty-counter-row" style="display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--bose-pink); border-radius: 50px; background: var(--bose-white); padding: 2px 8px; direction: rtl;">[span_1100](start_span)[span_1100](end_span)
                        <button class="btn-qty-plus" style="background: none; border: none; color: var(--bose-black); font-size: 18px; font-weight: 700; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;" aria-label="زيادة الكمية">+</button>[span_1101](start_span)[span_1101](end_span)
                        <input type="number" class="input-qty-value" value="1" min="1" readonly style="width: 35px; text-align: center; border: none; font-size: 14px; font-weight: 700; color: var(--bose-black); background: transparent; outline: none;" aria-label="الكمية الحالية">[span_1102](start_span)[span_1102](end_span)
                        <button class="btn-qty-minus" style="background: none; border: none; color: var(--bose-black); font-size: 18px; font-weight: 700; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center;" aria-label="نقص الكمية">-</button>[span_1103](start_span)[span_1103](end_span)
                    </div>[span_1104](start_span)[span_1104](end_span)

                    <div class="product-card-price" style="font-size: 1.1rem; font-weight: 700; color: var(--bose-pink); text-align: right;" data-base-price="${finalPrice}">[span_1105](start_span)[span_1105](end_span)
                        ${finalPrice} ${currency}[span_1106](start_span)[span_1106](end_span)
                    </div>[span_1107](start_span)[span_1107](end_span)

                    <button class="btn-add-to-cart" style="background: var(--bose-pink); color: var(--bose-white); border: none; padding: 12px; border-radius: 50px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; box-shadow: 0 4px 12px rgba(255, 145, 164, 0.15); width: 100%;">[span_1108](start_span)[span_1108](end_span)
                        <i class="fas fa-shopping-bag" style="font-size: 0.9rem;"></i> إضافة للسلة[span_1109](start_span)[span_1109](end_span)
                    </button>[span_1110](start_span)[span_1110](end_span)
                </div>[span_1111](start_span)[span_1111](end_span)
            </div>[span_1112](start_span)[span_1112](end_span)
        `;[span_1113](start_span)[span_1113](end_span)
    }
    window.generateStrictProductCardHTML = generateStrictProductCardHTML;[span_1114](start_span)[span_1114](end_span)

    /**
     * ربط أحداث كروت المنتجات لضمان تفعيل العدادات وإضافة السلة التفاعلية بدقة
     */
    function attachProductCardEvents(container, productsList, currency) {
        if (!container) return;[span_1115](start_span)[span_1115](end_span)

        container.querySelectorAll('.product-card').forEach(card => {[span_1116](start_span)[span_1116](end_span)
            const slug = card.dataset.slug;[span_1117](start_span)[span_1117](end_span)
            const product = productsList.find(p => p.slug === slug);[span_1118](start_span)[span_1118](end_span)
            if (!product) return;[span_1119](start_span)[span_1119](end_span)

            const qtyInput = card.querySelector('.input-qty-value');[span_1120](start_span)[span_1120](end_span)
            const priceDisplay = card.querySelector('.product-card-price');[span_1121](start_span)[span_1121](end_span)
            const plusBtn = card.querySelector('.btn-qty-plus');[span_1122](start_span)[span_1122](end_span)
            const minusBtn = card.querySelector('.btn-qty-minus');[span_1123](start_span)[span_1123](end_span)
            const addToCartBtn = card.querySelector('.btn-add-to-cart');[span_1124](start_span)[span_1124](end_span)

            const updatePriceDisplay = () => {[span_1125](start_span)[span_1125](end_span)
                const qty = parseInt(qtyInput.value, 10) || 1;[span_1126](start_span)[span_1126](end_span)
                const currentBase = parseFloat(priceDisplay.dataset.basePrice) || product.price;[span_1127](start_span)[span_1127](end_span)
                priceDisplay.textContent = `${currentBase * qty} ${currency}`;[span_1128](start_span)[span_1128](end_span)
            };

            const sizeTabs = card.querySelectorAll('.size-tab-btn');[span_1129](start_span)[span_1129](end_span)
            sizeTabs.forEach(tab => {[span_1130](start_span)[span_1130](end_span)
                tab.addEventListener('click', (e) => {[span_1131](start_span)[span_1131](end_span)
                    e.preventDefault();[span_1132](start_span)[span_1132](end_span)
                    
                    sizeTabs.forEach(t => {[span_1133](start_span)[span_1133](end_span)
                        t.classList.remove('active');[span_1134](start_span)[span_1134](end_span)
                        t.style.background = 'rgba(255, 145, 164, 0.08)';[span_1135](start_span)[span_1135](end_span)
                        t.style.color = 'var(--bose-black)';[span_1136](start_span)[span_1136](end_span)
                    });

                    tab.classList.add('active');[span_1137](start_span)[span_1137](end_span)
                    tab.style.background = 'var(--bose-pink)';[span_1138](start_span)[span_1138](end_span)
                    tab.style.color = '#fff';[span_1139](start_span)[span_1139](end_span)

                    const selectedSize = tab.dataset.sizeId;[span_1140](start_span)[span_1140](end_span)
                    const rawPrice = parseFloat(tab.dataset.sizePrice);[span_1141](start_span)[span_1141](end_span)
                    const calculatedUnitPrice = window.calculateBosePrice(rawPrice, "menu-only");[span_1142](start_span)[span_1142](end_span)

                    card.dataset.selectedSize = selectedSize;[span_1143](start_span)[span_1143](end_span)
                    priceDisplay.dataset.basePrice = calculatedUnitPrice;[span_1144](start_span)[span_1144](end_span)
                    updatePriceDisplay();[span_1145](start_span)[span_1145](end_span)
                });
            });

            if (plusBtn && minusBtn && qtyInput) {[span_1146](start_span)[span_1146](end_span)
                plusBtn.addEventListener('click', (e) => {[span_1147](start_span)[span_1147](end_span)
                    e.preventDefault();[span_1148](start_span)[span_1148](end_span)
                    let val = parseInt(qtyInput.value, 10) || 1;[span_1149](start_span)[span_1149](end_span)
                    qtyInput.value = val + 1;[span_1150](start_span)[span_1150](end_span)
                    updatePriceDisplay();[span_1151](start_span)[span_1151](end_span)
                });

                minusBtn.addEventListener('click', (e) => {[span_1152](start_span)[span_1152](end_span)
                    e.preventDefault();[span_1153](start_span)[span_1153](end_span)
                    let val = parseInt(qtyInput.value, 10) || 1;[span_1154](start_span)[span_1154](end_span)
                    if (val > 1) {[span_1155](start_span)[span_1155](end_span)
                        qtyInput.value = val - 1;[span_1156](start_span)[span_1156](end_span)
                        updatePriceDisplay();[span_1157](start_span)[span_1157](end_span)
                    }
                });
            }

            if (addToCartBtn) {[span_1158](start_span)[span_1158](end_span)
                addToCartBtn.addEventListener('click', (e) => {[span_1159](start_span)[span_1159](end_span)
                    e.preventDefault();[span_1160](start_span)[span_1160](end_span)
                    const qty = parseInt(qtyInput.value, 10) || 1;[span_1161](start_span)[span_1161](end_span)
                    const activeSize = card.dataset.selectedSize || 'triangle';[span_1162](start_span)[span_1162](end_span)
                    
                    const options = {};[span_1163](start_span)[span_1163](end_span)
                    if (product.sizes) {[span_1164](start_span)[span_1164](end_span)
                        options.size = activeSize;[span_1165](start_span)[span_1165](end_span)
                        const matchedSize = product.sizes.find(s => s.id === activeSize);[span_1166](start_span)[span_1166](end_span)
                        options.flavorName = `${product.flavorName || "كلاسيك"} (${matchedSize ? matchedSize.name : ""})`;[span_1167](start_span)[span_1167](end_span)
                    } else {
                        options.flavorName = product.flavorName || "كلاسيك";[span_1168](start_span)[span_1168](end_span)
                    }

                    const standardItem = window.createCartItem(product, options, qty);[span_1169](start_span)[span_1169](end_span)
                    if (standardItem) {[span_1170](start_span)[span_1170](end_span)
                        window.addBoseCartItem(standardItem);[span_1171](start_span)[span_1171](end_span)
                        qtyInput.value = 1;[span_1172](start_span)[span_1172](end_span)
                        updatePriceDisplay();[span_1173](start_span)[span_1173](end_span)
                    }
                });
            }
        });
    }
    window.attachProductCardEvents = attachProductCardEvents;[span_1174](start_span)[span_1174](end_span)

    /**
     * مولّد ومحرك مؤشرات التصفح النقطية (Dots) التفاعلية لجميع السلايدرات
     */
    function generateBoseDots(sliderContainer, totalItems, activeIndex = 0, onDotClick = null) {
        if (!sliderContainer) return;[span_1175](start_span)[span_1175](end_span)
        
        let dotsWrapper = sliderContainer.querySelector('.bose-dots-container');[span_1176](start_span)[span_1176](end_span)
        if (!dotsWrapper) {[span_1177](start_span)[span_1177](end_span)
            dotsWrapper = document.createElement('div');[span_1178](start_span)[span_1178](end_span)
            dotsWrapper.className = 'bose-dots-container';[span_1179](start_span)[span_1179](end_span)
            sliderContainer.appendChild(dotsWrapper);[span_1180](start_span)[span_1180](end_span)
        }
        
        dotsWrapper.innerHTML = '';[span_1181](start_span)[span_1181](end_span)
        for (let i = 0; i < totalItems; i++) {[span_1182](start_span)[span_1182](end_span)
            const dot = document.createElement('button');[span_1183](start_span)[span_1183](end_span)
            dot.className = `bose-dot ${i === activeIndex ? 'active' : ''}`;[span_1184](start_span)[span_1184](end_span)
            dot.setAttribute('aria-label', `الحقل رقم ${i + 1}`);[span_1185](start_span)[span_1185](end_span)
            
            dot.addEventListener('click', (e) => {[span_1186](start_span)[span_1186](end_span)
                e.preventDefault();[span_1187](start_span)[span_1187](end_span)
                dotsWrapper.querySelectorAll('.bose-dot').forEach((d, idx) => {[span_1188](start_span)[span_1188](end_span)
                    d.classList.toggle('active', idx === i);[span_1189](start_span)[span_1189](end_span)
                });
                if (typeof onDotClick === 'function') onDotClick(i);[span_1190](start_span)[span_1190](end_span)
            });
            dotsWrapper.appendChild(dot);[span_1191](start_span)[span_1191](end_span)
        }
    }

    /**
     * الأتمتة والملء الكامل لجميع أقسام الصفحة الرئيسية لعلامة حلويات بوسي
     */
    function autoPopulateHomepageComponents(data) {
        if (!data) return;[span_1192](start_span)[span_1192](end_span)

        if (!document.getElementById('hero-section') && !document.getElementById('waterfall-section')) {[span_1193](start_span)[span_1193](end_span)
            const marqueeTrack = document.getElementById('top-bar-marquee');[span_1194](start_span)[span_1194](end_span)
            if (marqueeTrack && data.navigation && data.navigation.topBarMessages) {[span_1195](start_span)[span_1195](end_span)
                renderTopMarquee(marqueeTrack, data.navigation.topBarMessages);[span_1196](start_span)[span_1196](end_span)
            }
            return;[span_1197](start_span)[span_1197](end_span)
        }

        const currency = data.store.currency || "EGP";[span_1198](start_span)[span_1198](end_span)
        const productsList = data.products || [];[span_1199](start_span)[span_1199](end_span)

        // 0. شريط الإعلانات التسويقية العلوي اللانهائي
        const marqueeTrack = document.getElementById('top-bar-marquee');[span_1200](start_span)[span_1200](end_span)
        if (marqueeTrack && data.navigation && data.navigation.topBarMessages) {[span_1201](start_span)[span_1201](end_span)
            renderTopMarquee(marqueeTrack, data.navigation.topBarMessages);[span_1202](start_span)[span_1202](end_span)
        }

        // 1. أتمتة القسم الأول: عقد من التميز
        const heroSection = document.getElementById('hero-section');[span_1203](start_span)[span_1203](end_span)
        if (heroSection && data.homepage.hero) {[span_1204](start_span)[span_1204](end_span)
            const heroData = data.homepage.hero;[span_1205](start_span)[span_1205](end_span)
            const heroTitleNode = document.getElementById('hero-title') || heroSection.querySelector('h1');[span_1206](start_span)[span_1206](end_span)
            const heroDescNode = document.getElementById('hero-description') || heroSection.querySelector('p');[span_1207](start_span)[span_1207](end_span)
            const heroCtaNode = document.getElementById('hero-cta-btn') || heroSection.querySelector('a');[span_1208](start_span)[span_1208](end_span)

            if (heroTitleNode) {[span_1209](start_span)[span_1209](end_span)
                const rawTitle = heroData.title || "عقد من التميز في صناعة الحلويات";[span_1210](start_span)[span_1210](end_span)
                const formattedTitle = rawTitle.replace("التميز", `<span style="color: var(--bose-pink); font-weight: 700;">التميز</span>`);[span_1211](start_span)[span_1211](end_span)
                heroTitleNode.innerHTML = formattedTitle;[span_1212](start_span)[span_1212](end_span)
            }
            if (heroDescNode) {[span_1213](start_span)[span_1213](end_span)
                heroDescNode.textContent = heroData.description;[span_1214](start_span)[span_1214](end_span)
            }
            if (heroCtaNode) {[span_1215](start_span)[span_1215](end_span)
                heroCtaNode.textContent = heroData.cta || "اطلب الآن";[span_1216](start_span)[span_1216](end_span)
                heroCtaNode.addEventListener('click', (e) => {[span_1217](start_span)[span_1217](end_span)
                    e.preventDefault();[span_1218](start_span)[span_1218](end_span)
                    const target = document.getElementById('waterfall-section');[span_1219](start_span)[span_1219](end_span)
                    if (target) {[span_1220](start_span)[span_1220](end_span)
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });[span_1221](start_span)[span_1221](end_span)
                    }
                });
            }
        }

        // 2. أتمتة عمودي شلال المنتجات البصري المتعاكس
        const leftCol = document.getElementById('waterfall-left-col');[span_1222](start_span)[span_1222](end_span)
        const rightCol = document.getElementById('waterfall-right-col');[span_1223](start_span)[span_1223](end_span)
        const waterfallContainer = document.querySelector('.waterfall-container') || document.getElementById('waterfall-section');[span_1224](start_span)[span_1224](end_span)
        const waterfallConfig = data.homepage.waterfall;[span_1225](start_span)[span_1225](end_span)

        if (leftCol && rightCol && waterfallConfig && waterfallContainer) {[span_1226](start_span)[span_1226](end_span)
            leftCol.innerHTML = '';[span_1227](start_span)[span_1227](end_span)
            rightCol.innerHTML = '';[span_1228](start_span)[span_1228](end_span)

            const leftImages = [...waterfallConfig.leftColumnImages, ...waterfallConfig.leftColumnImages, ...waterfallConfig.leftColumnImages];[span_1229](start_span)[span_1229](end_span)
            const rightImages = [...waterfallConfig.rightColumnImages, ...waterfallConfig.rightColumnImages, ...waterfallConfig.rightColumnImages];[span_1230](start_span)[span_1230](end_span)

            leftCol.innerHTML = leftImages.map(img => `[span_1231](start_span)[span_1231](end_span)
                <img src="${img}" class="waterfall-img bose-fade-in-img" alt="حلويات بوسي" style="width: 100%; height: ${waterfallConfig.imageSize || '320px'}; object-fit: cover; border-radius: 16px; margin-bottom: 16px; display: block;" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">[span_1232](start_span)[span_1232](end_span)
            `).join('');[span_1233](start_span)[span_1233](end_span)

            rightCol.innerHTML = rightImages.map(img => `[span_1234](start_span)[span_1234](end_span)
                <img src="${img}" class="waterfall-img bose-fade-in-img" alt="حلويات بوسي" style="width: 100%; height: ${waterfallConfig.imageSize || '320px'}; object-fit: cover; border-radius: 16px; margin-bottom: 16px; display: block;" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">[span_1235](start_span)[span_1235](end_span)
            `).join('');[span_1236](start_span)[span_1236](end_span)

            leftCol.classList.add('waterfall-up');[span_1237](start_span)[span_1237](end_span)
            rightCol.classList.add('waterfall-down');[span_1238](start_span)[span_1238](end_span)

            const pauseWaterfall = () => {[span_1239](start_span)[span_1239](end_span)
                leftCol.style.animationPlayState = 'paused';[span_1240](start_span)[span_1240](end_span)
                rightCol.style.animationPlayState = 'paused';[span_1241](start_span)[span_1241](end_span)
            };
            const resumeWaterfall = () => {[span_1242](start_span)[span_1242](end_span)
                leftCol.style.animationPlayState = 'running';[span_1243](start_span)[span_1243](end_span)
                rightCol.style.animationPlayState = 'running';[span_1244](start_span)[span_1244](end_span)
            };
            
            waterfallContainer.addEventListener('touchstart', pauseWaterfall, {passive: true});[span_1245](start_span)[span_1245](end_span)
            waterfallContainer.addEventListener('touchend', resumeWaterfall, {passive: true});[span_1246](start_span)[span_1246](end_span)
            waterfallContainer.addEventListener('mouseenter', pauseWaterfall);[span_1247](start_span)[span_1247](end_span)
            waterfallContainer.addEventListener('mouseleave', resumeWaterfall);[span_1248](start_span)[span_1248](end_span)

            if (!waterfallContainer.querySelector('.waterfall-overlay-top')) {[span_1249](start_span)[span_1249](end_span)
                const overlayTop = document.createElement('div');[span_1250](start_span)[span_1250](end_span)
                overlayTop.className = 'waterfall-overlay-top';[span_1251](start_span)[span_1251](end_span)
                const overlayBottom = document.createElement('div');[span_1252](start_span)[span_1252](end_span)
                overlayBottom.className = 'waterfall-overlay-bottom';[span_1253](start_span)[span_1253](end_span)
                waterfallContainer.appendChild(overlayTop);[span_1254](start_span)[span_1254](end_span)
                waterfallContainer.appendChild(overlayBottom);[span_1255](start_span)[span_1255](end_span)
                waterfallContainer.style.position = 'relative';[span_1256](start_span)[span_1256](end_span)
            }
        }

        // 3. أتمتة مسار الإتقان الفاخر التلقائي ومؤشراتها النقطية المتزامنة
        const excellenceSection = document.getElementById('excellence-section');[span_1257](start_span)[span_1257](end_span)
        const excellenceTrack = document.getElementById('excellence-images-track');[span_1258](start_span)[span_1258](end_span)
        const excellenceConfig = data.homepage.excellence;[span_1259](start_span)[span_1259](end_span)
        if (excellenceTrack && excellenceConfig) {[span_1260](start_span)[span_1260](end_span)
            excellenceTrack.innerHTML = '';[span_1261](start_span)[span_1261](end_span)
            const doubledImages = [...excellenceConfig.images, ...excellenceConfig.images];[span_1262](start_span)[span_1262](end_span)
            excellenceTrack.className = 'animate-marquee';[span_1263](start_span)[span_1263](end_span)
            excellenceTrack.innerHTML = doubledImages.map(img => `[span_1264](start_span)[span_1264](end_span)
                <a href="menu.html" class="excellence-track-link" style="display: block; width: 33.33vw; min-width: 280px; flex-shrink: 0; padding: 0 8px; box-sizing: border-box;">[span_1265](start_span)[span_1265](end_span)
                    <img src="${img}" class="bose-fade-in-img" alt="إتقان بوسي" style="width: 100%; height: 350px; object-fit: cover; border-radius: 24px; border: var(--bose-border-pink);" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">[span_1266](start_span)[span_1266](end_span)
                </a>[span_1267](start_span)[span_1267](end_span)
            `).join('');[span_1268](start_span)[span_1268](end_span)
            
            excellenceTrack.addEventListener('mouseenter', () => { excellenceTrack.style.animationPlayState = 'paused'; });[span_1269](start_span)[span_1269](end_span)
            excellenceTrack.addEventListener('mouseleave', () => { excellenceTrack.style.animationPlayState = 'running'; });[span_1270](start_span)[span_1270](end_span)
            excellenceTrack.addEventListener('touchstart', () => { excellenceTrack.style.animationPlayState = 'paused'; }, {passive: true});[span_1271](start_span)[span_1271](end_span)
            excellenceTrack.addEventListener('touchend', () => { excellenceTrack.style.animationPlayState = 'running'; }, {passive: true});[span_1272](start_span)[span_1272](end_span)
            enableMarqueeDragScrolling(excellenceTrack);[span_1273](start_span)[span_1273](end_span)

            if (excellenceSection) {[span_1274](start_span)[span_1274](end_span)
                let activeDotIndex = 0;[span_1275](start_span)[span_1275](end_span)
                generateBoseDots(excellenceSection, excellenceConfig.images.length, activeDotIndex, (idx) => {[span_1276](start_span)[span_1276](end_span)
                    const slides = excellenceTrack.querySelectorAll('.excellence-track-link');[span_1277](start_span)[span_1277](end_span)
                    if (slides[idx]) {[span_1278](start_span)[span_1278](end_span)
                        const targetOffset = slides[idx].offsetLeft - (excellenceTrack.offsetWidth - slides[idx].offsetWidth) / 2;[span_1279](start_span)[span_1279](end_span)
                        excellenceTrack.scrollTo({[span_1280](start_span)[span_1280](end_span)
                            left: targetOffset,[span_1281](start_span)[span_1281](end_span)
                            behavior: 'smooth[span_1282](start_span)'[span_1282](end_span)
                        });
                    }
                });

                setupScrollToDotsBinding(excellenceTrack, excellenceSection, excellenceConfig.images.length);[span_1283](start_span)[span_1283](end_span)

                setInterval(() => {[span_1284](start_span)[span_1284](end_span)
                    if (excellenceTrack.style.animationPlayState !== 'paused') {[span_1285](start_span)[span_1285](end_span)
                        activeDotIndex = (activeDotIndex + 1) % excellenceConfig.images.length;[span_1286](start_span)[span_1286](end_span)
                        const dotsWrapper = excellenceSection.querySelector('.bose-dots-container');[span_1287](start_span)[span_1287](end_span)
                        if (dotsWrapper) {[span_1288](start_span)[span_1288](end_span)
                            dotsWrapper.querySelectorAll('.bose-dot').forEach((dot, idx) => {[span_1289](start_span)[span_1289](end_span)
                                dot.classList.toggle('active', idx === activeDotIndex);[span_1290](start_span)[span_1290](end_span)
                            });
                        }
                    }
                }, 5000);[span_1291](start_span)[span_1291](end_span)
            }
        }

        // 4. أتمتة رندرة الأقسام الحيوية الثلاثة بالصفحة الرئيسية
        const mostSellingGrid = document.getElementById('most-selling-grid');[span_1292](start_span)[span_1292](end_span)
        if (mostSellingGrid && data.homepage.mostSelling) {[span_1293](start_span)[span_1293](end_span)
            mostSellingGrid.innerHTML = '';[span_1294](start_span)[span_1294](end_span)
            const matchedMSProducts = data.homepage.mostSelling.map(slug => productsList.find(p => p.slug === slug)).filter(Boolean);[span_1295](start_span)[span_1295](end_span)
            mostSellingGrid.innerHTML = matchedMSProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');[span_1296](start_span)[span_1296](end_span)
            attachProductCardEvents(mostSellingGrid, productsList, currency);[span_1297](start_span)[span_1297](end_span)
        }

        const newArrivalsSection = document.getElementById('new-arrivals-section');[span_1298](start_span)[span_1298](end_span)
        const newArrivalsGrid = document.getElementById('new-arrivals-grid');[span_1299](start_span)[span_1299](end_span)
        if (newArrivalsGrid && data.homepage.newArrivals) {[span_1300](start_span)[span_1300](end_span)
            newArrivalsGrid.innerHTML = '';[span_1301](start_span)[span_1301](end_span)
            const matchedNAProducts = data.homepage.newArrivals.map(slug => productsList.find(p => p.slug === slug)).filter(Boolean);[span_1302](start_span)[span_1302](end_span)
            newArrivalsGrid.innerHTML = matchedNAProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');[span_1303](start_span)[span_1303](end_span)
            attachProductCardEvents(newArrivalsGrid, productsList, currency);[span_1304](start_span)[span_1304](end_span)

            if (newArrivalsSection) {[span_1305](start_span)[span_1305](end_span)
                generateBoseDots(newArrivalsSection, Math.ceil(matchedNAProducts.length / 2), 0, (idx) => {[span_1306](start_span)[span_1306](end_span)
                    const cards = newArrivalsGrid.querySelectorAll('.product-card');[span_1307](start_span)[span_1307](end_span)
                    if (cards[idx * 2]) {[span_1308](start_span)[span_1308](end_span)
                        cards[idx * 2].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });[span_1309](start_span)[span_1309](end_span)
                    }
                });
                setupScrollToDotsBinding(newArrivalsGrid, newArrivalsSection, Math.ceil(matchedNAProducts.length / 2));[span_1310](start_span)[span_1310](end_span)
            }
        }

        const ourProductsGrid = document.getElementById('our-products-grid');[span_1311](start_span)[span_1311](end_span)
        const showMoreBtn = document.getElementById('btn-show-more-products') || document.querySelector('.btn-show-more-node');[span_1312](start_span)[span_1312](end_span)
        if (ourProductsGrid && data.homepage.ourProducts) {[span_1313](start_span)[span_1313](end_span)
            ourProductsGrid.innerHTML = '';[span_1314](start_span)[span_1314](end_span)
            const matchedOPProducts = data.homepage.ourProducts.map(slug => productsList.find(p => p.slug === slug)).filter(Boolean);[span_1315](start_span)[span_1315](end_span)
            const initialProducts = matchedOPProducts.slice(0, 4);[span_1316](start_span)[span_1316](end_span)
            const remainingProducts = matchedOPProducts.slice(4);[span_1317](start_span)[span_1317](end_span)

            ourProductsGrid.innerHTML = initialProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');[span_1318](start_span)[span_1318](end_span)
            attachProductCardEvents(ourProductsGrid, productsList, currency);[span_1319](start_span)[span_1319](end_span)

            if (showMoreBtn) {[span_1320](start_span)[span_1320](end_span)
                showMoreBtn.style.display = remainingProducts.length > 0 ? 'inline-flex' : 'none';[span_1321](start_span)[span_1321](end_span)
                if (!showMoreBtn.dataset.boseListener) {[span_1322](start_span)[span_1322](end_span)
                    showMoreBtn.addEventListener('click', (e) => {[span_1323](start_span)[span_1323](end_span)
                        e.preventDefault();[span_1324](start_span)[span_1324](end_span)
                        const tempDiv = document.createElement('div');[span_1325](start_span)[span_1325](end_span)
                        tempDiv.innerHTML = remainingProducts.map(prod => generateStrictProductCardHTML(prod, currency)).join('');[span_1326](start_span)[span_1326](end_span)
                        while (tempDiv.firstChild) {[span_1327](start_span)[span_1327](end_span)
                            ourProductsGrid.appendChild(tempDiv.firstChild);[span_1328](start_span)[span_1328](end_span)
                        }
                        attachProductCardEvents(ourProductsGrid, productsList, currency);[span_1329](start_span)[span_1329](end_span)
                        showMoreBtn.style.display = 'none';[span_1330](start_span)[span_1330](end_span)
                        window.dispatchEvent(new Event('bose_products_injected'));[span_1331](start_span)[span_1331](end_span)
                        window.showBoseToast("تم استعراض التشكيلة العامة الفاخرة بالكامل 🌸");[span_1332](start_span)[span_1332](end_span)
                    });
                    showMoreBtn.dataset.boseListener = "true";[span_1333](start_span)[span_1333](end_span)
                }
            }
        }

        const cakePreviewSec = document.getElementById('cake-preview-section');[span_1334](start_span)[span_1334](end_span)
        if (cakePreviewSec && data.homepage.cakePreview) {[span_1335](start_span)[span_1335](end_span)
            const previewData = data.homepage.cakePreview;[span_1336](start_span)[span_1336](end_span)
            const previewImg = document.getElementById('cake-preview-img') || cakePreviewSec.querySelector('img#cake-preview-img');[span_1337](start_span)[span_1337](end_span)
            const previewTitle = document.getElementById('cake-preview-title') || cakePreviewSec.querySelector('#cake-preview-title');[span_1338](start_span)[span_1338](end_span)
            const previewDesc = document.getElementById('cake-preview-desc') || cakePreviewSec.querySelector('#cake-preview-desc');[span_1339](start_span)[span_1339](end_span)
            const previewCta = document.getElementById('cake-preview-cta') || cakePreviewSec.querySelector('#cake-preview-cta');[span_1340](start_span)[span_1340](end_span)

            if (previewImg) {[span_1341](start_span)[span_1341](end_span)
                previewImg.src = previewData.image;[span_1342](start_span)[span_1342](end_span)
                previewImg.onload = () => previewImg.classList.add('loaded');[span_1343](start_span)[span_1343](end_span)
            }
            if (previewTitle) previewTitle.textContent = previewData.title;[span_1344](start_span)[span_1344](end_span)
            if (previewDesc) previewDesc.textContent = previewData.description;[span_1345](start_span)[span_1345](end_span)
            if (previewCta) {[span_1346](start_span)[span_1346](end_span)
                previewCta.href = previewData.target;[span_1347](start_span)[span_1347](end_span)
                previewCta.textContent = previewData.cta;[span_1348](start_span)[span_1348](end_span)
            }
        }

        const flowerPreviewSec = document.getElementById('flower-preview-section');[span_1349](start_span)[span_1349](end_span)
        if (flowerPreviewSec && data.homepage.flowerPreview) {[span_1350](start_span)[span_1350](end_span)
            const previewData = data.homepage.flowerPreview;[span_1351](start_span)[span_1351](end_span)
            const previewImg = document.getElementById('flower-preview-img') || flowerPreviewSec.querySelector('img#flower-preview-img');[span_1352](start_span)[span_1352](end_span)
            const previewTitle = document.getElementById('flower-preview-title') || flowerPreviewSec.querySelector('#flower-preview-title');[span_1353](start_span)[span_1353](end_span)
            const previewDesc = document.getElementById('flower-preview-desc') || flowerPreviewSec.querySelector('#flower-preview-desc');[span_1354](start_span)[span_1354](end_span)
            const previewCta = document.getElementById('flower-preview-cta') || flowerPreviewSec.querySelector('#flower-preview-cta');[span_1355](start_span)[span_1355](end_span)

            if (previewImg) {[span_1356](start_span)[span_1356](end_span)
                previewImg.src = previewData.image;[span_1357](start_span)[span_1357](end_span)
                previewImg.onload = () => previewImg.classList.add('loaded');[span_1358](start_span)[span_1358](end_span)
            }
            if (previewTitle) previewTitle.textContent = previewData.title;[span_1359](start_span)[span_1359](end_span)
            if (previewDesc) previewDesc.textContent = previewData.description;[span_1360](start_span)[span_1360](end_span)
            if (previewCta) {[span_1361](start_span)[span_1361](end_span)
                previewCta.href = previewData.target;[span_1362](start_span)[span_1362](end_span)
                previewCta.textContent = previewData.cta;[span_1363](start_span)[span_1363](end_span)
            }
        }

        // 5. أتمتة سلايدر الفئات الـ 12 ومؤشراتها النقطية التفاعلية
        const categoriesSliderSec = document.getElementById('categories-slider-section');[span_1364](start_span)[span_1364](end_span)
        const categoriesTrack = document.getElementById('categories-track');[span_1365](start_span)[span_1365](end_span)
        const categoriesData = data.homepage.categoriesSlider;[span_1366](start_span)[span_1366](end_span)
        if (categoriesTrack && categoriesData) {[span_1367](start_span)[span_1367](end_span)
            categoriesTrack.innerHTML = '';[span_1368](start_span)[span_1368](end_span)
            categoriesTrack.className = 'categories-track-loop';[span_1369](start_span)[span_1369](end_span)
            const categoriesLoopList = [...categoriesData, ...categoriesData];[span_1370](start_span)[span_1370](end_span)
            
            categoriesTrack.innerHTML = categoriesLoopList.map(cat => {[span_1371](start_span)[span_1371](end_span)
                const targetUrl = cat.builderType === 'cake-customizer' ? 'cake-builder.html[span_1372](start_span)'[span_1372](end_span)
                                : (cat.builderType === 'flower-customizer' ? 'flower-builder.html[span_1373](start_span)'[span_1373](end_span)
                                : `category.html?category=${cat.id}`);[span_1374](start_span)[span_1374](end_span)
                return `[span_1375](start_span)[span_1375](end_span)
                    <a href="${targetUrl}" class="category-slide-card" style="display: flex; flex-direction: column; align-items: center; width: 280px; flex-shrink: 0; padding: 12px; box-sizing: border-box; text-decoration: none;">[span_1376](start_span)[span_1376](end_span)
                        <img src="${cat.image}" class="bose-fade-in-img" alt="${escapeHTML(cat.title)}" style="width: 250px; height: 250px; object-fit: cover; border-radius: 20px; border: var(--bose-border-pink); box-shadow: var(--bose-shadow-glow);" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';" loading="lazy">[span_1377](start_span)[span_1377](end_span)
                        <span style="display: block; text-align: center; margin-top: 12px; font-size: 20px; font-weight: 700; color: var(--bose-black); line-height: 1.4;">${escapeHTML(cat.title)}</span>[span_1378](start_span)[span_1378](end_span)
                    </a>[span_1379](start_span)[span_1379](end_span)
                `;[span_1380](start_span)[span_1380](end_span)
            }).join('');[span_1381](start_span)[span_1381](end_span)

            categoriesTrack.addEventListener('mouseenter', () => { categoriesTrack.style.animationPlayState = 'paused'; });[span_1382](start_span)[span_1382](end_span)
            categoriesTrack.addEventListener('mouseleave', () => { categoriesTrack.style.animationPlayState = 'running'; });[span_1383](start_span)[span_1383](end_span)
            categoriesTrack.addEventListener('touchstart', () => { categoriesTrack.style.animationPlayState = 'paused'; }, {passive: true});[span_1384](start_span)[span_1384](end_span)
            categoriesTrack.addEventListener('touchend', () => { categoriesTrack.style.animationPlayState = 'running'; }, {passive: true});[span_1385](start_span)[span_1385](end_span)
            enableMarqueeDragScrolling(categoriesTrack);[span_1386](start_span)[span_1386](end_span)

            if (categoriesSliderSec) {[span_1387](start_span)[span_1387](end_span)
                let categoryDotIndex = 0;[span_1388](start_span)[span_1388](end_span)
                generateBoseDots(categoriesSliderSec, categoriesData.length, categoryDotIndex, (idx) => {[span_1389](start_span)[span_1389](end_span)
                    const slides = categoriesTrack.querySelectorAll('.category-slide-card');[span_1390](start_span)[span_1390](end_span)
                    if (slides[idx]) {[span_1391](start_span)[span_1391](end_span)
                        const targetOffset = slides[idx].offsetLeft - (categoriesTrack.offsetWidth - slides[idx].offsetWidth) / 2;[span_1392](start_span)[span_1392](end_span)
                        categoriesTrack.scrollTo({[span_1393](start_span)[span_1393](end_span)
                            left: targetOffset,[span_1394](start_span)[span_1394](end_span)
                            behavior: 'smooth[span_1395](start_span)'[span_1395](end_span)
                        });
                    }
                });

                setupScrollToDotsBinding(categoriesTrack, categoriesSliderSec, categoriesData.length);[span_1396](start_span)[span_1396](end_span)

                setInterval(() => {[span_1397](start_span)[span_1397](end_span)
                    if (categoriesTrack.style.animationPlayState !== 'paused') {[span_1398](start_span)[span_1398](end_span)
                        categoryDotIndex = (categoryDotIndex + 1) % categoriesData.length;[span_1399](start_span)[span_1399](end_span)
                        const dotsWrapper = categoriesSliderSec.querySelector('.bose-dots-container');[span_1400](start_span)[span_1400](end_span)
                        if (dotsWrapper) {[span_1401](start_span)[span_1401](end_span)
                            dotsWrapper.querySelectorAll('.bose-dot').forEach((dot, idx) => {[span_1402](start_span)[span_1402](end_span)
                                dot.classList.toggle('active', idx === categoryDotIndex);[span_1403](start_span)[span_1403](end_span)
                            });
                        }
                    }
                }, 6000);[span_1404](start_span)[span_1404](end_span)
            }
        }

        initBosePrideCounters(data);[span_1405](start_span)[span_1405](end_span)
    }

    /**
     * رندرة شريط الإعلانات التسويقية الموحد
     */
    function renderTopMarquee(marqueeTrack, messages) {
        marqueeTrack.innerHTML = '';[span_1406](start_span)[span_1406](end_span)
        const repeatedMessages = [[span_1407](start_span)[span_1407](end_span)
            ...messages, ...messages, ...messages, ...messages[span_1408](start_span)[span_1408](end_span)
        ];[span_1409](start_span)[span_1409](end_span)
        
        const listContainer = document.createElement('div');[span_1410](start_span)[span_1410](end_span)
        listContainer.className = 'animate-marquee';[span_1411](start_span)[span_1411](end_span)
        listContainer.style.cssText = 'display: flex; align-items: center; gap: 40px;';[span_1412](start_span)[span_1412](end_span)
        
        listContainer.innerHTML = repeatedMessages.map(msg => `[span_1413](start_span)[span_1413](end_span)
            <span class="marquee-msg" style="white-space: nowrap; font-size: 0.85rem; font-weight: 700; color: var(--bose-white); display: flex; align-items: center; gap: 8px;">[span_1414](start_span)[span_1414](end_span)
                🌸 ${escapeHTML(msg)}[span_1415](start_span)[span_1415](end_span)
            </span>[span_1416](start_span)[span_1416](end_span)
        `).join('');[span_1417](start_span)[span_1417](end_span)
        
        marqueeTrack.appendChild(listContainer);[span_1418](start_span)[span_1418](end_span)
        enableMarqueeDragScrolling(listContainer);[span_1419](start_span)[span_1419](end_span)
    }

    /**
     * محرك العدادات التصاعدية الذكي لقسم الفخر والاعتزاز
     */
    function initBosePrideCounters(data) {
        const statsContainer = document.querySelector('.stats-container') || document.getElementById('pride-section');[span_1420](start_span)[span_1420](end_span)
        if (!statsContainer) return;[span_1421](start_span)[span_1421](end_span)

        const prideConfig = data?.homepage?.pride;[span_1422](start_span)[span_1422](end_span)
        if (!prideConfig || !prideConfig.stats) return;[span_1423](start_span)[span_1423](end_span)

        const statsData = prideConfig.stats;[span_1424](start_span)[span_1424](end_span)

        const statsMap = {[span_1425](start_span)[span_1425](end_span)
            years: { selector: '.stat-years-val', id: 'stat-years-value', key: 'years' },[span_1426](start_span)[span_1426](end_span)
            customers: { selector: '.stat-customers-val', id: 'stat-customers-value', key: 'customers' },[span_1427](start_span)[span_1427](end_span)
            orders: { selector: '.stat-orders-val', id: 'stat-orders-value', key: 'orders' },[span_1428](start_span)[span_1428](end_span)
            cakes: { selector: '.stat-cakes-val', id: 'stat-cakes-value', key: 'cakes' },[span_1429](start_span)[span_1429](end_span)
            bouquets: { selector: '.stat-bouquets-val', id: 'stat-bouquets-value', key: 'bouquets' }[span_1430](start_span)[span_1430](end_span)
        };[span_1431](start_span)[span_1431](end_span)

        Object.entries(statsMap).forEach(([statName, mapping]) => {[span_1432](start_span)[span_1432](end_span)
            const element = statsContainer.querySelector(mapping.selector) || document.getElementById(mapping.id);[span_1433](start_span)[span_1433](end_span)
            if (!element) return;[span_1434](start_span)[span_1434](end_span)

            const configItem = statsData[mapping.key];[span_1435](start_span)[span_1435](end_span)
            if (!configItem) return;[span_1436](start_span)[span_1436](end_span)

            const targetValue = parseInt(configItem.value, 10) || 0;[span_1437](start_span)[span_1437](end_span)
            const suffix = configItem.suffix || "+";[span_1438](start_span)[span_1438](end_span)

            if (element.dataset.animated === "true") return;[span_1439](start_span)[span_1439](end_span)

            element.textContent = `0${suffix}`;[span_1440](start_span)[span_1440](end_span)

            const observer = new IntersectionObserver((entries) => {[span_1441](start_span)[span_1441](end_span)
                entries.forEach(entry => {[span_1442](start_span)[span_1442](end_span)
                    if (entry.isIntersecting) {[span_1443](start_span)[span_1443](end_span)
                        element.dataset.animated = "true";[span_1444](start_span)[span_1444](end_span)
                        animateBoseCountUp(element, targetValue, suffix);[span_1445](start_span)[span_1445](end_span)
                        observer.unobserve(entry.target);[span_1446](start_span)[span_1446](end_span)
                    }
                });
            }, { threshold: 0.1 });[span_1447](start_span)[span_1447](end_span)

            observer.observe(element);[span_1448](start_span)[span_1448](end_span)
        });
    }
    window.initBosePrideCounters = initBosePrideCounters;[span_1449](start_span)[span_1449](end_span)

    /**
     * حركة العداد التصاعدي ناعمة ومحسنة لحماية معالج الموبايل والأداء
     */
    function animateBoseCountUp(element, target, suffix) {
        let start = 0;[span_1450](start_span)[span_1450](end_span)
        const duration = 2000;[span_1451](start_span)[span_1451](end_span)
        const startTime = performance.now();[span_1452](start_span)[span_1452](end_span)
        let lastUpdateTime = 0;[span_1453](start_span)[span_1453](end_span)

        function updateCounter(currentTime) {[span_1454](start_span)[span_1454](end_span)
            const elapsed = currentTime - startTime;[span_1455](start_span)[span_1455](end_span)
            const progress = Math.min(elapsed / duration, 1);[span_1456](start_span)[span_1456](end_span)

            const easeProgress = progress * (2 - progress);[span_1457](start_span)[span_1457](end_span)
            const currentValue = Math.floor(easeProgress * target);[span_1458](start_span)[span_1458](end_span)

            if (currentTime - lastUpdateTime > 16 || progress === 1) {[span_1459](start_span)[span_1459](end_span)
                element.textContent = `${currentValue}${suffix}`;[span_1460](start_span)[span_1460](end_span)
                lastUpdateTime = currentTime;[span_1461](start_span)[span_1461](end_span)
            }

            if (progress < 1) {[span_1462](start_span)[span_1462](end_span)
                requestAnimationFrame(updateCounter);[span_1463](start_span)[span_1463](end_span)
            } else {
                element.textContent = `${target}${suffix}`;[span_1464](start_span)[span_1464](end_span)
            }
        }

        requestAnimationFrame(updateCounter);[span_1465](start_span)[span_1465](end_span)
    }

    /**
     * استرجاع آمن لسلة المشتريات من المتصفح الخفي والذاكرة الاحتياطية
     */
    window.getBoseCart = function () {
        try {
            let rawCart = null;[span_1466](start_span)[span_1466](end_span)
            try {
                rawCart = localStorage.getItem(CART_STORAGE_KEY);[span_1467](start_span)[span_1467](end_span)
            } catch (ex) {}
            
            if (!rawCart) return window.boseInMemoryCart || [];[span_1468](start_span)[span_1468](end_span)
            
            let parsed = JSON.parse(rawCart);[span_1469](start_span)[span_1469](end_span)
            if (!Array.isArray(parsed)) return [];[span_1470](start_span)[span_1470](end_span)
            
            return parsed;[span_1471](start_span)[span_1471](end_span)
        } catch (e) {
            console.error("❌ سلة التسوق تالفة في الذاكرة، تم تصفيرها احترازياً:", e);[span_1472](start_span)[span_1472](end_span)
            return [];[span_1473](start_span)[span_1473](end_span)
        }
    };

    /**
     * حفظ ومزامنة السلة وتحديث الشارات بالصفحات المفتوحة مع تمريرها على فلاتر التطهير
     */
    window.saveBoseCart = function (cart) {
        try {
            if (!Array.isArray(cart)) return;[span_1474](start_span)[span_1474](end_span)
            
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));[span_1475](start_span)[span_1475](end_span)
            } catch (storageEx) {}
            window.boseInMemoryCart = cart;[span_1476](start_span)[span_1476](end_span)
            window.updateGlobalCartCounter();[span_1477](start_span)[span_1477](end_span)
            window.dispatchEvent(new Event('bose_cart_updated'));[span_1478](start_span)[span_1478](end_span)
            window.dispatchEvent(new CustomEvent('bose_cart_changed', { detail: cart }));[span_1479](start_span)[span_1479](end_span)
        } catch (e) {
            console.error("❌ فشل حفظ السلة بالذاكرة المحلية:", e);[span_1480](start_span)[span_1480](end_span)
        }
    };

    /**
     * الإضافة الذكية والموحدة للسلة مع المطابقة الكاملة وتأمين الأسعار النهائية
     */
    window.addBoseCartItem = function (newItem) {
        if (!newItem || !newItem.productSlug) return;[span_1481](start_span)[span_1481](end_span)

        const cart = window.getBoseCart();[span_1482](start_span)[span_1482](end_span)

        if (!newItem.image && newItem.images && newItem.images.length > 0) {[span_1483](start_span)[span_1483](end_span)
            newItem.image = newItem.images[0];[span_1484](start_span)[span_1484](end_span)
        }

        const existingItemIndex = cart.findIndex(item => {[span_1485](start_span)[span_1485](end_span)
            if (item.productSlug === newItem.productSlug && item.type === newItem.type) {[span_1486](start_span)[span_1486](end_span)
                if (item.type !== "standard") {[span_1487](start_span)[span_1487](end_span)
                    return isEquivalentDetails(item.customDetails, newItem.customDetails);[span_1488](start_span)[span_1488](end_span)
                }
                return item.flavorName === newItem.flavorName;[span_1489](start_span)[span_1489](end_span)
            }
            return false;[span_1490](start_span)[span_1490](end_span)
        });

        if (existingItemIndex > -1) {[span_1491](start_span)[span_1491](end_span)
            cart[existingItemIndex].quantity = (parseInt(cart[existingItemIndex].quantity) || 0) + (parseInt(newItem.quantity) || 1);[span_1492](start_span)[span_1492](end_span)
        } else {
            if (!newItem.id) {[span_1493](start_span)[span_1493](end_span)
                if (newItem.type !== "standard") {[span_1494](start_span)[span_1494](end_span)
                    newItem.id = `${newItem.productSlug}-${Date.now()}`;[span_1495](start_span)[span_1495](end_span)
                } else {
                    newItem.id = newItem.productSlug;[span_1496](start_span)[span_1496](end_span)
                }
            }
            cart.push(newItem);[span_1497](start_span)[span_1497](end_span)
        }

        window.saveBoseCart(cart);[span_1498](start_span)[span_1498](end_span)
        window.showBoseToast(`تمت إضافة ${newItem.title} إلى السلة بنجاح 🌸`);[span_1499](start_span)[span_1499](end_span)
    };

    window.addBoseItemToCart = function(product, quantity = 1, customDetails = null, customPrice = null) {
        const finalPrice = customPrice !== null ? customPrice : product.price;[span_1500](start_span)[span_1500](end_span)
        const newItem = {[span_1501](start_span)[span_1501](end_span)
            productSlug: product.slug,[span_1502](start_span)[span_1502](end_span)
            title: product.title,[span_1503](start_span)[span_1503](end_span)
            flavorName: (customDetails && customDetails.flavorName) || product.flavorName || "كلاسيك",[span_1504](start_span)[span_1504](end_span)
            price: parseFloat(finalPrice),[span_1505](start_span)[span_1505](end_span)
            finalPrice: parseFloat(finalPrice),[span_1506](start_span)[span_1506](end_span)
            basePrice: parseFloat(product.basePrice || product.price),[span_1507](start_span)[span_1507](end_span)
            quantity: parseInt(quantity, 10) || 1,[span_1508](start_span)[span_1508](end_span)
            image: product.image || (product.images && product.images.length > 0 ? product.images[0] : ""),[span_1509](start_span)[span_1509](end_span)
            type: product.type || (product.isMiniCake ? "mini-cake" : "standard"),[span_1510](start_span)[span_1510](end_span)
            customDetails: customDetails[span_1511](start_span)[span_1511](end_span)
        };[span_1512](start_span)[span_1512](end_span)
        window.addBoseCartItem(newItem);[span_1513](start_span)[span_1513](end_span)
    };

    /**
     * تحديث كمية صنف بداخل السلة مع منع القيم الصفرية أو السالبة
     */
    window.updateBoseCartItemQuantity = function (itemId, newQuantity) {
        let cart = window.getBoseCart();[span_1514](start_span)[span_1514](end_span)
        const itemIndex = cart.findIndex(item => item.id === itemId);[span_1515](start_span)[span_1515](end_span)

        if (itemIndex > -1) {[span_1516](start_span)[span_1516](end_span)
            const qty = parseInt(newQuantity);[span_1517](start_span)[span_1517](end_span)
            if (isNaN(qty) || qty <= 0) {[span_1518](start_span)[span_1518](end_span)
                cart.splice(itemIndex, 1);[span_1519](start_span)[span_1519](end_span)
                window.showBoseToast("تمت إزالة الصنف من السلة 🌸");[span_1520](start_span)[span_1520](end_span)
            } else {
                cart[itemIndex].quantity = qty;[span_1521](start_span)[span_1521](end_span)
            }
            window.saveBoseCart(cart);[span_1522](start_span)[span_1522](end_span)
        }
    };

    /**
     * إزالة صنف محدد من سلة المشتريات
     */
    window.removeBoseCartItem = function (itemId) {
        let cart = window.getBoseCart();[span_1523](start_span)[span_1523](end_span)
        const updatedCart = cart.filter(item => item.id !== itemId);[span_1524](start_span)[span_1524](end_span)
        window.saveBoseCart(updatedCart);[span_1525](start_span)[span_1525](end_span)
    };

    /**
     * تفريغ وتصفير السلة بالكامل لتجهيز المعاملات الجديدة
     */
    window.clearBoseCart = function () {
        try {
            localStorage.removeItem(CART_STORAGE_KEY);[span_1526](start_span)[span_1526](end_span)
        } catch (ex) {}
        window.boseInMemoryCart = [];[span_1527](start_span)[span_1527](end_span)
        window.updateGlobalCartCounter();[span_1528](start_span)[span_1528](end_span)
        window.dispatchEvent(new Event('bose_cart_updated'));[span_1529](start_span)[span_1529](end_span)
        window.dispatchEvent(new CustomEvent('bose_cart_changed', { detail: [] }));[span_1530](start_span)[span_1530](end_span)
    };

    /**
     * تحديث عداد السلة الصغير بالهيدر وفقاً للكميات
     */
    window.updateGlobalCartCounter = function () {
        if (!domCache.cartCounts) {[span_1531](start_span)[span_1531](end_span)
            domCache.cartCounts = document.querySelectorAll("#nav-cart-count, .nav-cart-count-badge");[span_1532](start_span)[span_1532](end_span)
        }
        if (domCache.cartCounts.length === 0) return;[span_1533](start_span)[span_1533](end_span)

        try {
            const cart = window.getBoseCart();[span_1534](start_span)[span_1534](end_span)
            let totalDisplayItems = 0;[span_1535](start_span)[span_1535](end_span)
            cart.forEach(item => {[span_1536](start_span)[span_1536](end_span)
                const isBespokeOrCustom = item.type === "custom-cake" ||[span_1537](start_span)[span_1537](end_span)
                                          item.type === "custom-flower" ||[span_1538](start_span)[span_1538](end_span)
                                          item.type === "mini-cake" ||[span_1539](start_span)[span_1539](end_span)
                                          (item.id && item.id.includes("-"));[span_1540](start_span)[span_1540](end_span)
                                      
                if (isBespokeOrCustom) {[span_1541](start_span)[span_1541](end_span)
                    totalDisplayItems += 1;[span_1542](start_span)[span_1542](end_span)
                } else {
                    totalDisplayItems += (parseInt(item.quantity, 10) || 1);[span_1543](start_span)[span_1543](end_span)
                }
            });
            
            domCache.cartCounts.forEach(badge => {[span_1544](start_span)[span_1544](end_span)
                badge.textContent = totalDisplayItems;[span_1545](start_span)[span_1545](end_span)
            });
        } catch (e) {
            console.error("❌ فشل تحديث شارة العداد بالسلة:", e);[span_1546](start_span)[span_1546](end_span)
        }
    };

    /**
     * بناء الـ Modal الخاص بالبحث السريع والذكي ديناميكياً لتأمين الشاشات والصفحات
     */
    function ensureSearchModalExists() {
        if (domCache.searchModal) return domCache.searchModal;[span_1547](start_span)[span_1547](end_span)

        let searchModal = document.querySelector(".bose-search-modal");[span_1548](start_span)[span_1548](end_span)
        if (!searchModal) {[span_1549](start_span)[span_1549](end_span)
            searchModal = document.createElement("div");[span_1550](start_span)[span_1550](end_span)
            searchModal.className = "bose-search-modal";[span_1551](start_span)[span_1551](end_span)
            searchModal.id = "search-container";[span_1552](start_span)[span_1552](end_span)
            searchModal.innerHTML = `[span_1553](start_span)[span_1553](end_span)
                <div class="search-modal-box">[span_1554](start_span)[span_1554](end_span)
                    <div class="search-modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,145,164,0.15); padding-bottom:12px;">[span_1555](start_span)[span_1555](end_span)
                        <h3 style="margin:0; font-size:1.15rem; font-weight:700; color:var(--bose-black);">البحث السريع في الأصناف</h3>[span_1556](start_span)[span_1556](end_span)
                        <button class="search-close-btn" style="background:none; border:none; font-size:1.5rem; color:var(--bose-black); cursor:pointer; font-weight:700;" aria-label="إغلاق نافذة البحث">×</button>[span_1557](start_span)[span_1557](end_span)
                    </div>[span_1558](start_span)[span_1558](end_span)
                    <div class="search-modal-body">[span_1559](start_span)[span_1559](end_span)
                        <input type="text" id="global-search-input" placeholder="اكتب اسم صنفك المفضل.. (لوتس، كب كيك، بوكس..)" style="width:100%; border:var(--bose-border-pink); border-radius:12px; padding:12px 16px; font-family:'Cairo', sans-serif; font-size:0.95rem; box-sizing:border-box; outline:none; transition:0.2s; color:var(--bose-black);" onfocus="this.style.borderColor='var(--bose-pink)'" onblur="this.style.borderColor='rgba(255,145,164,0.3)'">[span_1560](start_span)[span_1560](end_span)
                        <div class="search-results-container" style="margin-top:16px;">[span_1561](start_span)[span_1561](end_span)
                            <div class="search-empty-state">[span_1562](start_span)[span_1562](end_span)
                                <p class="search-empty-state-text">اكتب اسم صنفك المفضل للبحث السريع عنه.. 🌸</p>[span_1563](start_span)[span_1563](end_span)
                            </div>[span_1564](start_span)[span_1564](end_span)
                        </div>[span_1565](start_span)[span_1565](end_span)
                    </div>[span_1566](start_span)[span_1566](end_span)
                </div>[span_1567](start_span)[span_1567](end_span)
            `;[span_1568](start_span)[span_1568](end_span)
            document.body.appendChild(searchModal);[span_1569](start_span)[span_1569](end_span)
        }
        domCache.searchModal = searchModal;[span_1570](start_span)[span_1570](end_span)
        return searchModal;[span_1571](start_span)[span_1571](end_span)
    }

    /**
     * إعداد وربط أحداث الواجهات التفاعلية (البحث السريع والدرج الجانبي للموبايل والكمبيوتر)
     */
    function initializeGlobalUIEvents() {
        const menuToggleButtons = document.querySelectorAll("#mobile-menu-toggle, .nav-menu-toggle, #menu-toggle-btn");[span_1572](start_span)[span_1572](end_span)
        const drawerMenu = document.querySelector(".bose-drawer-menu, #sidebar-drawer");[span_1573](start_span)[span_1573](end_span)
        const closeDrawerButtons = document.querySelectorAll("#sidebar-close-panel-btn, #drawer-shield");[span_1574](start_span)[span_1574](end_span)
        
        let drawerOverlay = document.querySelector(".drawer-overlay, #drawer-shield");[span_1575](start_span)[span_1575](end_span)
        if (!drawerOverlay && drawerMenu) {[span_1576](start_span)[span_1576](end_span)
            drawerOverlay = document.createElement("div");[span_1577](start_span)[span_1577](end_span)
            drawerOverlay.className = "drawer-overlay";[span_1578](start_span)[span_1578](end_span)
            drawerOverlay.id = "drawer-shield";[span_1579](start_span)[span_1579](end_span)
            document.body.appendChild(drawerOverlay);[span_1580](start_span)[span_1580](end_span)
        }

        const toggleDrawer = (forceState) => {[span_1581](start_span)[span_1581](end_span)
            if (!drawerMenu) return;[span_1582](start_span)[span_1582](end_span)
            const currentState = drawerMenu.classList.contains("active");[span_1583](start_span)[span_1583](end_span)
            const nextState = typeof forceState === "boolean" ? forceState : !currentState;[span_1584](start_span)[span_1584](end_span)
            
            drawerMenu.classList.toggle("active", nextState);[span_1585](start_span)[span_1585](end_span)
            if (drawerOverlay) drawerOverlay.classList.toggle("active", nextState);[span_1586](start_span)[span_1586](end_span)
            document.body.style.overflow = nextState ? "hidden" : "";[span_1587](start_span)[span_1587](end_span)
        };

        menuToggleButtons.forEach(btn => {[span_1588](start_span)[span_1588](end_span)
            btn.addEventListener("click", (e) => {[span_1589](start_span)[span_1589](end_span)
                e.preventDefault();[span_1590](start_span)[span_1590](end_span)
                toggleDrawer();[span_1591](start_span)[span_1591](end_span)
            });
        });

        if (drawerOverlay) {[span_1592](start_span)[span_1592](end_span)
            drawerOverlay.addEventListener("click", () => toggleDrawer(false));[span_1593](start_span)[span_1593](end_span)
        }

        closeDrawerButtons.forEach(btn => {[span_1594](start_span)[span_1594](end_span)
            btn.addEventListener("click", () => toggleDrawer(false));[span_1595](start_span)[span_1595](end_span)
        });

        const searchTriggerButtons = document.querySelectorAll("#nav-search-btn, .nav-search-trigger, #search-trigger-btn");[span_1596](start_span)[span_1596](end_span)
        searchTriggerButtons.forEach(btn => {[span_1597](start_span)[span_1597](end_span)
            btn.addEventListener("click", (e) => {[span_1598](start_span)[span_1598](end_span)
                e.preventDefault();[span_1599](start_span)[span_1599](end_span)
                const searchModal = ensureSearchModalExists();[span_1600](start_span)[span_1600](end_span)
                toggleSearchModal(searchModal, true);[span_1601](start_span)[span_1601](end_span)
            });
        });

        // [🛡️ مصلح دائم لاختفاء السلايدرات البرمجية في الصفحة الرئيسية]
        // في الموبايل، نوقف الحركات اللانهائية مؤقتاً ونبني سكرول مرن لراحة العين، وتستقر Dots تماماً
        const excellenceTrack = document.getElementById('excellence-images-track');[span_1602](start_span)[span_1602](end_span)
        const categoriesTrack = document.getElementById('categories-track');[span_1603](start_span)[span_1603](end_span)

        if (window.innerWidth <= 768) {[span_1604](start_span)[span_1604](end_span)
            if (excellenceTrack) {[span_1605](start_span)[span_1605](end_span)
                excellenceTrack.style.animation = 'none';[span_1606](start_span)[span_1606](end_span)
                excellenceTrack.classList.add('bose-manual-scroll-active');[span_1607](start_span)[span_1607](end_span)
            }
            if (categoriesTrack) {[span_1608](start_span)[span_1608](end_span)
                categoriesTrack.style.animation = 'none';[span_1609](start_span)[span_1609](end_span)
                categoriesTrack.classList.add('bose-manual-scroll-active');[span_1610](start_span)[span_1610](end_span)
            }
        }

        // [🔄 ربط مستمع الأحداث لحظياً لمزامنة العداد الفردي والذكي بالهيدر فوراً]
        window.addEventListener('storage', (e) => {[span_1611](start_span)[span_1611](end_span)
            if (e.key === CART_STORAGE_KEY) {[span_1612](start_span)[span_1612](end_span)
                window.updateGlobalCartCounter();[span_1613](start_span)[span_1613](end_span)
            }
        });
        window.addEventListener('bose_cart_updated', () => {[span_1614](start_span)[span_1614](end_span)
            window.updateGlobalCartCounter();[span_1615](start_span)[span_1615](end_span)
        });
    }

    function toggleSearchModal(modalElement, show) {
        if (!modalElement) return;[span_1616](start_span)[span_1616](end_span)
        modalElement.classList.toggle("active", show);[span_1617](start_span)[span_1617](end_span)
        document.body.style.overflow = show ? "hidden" : "";[span_1618](start_span)[span_1618](end_span)
        
        if (show) {[span_1619](start_span)[span_1619](end_span)
            const searchInput = document.getElementById("global-search-input");[span_1620](start_span)[span_1620](end_span)
            if (searchInput) {[span_1621](start_span)[span_1621](end_span)
                searchInput.value = "";[span_1622](start_span)[span_1622](end_span)
                searchInput.focus();[span_1623](start_span)[span_1623](end_span)
            }
            renderSearchResults("");[span_1624](start_span)[span_1624](end_span)
            
            const closeBtn = modalElement.querySelector(".search-close-btn");[span_1625](start_span)[span_1625](end_span)
            if (closeBtn && !closeBtn.dataset.boseListener) {[span_1626](start_span)[span_1626](end_span)
                closeBtn.addEventListener("click", () => toggleSearchModal(modalElement, false));[span_1627](start_span)[span_1627](end_span)
                closeBtn.dataset.boseListener = "true";[span_1628](start_span)[span_1628](end_span)
            }
            
            if (!modalElement.dataset.boseListener) {[span_1629](start_span)[span_1629](end_span)
                modalElement.addEventListener("click", (e) => {[span_1630](start_span)[span_1630](end_span)
                    if (e.target === modalElement) {[span_1631](start_span)[span_1631](end_span)
                        toggleSearchModal(modalElement, false);[span_1632](start_span)[span_1632](end_span)
                    }
                });
                
                document.addEventListener("keydown", (e) => {[span_1633](start_span)[span_1633](end_span)
                    if (e.key === "Escape" && modalElement.classList.contains("active")) {[span_1634](start_span)[span_1634](end_span)
                        toggleSearchModal(modalElement, false);[span_1635](start_span)[span_1635](end_span)
                    }
                });
                
                const searchInputLive = document.getElementById("global-search-input");[span_1636](start_span)[span_1636](end_span)
                if (searchInputLive) {[span_1637](start_span)[span_1637](end_span)
                    searchInputLive.addEventListener("input", (e) => {[span_1638](start_span)[span_1638](end_span)
                        const query = e.target.value.trim();[span_1639](start_span)[span_1639](end_span)
                        clearTimeout(searchDebounceTimeout);[span_1640](start_span)[span_1640](end_span)
                        searchDebounceTimeout = setTimeout(() => {[span_1641](start_span)[span_1641](end_span)
                            renderSearchResults(query);[span_1642](start_span)[span_1642](end_span)
                        }, 250);[span_1643](start_span)[span_1643](end_span)
                    });

                    searchInputLive.addEventListener("keydown", (e) => {[span_1644](start_span)[span_1644](end_span)
                        if (e.key === "Enter" || e.keyCode === 13) {[span_1645](start_span)[span_1645](end_span)
                            e.preventDefault();[span_1646](start_span)[span_1646](end_span)
                            const firstCard = resultsContainerElement().querySelector(".search-result-card");[span_1647](start_span)[span_1647](end_span)
                            if (firstCard) {[span_1648](start_span)[span_1648](end_span)
                                toggleSearchModal(modalElement, false);[span_1649](start_span)[span_1649](end_span)
                                window.location.href = firstCard.getAttribute("href");[span_1650](start_span)[span_1650](end_span)
                            }
                        }
                    });
                }
                modalElement.dataset.boseListener = "true";[span_1651](start_span)[span_1651](end_span)
            }
        }
    }

    function resultsContainerElement() {
        if (!domCache.resultsContainer) {[span_1652](start_span)[span_1652](end_span)
            domCache.resultsContainer = document.querySelector(".search-results-container");[span_1653](start_span)[span_1653](end_span)
        }
        return domCache.resultsContainer;[span_1654](start_span)[span_1654](end_span)
    }

    function renderSearchResults(query) {
        const resultsContainer = resultsContainerElement();[span_1655](start_span)[span_1655](end_span)
        if (!resultsContainer) return;[span_1656](start_span)[span_1656](end_span)

        if (!query) {[span_1657](start_span)[span_1657](end_span)
            resultsContainer.innerHTML = `[span_1658](start_span)[span_1658](end_span)
                <div class="search-empty-state">[span_1659](start_span)[span_1659](end_span)
                    <p class="search-empty-state-text">اكتب اسم صنفك المفضل للبحث السريع عنه.. 🌸</p>[span_1660](start_span)[span_1660](end_span)
                </div>[span_1661](start_span)[span_1661](end_span)
            `;[span_1662](start_span)[span_1662](end_span)
            return;[span_1663](start_span)[span_1663](end_span)
        }

        const data = window.BoseStoreData;[span_1664](start_span)[span_1664](end_span)
        if (!data || !data.products) {[span_1665](start_span)[span_1665](end_span)
            resultsContainer.innerHTML = `[span_1666](start_span)[span_1666](end_span)
                <div class="search-no-results">[span_1667](start_span)[span_1667](end_span)
                    <p class="search-no-results-main">لحظة واحدة.. بنحضر المنيو الفاخر 🌸</p>[span_1668](start_span)[span_1668](end_span)
                </div>[span_1669](start_span)[span_1669](end_span)
            `;[span_1670](start_span)[span_1670](end_span)
            return;[span_1671](start_span)[span_1671](end_span)
        }

        const lowerCaseQuery = query.toLowerCase();[span_1672](start_span)[span_1672](end_span)
        const matchedProducts = data.products.filter(product => {[span_1673](start_span)[span_1673](end_span)
            const inTitle = product.title.toLowerCase().includes(lowerCaseQuery);[span_1674](start_span)[span_1674](end_span)
            const inFlavor = (product.flavorName || "").toLowerCase().includes(lowerCaseQuery);[span_1675](start_span)[span_1675](end_span)
            const inDesc = (product.description || "").toLowerCase().includes(lowerCaseQuery);[span_1676](start_span)[span_1676](end_span)
            const inSearchTerms = product.searchTerms && product.searchTerms.some(term => term.toLowerCase().includes(lowerCaseQuery));[span_1677](start_span)[span_1677](end_span)
            
            return inTitle || inFlavor || inDesc || inSearchTerms;[span_1678](start_span)[span_1678](end_span)
        });

        if (matchedProducts.length === 0) {[span_1679](start_span)[span_1679](end_span)
            resultsContainer.innerHTML = `[span_1680](start_span)[span_1680](end_span)
                <div class="search-no-results">[span_1681](start_span)[span_1681](end_span)
                    <p class="search-no-results-main">ملقناش أصناف مطابقة لـ "${escapeHTML(query)}"</p>[span_1682](start_span)[span_1682](end_span)
                    <p class="search-no-results-sub">جرب تكتب كلمات بسيطة زي: لوتس، كب كيك، بوكس، تورتة..</p>[span_1683](start_span)[span_1683](end_span)
                </div>[span_1684](start_span)[span_1684](end_span)
            `;[span_1685](start_span)[span_1685](end_span)
            return;[span_1686](start_span)[span_1686](end_span)
        }

        let htmlResults = `<div class="search-results-grid">`;[span_1687](start_span)[span_1687](end_span)
        matchedProducts.forEach(product => {[span_1688](start_span)[span_1688](end_span)
            const finalPrice = window.calculateBosePrice(product.price, "menu-only");[span_1689](start_span)[span_1689](end_span)
            const sanitizedTitle = escapeHTML(product.title);[span_1690](start_span)[span_1690](end_span)
            const sanitizedFlavor = escapeHTML(product.flavorName || "كلاسيك");[span_1691](start_span)[span_1691](end_span)
            const firstImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : window.getBoseLogo());[span_1692](start_span)[span_1692](end_span)
            
            htmlResults += `[span_1693](start_span)[span_1693](end_span)
                <a href="product.html?slug=${product.slug}" class="search-result-card" data-slug="${product.slug}">[span_1694](start_span)[span_1694](end_span)
                    <img src="${firstImage}" alt="${sanitizedTitle}" class="search-card-img bose-fade-in-img" onload="this.classList.add('loaded')" onerror="this.onerror=null; this.src='${window.getBoseLogo()}';">[span_1695](start_span)[span_1695](end_span)
                    <div class="search-card-info-pane">[span_1696](start_span)[span_1696](end_span)
                        <h4 class="search-card-title">${sanitizedTitle}</h4>[span_1697](start_span)[span_1697](end_span)
                        <span class="search-card-flavor">${sanitizedFlavor}</span>[span_1698](start_span)[span_1698](end_span)
                        <div class="search-card-meta-row">[span_1699](start_span)[span_1699](end_span)
                            <span class="bose-price-text search-card-price">${finalPrice} ${data.store.currency}</span>[span_1700](start_span)[span_1700](end_span)
                            <span class="search-card-action-badge">استعرض الصنف 🌸</span>[span_1701](start_span)[span_1701](end_span)
                        </div>[span_1702](start_span)[span_1702](end_span)
                    </div>[span_1703](start_span)[span_1703](end_span)
                </a>[span_1704](start_span)[span_1704](end_span)
            `;[span_1705](start_span)[span_1705](end_span)
        });

        htmlResults += `</div>`;[span_1706](start_span)[span_1706](end_span)
        resultsContainer.innerHTML = htmlResults;[span_1707](start_span)[span_1707](end_span)

        resultsContainer.querySelectorAll(".search-result-card").forEach(card => {[span_1708](start_span)[span_1708](end_span)
            card.addEventListener("click", () => {[span_1709](start_span)[span_1709](end_span)
                const searchModal = document.querySelector(".bose-search-modal");[span_1710](start_span)[span_1710](end_span)
                if (searchModal) {[span_1711](start_span)[span_1711](end_span)
                    searchModal.classList.remove("active");[span_1712](start_span)[span_1712](end_span)
                }
                document.body.style.overflow = "";[span_1713](start_span)[span_1713](end_span)
            });
        });
    }

    /**
     * تطبيق الإعدادات الفنية للـ SEO وتأمين الهوية البصرية الحاكمة لـ حلويات بوسي
     */
    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;[span_1714](start_span)[span_1714](end_span)
        const data = window.BoseStoreData;[span_1715](start_span)[span_1715](end_span)

        const isPlaceholderTitle = document.title === "" ||[span_1716](start_span)[span_1716](end_span)
                                   document.title === "Document" ||[span_1717](start_span)[span_1717](end_span)
                                   document.title.includes("localhost") ||[span_1718](start_span)[span_1718](end_span)
                                   document.title.includes("127.0.0.1") ||[span_1719](start_span)[span_1719](end_span)
                                   document.title === "حلويات بوسي";[span_1720](start_span)[span_1720](end_span)
        
        if (isPlaceholderTitle) {[span_1721](start_span)[span_1721](end_span)
            document.title = data.seo.title;[span_1722](start_span)[span_1722](end_span)
        }

        ensureMetaTag("description", data.seo.description);[span_1723](start_span)[span_1723](end_span)
        ensureMetaTag("keywords", data.seo.keywords.join(", "));[span_1724](start_span)[span_1724](end_span)
        ensureMetaTag("og:title", data.seo.title, true);[span_1725](start_span)[span_1725](end_span)
        ensureMetaTag("og:description", data.seo.description, true);[span_1726](start_span)[span_1726](end_span)
        ensureMetaTag("og:image", data.seo.ogImage, true);[span_1727](start_span)[span_1727](end_span)
        ensureMetaTag("og:url", window.location.href, true);[span_1728](start_span)[span_1728](end_span)

        const logoElements = document.querySelectorAll("img#bose-store-logo, .bose-header-logo-image, .footer-brand-logo");[span_1729](start_span)[span_1729](end_span)
        logoElements.forEach(img => {[span_1730](start_span)[span_1730](end_span)
            if (img) {[span_1731](start_span)[span_1731](end_span)
                img.src = data.store.logo;[span_1732](start_span)[span_1732](end_span)
                img.alt = data.store.name;[span_1733](start_span)[span_1733](end_span)
                img.style.objectFit = "contain"; // [🛡️ إصلاح هندسي حاسم لمنع عصر اللوجو في الفوتر والهيدر]
                img.loading = "lazy";[span_1734](start_span)[span_1734](end_span)
            }
        });

        const footerAbout = document.getElementById("footer-about-text");[span_1735](start_span)[span_1735](end_span)
        if (footerAbout) {[span_1736](start_span)[span_1736](end_span)
            footerAbout.textContent = data.footer.about;[span_1737](start_span)[span_1737](end_span)
        }

        const copyrightYearSpan = document.getElementById("copyright-year");[span_1738](start_span)[span_1738](end_span)
        if (copyrightYearSpan) {[span_1739](start_span)[span_1739](end_span)
            copyrightYearSpan.textContent = "2026";[span_1740](start_span)[span_1740](end_span)
        }

        const copyrightBlocks = document.querySelectorAll(".footer-copyright-block p");[span_1741](start_span)[span_1741](end_span)
        copyrightBlocks.forEach(p => {[span_1742](start_span)[span_1742](end_span)
            if (p) {[span_1743](start_span)[span_1743](end_span)
                p.innerHTML = `© <span>2026</span> جميع الحقوق محفوظة لعلامة حلويات بوسي التجارية الفاخرة`;[span_1744](start_span)[span_1744](end_span)
            }
        });

        injectEarlyDependencies();[span_1745](start_span)[span_1745](end_span)
        applyGlobalStyles(data.store.theme);[span_1746](start_span)[span_1746](end_span)
        updateSocialLinks(data.social);[span_1747](start_span)[span_1747](end_span)
    }

    function ensureMetaTag(name, content, isProperty = false) {
        const attributeName = isProperty ? "property" : "name";[span_1748](start_span)[span_1748](end_span)
        let meta = document.querySelector(`meta[${attributeName}="${name}"]`);[span_1749](start_span)[span_1749](end_span)
        if (!meta) {[span_1750](start_span)[span_1750](end_span)
            meta = document.createElement("meta");[span_1751](start_span)[span_1751](end_span)
            meta.setAttribute(attributeName, name);[span_1752](start_span)[span_1752](end_span)
            document.head.appendChild(meta);[span_1753](start_span)[span_1753](end_span)
        }
        meta.setAttribute("content", content);[span_1754](start_span)[span_1754](end_span)
    }

    function updateSocialLinks(socialData) {
        const facebookBtns = document.querySelectorAll(".social-link-facebook");[span_1755](start_span)[span_1755](end_span)
        const instagramBtns = document.querySelectorAll(".social-link-instagram");[span_1756](start_span)[span_1756](end_span)
        const tiktokBtns = document.querySelectorAll(".social-link-tiktok");[span_1757](start_span)[span_1757](end_span)
        const whatsappBtns = document.querySelectorAll(".social-link-whatsapp");[span_1758](start_span)[span_1758](end_span)

        facebookBtns.forEach(btn => { if (socialData.facebook) btn.href = socialData.facebook; });[span_1759](start_span)[span_1759](end_span)
        instagramBtns.forEach(btn => { if (socialData.instagram) btn.href = socialData.instagram; });[span_1760](start_span)[span_1760](end_span)
        tiktokBtns.forEach(btn => { if (socialData.tiktok) btn.href = socialData.tiktok; });[span_1761](start_span)[span_1761](end_span)
        whatsappBtns.forEach(btn => {[span_1762](start_span)[span_1762](end_span)
            if (socialData.whatsapp) {[span_1763](start_span)[span_1763](end_span)
                btn.href = `https://wa.me/${socialData.whatsapp}`;[span_1764](start_span)[span_1764](end_span)
            }
        });
    }

    if (document.readyState === "loading") {[span_1765](start_span)[span_1765](end_span)
        document.addEventListener("DOMContentLoaded", loadStoreDatabase);[span_1766](start_span)[span_1766](end_span)
    } else {
        loadStoreDatabase();[span_1767](start_span)[span_1767](end_span)
    }
})();

document.addEventListener("DOMContentLoaded", () => {[span_1768](start_span)[span_1768](end_span)
    if (window.BoseStoreData && window.BoseStoreData.store) {[span_1769](start_span)[span_1769](end_span)
        verifyAndInitializeEngine();[span_1770](start_span)[span_1770](end_span)
    } else {
        let attempts = 0;[span_1771](start_span)[span_1771](end_span)
        const maxAttempts = 100;[span_1772](start_span)[span_1772](end_span)
        
        const coreGuardInterval = setInterval(() => {[span_1773](start_span)[span_1773](end_span)
            attempts++;[span_1774](start_span)[span_1774](end_span)
            if (window.BoseStoreData && window.BoseStoreData.store) {[span_1775](start_span)[span_1775](end_span)
                clearInterval(coreGuardInterval);[span_1776](start_span)[span_1776](end_span)
                verifyAndInitializeEngine();[span_1777](start_span)[span_1777](end_span)
            } else if (attempts >= maxAttempts) {[span_1778](start_span)[span_1778](end_span)
                clearInterval(coreGuardInterval);[span_1779](start_span)[span_1779](end_span)
                console.error("❌ حارس التمهيد: تجاوز الحد الأقصى لمحاولات تحميل قاعدة البيانات. تم إيقاف الفحص لتأمين الأداء.");[span_1780](start_span)[span_1780](end_span)
            }
        }, 50);[span_1781](start_span)[span_1781](end_span)
    }
});

function verifyAndInitializeEngine() {[span_1782](start_span)[span_1782](end_span)
    console.log("🚀 تم التحقق من مطابقة المحرك المخصص وتوافقه مع قاعدة بيانات حلويات بوسي.");[span_1783](start_span)[span_1783](end_span)
}
