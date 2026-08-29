/**
 * 🎯 [جولة تفاعلية حية - "إزاي أطلب؟"] 🎯
 * ------------------------------------------------------------------
 * بديل/إضافة لقسم "أول مرة تطلبي أونلاين؟" النصي: بدل ما العميلة تقرا
 * خطوة في مكان وتحاول تفتكرها وهي بتنفذ في مكان تاني، الجولة دي بتضيء
 * (spotlight) العنصر الحقيقي اللي محتاجة تدوس عليه على نفس الصفحة اللي
 * هي فيها فعلاً، بشرح مختصر جنبه، وبتتقدم للخطوة الجاية أول ما تدوس
 * عليه فعلياً - يعني بتتعلم وهي بتنفذ، مش بتتفرج وبعدين تحاول تفتكر.
 *
 * ليه اتعملت كده (سياق الشكوى الأصلية): عميلات كتير بيقولوا "مش عارفة
 * أطلب / صعب عليا / مش عارفة أدخل السلة" رغم إن زرار السلة ظاهر فوق في
 * كل صفحة - المشكلة مش نقص شرح، المشكلة إن الشرح (لو موجود) في مكان
 * منفصل عن التنفيذ الفعلي. الحل هنا: نوري لها العنصر الحقيقي بالظبط
 * لحظة ما تحتاجه، مش شرح عام قبلها بوقت.
 *
 * الحالة (active/stepIndex) محفوظة في localStorage عشان الجولة تكمل
 * صح لما العميلة تتنقل بين الصفحات (منيو → فئة → منتج → سلة → إتمام
 * الطلب) - كل صفحة فيها الملف ده بتكمل من حيث ما وقفت الجولة تلقائياً.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'bose_guided_tour_state_v1';

    // 🗺️ خطوات الجولة بالترتيب - كل خطوة = عنصر حقيقي واحد على صفحة حقيقية.
    // "page": الملفات اللي الخطوة دي لازم تظهر فيها بس. "anyPage": تظهر في
    // أي صفحة (مستخدمة بس لخطوة "دي سلتك!" لأن أيقونة السلة موجودة في
    // الهيدر بكل صفحة، ومش محتاجة تنقل صفحة عشان تظهر).
    const TOUR_STEPS = [
        {
            page: ['menu.html'],
            selector: '.bose-menu-custom-card',
            title: 'اختاري فئة',
            text: 'دوسي على أي فئة تعجبك زي دي، وهنوريكي كل الأصناف اللي جواها.'
        },
        {
            page: ['category.html'],
            selector: '.product-card',
            title: 'اختاري الصنف',
            text: 'دوسي على أي منتج زي ده عشان تشوفي تفاصيله وسعره بالكامل.'
        },
        {
            page: ['product.html'],
            selector: '#btn-add-to-cart-master-trigger',
            title: 'ضيفيه لسلتك',
            text: 'بعد ما تحددي اللي يناسبك، دوسي هنا عشان تضيفي المنتج ده لسلتك.'
        },
        {
            anyPage: true,
            delayBeforeShow: 550,
            selector: '.nav-cart-icon-wrapper[href="/cart.html"]',
            title: 'دي سلتك! 🎉',
            text: 'شوفي، بقى فيها رقم دلوقتي. سلتك هتلاقيها هنا دايمًا فوق في أي صفحة بالموقع. دوسي عليها.'
        },
        {
            page: ['cart.html'],
            selector: '#btn-proceed-to-checkout',
            title: 'كمّلي طلبك',
            text: 'راجعي طلبك، وبعدين دوسي هنا عشان تكتبي بياناتك وتحددي التوصيل أو الاستلام.'
        },
        {
            page: ['checkout.html'],
            selector: '#btn-submit-order-final',
            title: 'اطلبي دلوقتي',
            text: 'املي اسمك ورقم موبايلك، اختاري توصيل أو استلام، وبعدين دوسي الزرار ده - وطلبك هيوصلنا فورًا.'
        }
    ];

    function getState() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch (e) { return null; }
    }
    function setState(s) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* localStorage غير متاح، الجولة هتشتغل للصفحة الحالية بس */ }
    }
    function clearState() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* لا شيء */ }
    }

    function currentPageFile() {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 1] || 'index.html';
    }

    let activeOverlayEls = null;
    let activeClickHandler = null;
    let waitTimer = null;

    function removeOverlay() {
        if (activeOverlayEls) { activeOverlayEls.forEach(el => el.remove()); activeOverlayEls = null; }
        if (activeClickHandler) { document.removeEventListener('click', activeClickHandler, true); activeClickHandler = null; }
        if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'bose-tour-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('bose-tour-toast-show'));
        setTimeout(() => { t.classList.remove('bose-tour-toast-show'); setTimeout(() => t.remove(), 400); }, 3400);
    }

    function endTour(celebrate) {
        removeOverlay();
        clearState();
        if (celebrate) showToast('تمام! 🎉 كده بقيتي عارفة تطلبي من عندنا بكل سهولة.');
    }

    function injectStylesOnce() {
        if (document.getElementById('bose-tour-styles')) return;
        const style = document.createElement('style');
        style.id = 'bose-tour-styles';
        style.textContent = `
            .bose-tour-highlight-box{position:fixed;z-index:99998;pointer-events:none;border-radius:14px;box-shadow:0 0 0 9999px rgba(17,17,17,.62);border:3px solid #FF91A4;transition:top .3s ease,left .3s ease,width .3s ease,height .3s ease;}
            .bose-tour-tooltip{position:fixed;z-index:99999;background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 8px 30px rgba(0,0,0,.25);max-width:290px;font-family:'Cairo',sans-serif;direction:rtl;text-align:right;animation:boseTourPop .25s ease;}
            @keyframes boseTourPop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
            .bose-tour-progress{font-size:.72rem;color:#FF91A4;font-weight:700;margin-bottom:4px;}
            .bose-tour-tooltip-title{font-weight:800;font-size:1rem;color:#111;margin-bottom:6px;}
            .bose-tour-tooltip-text{font-size:.88rem;color:#333;line-height:1.6;margin:0 0 10px 0;}
            .bose-tour-tap-hint{display:flex;align-items:center;gap:5px;font-size:.78rem;color:#FF91A4;font-weight:700;margin-bottom:12px;}
            .bose-tour-skip-btn{background:none;border:none;color:#999;font-size:.78rem;cursor:pointer;text-decoration:underline;padding:0;font-family:'Cairo',sans-serif;}
            .bose-tour-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#111;color:#fff;padding:14px 22px;border-radius:14px;font-family:'Cairo',sans-serif;font-size:.9rem;z-index:100000;opacity:0;transition:opacity .3s ease,transform .3s ease;max-width:88vw;text-align:center;}
            .bose-tour-toast-show{opacity:1;transform:translateX(-50%) translateY(0);}
            @media (max-width:480px){.bose-tour-tooltip{max-width:85vw;}}
        `;
        document.head.appendChild(style);
    }

    function waitForElement(selector, cb, timeoutMs) {
        const start = Date.now();
        (function tick() {
            const el = document.querySelector(selector);
            if (el) { cb(el); return; }
            if (Date.now() - start > (timeoutMs || 12000)) return; // العنصر مش هيظهر (الصفحة اتغيرت مثلاً)، منسيبش مؤقت شغال للأبد
            waitTimer = setTimeout(tick, 250);
        })();
    }

    function positionAndShowStep(stepIndex) {
        removeOverlay();
        const step = TOUR_STEPS[stepIndex];
        if (!step) { endTour(true); return; }
        const proceed = () => waitForElement(step.selector, el => renderSpotlight(el, step, stepIndex));
        if (step.delayBeforeShow) setTimeout(proceed, step.delayBeforeShow); else proceed();
    }

    function renderSpotlight(el, step, stepIndex) {
        injectStylesOnce();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const rect = el.getBoundingClientRect();
            const pad = 8;
            const box = document.createElement('div');
            box.className = 'bose-tour-highlight-box';
            box.style.top = (rect.top - pad) + 'px';
            box.style.left = (rect.left - pad) + 'px';
            box.style.width = (rect.width + pad * 2) + 'px';
            box.style.height = (rect.height + pad * 2) + 'px';
            document.body.appendChild(box);

            const tooltip = document.createElement('div');
            tooltip.className = 'bose-tour-tooltip';
            tooltip.innerHTML = `
                <div class="bose-tour-progress">خطوة ${stepIndex + 1} من ${TOUR_STEPS.length}</div>
                <div class="bose-tour-tooltip-title">${step.title}</div>
                <p class="bose-tour-tooltip-text">${step.text}</p>
                <div class="bose-tour-tap-hint"><i class="fa-solid fa-hand-pointer"></i> دوسي على العنصر المضيء بالإطار الوردي</div>
                <button type="button" class="bose-tour-skip-btn" data-bose-tour-skip="1">إنهاء الجولة</button>
            `;
            document.body.appendChild(tooltip);

            // تموضع الكارت فوق أو تحت العنصر المضاء حسب المساحة المتاحة، وميخرجش برة الشاشة أفقياً
            const tRect = tooltip.getBoundingClientRect();
            let top = rect.bottom + pad + 14;
            if (top + tRect.height > window.innerHeight - 10) top = Math.max(10, rect.top - tRect.height - 14 - pad);
            let left = rect.left + rect.width / 2 - tRect.width / 2;
            left = Math.max(10, Math.min(left, window.innerWidth - tRect.width - 10));
            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';

            activeOverlayEls = [box, tooltip];
            tooltip.querySelector('[data-bose-tour-skip]').addEventListener('click', () => endTour(false));

            // 🛡️ [capture:true]: بيضمن إن الحدث ده يوصلنا الأول قبل أي onclick تاني
            // على نفس العنصر (زي event.stopPropagation() جوه أزرار الموقع)، عشان
            // نضمن نلحق نتقدم للخطوة الجاية حتى لو زرار الموقع بيوقف الانتشار.
            activeClickHandler = function (e) {
                if (e.target.closest('[data-bose-tour-skip]')) return;
                if (!e.target.closest(step.selector)) return;
                const nextIndex = stepIndex + 1;
                removeOverlay();
                if (nextIndex >= TOUR_STEPS.length) { endTour(true); return; }
                setState({ active: true, stepIndex: nextIndex });
                const nextStep = TOUR_STEPS[nextIndex];
                // لو الخطوة الجاية "anyPage" (زي أيقونة السلة) بتظهر فورًا على نفس
                // الصفحة من غير انتظار تنقل - أي خطوة تانية هتظهر لوحدها لما الصفحة
                // الجديدة تحمّل وتستدعي init() تلقائي.
                if (nextStep && nextStep.anyPage) positionAndShowStep(nextIndex);
            };
            document.addEventListener('click', activeClickHandler, true);
        }, 380);
    }

    function startTour() {
        setState({ active: true, stepIndex: 0 });
        const firstPage = TOUR_STEPS[0].page[0];
        if (currentPageFile() === firstPage) init(); else window.location.href = '/' + firstPage;
    }

    function init() {
        const state = getState();
        if (!state || !state.active) return;
        const step = TOUR_STEPS[state.stepIndex];
        if (!step) { clearState(); return; }
        const page = currentPageFile();
        const pageMatches = step.anyPage || (step.page && step.page.indexOf(page) !== -1);
        if (!pageMatches) return; // العميلة يمكن غيّرت الصفحة يدوي بره مسار الجولة - منعرضش حاجة لحد ما توصل الصفحة الصح
        positionAndShowStep(state.stepIndex);
    }

    // أي عنصر عليه data-start-bose-tour="1" (زرار البدء في قسم "إزاي أطلب؟"،
    // تلميح الهيدر، رابط القائمة الجانبية) بيبدأ الجولة بدل سلوكه الافتراضي.
    document.addEventListener('click', function (e) {
        const trigger = e.target.closest('[data-start-bose-tour]');
        if (!trigger) return;
        e.preventDefault();
        startTour();
    }, false);

    window.startBoseGuidedTour = startTour;

    document.addEventListener('DOMContentLoaded', () => { setTimeout(init, 600); });
})();
