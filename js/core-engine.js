/**
 * core-engine.js - المحرك المركزي العالمي وحارس البيانات والحسابات المالية
 * موقع حلويات بوسي (BoseSweets) - النسخة الاحترافية الملوكية المطورة V14.0
 * [تحديث V14.0]: تفعيل الكاش الذكي بالتحقق من بصمة الإصدار (get_bose_data_version)
 * بدل الاعتماد على صلاحية زمنية عمياء (15 دقيقة) فقط - راجع loadStoreDatabase().
 * محظور الحذف، الاختصار، الدمج، أو التبسيط نهائياً تماشياً مع فلسفة العلامة الفاخرة.
 */

(function() {
    "use strict";

    // 1. [صمام أمان الأداء]: حظر استعادة السكرول التلقائية لسرعة التصفح لراحة العميل النفسية
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    function forceScrollToTop() {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    forceScrollToTop();

    /**
     * ℹ️👑 [نظام الشروح التوضيحية الموحد للموقع كله]: كان الشرح المنبثق (Popover)
     * موجود جوه cake-builder.html بس، بمنطق محلي مربوط بديكشنري ثابت من مفاتيح
     * معروفة مقدماً. المشكلة إن ده مبيصلحش لبقية الموقع لأن معظم كروت المنتجات
     * والمحتوى بيتبني ديناميكياً بعد تحميل بيانات المتجر (مش موجود وقت تحميل
     * الصفحة). الحل هنا: نظام واحد مشترك على مستوى الموقع كله، بيتحقن مرة واحدة
     * في <body> فور تحميل الصفحة (زي ensurePwaInstallability بالظبط)، وبيستخدم
     * event delegation على document بدل ما يربط listener لكل زرار لوحده - فأي
     * زرار ⓘ حتى لو اتحقن بعد كده جوه كارت منتج، بيشتغل تلقائياً من غير أي كود
     * إضافي. أي جزء في الموقع يقدر يستخدمه بس بإضافة:
     * <button class="bose-info-badge-inline" data-bose-info-title="..." data-bose-info-text="...">ⓘ</button>
     * أو برمجياً: window.BoseInfoPopover.open("العنوان", "النص التوضيحي").
     */
    (function ensureBoseInfoPopoverSystem() {
        if (document.getElementById('bose-global-info-popover-backdrop')) return;

        const backdrop = document.createElement('div');
        backdrop.id = 'bose-global-info-popover-backdrop';
        backdrop.className = 'bose-info-popover-backdrop';
        backdrop.innerHTML = `
            <div class="bose-info-popover-box" role="dialog" aria-modal="true" aria-labelledby="bose-global-info-popover-title">
                <button type="button" class="bose-info-popover-close" id="bose-global-info-popover-close" aria-label="إغلاق الشرح">&times;</button>
                <h4 id="bose-global-info-popover-title"></h4>
                <p id="bose-global-info-popover-text"></p>
            </div>
        `;

        function mountBackdrop() {
            if (document.body) document.body.appendChild(backdrop);
            else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(backdrop));
        }
        mountBackdrop();

        function openPopover(title, text) {
            const titleEl = document.getElementById('bose-global-info-popover-title');
            const textEl = document.getElementById('bose-global-info-popover-text');
            if (!titleEl || !textEl || !text) return;
            titleEl.textContent = title || 'توضيح';
            textEl.textContent = text;
            backdrop.classList.add('show');
        }
        function closePopover() {
            backdrop.classList.remove('show');
        }

        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closePopover(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && backdrop.classList.contains('show')) closePopover();
        });
        // 🛡️ [تفويض حدث واحد على مستوى الصفحة كلها]: يشتغل مع أي زرار ⓘ حالي أو
        // هيتحقن لاحقاً (كروت منتجات، صفحة تشيك أوت، أي مكان جديد) من غير أي setup إضافي.
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('#bose-global-info-popover-close');
            if (closeBtn) { closePopover(); return; }
            const badge = e.target.closest('[data-bose-info-text]');
            if (!badge) return;
            e.preventDefault();
            e.stopPropagation();
            openPopover(badge.dataset.boseInfoTitle, badge.dataset.boseInfoText);
        });

        window.BoseInfoPopover = { open: openPopover, close: closePopover };
    })();

    /**
     * 👑👑 [مرحلة جديدة - تحميل التطبيق]: ربط manifest.json فعلياً بكل صفحة في
     * الموقع + تسجيل Service Worker. الملف كان موجود على السيرفر من زمان لكن
     * ملحقش بأي صفحة HTML أبداً (مفيش أي <link rel="manifest"> في أي مكان)،
     * فمتصفح Chrome/Android مكانش يقدر يعتبر الموقع "قابل للتثبيت" خالص - يعني
     * زرار "ثبّتي التطبيق" في أي نافذة كان هيفضل شكلي بس بدون فايدة حقيقية.
     * الحقن هنا بيتم فوراً من غير أي تأخير (قبل حتى تحميل بيانات المتجر) عشان
     * يطبّق على كل صفحة في الموقع تلقائياً من نفس المكان، من غير ما نحتاج نعدّل
     * الـ <head> بتاع كل صفحة HTML على حدة يدوياً (أكتر من 20 صفحة).
     */
    (function ensurePwaInstallability() {
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            manifestLink.href = '/manifest.json';
            document.head.appendChild(manifestLink);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
            const themeMeta = document.createElement('meta');
            themeMeta.name = 'theme-color';
            themeMeta.content = '#FF91A4';
            document.head.appendChild(themeMeta);
        }
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => { /* فشل صامت - متأثرش على تجربة العميل العادية */ });
            });
        }
    })();

    /**
     * 👑👑 [مرحلة جديدة - مشترك بين النافذة والبلوك الكبير]: نلقط حدث تثبيت الـ PWA
     * مرة واحدة بس هنا فوق (بدري قبل أي حاجة تانية)، ونخزنه في متغير مشترك على
     * مستوى الملف كله، عشان أي زرار تحميل تطبيق في أي مكان بالموقع (نافذة الترحيب
     * أو البلوك الكبير في الرئيسية) يقدر يستخدم نفس التقاطة الحدث دي بالظبط -
     * الحدث ده بيتفعّل مرة واحدة بس من المتصفح، فلازم نلقطه من نقطة مركزية وحيدة.
     */
    /** @type {any} */ let boseDeferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        boseDeferredInstallPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
        localStorage.setItem('bose_app_installed_flag', 'true');
        const popup = document.getElementById('bose-app-install-popup-overlay');
        if (popup) popup.remove();
    });

    /**
     * دالة موحّدة لتفعيل تثبيت التطبيق - تُستخدم من نافذة الترحيب وأزرار البلوك
     * الكبير في الرئيسية على حد سواء.
     * ⚠️ [TODO لصاحبة المتجر]: لحد ما يبقى فيه تطبيق حقيقي منشور على Google Play
     * و App Store، الزراير دي بتفعّل تثبيت الـ PWA بدل ما تفتح صفحة متجر حقيقية.
     * لما يبقى فيه روابط متجر حقيقية، استبدلي محتوى الدالة دي بفتح الرابط المناسب
     * حسب نظام تشغيل الجهاز (iOS → App Store link، Android → Google Play link).
     */
    window.triggerBoseAppInstall = async function() {
        if (boseDeferredInstallPrompt) {
            boseDeferredInstallPrompt.prompt();
            const choice = await boseDeferredInstallPrompt.userChoice;
            boseDeferredInstallPrompt = null;
            if (choice && choice.outcome === 'accepted') {
                localStorage.setItem('bose_app_installed_flag', 'true');
            }
        } else if (window.showBoseGlobalToast) {
            window.showBoseGlobalToast('لتثبيت التطبيق، افتحي قائمة المتصفح واختاري "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
        }
    };

    /**
     * 👑 [إصلاح جذري - كارثة الأحجام]: خريطة أسماء الأحجام الموحدة لكل الموقع (مطابقة
     * تماماً لنفس الأسماء المستخدمة في product.html/category.html). كانت هذه الأسماء
     * مكررة محلياً في أكتر من ملف، وأهم من كده: كروت المنتجات في الصفحة الرئيسية
     * وصفحة العروض وسلة "قد يعجبك أيضاً" كانت بتضيف المنتج للسلة بأرخص حجم (مثلث)
     * تلقائياً من غير ما تدي العميل أي فرصة يختار الحجم المناسب - ده كان بيسبب خسارة
     * فعلية في قيمة الطلب وارتباك للعميل لما يوصله منتج بحجم أصغر مما توقع. الخريطة دي
     * بقت متاحة عالمياً (window.BOSE_SIZE_LABELS) عشان أي كارت منتج في أي مكان بالموقع
     * يقدر يعرض تبويب اختيار الحجم بنفس الأسماء بالظبط.
     */
    window.BOSE_SIZE_LABELS = { triangle: "مثلث", medium: "طاجن", large: "حجم عائلي" };
    document.addEventListener('DOMContentLoaded', forceScrollToTop);
    window.addEventListener('load', forceScrollToTop);

    // تشغيل حقن الخطوط والأيقونات فوراً من هنا لسرعة الظهور
    injectEarlyDependencies();

    // تهيئة المتغيرات العالمية الموحدة في نطاق window لخدمة صفحات الموقع
    window.BoseStoreData = null; 
    window.boseServerTimeOffset = 0; // فارق التوقيت بالمللي ثانية: (وقت الخادم - وقت جهاز العميل)

    /**
     * 🧠 [V14.0 - كاش ذكي بالتحقق من الإصدار]: بدل ما كنا نعتمد بس على مرور
     * 15 دقيقة عشان نعتبر الكاش "قديم"، دلوقتي بنسأل قاعدة البيانات سؤال رخيص
     * جداً (get_bose_data_version - قيمة تاريخ واحدة بس، مش جدول كامل) عشان
     * نعرف هل فعلاً حصل أي تعديل حقيقي (منتج/فئة/عرض/منطقة شحن/إعدادات متجر)
     * من وقت آخر كاش محفوظ عندنا.
     *
     * 👑👑 [إصلاح جذري - أداء الهيدر والقائمة الجانبية]: قبل كده كان الهيدر
     * والقائمة الجانبية بالكامل (buildAndInjectGlobalComponents) بيستنوا طلب
     * "التحقق من الإصدار" يخلص فعلياً من السيرفر قبل ما يظهروا - حتى لو كان
     * عند العميلة كاش صالح 100%. يعني في أي اتصال بطيء، صفحة من غير هيدر ولا
     * زرار قائمة ولا سلة لثواني حقيقية. دلوقتي (Stale-While-Revalidate):
     * نعرض القائمة والهيدر وكل بيانات المتجر فوراً من الكاش المحلي، والتحقق
     * من وجود تحديث بيحصل بهدوء تام في الخلفية من غير ما يأخر ظهور أي حاجة.
     *
     * صمام أمان: لو التحقق نفسه فشل (مشكلة شبكة وقتية)، بيعيد المحاولة مرة
     * واحدة بعد نص ثانية قبل ما يستسلم لنفس الزيارة (ومفيش أي تأخير محسوس
     * للعميلة أصلاً لأنه بيحصل في الخلفية). وفيه سقف زمني قاسي (ساعتين) كخط
     * دفاع أخير عشان أي تعديل من لوحة التحكم (خصوصاً صور المنتجات) يوصل
     * للعميل بأسرع وقت ممكن.
     *
     * 🔧 [أداة تشخيص]: إضافة ?refresh=1 لأي رابط في الموقع بتتخطى الكاش المحلي
     * بالكامل وتجيب أحدث نسخة من قاعدة البيانات مباشرة - مفيدة لصاحبة المتجر
     * عشان تتأكد فوراً إن أي تعديل وصل فعلاً.
     */
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;

        const forceRefresh = new URLSearchParams(window.location.search).get('refresh') === '1';
        const cachedData = forceRefresh ? null : localStorage.getItem('bose_cached_store_data');
        const cachedTime = forceRefresh ? null : localStorage.getItem('bose_cached_store_time');
        const cachedVersion = forceRefresh ? null : localStorage.getItem('bose_cached_store_version');
        const cacheHardExpiry = 2 * 60 * 60 * 1000; // صمام أمان أخير: ساعتين
        const cacheWithinHardLimit = cachedData && cachedTime && (Date.now() - parseInt(cachedTime, 10) < cacheHardExpiry);

        if (cacheWithinHardLimit) {
            try {
                // نعرض فوراً من الكاش المحلي - مفيش أي استنى لأي طلب شبكة قبل ما
                // تشوف العميلة الهيدر/القائمة/المنتجات.
                window.BoseStoreData = JSON.parse(cachedData);
                initCoreFlow();

                // التحقق من وجود تحديث بيحصل دلوقتي بهدوء في الخلفية - مش بيأخر
                // ولا بيقاطع أي حاجة العميلة شايفاها بالفعل.
                (async () => {
                    if (!window.BoseSupabase || typeof window.BoseSupabase.getBoseDataVersion !== "function") return;

                    /** محاولة واحدة لقراءة النسخة الحية - بترجع النسخة أو null على الفشل */
                    async function attemptVersionCheck() {
                        try {
                            const versionResult = await window.BoseSupabase.getBoseDataVersion();
                            const v = Array.isArray(versionResult)
                                ? (versionResult[0]?.get_bose_data_version ?? versionResult[0])
                                : (versionResult?.get_bose_data_version ?? versionResult);
                            return (v !== null && v !== undefined) ? v : null;
                        } catch (e) {
                            return null;
                        }
                    }

                    let liveVersion = await attemptVersionCheck();
                    if (liveVersion === null) {
                        await new Promise((r) => setTimeout(r, 500));
                        liveVersion = await attemptVersionCheck();
                    }
                    if (liveVersion === null || String(liveVersion) === String(cachedVersion)) return;

                    // النسخة اتغيرت فعلاً - نجيب البيانات الجديدة ونحدّث العناصر
                    // الحية بهدوء من غير Reload كامل يقاطع تصفح العميلة.
                    try {
                        const freshData = await window.BoseSupabase.loadBoseStoreDataFromSupabase();
                        window.BoseStoreData = freshData;
                        localStorage.setItem('bose_cached_store_data', JSON.stringify(freshData));
                        localStorage.setItem('bose_cached_store_time', String(Date.now()));
                        localStorage.setItem('bose_cached_store_version', String(liveVersion));
                        buildAndInjectGlobalComponents();
                        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
                    } catch (e) { /* فشل التحديث الصامت في الخلفية - العميلة شغالة بالفعل بالنسخة المحفوظة الصالحة */ }
                })();

                return;
            } catch (e) {
                localStorage.removeItem('bose_cached_store_data');
                localStorage.removeItem('bose_cached_store_time');
                localStorage.removeItem('bose_cached_store_version');
            }
        }
        
        let retries = 5;
        let delay = 1000;
        
        while (retries > 0) {
            try {
                // 🛡️ [المرحلة 1 - الانتقال الكامل لـ Supabase]: الموقع بقى بيقرأ
                // قاعدة البيانات الحية من Supabase مباشرة بدل ملف data/site-data-final.json
                // الثابت. الملف الثابت اتشال نهائياً من مسار التحميل - أي تعديل سعر
                // أو منتج أو محتوى دلوقتي لازم يحصل من قاعدة البيانات (لوحة التحكم
                // في المرحلة الجاية) عشان يظهر فعلياً للعميل.
                if (!window.BoseSupabase || typeof window.BoseSupabase.loadBoseStoreDataFromSupabase !== "function") {
                    throw new Error("طبقة الاتصال بقاعدة البيانات (supabase-client.js) غير محمّلة قبل core-engine.js.");
                }

                window.BoseStoreData = await window.BoseSupabase.loadBoseStoreDataFromSupabase();

                // ملحوظة: الاتصال بـ Supabase REST بيتم عبر fetch داخلي في supabase-client.js
                // ومش بيرجّع نفس الوصول لهيدر Date اللي كنا بناخده من الملف الثابت،
                // فبنسيب فارق التوقيت صفر بدل ما نحسبه غلط. الدقة دي مش حرجة لوظيفة
                // الموقع الحالية (مفيش أي مكان بيعتمد عليها بشكل حاسم في الحسابات).
                window.boseServerTimeOffset = 0;

                localStorage.setItem('bose_cached_store_data', JSON.stringify(window.BoseStoreData));
                localStorage.setItem('bose_cached_store_time', String(Date.now()));

                // 🧠 [V14.0]: تسجيل بصمة النسخة الحالية فور نجاح الجلب، عشان أي زيارة
                // تانية (حتى لو بعد دقيقة واحدة) تقدر تتحقق بسرعة بدل ما تستنى 15 دقيقة.
                // فشل هذا الطلب تحديداً (مش حرج) بيتجاهل بأمان ويفضل الموقع شغال عادي،
                // وبس هيرجع يتحقق بطريقة أبطأ (تحميل كامل) في الزيارة الجاية.
                if (window.BoseSupabase && typeof window.BoseSupabase.getBoseDataVersion === "function") {
                    try {
                        const versionResult = await window.BoseSupabase.getBoseDataVersion();
                        const v = Array.isArray(versionResult)
                            ? (versionResult[0]?.get_bose_data_version ?? versionResult[0])
                            : (versionResult?.get_bose_data_version ?? versionResult);
                        if (v !== null && v !== undefined) {
                            localStorage.setItem('bose_cached_store_version', String(v));
                        } else {
                            localStorage.removeItem('bose_cached_store_version');
                        }
                    } catch (e) {
                        localStorage.removeItem('bose_cached_store_version');
                    }
                }
                
                initCoreFlow();
                return;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    console.error("❌ خطأ حرج في تهيئة نظام حلويات بوسي الموحد:", error);
                    showGlobalFriendlyError();
                } else {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; 
                }
            }
        }
    }

    /**
     * دالة تشغيل التدفق المركزي والتهيئات البصرية المبكرة للموقع مع حماية صارمة ضد أخطاء الـ DOM
     */
    function initCoreFlow() {
        applyGlobalSEOAndBranding();
        buildAndInjectGlobalComponents();
        
        if (typeof window.updateGlobalCartCounter === 'function') {
            window.updateGlobalCartCounter();
        }
        
        injectHomepageSectionMeta();
        renderDynamicWaterfall();
        renderOffersSection();
        renderAllOffersPage();
        renderHomepageProductGrids();
        setupOurProductsShowMore();
        injectSimulatorsPreviewData();
        setupPrideCountersAnimation();
        setupAppInstallPopup();
        setupAppPromoBlockButtons();
        injectAppPromoRealContent();
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setupBoseUnifiedSliderEngine('offers-slider-track', 'offers-dots-container', 'offers-carousel-section');
                setupBoseUnifiedSliderEngine('categories-track', 'categories-dots-container', 'categories-slider-section');
                setupBoseUnifiedSliderEngine('most-selling-grid', 'most-selling-dots-container', 'most-selling-section');
                setupBoseUnifiedSliderEngine('new-arrivals-grid', 'new-arrivals-dots-container', 'new-arrivals-section');
            });
        });

        document.dispatchEvent(new CustomEvent('BoseDatabaseLoaded', { detail: window.BoseStoreData }));
    }

    /**
     * 👑👑 [إصلاح جذري نهائي - كارثة اختفاء التبويب أسفل "اطلب الآن"]: بعد 9 محاولات
     * إصلاح سابقة فشلت جميعها (كل واحدة كانت بترقّع مشكلة تايمنج جديدة في نفس المحرك
     * اليدوي بالـ JS اللي بيحسب موضع transform بنفسه)، تقرر إلغاء فكرة "محرك السحب
     * اليدوي" بالكامل من جذورها بدل ما نضيف رقعة عاشرة. أي حل مبني على حساب موضع
     * العنصر بالـ JS (posX/halfWidth/pointermove) عنده احتمال يفشل في توقيت معين
     * (تحميل خط/أيقونة متأخر، تغيير viewport لحظة أول لمسة، bfcache، الخ) على جهاز
     * أو متصفح معين مهما زودنا الحراسات. الحل الجذري: نسيب المتصفح نفسه يتحكم في
     * التمرير الأفقي بشكل native (overflow-x: auto + scroll-snap في CSS) - مفيش أي
     * transform بيتحسب بالـ JS خالص، فمفيش أي احتمال "يختفي" لأن مفيش كود بيحرّكه؛
     * هو ببساطة صف عادي قابل للتمرير بإصبع العميل زي أي قائمة تانية في أي تطبيق.
     * دالة setupHeroTickerDragEngine اتشالت بالكامل من هنا ومن استدعائها في initCoreFlow.
     */

    /**
     * ✍️ ضخ العناوين والوصف للأقسام الرئيسية لعلامة حلويات بوسي
     */
    function injectHomepageSectionMeta() {
        const data = window.BoseStoreData;
        if (!data || !data.homepage) return;

        const heroDesc = document.getElementById('hero-description');
        if (heroDesc && data.homepage.hero) {
            heroDesc.textContent = data.homepage.hero.description || "نختار كل مكوّن بعناية فائقة، لنصنع لمناسباتكم جودة تستاهل ثقتكم.";
        }

        const categoriesSection = document.getElementById('categories-slider-section') || document.getElementById('categories-section') || document.querySelector('[id*="categories"]');
        const liveCategoriesList = window.getBoseCategoriesList();
        if (categoriesSection && liveCategoriesList.length) {
            const titleEl = document.getElementById('categories-section-title') || categoriesSection.querySelector('.section-title') || categoriesSection.querySelector('h2');
            const descEl = document.getElementById('categories-section-subtitle') || categoriesSection.querySelector('.bose-section-subtitle');
            
            if (titleEl) titleEl.textContent = "تسوق حسب الفئة";
            if (descEl) descEl.textContent = "قسمنا منيو حلويات بوسي لـ 12 فئة واضحة بالصور، عشان تلاقوا اللي بتحبوه من غير حيرة.";
            
            const track = document.getElementById('categories-track') || categoriesSection.querySelector('.categories-track-slider') || categoriesSection.querySelector('[id*="track"]');
            if (track) {
                track.innerHTML = liveCategoriesList.map(/** @param {Object} cat */ (cat) => `
                    <div class="category-card-unified" onclick="window.location.href='category.html?category=${encodeURIComponent(cat.id)}'">
                        <img src="${window.optimizeBoseImageUrl(cat.image, 450)}" alt="${window.escapeBoseHTML(cat.title)}" class="category-card-img" width="180" height="180" loading="lazy" />
                        <div class="category-card-name">${window.escapeBoseHTML(cat.title)}</div>
                    </div>
                `).join('');
            }
        }

        const mostSellingSection = document.getElementById('most-selling-section');
        if (mostSellingSection) {
            const titleEl = document.getElementById('most-selling-main-heading') || mostSellingSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "الأكثر مبيعاً";
            const descEl = document.getElementById('most-selling-description') || mostSellingSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "دي الأصناف اللي بتطلبوها وتحبوها من سنين، نكهات مظبوطة بالملي، بقت رمز ثقتكم فينا.";
        }

        const newArrivalsSection = document.getElementById('new-arrivals-section');
        if (newArrivalsSection) {
            const titleEl = document.getElementById('new-arrivals-main-heading') || newArrivalsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "وصل حديثاً";
            const descEl = document.getElementById('new-arrivals-description') || newArrivalsSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "هنا هتلاقوا أحدث الأفكار اللي طورناها شهور كاملة، عشان تخطف قلبكم من أول معلقة.";
        }

        const ourProductsSection = document.getElementById('our-products-section');
        if (ourProductsSection) {
            const titleEl = document.getElementById('our-products-main-heading') || ourProductsSection.querySelector('h2');
            if (titleEl) titleEl.textContent = "منتجاتنا";
            const descEl = document.getElementById('our-products-description') || ourProductsSection.querySelector('.bose-section-subtitle');
            if (descEl) descEl.textContent = "منيو حلويات بوسي بالكامل: تشكيلة غنية، بنحضرها طازة كل يوم بمكونات طبيعية 100%.";
        }
    }

    /**
     * 🏷️ رندر قسم العروض والخصومات في بداية الأقسام
     */
    /**
     * 👑 [مصدر واحد للحقيقة]: قسم العروض بالرئيسية وصفحة كل العروض offers.html
     * بيستخدموا نفس المصدر بالظبط - أي منتج في قاعدة البيانات معاه oldPrice > price.
     * محدش بيكتب عروض يدوي تاني في أكتر من مكان، فمفيش احتمال تضارب أو نسيان.
     * 🛡️ [V14.0]: بيستبعد المنتجات المتعلّمة "غير متاحة" (isAvailable === false)
     * حتى لو عليها خصم فعلي - منتج نفدت كميته منطقي ميظهرش في واجهة العروض.
     */
    function getAllOfferProducts() {
        const data = window.BoseStoreData;
        if (!data || !data.products) return [];
        return data.products.filter(/** @param {Object} p */ (p) => p.oldPrice && p.oldPrice > p.price && p.isAvailable !== false);
    }
    window.getAllOfferProducts = getAllOfferProducts;

    function renderOffersSection() {
        const offersTrack = document.getElementById('offers-slider-track');
        const offersSection = document.getElementById('offers-carousel-section');
        if (!offersTrack) return;

        const offersData = getAllOfferProducts();

        // مفيش عروض حالياً؟ القسم بالكامل يتخفي بدل ما يفضل فاضي قدام العميل
        if (offersData.length === 0) {
            if (offersSection) offersSection.style.display = 'none';
            return;
        }

        offersTrack.innerHTML = offersData.map(/** @param {Object} offer */ (offer) => createProductCardHTML(offer)).join('');
    }

    /**
     * 👑 [محرك التعمير الموحد لكافة الحركات الأفقية والسلايدرات]
     * @param {string} trackId
     * @param {string} dotsContainerId
     * @param {string} sectionId
     */
    function setupBoseUnifiedSliderEngine(trackId, dotsContainerId, sectionId) {
        /** @type {HTMLElement|null} */
        const track = document.getElementById(trackId);
        const section = document.getElementById(sectionId) || (track ? track.closest('section') : null);
        if (!track) return;

        const cards = track.children;
        const count = cards.length;
        if (count === 0) return;

        for (let i = 0; i < cards.length; i++) {
            // 🛡️ لازم تتفق مع scroll-snap-align:start في main.css (كارت واحد
            // كامل يبدأ من حافة الشاشة) - لو فضلت center هنا هتتعارض مع القاعدة
            // اللي في الـ CSS وتخلي حساب موقع الدوت (syncDotsAndPosition تحت) غلط.
            /** @type {HTMLElement} */ (cards[i]).style.scrollSnapAlign = 'start';
        }

        let dotsContainer = document.getElementById(dotsContainerId) || (section ? section.querySelector('.bose-dots-container') : null);

        if (dotsContainer) {
            let dotsHtml = '';
            for (let i = 0; i < count; i++) {
                dotsHtml += `<span class="bose-slider-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`;
            }
            dotsContainer.innerHTML = dotsHtml;
            dotsContainer.removeAttribute('hidden');
        }

        const dots = dotsContainer ? dotsContainer.querySelectorAll('.bose-slider-dot') : [];

        const syncDotsAndPosition = () => {
            const cardEl = /** @type {HTMLElement} */ (cards[0]);
            const cardWidth = cardEl.offsetWidth + parseInt(window.getComputedStyle(track).gap || '20', 10);
            const scrollPosition = track.scrollLeft;
            let activeIndex = Math.round(scrollPosition / cardWidth);
            
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= count) activeIndex = count - 1;

            dots.forEach((/** @type {Element} */ dot, /** @type {number} */ idx) => {
                dot.classList.toggle('active', idx === activeIndex);
            });
        };

        track.addEventListener('scroll', syncDotsAndPosition);

        if (dotsContainer) {
            dotsContainer.addEventListener('click', (e) => {
                const target = /** @type {HTMLElement} */ (e.target);
                const dot = target.closest('.bose-slider-dot');
                if (!dot) return;
                const index = parseInt(dot.getAttribute('data-index') || '0', 10);
                if (cards[index]) {
                    const cardEl = /** @type {HTMLElement} */ (cards[0]);
                    const cardWidth = cardEl.offsetWidth + parseInt(window.getComputedStyle(track).gap || '20', 10);
                    track.style.scrollBehavior = 'smooth';
                    track.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
                }
            });
        }

        if (section) {
            const nextBtn = section.querySelector('.offers-nav-next') || section.querySelector('.bose-slider-arrow.next');
            const prevBtn = section.querySelector('.offers-nav-prev') || section.querySelector('.bose-slider-arrow.prev');
            
            if (nextBtn && prevBtn) {
                const getScrollStep = () => {
                    const cardEl = /** @type {HTMLElement} */ (cards[0]);
                    return cardEl.offsetWidth + parseInt(window.getComputedStyle(track).gap || '20', 10);
                };
                
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    track.style.scrollBehavior = 'smooth';
                    track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
                });
                
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    track.style.scrollBehavior = 'smooth';
                    track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
                });
            }
        }

        let isDragging = false, startX = 0, startScrollLeft = 0;

        /** @param {MouseEvent|TouchEvent} e */
        const onDragStart = (e) => {
            isDragging = true;
            track.style.scrollBehavior = 'auto';
            const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
            startX = pageX - track.offsetLeft;
            startScrollLeft = track.scrollLeft;
        };

        /** @param {MouseEvent|TouchEvent} e */
        const onDragMove = (e) => {
            if (!isDragging) return;
            const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
            const x = pageX - track.offsetLeft;
            const walk = (x - startX) * 1.5;
            track.scrollLeft = startScrollLeft - walk;
        };

        const onDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            track.style.scrollBehavior = 'smooth';
            syncDotsAndPosition();
        };

        // 🖱️ السحب اليدوي بالماوس (ديسكتوب) فقط. الموبايل بيستخدم السكرول الأصلي
        // للمتصفح (native overflow-x touch scrolling) اللي أصلاً مفعّل ومظبوط بـ
        // scroll-snap فوق، وده سلس تلقائياً من غير أي تدخل جافاسكريبت.
        track.addEventListener('mousedown', onDragStart);
        track.addEventListener('mousemove', onDragMove);
        track.addEventListener('mouseup', onDragEnd);
        track.addEventListener('mouseleave', onDragEnd);

        // 🛡️ [إصلاح ثقل السحب باللمس]: كان فيه تطبيق يدوي لـ scrollLeft فوق نفس
        // العنصر اللي أصلاً native overflow-scroll، فالنظامين (سكرول المتصفح
        // الطبيعي + تعديل الجافاسكريبت اليدوي لنفس القيمة) كانوا بيتعاركوا مع
        // بعض في نفس اللحظة، وده اللي بيحس العميل بيه كسحب "تقيل" وغير سلس على
        // الموبايل تحديداً. اتشالت الاستماعات اليدوية دي بالكامل والسكرول
        // بالإصبع بقى معتمد 100% على سلوك المتصفح الأصلي السلس.
    }

    /**
     * 📄 صفحة العروض المستقلة offers.html - المكان الشرعي الوحيد لعرض كل العروض
     * بتستخدم نفس مصدر البيانات ونفس دالة الكارت الموحدة، فأي تحديث في مكان واحد
     * بينعكس تلقائياً هنا وفي كارت الرئيسية بدون أي تكرار أو تضارب.
     */
    function renderAllOffersPage() {
        const grid = document.getElementById('all-offers-grid');
        if (!grid) return;

        const offersData = getAllOfferProducts();
        const emptyState = document.getElementById('all-offers-empty-state');

        if (offersData.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        grid.innerHTML = offersData.map(/** @param {Object} offer */ (offer) => createProductCardHTML(offer)).join('');
    }

    function renderDynamicWaterfall() {
        const leftCol = document.getElementById('waterfall-left-col');
        const rightCol = document.getElementById('waterfall-right-col');
        const waterfallData = window.BoseStoreData?.homepage?.waterfall;

        if (!waterfallData) return;

        /**
         * كل صورة في الشلال دلوقتي رابط مباشر بسيط (image فقط) - مش مربوطة
         * بمنتج حقيقي. لسه بندعم الشكل القديم (image + slug) لو موجود في
         * بيانات قديمة عشان ميتكسرش أي حاجة، بس الإضافة من لوحة التحكم
         * دلوقتي بتحفظ روابط مباشرة بس.
         * @param {Array<Object|string>} items
         */
        const buildWaterfallItemsHtml = (items) => items.map((item) => {
            // 🛡️ [إصلاح حرج]: الصور المرفوعة يدوياً من لوحة التحكم (من غير ربط
            // بمنتج) بتتخزن ككائن { image, slug: "" } مش نص خام زي الشكل القديم.
            // كنا بنستخرج الصورة بس لو فيه slug، فأي صورة من غير ربط كانت بتاخد
            // الكائن كله كـ src وتظهر مكسورة. دلوقتي بنستخرج image صح في الحالتين.
            const isObject = item && typeof item === 'object';
            const imgSrc = isObject ? item.image : item;
            const isLinked = isObject && !!item.slug;
            const imgTag = `<img src="${window.optimizeBoseImageUrl(imgSrc, 300)}" alt="منتج فاخر حلويات بوسي" class="waterfall-img" width="220" height="220" loading="lazy" />`;
            return isLinked
                ? `<a href="product.html?slug=${encodeURIComponent(item.slug)}" class="waterfall-img-link" aria-label="عرض تفاصيل المنتج">${imgTag}</a>`
                : imgTag;
        }).join('');

        if (leftCol && waterfallData.leftColumnImages) {
            const leftHtml = buildWaterfallItemsHtml(waterfallData.leftColumnImages);
            leftCol.innerHTML = `<div class="waterfall-up">${leftHtml} ${leftHtml}</div>`;
        }

        if (rightCol && waterfallData.rightColumnImages) {
            const rightHtml = buildWaterfallItemsHtml(waterfallData.rightColumnImages);
            rightCol.innerHTML = `<div class="waterfall-down">${rightHtml} ${rightHtml}</div>`;
        }

        // ⚙️ [تحكم في سرعة الشلال وتشغيله/إيقافه من لوحة التحكم]: بيتقرا من
        // homepage.waterfall.speedSeconds و homepage.waterfall.enabled. الإيقاف
        // بيجمّد الحركة مكانها (بيفضل المحتوى ظاهر) بدل ما يخفي القسم بالكامل.
        const waterfallSpeed = Number(waterfallData.speedSeconds) > 0 ? Number(waterfallData.speedSeconds) : 57.2;
        const waterfallEnabled = waterfallData.enabled !== false;
        [leftCol?.querySelector('.waterfall-up'), rightCol?.querySelector('.waterfall-down')].forEach((track) => {
            if (!track) return;
            // ملحوظة: لازم !important هنا لأن قاعدة الـ CSS الأصلية لـ .waterfall-up/.waterfall-down
            // نفسها !important، وأي inline style عادي (من غير important) هيتجاهله المتصفح.
            track.style.setProperty('animation-duration', `${waterfallSpeed}s`, 'important');
            track.style.setProperty('animation-play-state', waterfallEnabled ? 'running' : 'paused', 'important');
        });
    }

    /**
     * 👑 [محرك موحد وحيد لكل كروت المنتجات في الموقع كله]
     * أي منتج معاه oldPrice أكبر من price بيتحول تلقائياً وفي كل مكان يظهر فيه
     * (فئة، أكثر مبيعاً، وصل حديثاً، صفحة العروض) لكارت "عليه عرض" واضح بشارة خصم
     * وسعر قديم مشطوب ومبلغ التوفير - بدل ما يظهر كمنتج مستقل مربك للعميل.
     * ده الحل الجذري لمشكلة تكرار منتجات العروض (مش بس الجاتوهات) في كل الفئات.
     * @param {Object} product
     * @returns {string}
     */
    function createProductCardHTML(product) {
        if (!product) return '';
        const rawImg = (product.images && product.images.length > 0 && product.images[0]) ? product.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png';
        const safeImg = window.optimizeBoseImageUrl(rawImg, 400);
        const safeTitle = window.escapeBoseHTML(product.title);
        const safeFlavor = window.escapeBoseHTML(product.flavorName || '');
        const safeDesc = window.escapeBoseHTML(product.flavorDesc || (product.description ? product.description.substring(0, 80) + '...' : ''));

        // 🛡️ [إصلاح جذري]: أي منتج "رئيسي" مرتبط بمحاكي تفاعلي (تورت مخصص / بوكيه ورد)
        // معندوش سعر أو تفاصيل ثابتة أصلاً — سعره وتفاصيله بيتحددوا داخل المحاكي فقط.
        // قبل كده كان الكارت بيوديه لصفحة منتج ثابتة (product.html) بسعر ووصف تقريبي غلط،
        // وكأنه "تورتة جاهزة" منفصلة عن المحاكي. دلوقتي بيوديه للمحاكي مباشرة وبس، ومفيش
        // زرار "إضافة للسلة" مباشر أو عداد كمية لأنه مش منطقي هنا خالص.
        const isBuilderMaster = !!product.customBuilderUrl && product.builderType && product.builderType !== 'standard';

        if (isBuilderMaster) {
            return `
                <div class="product-card-unified bose-builder-master-card" data-id="${product.id}" onclick="window.location.href='${product.customBuilderUrl}';" style="cursor:pointer;">
                    <img src="${safeImg}" alt="${safeTitle}" class="product-card-img" width="300" height="300" loading="lazy" />
                    <h3 class="product-card-title">${safeTitle}</h3>
                    <span class="product-card-flavor-name">${safeFlavor}</span>
                    <p class="product-card-desc">${safeDesc}</p>
                    <div class="product-card-price">
                        <span>أسعار تبدأ من ${Math.round(product.basePrice || product.price || 0)} جنيه</span>
                    </div>
                    <button class="btn-add-to-cart" onclick="event.stopPropagation(); window.location.href='${product.customBuilderUrl}';">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> ابدأ التصميم الآن
                    </button>
                </div>
            `;
        }

        // 👑 [إصلاح جذري - كارثة الأحجام]: لو المنتج عنده أكتر من حجم سعر حقيقي (زي
        // الديسباسيتو/القشطوطة: مثلث/وسط/كبير)، لازم يظهر تبويب اختيار حجم مصغر جوه
        // الكارت نفسه في أي مكان يظهر فيه (الرئيسية، العروض، المقترحات) - مش بس في
        // صفحة الفئة أو صفحة المنتج المستقلة. قبل كده كان العميل بيضغط "إضافة للسلة"
        // من هنا فيتضاف تلقائياً بأرخص وأصغر حجم من غير أي تنبيه، وده اللي كانت
        // صاحبة المتجر بتوصفه بـ"الكارثة".
        const availableSizes = (product.prices && typeof product.prices === 'object') ? Object.keys(product.prices) : [];
        const distinctSizePrices = new Set(availableSizes.map(s => product.prices[s]));
        const hasMultipleSizes = availableSizes.length > 1 && distinctSizePrices.size > 1;
        const defaultSizeKey = (product.defaultSize && availableSizes.includes(product.defaultSize)) ? product.defaultSize : (availableSizes[0] || null);

        let sizeTabsHtml = '';
        if (hasMultipleSizes) {
            sizeTabsHtml = `
                <div class="bose-mini-size-note"><i class="fa-solid fa-circle-info"></i> متاح بأحجام متعددة، اختار اللي يناسبك:</div>
                <div class="bose-card-size-tabs" role="group" aria-label="اختيار الحجم">
                    ${availableSizes.map(sizeKey => `
                        <button type="button" class="bose-card-size-pill${sizeKey === defaultSizeKey ? ' active' : ''}"
                                data-size-key="${sizeKey}"
                                onclick="event.stopPropagation(); window.handleBoseCardSizeChange(this, '${product.id}')">${window.BOSE_SIZE_LABELS[sizeKey] || sizeKey}</button>
                    `).join('')}
                </div>
            `;
        }

        // 🖼️🛡️ [إصلاح جذري - الصورة مش بتتغيّر مع الحجم]: الكارت هنا كان دايماً
        // بيعرض images[0] بس، حتى لو المنتج (زي الديسباسيتو والريدڤيلڤت) عنده
        // صورة مختلفة مسجلة لكل حجم في product.sizeImages (نفس البيانات اللي
        // صفحة المنتج وصفحة الفئة بيستخدموها بالفعل). دلوقتي بيبدأ بصورة الحجم
        // الافتراضي المختار لو موجودة، وبيترك data-size-img عشان handleBoseCardSizeChange
        // يقدر يبدّلها لحظياً لما العميل يغيّر تبويب الحجم.
        const defaultSizeImgRaw = (product.sizeImages && defaultSizeKey && product.sizeImages[defaultSizeKey]) ? product.sizeImages[defaultSizeKey] : rawImg;
        const cardImg = window.optimizeBoseImageUrl(defaultSizeImgRaw, 400);

        const calculatedPrice = window.calculateProductFinalPrice(product, hasMultipleSizes ? { size: defaultSizeKey } : {});
        const hasDiscount = !!(product.oldPrice && product.oldPrice > product.price);
        let discountBadgeHtml = '';
        let oldPriceHtml = '';
        let savingsHtml = '';
        if (hasDiscount) {
            const savingsAmount = product.oldPrice - product.price;
            const discountPercent = Math.round((savingsAmount / product.oldPrice) * 100);
            discountBadgeHtml = `<div class="offer-badge bose-offer-badge">خصم ${discountPercent}%</div>`;
            oldPriceHtml = `<span class="product-old-price">${Math.round(product.oldPrice)} جنيه</span>`;
            savingsHtml = `<span class="offer-savings-note">وفر ${Math.round(savingsAmount)} جنيه</span>`;
        }

        // 🛡️ [V14.0]: منتج نفدت كميته (isAvailable === false) بيفضل ظاهر في الشبكة
        // (عشان العميل يعرف إنه كان موجود ويرجع يسأل عليه) لكن بيتقفل زرار الإضافة
        // للسلة وبتتحط شارة واضحة بدل ما يتباع منتج مش موجود فعلياً بالخطأ.
        // 🎂 [حل مشكلة "العميل مش فاهم الكمية"]: لو المنتج عنده quantity_note حقيقي
        // من لوحة التحكم (مثال: "دستة كاملة = 12 قطعة")، بيتعرض هنا دايماً وبشكل
        // واضح جنب السعر - مش مخفي جوه ⓘ اختياري - عشان دي حقيقة أساسية لازم كل
        // عميل يشوفها من غير ما يحتاج يكتشفها بنفسه.
        const quantityNoteHtml = product.quantityNote
            ? `<div class="bose-qty-clarity-note"><i class="fa-solid fa-circle-info"></i><span>${window.escapeBoseHTML(product.quantityNote)}</span></div>`
            : '';

        const isUnavailable = product.isAvailable === false;
        const addToCartButtonHtml = isUnavailable
            ? `<button class="btn-add-to-cart" disabled style="opacity:0.6; cursor:not-allowed;">
                    <i class="fa-solid fa-ban"></i> نفدت الكمية حالياً
               </button>`
            : `<button class="btn-add-to-cart" onclick="window.handleBoseDirectAddToCart(this, '${product.id}')">
                    <i class="fa-solid fa-basket-shopping"></i> اضافة للسلة
               </button>`;

        return `
            <div class="product-card-unified${hasDiscount ? ' bose-offer-card' : ''}${isUnavailable ? ' bose-unavailable-card' : ''}" data-id="${product.id}" data-selected-size="${defaultSizeKey || ''}" onclick="if(!event.target.closest('.product-card-qty-wrapper') && !event.target.closest('.btn-add-to-cart') && !event.target.closest('.bose-card-size-tabs')){ window.location.href='product.html?slug=${encodeURIComponent(product.slug)}'; }" style="cursor:pointer;">
                ${discountBadgeHtml}
                ${isUnavailable ? `<div class="offer-badge" style="background:rgba(17,17,17,0.75);">نفدت الكمية</div>` : ''}
                <img src="${cardImg}" alt="${safeTitle}" class="product-card-img" data-size-img="1" width="300" height="300" loading="lazy" style="${isUnavailable ? 'filter:grayscale(60%); opacity:0.75;' : ''}" />
                <h3 class="product-card-title">${safeTitle}</h3>
                <span class="product-card-flavor-name">${safeFlavor}</span>
                <p class="product-card-desc">${safeDesc}</p>
                ${sizeTabsHtml}
                ${quantityNoteHtml}
                
                <div class="product-card-qty-wrapper" style="${isUnavailable ? 'display:none;' : ''}">
                    <button class="btn-qty-plus" onclick="window.handleBoseCardQtyChange(this, 1)">+</button>
                    <input type="number" class="input-qty-value" value="1" min="1" readonly />
                    <button class="btn-qty-minus" onclick="window.handleBoseCardQtyChange(this, -1)">-</button>
                </div>
                
                <div class="product-card-price" data-base-price="${calculatedPrice}">
                    ${oldPriceHtml}
                    <span>${Math.round(calculatedPrice)} جنيه</span>
                    ${savingsHtml}
                </div>
                ${addToCartButtonHtml}
            </div>
        `;
    }

    /**
     * 👑 [إصلاح جذري - كارثة الأحجام]: تفعيل تبويب الحجم المصغر جوه أي كارت منتج
     * (رئيسية/عروض/مقترحات) - بيحدث السعر المعروض لحظياً وبيسجل الحجم المختار
     * على الكارت نفسه، عشان handleBoseDirectAddToCart يقرأه صح وقت الإضافة الفعلية.
     * @param {HTMLElement} pillElement
     * @param {string} productId
     */
    window.handleBoseCardSizeChange = function(pillElement, productId) {
        if (!window.BoseStoreData || !pillElement) return;
        const product = window.BoseStoreData.products ? window.BoseStoreData.products.find((/** @type {any} */ p) => p.id === productId || p.slug === productId) : null;
        if (!product) return;

        const card = pillElement.closest('.product-card-unified');
        if (!card) return;
        const sizeKey = pillElement.dataset.sizeKey;

        card.querySelectorAll('.bose-card-size-pill').forEach((/** @type {HTMLElement} */ p) => p.classList.remove('active'));
        pillElement.classList.add('active');
        card.dataset.selectedSize = sizeKey;

        const newPrice = window.calculateProductFinalPrice(product, { size: sizeKey });
        const priceDisplay = card.querySelector('.product-card-price');
        if (priceDisplay) {
            priceDisplay.dataset.basePrice = String(newPrice);
            const priceSpan = priceDisplay.querySelector('span');
            if (priceSpan) priceSpan.textContent = `${Math.round(newPrice)} جنيه`;
        }

        // 🖼️🛡️ [إصلاح جذري - الصورة مش بتتغيّر مع الحجم]: نفس الإصلاح المطبّق في
        // category.html، لكن هنا في المحرك الموحد اللي بيغذي كروت الرئيسية/العروض/
        // المقترحات كلها. لو المنتج عنده صورة مسجلة للحجم الجديد في sizeImages
        // بنبدّلها بفيد بسيط، ولو مفيش صورة مخصصة لهذا الحجم بتفضل الصورة الحالية
        // زي ما هي (مفيش أي كسر أو صورة فاضية).
        const imgNode = card.querySelector('.product-card-img[data-size-img]');
        if (imgNode && product.sizeImages && product.sizeImages[sizeKey]) {
            const newImgUrl = product.sizeImages[sizeKey];
            const optimizedUrl = window.optimizeBoseImageUrl(newImgUrl, 400);
            if (imgNode.getAttribute('src') !== optimizedUrl) {
                imgNode.style.transition = 'opacity 0.15s ease';
                imgNode.style.opacity = '0.4';
                setTimeout(() => {
                    imgNode.src = optimizedUrl;
                    imgNode.style.opacity = '1';
                }, 120);
            }
        }
    };

    // 🛡️ [إصلاح معماري جذري]: createProductCardHTML كانت دالة "موحدة" بالاسم بس،
    // من غير ما تكون متاحة فعلياً لأي صفحة تانية غير core-engine.js نفسه (مش معلقة
    // على window). النتيجة: صفحات زي category.html و cart.html اضطرت تكتب نسخة
    // خاصة بيها من نفس منطق الكارت يدوياً بدل ما تستدعي الدالة دي - وكل نسخة من
    // النسخ دي ممكن تتصلح لوحدها وتفضل الباقي فيهم نفس المشكلة (بالظبط اللي حصل
    // مع مشكلة "تكرار منتجات العروض"). تعليقها هنا على window بيخلي أي صفحة في
    // الموقع كله تقدر تستخدم window.createProductCardHTML(product) بدل ما تعيد
    // كتابة نفس الكود من الصفر.
    window.createProductCardHTML = createProductCardHTML;

    /**
     * @param {HTMLElement} buttonElement
     * @param {number} direction
     */
    window.handleBoseCardQtyChange = function(buttonElement, direction) {
        const qtyContainer = buttonElement.closest('.product-card-qty-wrapper');
        const cardContainer = buttonElement.closest('.product-card-unified');
        if (!qtyContainer || !cardContainer) return;

        /** @type {HTMLInputElement|null} */
        const qtyInput = qtyContainer.querySelector('.input-qty-value');
        const priceDisplay = cardContainer.querySelector('.product-card-price');
        if (!qtyInput || !priceDisplay) return;

        let currentQty = parseInt(qtyInput.value, 10) || 1;
        currentQty += direction;
        if (currentQty < 1) currentQty = 1;
        qtyInput.value = String(currentQty);

        const basePrice = parseFloat(priceDisplay.getAttribute('data-base-price') || '0') || 0;
        priceDisplay.textContent = `${Math.round(basePrice * currentQty)} جنيه`;
    };

    function renderHomepageProductGrids() {
        const data = window.BoseStoreData;
        // 🛡️ [تحصين]: data.homepage ممكن يوصل فاضي {} لحد ما يتملى من لوحة التحكم،
        // فالحماية هنا بتمنع أي كسر JS بدل ما تعتمد بس على وجود homepage نفسه.
        if (!data || !data.products || !data.homepage) return;

        const mostSellingGrid = document.getElementById('most-selling-grid');
        if (mostSellingGrid && data.homepage.mostSelling) {
            const items = data.homepage.mostSelling.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            mostSellingGrid.innerHTML = items.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
        }

        const newArrivalsGrid = document.getElementById('new-arrivals-grid');
        if (newArrivalsGrid && data.homepage.newArrivals) {
            const items = data.homepage.newArrivals.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean);
            newArrivalsGrid.innerHTML = items.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
        }

        const ourProductsGrid = document.getElementById('our-products-grid');
        if (ourProductsGrid && data.homepage.ourProducts) {
            const initialItems = data.homepage.ourProducts.slice(0, 4).map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean).filter(isSingleSizeProduct);
            ourProductsGrid.innerHTML = initialItems.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
        }
    }

    // 🛡️👑 [إصلاح جذري - "منتجاتنا" كارت ممطوط]: قسم "منتجاتنا" في الرئيسية
    // (عمودين جنب بعض بس) اتصمم من الأول على أساس كل الكروت نفس الارتفاع بالظبط.
    // منتج بيه أكتر من حجم حقيقي (زي الديسباسيتو والريدڤيلڤت) بيضيف بلوك تبويبات
    // الحجم كامل (bose-mini-size-note + bose-card-size-tabs) جوه الكارت، فبيبقى
    // أطول من الكارت المجاور ليه بشكل واضح ومقصوص العين - ده "الكارت الممطوط".
    // الفلتر هنا بيمنع أي منتج متعدد الأحجام إنه يظهر في القسم ده خالص - سواء في
    // العرض الأول أو زرار "استعرض المزيد" - حتى لو اتضاف بالغلط من لوحة التحكم
    // في homepage.ourProducts مستقبلاً، فمفيش أي احتمال يرجع "الكارت الممطوط" تاني.
    /** @param {any} product */
    function isSingleSizeProduct(product) {
        if (!product) return false;
        const availableSizes = (product.prices && typeof product.prices === 'object') ? Object.keys(product.prices) : [];
        const distinctSizePrices = new Set(availableSizes.map(s => product.prices[s]));
        return !(availableSizes.length > 1 && distinctSizePrices.size > 1);
    }

    function setupOurProductsShowMore() {
        const showMoreBtn = document.getElementById('our-products-show-more-btn');
        const ourProductsGrid = document.getElementById('our-products-grid');
        const data = window.BoseStoreData;

        if (!showMoreBtn || !ourProductsGrid || !data) return;

        showMoreBtn.classList.add('btn-show-more-outline');
        showMoreBtn.textContent = "استعرض المزيد";

        showMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // 🛡️ [تحصين]: منع كسر JS لو ourProducts لسه مش متملي في لوحة التحكم
            if (!data.homepage || !data.homepage.ourProducts) return;
            const allItems = data.homepage.ourProducts.map(/** @param {string} id */ (id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id)).filter(Boolean).filter(isSingleSizeProduct);
            ourProductsGrid.innerHTML = allItems.map((/** @type {any} */ p) => createProductCardHTML(p)).join('');
            showMoreBtn.style.setProperty('display', 'none', 'important'); 
        });
    }

    function injectSimulatorsPreviewData() {
        const data = window.BoseStoreData;
        if (!data || !data.homepage) return;

        const cakeSection = document.getElementById('cake-preview-section');
        if (cakeSection && data.homepage.cakePreview) {
            const preview = data.homepage.cakePreview;
            /** @type {HTMLImageElement|null} */ const imgEl = cakeSection.querySelector('#cake-preview-img');
            const titleEl = cakeSection.querySelector('#cake-preview-title');
            const descEl = cakeSection.querySelector('#cake-preview-desc');
            /** @type {HTMLAnchorElement|null} */ const ctaEl = cakeSection.querySelector('#cake-preview-cta');

            if (imgEl && preview.image) imgEl.src = preview.image;
            if (titleEl && preview.title) titleEl.textContent = preview.title;
            if (descEl && preview.description) descEl.textContent = preview.description;
            if (ctaEl && preview.cta) {
                ctaEl.textContent = preview.cta;
                if (preview.target) ctaEl.href = preview.target;
            }
        }

        const flowerSection = document.getElementById('flower-preview-section');
        if (flowerSection && data.homepage.flowerPreview) {
            const preview = data.homepage.flowerPreview;
            /** @type {HTMLImageElement|null} */ const imgEl = flowerSection.querySelector('#flower-preview-img');
            const titleEl = flowerSection.querySelector('#flower-preview-title');
            const descEl = flowerSection.querySelector('#flower-preview-desc');
            /** @type {HTMLAnchorElement|null} */ const ctaEl = flowerSection.querySelector('#flower-preview-cta');

            if (imgEl && preview.image) imgEl.src = preview.image;
            if (titleEl && preview.title) titleEl.textContent = preview.title;
            if (descEl && preview.description) descEl.textContent = preview.description;
            if (ctaEl && preview.cta) {
                ctaEl.textContent = preview.cta;
                if (preview.target) ctaEl.href = preview.target;
            }
        }
    }

    function setupPrideCountersAnimation() {
        const prideSection = document.getElementById('pride-section');
        if (!prideSection || !window.BoseStoreData?.homepage?.pride?.stats) return;

        const statsData = window.BoseStoreData.homepage.pride.stats;
        
        /**
         * @param {Element} el
         * @param {number} target
         * @param {string} suffix
         */
        const animateCounter = (el, target, suffix) => {
            let current = 0;
            const duration = 2000;
            const stepTime = Math.max(Math.floor(duration / target), 15);
            const increment = Math.ceil(target / (duration / stepTime));
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    el.textContent = target + suffix;
                    clearInterval(timer);
                } else {
                    el.textContent = current + suffix;
                }
            }, stepTime);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    Object.keys(statsData).forEach((key) => {
                        const targetEl = prideSection.querySelector(`[data-stat="${key}"]`) || document.getElementById(`pride-stat-${key}`);
                        if (targetEl && !targetEl.classList.contains('animated')) {
                            targetEl.classList.add('animated');
                            animateCounter(targetEl, parseInt(statsData[key].value, 10), statsData[key].suffix || '+');
                        }
                    });
                    observer.unobserve(prideSection);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(prideSection);
    }

    /**
     * @param {number} basePrice
     * @param {string} applyOnContext
     * @returns {number}
     */
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return parseFloat((basePrice * (1 + (rule.percent / 100))).toFixed(4));
        }
        return basePrice;
    };

    /**
     * @param {Object} product
     * @param {Object} selectedOptions
     * @returns {number}
     */
    window.calculateProductFinalPrice = function(product, selectedOptions) {
        const opts = selectedOptions || {};
        let price = 0;
        
        if (product) {
            price = product.price || product.basePrice || 0;
            // 🚨🚨 [إصلاح جذري حرج - العروض بتلغي نفسها]: عمود "prices" (الخاص
            // بالأحجام) ممكن يفضل فيه القيمة القديمة قبل الخصم غلط في البيانات
            // (حصل فعلاً مع منتج "جاتوه كلاسيك" سابقاً) - فأي مكان بيمرر "size"
            // كان بيلغي الخصم تماماً ويرجّع السعر القديم. الحل: نستخدم قيمة الحجم
            // بس لو المقاسات فعلاً مختلفة عن بعضها (يعني المنتج multi-size حقيقي)،
            // وإلا نفضل معتمدين على product.price الصحيح المحدث بعد أي خصم.
            if (product.prices && opts.size) {
                const sizeValues = Object.values(product.prices);
                const hasRealSizeVariation = new Set(sizeValues).size > 1;
                if (hasRealSizeVariation) {
                    price = product.prices[opts.size] || price;
                }
            }
            const selectedPrinting = opts.printing || opts.printingType || 'none';
            if (selectedPrinting && selectedPrinting !== 'none') {
                let printingFee = 0;
                if (product.customizationOptions && product.customizationOptions.printing) {
                    const printOptions = product.customizationOptions.printing.options;
                    if (Array.isArray(printOptions)) {
                        const printingOpt = printOptions.find((/** @type {any} */ opt) => opt.id === selectedPrinting || opt.type === selectedPrinting);
                        if (printingOpt) printingFee = printingOpt.price;
                    }
                }
                if (printingFee === 0) {
                    if (selectedPrinting === 'edible' || selectedPrinting === 'printable-edible' || selectedPrinting === 'صورة_صالحة_للأكل') {
                        printingFee = 60;
                    } else if (selectedPrinting === 'non-edible' || selectedPrinting === 'printable-non-edible' || selectedPrinting === 'صورة_غير_صالحة_للأكل') {
                        printingFee = 15;
                    }
                }
                price += printingFee;
            }
            if (product.isMiniCake || product.type === "mini-cake" || product.slug === "mini-cake-two-person") {
                if (opts.extraToppingPrice) price += parseFloat(opts.extraToppingPrice);
                if (opts.printingPrice) price += parseFloat(opts.printingPrice);
            }
        }
        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * @param {number|string} persons
     * @param {Object} options
     * @returns {number}
     */
    window.calculateCustomCakePrice = function(persons, options = {}) {
        const config = window.BoseStoreData?.cakeBuilder;
        const safePersons = parseInt(String(persons), 10) || (config ? config.persons.minimum : 10) || 10;
        let price = (config ? config.basePrice : 580) || 580;
        const minPersons = (config ? config.persons.minimum : 10) || 10;
        const pricePerPerson = (config ? config.pricePerPerson : 145) || 145; 
        const extraPersons = Math.max(0, safePersons - minPersons);
        price += extraPersons * pricePerPerson;
        
        const selectedPrinting = options.printingType || options.printing || 'none';
        if (selectedPrinting && selectedPrinting !== 'none') {
            let printingFee = 0;
            if (config && config.printingOptions) {
                const printOpt = config.printingOptions.find((/** @type {any} */ opt) => opt.id === selectedPrinting);
                if (printOpt) printingFee = printOpt.price;
            }
            if (printingFee === 0) {
                printingFee = (selectedPrinting === 'edible' || selectedPrinting === 'صورة_صالحة_للأكل') ? 60 : 15;
            }
            price += printingFee;
        }
        if (options.wrappingPrice) price += parseFloat(options.wrappingPrice) || 0;
        return window.calculateBosePrice(price, "menu-only");
    };

    /**
     * @param {number|string} flowerCount
     * @param {Object} options
     * @returns {number}
     */
    window.calculateCustomFlowerPrice = function(flowerCount, options = {}) {
        // 🧮 [توحيد مصدر الأسعار - المرحلة 3]: القراءة من window.BoseStoreData.flowerBuilder
        // بدل الأرقام المكتوبة يدوياً، عشان أي تعديل مستقبلي على السعر من قاعدة البيانات
        // ينعكس فعلياً على الموقع. القيم بعد "||" هي نفس الأرقام القديمة تماماً كقيمة
        // احتياطية فقط لو الحقل مفقود من الـ JSON لأي سبب - نفس القيم المستخدمة حرفياً
        // في flower-engine.js لضمان تطابق سعر المحاكي مع سعر الحارس المركزي بالمليم.
        const fbConfig = window.BoseStoreData?.flowerBuilder || {};
        const basePrice = parseFloat(fbConfig.basePrice) || 400;
        const baseFlowers = parseInt(fbConfig.baseFlowers, 10) || 15;
        const extraFlowerPrice = parseFloat(fbConfig.extraFlowerPrice) || 35;
        const photoPrintPrice = parseFloat(fbConfig.photoPrintPrice) || 15;
        // 💰👑 [توحيد سعر كارت الإهداء مع محاكي التورت]: القيمة الاحتياطية هنا كانت
        // 20 وبقت 30 - نفس التعديل المطبق في flowerConfig.giftCardPrice بملف
        // flower-engine.js، عشان الحارس المركزي هنا (اللي بيتأكد من السعر وقت
        // الإضافة للسلة والتشيك أوت) يفضل مطابق تماماً للسعر المعروض للعميل.
        const giftCardPrice = parseFloat(fbConfig.giftCardPrice) || 30;
        // ملحوظة: مفيش حقل رسمي لسعر شريط الستان المطبوع (satinRibbonPrice) داخل
        // flowerBuilder بالـ JSON حالياً - فضّلنا نسيبه ثابت 50 بدل ما نخمّن ربطه بحقل
        // تاني (زي wrappingTypes) معناه مختلف، لحد ما يتضاف حقل مخصص له فعلياً.
        const satinRibbonPrice = 50;

        const safeFlowerCount = parseInt(String(flowerCount), 10) || baseFlowers;
        const extraFlowers = Math.max(0, safeFlowerCount - baseFlowers);
        let servicePrice = basePrice + (extraFlowers * extraFlowerPrice);
        if (options.hasSatinRibbon) servicePrice += satinRibbonPrice; 
        const safePhotoCount = parseInt(options.photoCount, 10) || 0;
        if (options.hasPhotos && safePhotoCount > 0) servicePrice += safePhotoCount * photoPrintPrice; 
        if (options.hasGiftCard) servicePrice += giftCardPrice; 
        const finalServicePrice = window.calculateBosePrice(servicePrice, "menu-only");
        
        const safeCashAmount = parseFloat(options.cashAmount) || 0;
        const safeChocolateBudget = parseFloat(options.chocolateBudget) || 0;
        return finalServicePrice + safeCashAmount + safeChocolateBudget;
    };

    /**
     * @param {Object} product
     * @param {Object} selectedOptions
     * @param {number} quantity
     * @returns {Object|null}
     */
    window.createCartItem = function(product, selectedOptions, quantity = 1) {
        if (!product) return null;
        const opts = selectedOptions || {};
        let finalUnitPrice = 0;
        if (product.type === "custom-flower") {
            finalUnitPrice = window.calculateCustomFlowerPrice(opts.flowerCount, opts);
        } else if (product.type === "custom-cake") {
            finalUnitPrice = window.calculateCustomCakePrice(opts.persons, opts);
        } else {
            finalUnitPrice = window.calculateProductFinalPrice(product, opts);
        }
        
        const isCustomizable = product.isMiniCake ||
                             product.type === "custom-cake" || 
                             product.type === "custom-flower" || 
                             (product.customizationOptions && Object.keys(opts).length > 0);
                             
        const finalId = isCustomizable ? `${product.slug}-${Date.now()}` : String(product.slug || product.id);
        let correctFlavor = opts.flavorName || opts.cakeType || product.flavorName || product.flavor || "جاهز وفريش";
        if (correctFlavor === "none" || correctFlavor === "افتراضي") {
            correctFlavor = product.flavorName || "جاهز وفريش";
        }

        return {
            id: finalId,
            productSlug: product.slug,
            title: product.title,
            flavorName: correctFlavor,
            basePrice: parseFloat((product.price || product.basePrice || 0).toFixed(4)),
            finalPrice: parseFloat(finalUnitPrice.toFixed(4)),
            quantity: parseInt(String(quantity), 10) || 1,
            image: (product.images && product.images[0]) || product.image || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png",
            type: product.type || (product.isMiniCake ? "mini-cake" : "standard"),
            customDetails: {
                cakeType: opts.cakeType || opts.cakeFlavor || "فانيليا",
                shape: opts.shape || "circle",
                persons: parseInt(opts.persons, 10) || (product.isMiniCake ? 2 : 0),
                printingType: opts.printingType || opts.printing || "none",
                customMessage: opts.customMessage || "",
                allergyNote: opts.allergyNote || "",
                // 🐛 [إصلاح خلل موجود من قبل]: isGift وoccasionLabel كانا بيترسلوا من
                // محاكي التورت جوه customOptions لكن معندهمش أي سطر هنا كانوا بيتقروا
                // منه - يعني كانوا بيتمسحوا بصمت ومحدش كان بيشوفهم في السلة ولا فاتورة
                // الواتساب، رغم إن العميلة فعلاً بتختارهم/بتكتبهم.
                isGift: !!opts.isGift,
                occasionLabel: opts.occasionLabel || "",
                flowerType: opts.flowerType || "none",
                flowerCount: parseInt(opts.flowerCount, 10) || 0,
                cashAmount: parseFloat(opts.cashAmount) || 0,
                hasSatinRibbon: !!opts.hasSatinRibbon,
                satinRibbonText: opts.satinRibbonText || "",
                photoCount: parseInt(opts.photoCount, 10) || 0,
                hasChocolate: !!opts.hasChocolate,
                chocolateBudget: parseFloat(opts.chocolateBudget) || 0,
                hasGiftCard: !!opts.hasGiftCard,
                giftCardText: opts.giftCardText || "",
                // 🖼️ [تمييز نوع كل صورة]: صورة "الطباعة على السطح" وصورة "التصميم
                // المرجعي المطلوب تقريبه" مختلفتان تماماً في الغرض - بنخزنهم منفصلين
                // بدل قايمة واحدة مجهولة، عشان فاتورة الواتساب تقدر توضح لكل واحدة
                // غرضها بالظبط بدل ما تظهر كـ"صورة مرجعية" عامة غامضة.
                printImageUrl: opts.printImageUrl || "",
                replicaImageUrl: opts.replicaImageUrl || "",
                // 👑 [إصلاح جذري - كارثة الأحجام]: نخزن الحجم المختار فعلياً (لو المنتج
                // بيدعم أكتر من حجم سعر) جوه بيانات عنصر السلة، عشان يظهر بوضوح في
                // صفحة السلة وفي فاتورة الواتساب - بدل ما يختفي تماماً ويفضل السعر
                // هو الفرق الوحيد الصامت بين حجم وحجم.
                size: opts.size || null,
                sizeLabel: opts.size ? (window.BOSE_SIZE_LABELS[opts.size] || opts.size) : ""
            }
        };
    };

    /**
     * @param {string} phone
     * @param {boolean} isOptional
     * @returns {boolean}
     */
    window.validateBosePhoneNumber = function(phone, isOptional = false) {
        if (!phone || phone.trim() === "") return isOptional;
        const cleaned = window.sanitizeBosePhoneNumber(phone);
        return /^01[0125][0-9]{8}$/.test(cleaned);
    };

    /**
     * @param {string} phone
     * @returns {string}
     */
    window.sanitizeBosePhoneNumber = function(phone) {
        if (!phone) return "";
        let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, "");
        if (cleaned.startsWith("201")) cleaned = "0" + cleaned.substring(2);
        else if (cleaned.startsWith("00201")) cleaned = "0" + cleaned.substring(4);
        else if (cleaned.startsWith("1") && cleaned.length === 10) cleaned = "0" + cleaned;
        return cleaned;
    };

    /**
     * @param {string} phone
     * @returns {string}
     */
    window.toInternationalWhatsappNumber = function(phone) {
        let cleaned = window.sanitizeBosePhoneNumber(phone || "");
        if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
        return "20" + cleaned;
    };

    /**
     * @param {string} phone
     * @param {string} text
     * @returns {string}
     */
    window.buildWhatsappLink = function(phone, text) {
        const intlNumber = window.toInternationalWhatsappNumber(phone);
        return `https://wa.me/${intlNumber}?text=${encodeURIComponent(text || "")}`;
    };

    /**
     * @param {number} subtotal
     * @param {Object} coupon
     * @returns {number}
     */
    window.calculateCouponDiscount = function(subtotal, coupon) {
        const safeSubtotal = parseFloat(String(subtotal)) || 0;
        if (!coupon) return 0;
        const value = parseFloat(coupon.value) || 0;
        let discount = 0;
        if (coupon.type === "fixed") {
            discount = value;
        } else {
            discount = safeSubtotal * (value / 100);
        }
        return Math.max(0, Math.min(discount, safeSubtotal));
    };

    /**
     * 🧮 [إصلاح حرج - المرحلة 1]: الدالة الموحدة الوحيدة لحساب فاتورة السلة/الشحن/الطلب النهائي.
     * تُستخدم من cart-engine.js في 3 نقاط: ملخص السلة، ملخص الشحن بالـ checkout، وتأكيد الطلب النهائي،
     * لضمان تطابق الأرقام بالمليم في كل مرحلة من رحلة الشراء.
     * القاعدة المالية الصارمة: لا تقريب على الأسعار الفردية أو subtotal/discount، والتقريب الوحيد
     * يتم مرة واحدة وحصرياً على الإجمالي الكلي النهائي (grandTotal).
     * @param {Array} cart
     * @param {Object} storeData
     * @param {number} shippingFee
     * @returns {{subtotal: number, discount: number, shippingFee: number, grandTotal: number, itemsCount: number}}
     */
    window.calculateBoseInvoice = function(cart, storeData, shippingFee) {
        const safeCart = Array.isArray(cart) ? cart : [];
        const safeShippingFee = parseFloat(String(shippingFee)) || 0;

        let subtotal = 0;
        let itemsCount = 0;
        safeCart.forEach((/** @type {any} */ item) => {
            const unitPrice = parseFloat(item.finalPrice) || 0;
            const qty = parseInt(item.quantity, 10) || 1;
            subtotal += unitPrice * qty;
            itemsCount += qty;
        });
        subtotal = parseFloat(subtotal.toFixed(4));

        let discount = 0;
        let activeCouponCode = null;
        try {
            // 🛡️ [إصلاح أمني]: بيانات الكوبون النشط بقت جاية من نتيجة تحقق آمن عبر
            // الباكند (validate_coupon RPC) وقت الضغط على "تطبيق"، مش من قايمة
            // storeData.coupons العامة القديمة اللي كانت بتفضح كل أكواد الخصم لأي
            // حد يفتح site-data-final.json مباشرة. راجع onclick الخاص بـ btn-apply-coupon
            // في cart-engine.js لمصدر بيانات bose_active_coupon الجديد.
            const rawActiveCoupon = localStorage.getItem("bose_active_coupon");
            if (rawActiveCoupon) {
                const activeCoupon = JSON.parse(rawActiveCoupon);
                if (activeCoupon && activeCoupon.code) {
                    discount = window.calculateCouponDiscount(subtotal, activeCoupon);
                    activeCouponCode = activeCoupon.code;
                }
            }
        } catch (e) {
            discount = 0;
            activeCouponCode = null;
        }
        discount = parseFloat(discount.toFixed(4));

        const grandTotal = Math.round(Math.max(0, subtotal - discount) + safeShippingFee);

        return {
            subtotal: subtotal,
            discount: discount,
            shippingFee: safeShippingFee,
            grandTotal: grandTotal,
            itemsCount: itemsCount,
            couponCode: activeCouponCode
        };
    };

    /**
     * 🆔 [إصلاح حرج - المرحلة 1]: توليد رقم طلب فريد فعلياً (طابع زمني بصيغة Base36 + رقم عشوائي)
     * لمنع تصادم أرقام الطلبات بين عمليتي شراء متزامنتين.
     * @returns {string}
     */
    window.generateBoseOrderId = function() {
        const timestampPart = Date.now().toString(36).toUpperCase();
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        return `${timestampPart}${randomPart}`;
    };

    /**
     * @param {string} url
     * @param {number|string} width
     * @returns {string}
     */
    window.optimizeBoseImageUrl = function(url, width) {
        if (!url || typeof url !== "string") return url;
        if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
        const safeWidth = parseInt(String(width), 10) || 600;
        // 🛡️🛡️ [إصلاح جذري - جودة الصور الضبابية]: كنا بنطلب من Cloudinary نفس
        // عرض الـ CSS المعروض بالبكسل بالظبط (180/250/300px..) من غير أي اعتبار
        // لكثافة بكسل الشاشة (Device Pixel Ratio). شاشات الموبايل والتابلت
        // الحديثة (Retina/2x/3x) بتعرض كل "بكسل CSS" بـ 2 أو 3 بكسل فعلي فيها،
        // فكانت كل صور الموقع بتوصل بدقة أقل بكتير من دقة الشاشة الحقيقية وتظهر
        // ضبابية/معتمة (خصوصاً في قسم "تسوق حسب الفئة" اللي كروته بتوصل لـ 420px
        // ارتفاع فعلي بينما كان بيتطلب منها بس 250px). دلوقتي بنضرب العرض
        // المطلوب في نسبة كثافة بكسل الجهاز الفعلية (بحد أقصى 3x لتفادي تحميل
        // صور ضخمة بلا داعي وإهدار بيانات). كمان رفعنا q_auto العادي لـ
        // q_auto:good كأرضية جودة أعلى تفادياً لأي ضغط عدواني زيادة عن اللزوم
        // من وضع q_auto الافتراضي على صور فيها تفاصيل دقيقة (كريمة/زهور/تزيين).
        const dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 3) : 2;
        const targetWidth = Math.round(safeWidth * dpr);
        const transform = `f_auto,q_auto:good,w_${targetWidth},c_limit`;
        if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto")) return url;
        return url.replace("/upload/", `/upload/${transform}/`);
    };

    /**
     * 🛡️ [إصلاح - مصدر واحد حي لصور الفئات]: بترجع قايمة الفئات جاهزة للعرض
     * (id/title/image/builderType) مبنية مباشرة من جدول categories الحي
     * (data.categories) بدل الاعتماد على نسخة homepage.categoriesSlider
     * المحفوظة (snapshot) اللي كانت بتفضل قديمة لحد ما حد يفتح صفحة الهوم
     * بيدج في لوحة التحكم ويدوس حفظ. النتيجة: أي صورة/عنوان فئة بيتغيّر من
     * admin/categories.html بيظهر فوراً في الرئيسية والمنيو من غير أي خطوة
     * تانية. بيرجع للـ snapshot القديم بس لو جدول categories وصل فاضي فعلاً
     * (حماية من كسر الصفحة، مش السلوك المتوقع في الاستخدام العادي).
     * @returns {Array<Object>}
     */
    window.getBoseCategoriesList = function() {
        const data = window.BoseStoreData;
        if (!data) return [];
        if (Array.isArray(data.categories) && data.categories.length) {
            return data.categories
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((c) => ({
                    id: c.id,
                    title: c.title,
                    image: c.image || "",
                    builderType: c.builder_type || "standard",
                }));
        }
        return (data.homepage && data.homepage.categoriesSlider) || [];
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    window.escapeBoseHTML = function(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    /**
     * @param {string} dateStr
     * @param {string} timeStr
     * @returns {boolean}
     */
    // 🛡️ [إصلاح - المرحلة 2]: قبل كده كانت الدالة بتطبّق 24 ساعة على كل أنواع
    // الطلبات بدون استثناء، بينما "الشروط والأحكام" الرسمية بتوعد العميل بمدة
    // أسبوع كامل للتورت والورد المخصص عبر المحاكي (لأنها بتاخد مراحل تحضير وتنسيق
    // كتيرة). دلوقتي الدالة بتاخد isCustomOrder وتطبّق العتبة الصحيحة المطابقة
    // لصاحب المتجر: 168 ساعة (7 أيام) للمخصص، 24 ساعة لباقي المنتجات.
    window.validateBoseDeliverySchedule = function(dateStr, timeStr, isCustomOrder = false) {
        if (!dateStr || !timeStr) return false;
        const selectedDateTime = new Date(`${dateStr}T${timeStr}`);
        const currentDateTime = new Date(Date.now() + (window.boseServerTimeOffset || 0));
        if (selectedDateTime <= currentDateTime) return false;
        const rules = window.BoseStoreData?.orderRules || {};
        const requiredHours = isCustomOrder
            ? (rules.minPreparationTimeHoursCustom || 168) - 0.05
            : (rules.minPreparationTimeHours || 24) - 0.05;
        return (selectedDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60) >= requiredHours;
    };

    // 🛡️ [إصلاح - المرحلة 2]: دالة مشتركة موحّدة لتحديد هل السلة فيها منتج مخصص
    // (تورت محاكي / ورد محاكي) يستوجب قاعدة الأسبوع، بدل تكرار نفس الشرط في أكتر
    // من ملف (cart-engine.js وcheckout.html) بشكل منفصل وعرضة للتعارض مستقبلاً.
    window.boseCartHasCustomItem = function(cart) {
        if (!Array.isArray(cart)) return false;
        return cart.some(item =>
            item.type === "custom-cake" ||
            item.type === "mini-cake" ||
            item.type === "custom-flower" ||
            item.productSlug === "toort-custom-master" ||
            item.productSlug === "flowers-master"
        );
    };

    /**
     * @param {Object} item
     * @returns {number}
     */
    window.recalculateCartItemPrice = function(item) {
        if (!item || !window.BoseStoreData) return parseFloat(item?.finalPrice) || 0;
        const details = item.customDetails || {};

        if (item.type === "custom-cake") {
            return window.calculateCustomCakePrice(details.persons, { printingType: details.printingType });
        }
        if (item.type === "custom-flower") {
            return window.calculateCustomFlowerPrice(details.flowerCount, {
                hasSatinRibbon: details.hasSatinRibbon,
                photoCount: details.photoCount,
                hasPhotos: details.photoCount > 0,
                hasGiftCard: details.hasGiftCard,
                cashAmount: details.cashAmount,
                chocolateBudget: details.hasChocolate ? details.chocolateBudget : 0
            });
        }

        const product = window.BoseStoreData.products?.find((/** @type {any} */ p) => p.slug === item.productSlug);
        if (!product) return parseFloat(item.finalPrice) || 0;

        return window.calculateProductFinalPrice(product, {
            printing: details.printingType,
            extraToppingPrice: item.extraToppingPrice,
            printingPrice: item.printingPrice
        });
    };

    /**
     * @param {Array} cart
     * @returns {{cart: Array, wasTampered: boolean}}
     */
    window.recalculateFullCart = function(cart) {
        let wasTampered = false;
        const fixedCart = (cart || []).map((/** @type {any} */ item) => {
            const trustedPrice = window.recalculateCartItemPrice(item);
            const storedPrice = parseFloat(item.finalPrice) || 0;
            if (Math.abs(trustedPrice - storedPrice) > 0.5) wasTampered = true;
            return { ...item, finalPrice: parseFloat(trustedPrice.toFixed(4)) };
        });
        return { cart: fixedCart, wasTampered };
    };

    /**
     * 🛡️ [إصلاح حرج]: نظام رسائل التنبيه المؤقتة (toast) - كان بيتنادى عليه في
     * أكتر من 8 أماكن في الموقع (تمت الإضافة للسلة، تم إرسال المراجعة، إلخ)
     * بس الدالة نفسها كانت مش متعرّفة في أي مكان، يعني كل الرسائل دي كانت
     * بتفشل بصمت (typeof === 'function' بيرجع false) والعميل ملوش أي تأكيد
     * بصري إن الإضافة للسلة نجحت غير رقم صغير في شارة السلة بالزاوية.
     * الـ CSS الخاص بالتصميم (#bose-toast-container / .bose-toast-message)
     * كان جاهز فعلاً من قبل في global.css - هنا بس بنوصّله بمنطق JS شغال.
     */
    window.showBoseToast = function (message, duration = 3200) {
        if (!message) return;
        let container = document.getElementById('bose-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'bose-toast-message';
        toast.textContent = message;
        container.appendChild(toast);

        // فريم إضافي قبل إضافة is-visible عشان الـ transition يشتغل فعلاً
        // (لو ضفناها في نفس الفريم، المتصفح مش هيعمل انتقال من الحالة الابتدائية)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('is-visible'));
        });

        setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.classList.add('is-leaving');
            setTimeout(() => toast.remove(), 420);
        }, duration);
    };

    window.updateGlobalCartCounter = function() {
        const cartCountBadges = document.querySelectorAll('#nav-cart-count, .nav-cart-badge');
        if (cartCountBadges.length === 0) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        let totalDisplayItems = 0;
        cart.forEach((/** @type {any} */ item) => {
            // ملاحظة: المنتجات المخصصة (تورت/ورد) بيتولد لها id بالشكل `${slug}-${Date.now()}`
            // يعني بينتهي بسلسلة أرقام طويلة (timestamp)، وده الفارق الحقيقي عن أكواد
            // المنتجات العادية اللي بتستخدم شرطات في كتابتها (kebab-case) زي donuts-matilda
            const hasTimestampSuffix = item.id && /-\d{10,}$/.test(String(item.id));
            const isBespokeOrCustom = item.type === "custom-cake" || 
                                      item.type === "custom-flower" || 
                                      item.type === "mini-cake" || 
                                      hasTimestampSuffix;
            totalDisplayItems += isBespokeOrCustom ? 1 : (parseInt(item.quantity, 10) || 1);
        });
        cartCountBadges.forEach((badge) => badge.textContent = String(totalDisplayItems));

        // 🛒 [سلة عائمة]: تبديل حالة الفقاعة العائمة بين "فاضية" (وميض تحفيزي مستمر
        // يشجع العميل يضيف منتجات) و"فيها أصناف" (الوميض بيقف ويثبت اللون عشان
        // العميل يركز على العدد الحقيقي ويكمل طلبه براحة).
        const floatingCartBtn = document.getElementById('bose-floating-cart-btn');
        if (floatingCartBtn) {
            floatingCartBtn.classList.toggle('is-empty', totalDisplayItems === 0);
            floatingCartBtn.classList.toggle('has-items', totalDisplayItems > 0);
        }
    };

    /**
     * @param {string} message
     */
    window.showBoseGlobalToast = function(message) {
        let container = document.getElementById('bose-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bose-toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'bose-toast-message';
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('is-visible'));
        setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.classList.add('is-leaving');
            setTimeout(() => { toast.remove(); }, 400);
        }, 3000);
    };

    /**
     * @param {HTMLElement} buttonElement
     * @param {string} productId
     */
    window.handleBoseDirectAddToCart = function(buttonElement, productId) {
        if (!window.BoseStoreData || !buttonElement) return;
        const product = window.BoseStoreData.products ? window.BoseStoreData.products.find((/** @type {any} */ p) => p.id === productId || p.slug === productId) : null;
        if (!product) return;

        // 🛡️ [إصلاح حرج - السلة كانت بتضيف التورت/البوكيه المخصص مباشرة من غير محاكي]:
        // createProductCardHTML وحدها كانت بتتأكد إن المنتج "رئيسي مرتبط بمحاكي"
        // (isBuilderMaster) قبل ما تعرض زرار "اضافة للسلة" أصلاً - أي استدعاء تاني
        // لهذه الدالة من مكان مختلف (مثلاً كارت "منتجات مقترحة" داخل صفحة السلة أو
        // صفحة منتج) كان بيعدي من غير أي فحص، فيضيف تورتة/بوكيه بسعر ووصف افتراضي
        // فارغين تماماً بدون ما العميل يختار الطعم/الشكل/عدد الأفراد من المحاكي.
        // الفحص دلوقتي بقى موجود جوه الدالة نفسها (مش بس جوه الكارت) عشان
        // مفيش أي طريقة تانية تقدر تتحايل عليه مهما كان مصدر الاستدعاء.
        const isBuilderMasterProduct = !!product.customBuilderUrl && product.builderType && product.builderType !== 'standard';
        if (isBuilderMasterProduct) {
            window.location.href = product.customBuilderUrl;
            return;
        }

        // 🛡️ [V14.0]: حارس أخير يمنع إضافة منتج نفدت كميته للسلة حتى لو حصل أي
        // استدعاء مباشر للدالة دي متجاوز لواجهة الزرار المعطّل في createProductCardHTML.
        if (product.isAvailable === false) {
            if (typeof window.showBoseGlobalToast === 'function') {
                window.showBoseGlobalToast('عذراً، هذا الصنف نفدت كميته حالياً.');
            }
            return;
        }

        const cardContainer = buttonElement.closest('.product-card-unified');
        let qty = 1;
        if (cardContainer) {
            /** @type {HTMLInputElement|null} */
            const qtyInput = cardContainer.querySelector('.input-qty-value');
            if (qtyInput) qty = parseInt(qtyInput.value, 10) || 1;
        }

        // 👑 [إصلاح جذري - كارثة الأحجام]: نقرأ الحجم اللي العميل اختاره فعلياً من
        // تبويب الحجم المصغر جوه الكارت (لو المنتج بيدعم أكتر من حجم) بدل ما نضيفه
        // دايماً بأرخص حجم افتراضي زي ما كان بيحصل قبل كده في أي كارت خارج صفحة الفئة.
        const selectedSize = cardContainer ? (cardContainer.dataset.selectedSize || null) : null;
        const addOpts = selectedSize ? { size: selectedSize } : {};

        const rawCart = localStorage.getItem('bose_cart');
        let cart = rawCart ? JSON.parse(rawCart) : [];
        const cartLineId = selectedSize ? `${product.slug}-${selectedSize}` : product.slug;
        const existingItem = cart.find((/** @type {any} */ item) => item.id === cartLineId);
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            const newItem = window.createCartItem(product, addOpts, qty);
            if (newItem) { newItem.id = cartLineId; cart.push(newItem); }
        }

        localStorage.setItem('bose_cart', JSON.stringify(cart));
        window.updateGlobalCartCounter();

        if (cardContainer) {
            /** @type {HTMLInputElement|null} */ const qtyInput = cardContainer.querySelector('.input-qty-value');
            const priceDisplay = cardContainer.querySelector('.product-card-price');
            const finalUnitPrice = window.calculateProductFinalPrice(product, addOpts);
            if (qtyInput) qtyInput.value = "1";
            if (priceDisplay) {
                const priceSpan = priceDisplay.querySelector('span');
                if (priceSpan) priceSpan.textContent = `${Math.round(finalUnitPrice)} جنيه`;
                else priceDisplay.textContent = `${Math.round(finalUnitPrice)} جنيه`;
            }
        }

        const originalHtml = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
        /** @type {HTMLButtonElement} */ (buttonElement).disabled = true;

        window.showBoseGlobalToast('ضفنا المنتج للسلة.');

        setTimeout(() => {
            buttonElement.innerHTML = originalHtml;
            /** @type {HTMLButtonElement} */ (buttonElement).disabled = false;
        }, 2500);
    };

    function injectEarlyDependencies() {
        if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
            const p1 = document.createElement('link'); p1.rel = 'preconnect'; p1.href = 'https://fonts.googleapis.com';
            const p2 = document.createElement('link'); p2.rel = 'preconnect'; p2.href = 'https://fonts.gstatic.com'; p2.crossOrigin = 'anonymous';
            const font = document.createElement('link'); font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
            document.head.append(p1, p2, font);
        }
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link'); fa.rel = 'stylesheet'; fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(fa);
        }
        // 🛡️ [إصلاح - المرحلة 3]: manifest.json كان موجود كملف بس مش متربط بأي صفحة،
        // فكانت ميزة "تثبيت الموقع كتطبيق" (PWA) معطّلة فعلياً بدون أي فايدة من وجود
        // الملف. الحقن هنا مركزي في المحرك الرئيسي بدل تكرار الوسم يدوياً في كل صفحة.
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link'); manifest.rel = 'manifest'; manifest.href = '/manifest.json';
            document.head.appendChild(manifest);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
            const theme = document.createElement('meta'); theme.name = 'theme-color'; theme.content = '#FF91A4';
            document.head.appendChild(theme);
        }
    }

    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        if (data.seo && data.seo.title && document.title !== data.seo.title) {
            document.title = data.seo.title;
        }
        injectBoseStructuredData(data);
    }

    /**
     * 🔍👑 [SEO/GEO - بيانات مهيكلة Schema.org]: بيانات JSON-LD موحّدة (منظمة +
     * نشاط تجاري محلي + موقع إلكتروني) بتتحقن في كل صفحة من هنا مركزياً، بقيم حية
     * جايه فعلياً من إعدادات المتجر في قاعدة البيانات (اسم المتجر، اللوجو، الهاتف،
     * روابط السوشيال ميديا، عنوان الاستلام) - مش بيانات ثابتة مكتوبة يدوياً هتفضل
     * قديمة أول ما حد يغيّر حاجة من لوحة التحكم.
     *
     * ليه ده مهم:
     * 1) هو الطريقة الرسمية اللي جوجل بيعتمد عليها عشان يعرض لوجو البراند بجانب
     *    اسم الموقع في نتائج البحث (Organization.logo) بدل الأيقونة الافتراضية.
     * 2) بيدي محركات البحث والذكاء الاصطناعي (ChatGPT/Perplexity/Google AI Overviews)
     *    فهم واضح ومباشر لهوية النشاط التجاري (اسمه، نوعه Bakery، رقم تواصله،
     *    حساباته الرسمية) بدل ما يحاولوا "يخمّنوا" ده من النص العادي - ده جوهر
     *    الـ GEO (Generative Engine Optimization).
     * 3) WebSite schema بيفتح الباب لظهور مربع بحث مباشر (Sitelinks Search Box)
     *    جوه نتيجة جوجل نفسها.
     */
    function injectBoseStructuredData(data) {
        try {
            const store = data.store || {};
            const social = data.social || {};
            const seo = data.seo || {};
            const pageUrl = window.location.origin + window.location.pathname;
            const logoUrl = store.logo || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
            const storeName = store.name || "حلويات بوسي";

            const sameAs = [social.facebook, social.instagram, social.tiktok].filter(Boolean);

            const graph = [
                {
                    "@type": ["Organization", "Bakery"],
                    "@id": window.location.origin + "/#organization",
                    "name": storeName,
                    "url": window.location.origin + "/",
                    "logo": logoUrl,
                    "image": logoUrl,
                    "description": seo.description || store.slogan || "",
                    ...(store.phone ? { "telephone": store.phone } : {}),
                    ...(sameAs.length ? { "sameAs": sameAs } : {}),
                    ...(store.pickup && store.pickup.address ? {
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": store.pickup.address,
                            "addressCountry": "EG"
                        }
                    } : {})
                },
                {
                    "@type": "WebSite",
                    "@id": window.location.origin + "/#website",
                    "url": window.location.origin + "/",
                    "name": storeName,
                    "publisher": { "@id": window.location.origin + "/#organization" },
                    "inLanguage": "ar"
                }
            ];

            const jsonLd = { "@context": "https://schema.org", "@graph": graph };

            let script = document.getElementById("bose-structured-data");
            if (!script) {
                script = document.createElement("script");
                script.type = "application/ld+json";
                script.id = "bose-structured-data";
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(jsonLd);
        } catch (e) {
            // فشل حقن البيانات المهيكلة مش لازم يكسر الموقع - نتجاهله بأمان
        }
    }

    /**
     * 👑👑 [مرحلة جديدة - تحميل التطبيق]: نافذة ترحيبية بهوية حلويات بوسي بالكامل
     * (وردي/أبيض/ذهبي، خط Cairo) بتظهر للعميل بعد ثواني من دخوله الموقع لأول مرة،
     * بتستخدم شخصية الشيف بتاعة اللوجو (مش أي ماسكوت جاهز)، وبتدعو العميل يثبّت
     * تطبيق الويب (PWA) بتاعنا على شاشته الرئيسية زي أي تطبيق عادي.
     *
     * ⚠️ [مهم للمطوّر/صاحبة المتجر]: الرابط ده أدناه بس Placeholder مؤقت بيشاور على
     * اللوجو العادي - لازم يترفع ملف "assets/bose-mascot-character.png" (اللي جوه
     * حزمة التسليم دي) على Cloudinary زي باقي الصور، وبعدين نستبدل قيمة الثابت
     * MASCOT_IMAGE_URL تحت برابط الصورة الجديد.
     */
    const BOSE_APP_MASCOT_IMAGE_URL = "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png"; // TODO: استبدلي بالرابط بعد رفع bose-mascot-character.png

    function setupAppInstallPopup() {
        // لو التطبيق شغال بالفعل كـ PWA مثبّت (standalone)، العميل مثبّته أصلاً - متعرضيش عليه يثبّته تاني
        const alreadyInstalled = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        if (alreadyInstalled) return;
        if (localStorage.getItem('bose_app_installed_flag') === 'true') return;

        // 👑 [تعديل بناءً على طلب صاحبة المتجر]: شلنا فكرة "متتكررش قبل 14 يوم" نهائياً.
        // النافذة دلوقتي بتظهر في كل *دخول جديد* للموقع (فتح تبويب/متصفح جديد) طول
        // ما العميل لسه ما ثبّتش التطبيق فعلياً - مفيش أي تأجيل زمني تاني. بنستخدم
        // sessionStorage (مش localStorage) عشان نمنع بس ظهورها المزعج في كل صفحة
        // تانية العميل يدخلها *جوه نفس الجلسة/التبويب الحالي* بعد ما قفلها فعلاً -
        // لكن أي دخول جديد للموقع (تبويب جديد/فتح المتصفح تاني) هيوريها له تاني من الأول.
        if (sessionStorage.getItem('bose_app_popup_dismissed_this_session') === 'true') return;

        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

        const closePopup = () => {
            const popup = document.getElementById('bose-app-install-popup-overlay');
            if (popup) popup.remove();
            sessionStorage.setItem('bose_app_popup_dismissed_this_session', 'true');
        };

        const showPopup = () => {
            // ضمان أخير: لو فتحت صفحة تانية في نفس الجلسة والنافذة ظهرت فعلاً قبل كده، منكررهاش
            if (document.getElementById('bose-app-install-popup-overlay')) return;

            const ctaHtml = isIOS
                ? `<div class="bose-app-install-ios-note">
                        <i class="fa-solid fa-arrow-up-from-bracket"></i>
                        من متصفح Safari: اضغطي زر "المشاركة" تحت، واختاري <strong>"إضافة إلى الشاشة الرئيسية"</strong>
                   </div>`
                : `<button type="button" id="bose-app-install-cta-btn" class="bose-app-install-cta-btn">
                        <i class="fa-solid fa-download"></i> ثبّتي التطبيق الآن
                   </button>`;

            const popupHtml = `
                <div id="bose-app-install-popup-overlay" class="bose-app-install-popup-overlay">
                    <div class="bose-app-install-popup-card" role="dialog" aria-modal="true" aria-label="تثبيت تطبيق حلويات بوسي">
                        <button type="button" class="bose-app-install-close-btn" id="bose-app-install-close-btn" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
                        <img src="${BOSE_APP_MASCOT_IMAGE_URL}" alt="شيف حلويات بوسي" class="bose-app-install-mascot-img" width="180" height="180" loading="lazy" />
                        <h3 class="bose-app-install-title">حمّلي تطبيقنا! 🎀</h3>
                        <p class="bose-app-install-desc">اطلبي حلوياتك المفضلة في ثواني، واستلمي عروضنا الحصرية أول بأول من غير ما تفوتك حاجة</p>
                        ${ctaHtml}
                        <button type="button" class="bose-app-install-secondary-link" id="bose-app-install-later-btn">مش دلوقتي</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', popupHtml);

            const overlay = document.getElementById('bose-app-install-popup-overlay');
            const closeBtn = document.getElementById('bose-app-install-close-btn');
            const laterBtn = document.getElementById('bose-app-install-later-btn');
            const ctaBtn = document.getElementById('bose-app-install-cta-btn');

            if (closeBtn) closeBtn.addEventListener('click', closePopup);
            if (laterBtn) laterBtn.addEventListener('click', closePopup);
            if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
            if (ctaBtn) {
                ctaBtn.addEventListener('click', async () => {
                    await window.triggerBoseAppInstall();
                    closePopup();
                });
            }
        };

        // نستنى شوية ثواني بعد التحميل الكامل عشان النافذة متبانش فجأة لحظة ما العميل
        // لسه بيحمل الصفحة - إحساس أهدى واحترافي أكتر من ظهور فوري صادم
        setTimeout(showPopup, 3500);
    }

    /**
     * 👑 [مرحلة جديدة - البلوك الكبير]: تفعيل زراير App Store / Google Play في
     * البلوك البصري الكبير بالصفحة الرئيسية - نفس الدالة الموحدة المستخدمة في
     * نافذة الترحيب بالظبط.
     */
    function setupAppPromoBlockButtons() {
        const iosBtn = document.getElementById('app-promo-appstore-btn');
        const androidBtn = document.getElementById('app-promo-googleplay-btn');
        if (iosBtn) iosBtn.addEventListener('click', () => window.triggerBoseAppInstall());
        if (androidBtn) androidBtn.addEventListener('click', () => window.triggerBoseAppInstall());
    }

    /**
     * 👑 [محتوى حقيقي - بلوك تحميل التطبيق]: الشاشة 1 (المنتجات) والشاشة 3 (السلة)
     * جوه محاكي الموبايل كانت مجرد صناديق رمادية فاضية (Placeholder بصري بحت من غير
     * أي بيانات حقيقية). الدالة دي بتاخد نفس منتجات "الأكثر مبيعاً" الحقيقية اللي
     * ظاهرة فعلاً في قسم most-selling بالصفحة (من data.homepage.mostSelling) وتحقن
     * صورها الحقيقية وأسمائها وأسعارها جوه الموبايل، عشان المعاينة تبقى انعكاس حقيقي
     * للمنيو الفعلي بدل تصميم تجريدي وهمي.
     */
    function injectAppPromoRealContent() {
        const data = window.BoseStoreData;
        if (!data || !data.products) return;

        const sourceIds = (data.homepage && (data.homepage.mostSelling || data.homepage.newArrivals)) || [];
        const items = sourceIds
            .map((/** @param {string} id */ id) => data.products.find((/** @type {any} */ p) => p.id === id || p.slug === id))
            .filter(Boolean);

        // 🛡️ لو مفيش عناصر متربطة في لوحة التحكم لسه، منسيبش الصناديق فاضية بلا داعي - نرجع لأول منتجات حقيقية موجودة في القاعدة
        const products = (items.length ? items : data.products).slice(0, 4);
        if (!products.length) return;

        const gridEl = document.getElementById('app-promo-product-grid');
        if (gridEl) {
            gridEl.innerHTML = products.slice(0, 4).map((/** @type {any} */ p) => {
                const img = window.optimizeBoseImageUrl((p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 200);
                const title = window.escapeBoseHTML(p.title || '');
                return `<div class="mock-product-card"><img src="${img}" alt="${title}" loading="lazy" /><span class="mock-product-name">${title}</span></div>`;
            }).join('');
        }

        const cartRowsEl = document.getElementById('app-promo-cart-rows');
        if (cartRowsEl) {
            cartRowsEl.innerHTML = products.slice(0, 2).map((/** @type {any} */ p) => {
                const img = window.optimizeBoseImageUrl((p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 100);
                const title = window.escapeBoseHTML(p.title || '');
                const price = Math.round(p.basePrice || p.price || 0);
                return `
                    <div class="mock-cart-row">
                        <div class="mock-cart-thumb"><img src="${img}" alt="${title}" loading="lazy" /></div>
                        <div class="mock-cart-lines">
                            <span class="mock-cart-name">${title}</span>
                            <span class="mock-cart-price">${price} جنيه</span>
                        </div>
                    </div>`;
            }).join('');
        }
    }

    function buildAndInjectGlobalComponents() {
        const data = window.BoseStoreData;
        if (!data) return;

        const headerInjector = document.getElementById('bose-header-injector');
        if (headerInjector) {
            const marqueeMessages = data.navigation?.topBarMessages || ["صنعناها بحب لتهديها لمن تحب", "توصيل طازج يومياً لجميع المناطق"];
            let marqueeItemsHtml = '';
            // 🛡️ [تحصين إضافي - دفاع في العمق]: رسائل الشريط المتحرك بتيجي من لوحة
            // التحكم (store_settings.navigation) وبتتحقن هنا لكل زائر في كل صفحة بالموقع
            // من غير أي تعقيم. نفس مبدأ التحصين المطبّق فعلاً على باقي الحقول الإدارية
            // في الموقع (زي عنوان الفرع في cart-engine.js) بيتطبق هنا كمان - حتى لو
            // الحساب الإداري موثوق حالياً، أي اختراق مستقبلي لحساب الأدمن أو أي ثغرة
            // تانية في لوحة التحكم مبتتحولش لسكريبت شغال على جهاز كل زائر للموقع.
            marqueeMessages.forEach((/** @type {string} */ msg) => { marqueeItemsHtml += `<span class="bose-marquee-item">${window.escapeBoseHTML(msg)}</span>`; });

            // ⚙️ [تحكم في سرعة الشريط العلوي وتشغيله/إيقافه من لوحة التحكم]:
            // بيتقرا من navigation.topBarSpeedSeconds و navigation.topBarEnabled.
            const topBarSpeed = Number(data.navigation?.topBarSpeedSeconds) > 0 ? Number(data.navigation.topBarSpeedSeconds) : 44;
            const topBarEnabled = data.navigation?.topBarEnabled !== false;
            const topBarTrackStyle = `animation-duration:${topBarSpeed}s !important; animation-play-state:${topBarEnabled ? 'running' : 'paused'} !important;`;

            headerInjector.innerHTML = `
                <div id="top-bar-marquee" class="bose-top-bar-marquee-container" aria-label="شريط الإعلانات التسويقية">
                    <div class="bose-top-bar-marquee-track" style="${topBarTrackStyle}">
                        ${marqueeItemsHtml} ${marqueeItemsHtml}
                    </div>
                </div>

                <header class="bose-sticky-header">
                    <div class="header-right-side">
                        <button id="mobile-menu-toggle" class="bose-nav-btn" aria-label="فتح القائمة الجانبية">
                            <i class="fa-solid fa-bars-staggered"></i>
                        </button>
                        <a href="index.html" class="brand-logo-container">
                            <img id="bose-store-logo" src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="لوجو حلويات بوسي الفاخرة" class="brand-logo-img" width="80" height="80" />
                            <span class="brand-name-display">حلويات بوسي</span>
                        </a>
                    </div>
                    <div class="header-left-side">
                        <button id="nav-search-btn" class="bose-nav-btn" aria-label="البحث عن صنف أو نكهة">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                        <a href="cart.html" class="nav-cart-icon-wrapper" aria-label="عرض سلة المشتريات">
                            <i class="fa-solid fa-bag-shopping bose-nav-btn" style="padding:0;"></i>
                            <span id="nav-cart-count" class="nav-cart-count-badge">0</span>
                        </a>
                    </div>
                </header>

                <div id="bose-sidebar-drawer" class="bose-sidebar-drawer" aria-hidden="true">
                    <div class="sidebar-header">
                        <div class="sidebar-logo-container">
                            <img src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="لوجو حلويات بوسي" class="sidebar-logo" width="80" height="80" />
                            <span class="sidebar-brand-name">حلويات بوسي</span>
                        </div>
                        <button id="sidebar-close-btn" class="sidebar-close-btn" aria-label="إغلاق القائمة">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="sidebar-scrollable-content">
                        <div class="sidebar-menu-wrapper">
                            <button type="button" id="sidebar-categories-toggle" class="sidebar-section-title sidebar-expand-toggle" aria-expanded="false">
                                تسوّقي حسب الفئة
                                <i class="fa-solid fa-chevron-down toggle-chevron"></i>
                            </button>
                            <ul class="sidebar-links-list sidebar-categories-collapse" id="sidebar-categories-list" style="display:none;">
                                <li class="sidebar-link-item"><a href="cake-builder.html"><span class="link-main-side"><i class="fa-solid fa-birthday-cake main-icon"></i>التورت الفاخرة</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-gatowat"><span class="link-main-side"><i class="fa-solid fa-cheese main-icon"></i>الجاتوهات الملكية</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-qashtota"><span class="link-main-side"><i class="fa-solid fa-stroopwafel main-icon"></i>القشطوطة الغنية</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-despacito"><span class="link-main-side"><i class="fa-solid fa-box main-icon"></i>الديسباسيتو الفاخر</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-cinabon"><span class="link-main-side"><i class="fa-solid fa-cookie main-icon"></i>السينابون الطازج</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-donuts"><span class="link-main-side"><i class="fa-solid fa-ring main-icon"></i>الدوناتس الهشة</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-red-velvet"><span class="link-main-side"><i class="fa-solid fa-heart main-icon"></i>الريدڤيلڤت</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-cupcake"><span class="link-main-side"><i class="fa-solid fa-cookie-bite main-icon"></i>الكب كيك</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-mini-cake"><span class="link-main-side"><i class="fa-solid fa-cubes main-icon"></i>الميني تورت</span></a></li>
                                <li class="sidebar-link-item"><a href="flower-builder.html"><span class="link-main-side"><i class="fa-solid fa-spa main-icon"></i>بوكيهات الورد</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-happiness-cups"><span class="link-main-side"><i class="fa-solid fa-ice-cream main-icon"></i>كبات السعادة</span></a></li>
                                <li class="sidebar-link-item"><a href="category.html?category=taswaq-relax-box"><span class="link-main-side"><i class="fa-solid fa-gift main-icon"></i>بوكس الروقان</span></a></li>
                            </ul>
                        </div>

                        <div class="sidebar-menu-wrapper" style="margin-top: 25px;">
                            <div class="sidebar-section-title">التصفح الفاخر</div>
                            <ul class="sidebar-links-list">
                                <li class="sidebar-link-item">
                                    <a href="index.html">
                                        <span class="link-main-side"><i class="fa-solid fa-house main-icon"></i>الرئيسية</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="menu.html">
                                        <span class="link-main-side"><i class="fa-solid fa-utensils main-icon"></i>المنيو الشامل</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="offers.html">
                                        <span class="link-main-side"><i class="fa-solid fa-tags main-icon"></i>العروض والخصومات</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="cake-builder.html">
                                        <span class="link-main-side"><i class="fa-solid fa-cake-candles main-icon"></i>محاكي التورت التفاعلي</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="flower-builder.html">
                                        <span class="link-main-side"><i class="fa-solid fa-seedling main-icon"></i>محاكي الورد الخاص</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="cart.html">
                                        <span class="link-main-side"><i class="fa-solid fa-basket-shopping main-icon"></i>سلة التسوق</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="track-order.html">
                                        <span class="link-main-side"><i class="fa-solid fa-location-crosshairs main-icon"></i>تتبعي طلبك</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="rewards.html">
                                        <span class="link-main-side"><i class="fa-solid fa-gift main-icon"></i>مكافآتك</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div class="sidebar-menu-wrapper" style="margin-top: 25px;">
                            <div class="sidebar-section-title">روابط المعرفة</div>
                            <ul class="sidebar-links-list">
                                <li class="sidebar-link-item">
                                    <a href="about.html">
                                        <span class="link-main-side"><i class="fa-solid fa-heart-pulse main-icon"></i>مَنْ نحن</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="contact.html">
                                        <span class="link-main-side"><i class="fa-solid fa-phone-flip main-icon"></i>تواصل معنا</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="policies/shipping-policy.html">
                                        <span class="link-main-side"><i class="fa-solid fa-truck main-icon"></i>سياسة الشحن والتوصيل</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="policies/refund-policy.html">
                                        <span class="link-main-side"><i class="fa-solid fa-rotate-left main-icon"></i>سياسة الاسترجاع</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="policies/privacy-policy.html">
                                        <span class="link-main-side"><i class="fa-solid fa-shield-halved main-icon"></i>سياسة الخصوصية</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                                <li class="sidebar-link-item">
                                    <a href="policies/terms.html">
                                        <span class="link-main-side"><i class="fa-solid fa-file-contract main-icon"></i>الشروط والأحكام</span>
                                        <i class="fa-solid fa-chevron-left arrow-icon"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="sidebar-footer-contacts">
                        <a href="https://wa.me/${window.toInternationalWhatsappNumber(data.social?.whatsapp || '201097238441')}" target="_blank" rel="noopener noreferrer" class="sidebar-contact-pill">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>راسلنا فوري عبر الواتساب</span>
                        </a>
                        <a href="tel:${data.store?.phone || '01097238441'}" class="sidebar-contact-pill">
                            <i class="fa-solid fa-phone"></i>
                            <span>اتصال هاتفي مباشر</span>
                        </a>
                    </div>
                </div>
                <div id="bose-sidebar-overlay" class="bose-sidebar-overlay"></div>

                <div id="bose-search-modal" class="bose-search-modal" aria-hidden="true">
                    <div class="search-modal-header">
                        <button id="search-modal-close" class="bose-nav-btn" style="font-size: 26px;" aria-label="إغلاق البحث">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="search-input-wrapper">
                        <input type="text" id="bose-search-field" class="bose-search-field" placeholder="ابحث عن النكهة أو الصنف (لوتس، بيستاشيو...)" aria-label="حقل البحث" autocomplete="off" />
                        <i class="fa-solid fa-magnifying-glass search-field-icon"></i>
                    </div>
                    <div id="search-results-container" class="search-results-container"></div>
                </div>
            `;
            setupHeaderAndSidebarEvents();
        }

        // 🔧 [إصلاح جذري]: الشريط السفلي الثابت كان Hardcoded جوه index.html بس، فكان بيختفي
        // تماماً في أي صفحة تانية (منتج، فئة، سلة، دفع...). دلوقتي بيتحقن تلقائياً في كل صفحة
        // محملة core-engine.js، وزرار "العروض" بقى بيوجه لصفحة العروض المستقلة الحقيقية
        // offers.html بدل ما يعمل Scroll جوه الرئيسية بس (اللي أصلاً معندهاش تأثير في أي صفحة تانية).
        if (!document.querySelector('.bose-bottom-nav-bar')) {
            const currentPage = (window.location.pathname.split('/').pop() || 'index.html');
            const isHome = currentPage === '' || currentPage === 'index.html';
            const isOffers = currentPage === 'offers.html';
            const isCart = currentPage === 'cart.html';

            const bottomNav = document.createElement('nav');
            bottomNav.className = 'bose-bottom-nav bose-bottom-nav-bar';
            bottomNav.setAttribute('aria-label', 'التنقل السفلي السريع');
            bottomNav.innerHTML = `
                <a href="index.html" class="bottom-nav-item bose-bottom-nav-item${isHome ? ' active' : ''}">
                    <i class="fas fa-home"></i>
                    <span>الرئيسية</span>
                </a>
                <a href="offers.html" class="bottom-nav-item bose-bottom-nav-item${isOffers ? ' active' : ''}">
                    <i class="fas fa-tags"></i>
                    <span>العروض</span>
                </a>
                <a href="https://wa.me/${window.toInternationalWhatsappNumber(data.social?.whatsapp || '201097238441')}" target="_blank" rel="noopener noreferrer" class="bottom-nav-item bose-bottom-nav-item whatsapp-item">
                    <i class="fab fa-whatsapp"></i>
                    <span>الواتساب</span>
                </a>
                <a href="cart.html" class="bottom-nav-item bose-bottom-nav-item cart-item${isCart ? ' active' : ''}">
                    <div class="nav-cart-icon-wrap">
                        <i class="fas fa-shopping-bag"></i>
                        <span class="nav-cart-badge bose-bottom-nav-badge">0</span>
                    </div>
                    <span>السلة</span>
                </a>
            `;
            document.body.appendChild(bottomNav);
        }

        // 🛒 [سلة عائمة ثابتة]: فقاعة سلة عائمة فوق التبويب السفلي، ثابتة في مكانها طول
        // ما العميل بيتصفح الموقع، وقريبة من إبهامه عشان توصله بسهولة من غير ما يدور
        // عليها. طول ما السلة فاضية بتعمل وميض/نبض هادي يلفت نظر العميل ويشجعه إنه
        // يضيف منتجات. أول ما يبقى فيها صنف، الوميض بيقف ويظهر بس عداد العدد بوضوح.
        // مبنية على نفس ستايل الكارت (بمبي/أبيض) وبتتحدث لحظياً زي أي عداد سلة تاني
        // بالموقع لأنها بتستخدم نفس كلاس nav-cart-badge اللي updateGlobalCartCounter شغالة عليه.
        if (!document.querySelector('.bose-floating-cart-btn')) {
            const currentPageForFab = (window.location.pathname.split('/').pop() || 'index.html');
            if (currentPageForFab !== 'cart.html' && currentPageForFab !== 'checkout.html') {
                const floatingCartBtn = document.createElement('a');
                floatingCartBtn.href = 'cart.html';
                floatingCartBtn.className = 'bose-floating-cart-btn is-empty';
                floatingCartBtn.id = 'bose-floating-cart-btn';
                floatingCartBtn.setAttribute('aria-label', 'سلة المشتريات - اضغطي هنا لمراجعة السلة وإتمام الطلب');
                floatingCartBtn.innerHTML = `
                    <span class="bose-floating-cart-pulse"></span>
                    <i class="fa-solid fa-basket-shopping"></i>
                    <span id="floating-cart-count" class="nav-cart-badge bose-floating-cart-badge">0</span>
                `;
                document.body.appendChild(floatingCartBtn);
            }
        }

        const footerInjector = document.getElementById('bose-footer-injector');
        if (footerInjector) {
            footerInjector.innerHTML = `
                <footer class="bose-footer" role="contentinfo">
                    <div class="footer-grid-layout">
                        <div class="footer-column-block">
                            <div class="footer-brand-meta">
                                <img src="${window.optimizeBoseImageUrl(data.store?.logo || 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 150)}" alt="حلويات بوسي الفاخرة" class="footer-logo" width="80" height="80" />
                                <span class="footer-title">حلويات بوسي</span>
                            </div>
                            <p id="footer-about-text" class="footer-about-paragraph">${window.escapeBoseHTML(data.footer?.about || 'صنعناها بحب لتهديها لمن تحب')}</p>
                            <div id="footer-social-links" class="footer-social-wrapper">
                                <a href="${data.social?.facebook || '#'}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-facebook-f"></i></a>
                                <a href="${data.social?.instagram || '#'}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-instagram"></i></a>
                                <a href="${data.social?.tiktok || '#'}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-tiktok"></i></a>
                                <a href="https://wa.me/${window.toInternationalWhatsappNumber(data.social?.whatsapp || '201097238441')}" target="_blank" rel="noopener noreferrer" class="footer-social-icon-btn"><i class="fa-brands fa-whatsapp"></i></a>
                            </div>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">روابط سريعة</h3>
                            <ul class="footer-links-ul">
                                <li><a href="index.html">الرئيسية</a></li>
                                <li><a href="menu.html">المنيو الشامل</a></li>
                                <li><a href="cake-builder.html">محاكي التورت</a></li>
                                <li><a href="flower-builder.html">محاكي الورد</a></li>
                                <li><a href="cart.html">سلة التسوق</a></li>
                            </ul>
                        </div>
                        <div class="footer-column-block">
                            <h3 class="footer-heading-title">وثائق وسياسات</h3>
                            <ul class="footer-links-ul">
                                <li><a href="policies/privacy-policy.html">سياسة الخصوصية</a></li>
                                <li><a href="policies/refund-policy.html">سياسة الاسترجاع المالي</a></li>
                                <li><a href="policies/shipping-policy.html">سياسة الشحن والتوصيل</a></li>
                                <li><a href="policies/terms.html">الشروط والأحكام</a></li>
                                <li class="footer-contact-item" style="margin-top: 15px; display: flex; align-items: center; gap: 8px; font-size: 14px; color: #111111;">
                                    <i class="fa-solid fa-location-dot" style="color: #FF91A4;"></i>
                                    <span>${window.escapeBoseHTML(data.store?.pickup?.address || 'العنوان الرئيسي')}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <p class="footer-copyright-block">جميع الحقوق محفوظة &copy; <span id="footer-year-display">2026</span> لعلامة حلويات بوسي الفاخرة.</p>
                </footer>
            `;
        }
    }

    function setupHeaderAndSidebarEvents() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('sidebar-close-btn');
        const sidebar = document.getElementById('bose-sidebar-drawer');
        const overlay = document.getElementById('bose-sidebar-overlay');
        
        const searchBtn = document.getElementById('nav-search-btn');
        const searchModal = document.getElementById('bose-search-modal');
        const searchClose = document.getElementById('search-modal-close');
        /** @type {HTMLInputElement|null} */ const searchField = document.querySelector('#bose-search-field');
        const resultsContainer = document.getElementById('search-results-container');

        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                overlay.classList.add('show');
                document.body.classList.add('drawer-active');
            });
        }
        
        const closeSidebar = () => {
            if (sidebar && overlay) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                document.body.classList.remove('drawer-active');
            }
        };

        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay) overlay.addEventListener('click', closeSidebar);

        const categoriesToggle = document.getElementById('sidebar-categories-toggle');
        const categoriesList = document.getElementById('sidebar-categories-list');
        if (categoriesToggle && categoriesList) {
            categoriesToggle.addEventListener('click', () => {
                const isOpen = categoriesList.style.display === 'block';
                categoriesList.style.display = isOpen ? 'none' : 'block';
                categoriesToggle.setAttribute('aria-expanded', String(!isOpen));
                categoriesToggle.classList.toggle('expanded', !isOpen);
            });
        }

        if (searchBtn && searchModal) {
            searchBtn.addEventListener('click', () => {
                searchModal.classList.add('active');
                setTimeout(() => searchField?.focus(), 200);
            });
        }

        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchModal.classList.remove('active');
            });
        }

        if (searchField && resultsContainer) {
            let searchDebounceTimer = null;
            searchField.addEventListener('input', (e) => {
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                const target = /** @type {HTMLInputElement} */ (e.target);
                const rawQuery = target.value;
                searchDebounceTimer = setTimeout(() => {
                    const query = rawQuery.trim().toLowerCase();
                    if (!query) { resultsContainer.innerHTML = ''; return; }

                    const allProducts = window.BoseStoreData?.products || [];
                    const filtered = allProducts.filter((/** @type {any} */ p) => p.title?.toLowerCase().includes(query) || p.flavorName?.toLowerCase().includes(query));

                    let html = '';
                    filtered.forEach((/** @type {any} */ p) => {
                        let targetUrl = (p.id === 'toort-custom-master' || p.slug === 'toort-custom-master') ? 'cake-builder.html' : 
                                        ((p.id === 'flowers-master' || p.slug === 'flowers-master') ? 'flower-builder.html' : `product.html?slug=${encodeURIComponent(p.slug)}`);
                        const safeImg = window.optimizeBoseImageUrl((p.images && p.images.length > 0 && p.images[0]) ? p.images[0] : 'https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png', 120);
                        const safeTitle = window.escapeBoseHTML(p.title);
                        const safeFlavor = window.escapeBoseHTML(p.flavorName || '');
                        html += `
                            <a href="${targetUrl}" class="search-result-card-item">
                                <img src="${safeImg}" class="search-result-img" width="60" height="60" loading="lazy" alt="${safeTitle}" />
                                <div class="search-result-info">
                                    <div class="search-result-name">${safeTitle}</div>
                                    ${safeFlavor ? `<div class="search-result-flavor">${safeFlavor}</div>` : ''}
                                </div>
                                <div class="search-result-price-view">${Math.round(p.price)} جنيه</div>
                            </a>
                        `;
                    });
                    resultsContainer.innerHTML = html || '<div class="search-no-results-msg">لم نجد أصنافاً تطابق بحثك.</div>';
                }, 200);
            });
        }
    }

    function showGlobalFriendlyError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bose-global-toast-error';
        errorDiv.textContent = 'عذراً، نواجه صعوبة في الاتصال بالخادم حالياً. يرجى إعادة محاولة تحميل الصفحة.';
        document.body.appendChild(errorDiv);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStoreDatabase);
    } else {
        loadStoreDatabase();
    }
})();
