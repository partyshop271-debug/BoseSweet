/**
 * 💗 [محرك المفضلة - Favorites Engine]
 * ==========================================================================
 * الموقع مفيهوش نظام تسجيل دخول أو حسابات عملاء (نفس فلسفة السلة تماماً -
 * راجع bose_cart في cart-engine.js)، فالمفضلة هنا بتتخزن محلياً في متصفح
 * كل عميلة على حدة عبر localStorage تحت مفتاح bose_favorites (مصفوفة IDs
 * فقط، مش كائنات منتج كاملة - عشان لو تفاصيل المنتج اتغيرت من لوحة التحكم
 * بعدين، المفضلة تفضل شايفة أحدث نسخة دايماً بدل نسخة قديمة مخزّنة).
 *
 * أي صفحة في الموقع تقدر تستخدم:
 *   - window.getBoseFavorites()          → مصفوفة IDs المنتجات المفضّلة
 *   - window.isBoseFavorite(productId)   → true/false
 *   - window.toggleBoseFavorite(id, btn) → يضيف/يشيل + يحدّث الواجهة والعداد
 *   - window.updateFavoritesBadge()      → يحدّث عداد قلب الهيدر في كل الصفحة
 * ==========================================================================
 */
(function () {
    'use strict';

    const FAV_STORAGE_KEY = 'bose_favorites';
    // 💗🆕 [نمو - مفضلة مرتبطة برقم موبايل]: آخر رقم موبايل حقيقي اتأكد لهذه
    // العميلة (بعد طلب ناجح، أو بحث ناجح في صفحة المكافآت/تتبع الطلب) - بيتسجل
    // هنا عشان أي تغيير لاحق في المفضلة يترفع تلقائي لنفس الرقم من غير ما
    // العميلة تعمل حاجة إضافية.
    const KNOWN_PHONE_KEY = 'bose_known_phone';

    /** @returns {string[]} */
    function getBoseFavorites() {
        try {
            const raw = localStorage.getItem(FAV_STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list.map(String) : [];
        } catch (e) {
            console.warn('⚠️ فشل قراءة المفضلة المحفوظة محلياً.');
            return [];
        }
    }

    /** @param {string[]} list */
    function saveBoseFavorites(list) {
        try {
            localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn('⚠️ فشل حفظ المفضلة محلياً (ممكن مساحة المتصفح ممتلئة).');
        }
    }

    /**
     * @param {string|number} productId
     * @returns {boolean}
     */
    function isBoseFavorite(productId) {
        if (!productId) return false;
        return getBoseFavorites().includes(String(productId));
    }

    function getKnownPhone() {
        try { return localStorage.getItem(KNOWN_PHONE_KEY) || null; } catch (e) { return null; }
    }

    /**
     * 📞 بتتنادى من أي مكان في الموقع اتأكد فيه رقم موبايل حقيقي للعميلة
     * (نجاح طلب، بحث ناجح في المكافآت/تتبع الطلب) - بعد كده أي تغيير في
     * المفضلة هيترفع تلقائي لنفس الرقم ده.
     * @param {string} phone
     */
    function setBoseKnownPhone(phone) {
        if (!phone) return;
        try { localStorage.setItem(KNOWN_PHONE_KEY, String(phone)); } catch (e) {}
    }

    /**
     * ☁️ بترفع نسخة المفضلة المحلية الحالية لنفس رقم الموبايل المعروف (لو
     * موجود) - best-effort بالكامل، مفيش أي انتظار أو رسالة خطأ للعميلة لو
     * فشلت (تحسين خلفي، مش جزء أساسي من رحلة الشراء).
     */
    function syncBoseFavoritesToServer() {
        const phone = getKnownPhone();
        if (!phone) return;
        if (!window.BoseSupabase || typeof window.BoseSupabase.syncCustomerFavorites !== 'function') return;
        window.BoseSupabase.syncCustomerFavorites(phone, getBoseFavorites()).catch(() => {
            // تجاهل عمدي - رفع خلفي اختياري، ما ينفعش يعطّل أي حاجة تانية بالصفحة
        });
    }

    /**
     * 🔄 بتجيب مفضلة العميلة المسجّلة على نفس الرقم من القاعدة، تدمجها مع أي
     * حاجة محلية موجودة بالفعل على الجهاز ده (union - مفيش أي حاجة بتتشال)،
     * تحفظ النسخة المدموجة محليًا، وترفعها تاني عشان القاعدة والمتصفح يفضلوا
     * متطابقين. بتتنادى لما رقم موبايل يتأكد من صفحة المكافآت/تتبع الطلب.
     * @param {string} phone
     */
    async function mergeBoseFavoritesFromServer(phone) {
        if (!phone) return;
        setBoseKnownPhone(phone);
        if (!window.BoseSupabase || typeof window.BoseSupabase.fetchCustomerFavorites !== 'function') return;
        try {
            const remoteList = await window.BoseSupabase.fetchCustomerFavorites(phone);
            const localList = getBoseFavorites();
            const merged = Array.from(new Set([...localList, ...remoteList.map(String)]));
            if (merged.length !== localList.length) {
                saveBoseFavorites(merged);
                updateFavoritesBadge();
            }
            syncBoseFavoritesToServer();
        } catch (e) {
            // تجاهل عمدي - نفس فلسفة رفع المفضلة، تحسين خلفي اختياري
        }
    }

    /**
     * 🔄 بيحدّث كل شارات عداد المفضلة الظاهرة في الصفحة (هيدر سطح المكتب +
     * أي مكان تاني ليه نفس الكلاس مستقبلاً) دفعة واحدة.
     */
    function updateFavoritesBadge() {
        const count = getBoseFavorites().length;
        const badges = document.querySelectorAll('.nav-fav-count-badge');
        badges.forEach((badge) => {
            badge.textContent = String(count);
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    /**
     * 👆 قلب حالة منتج (إضافة/إزالة) من المفضلة، وتحديث كل زرار قلب ليه
     * نفس data-fav-id ظاهر حالياً في الصفحة (المنتج ممكن يكون ظاهر في أكتر
     * من سلايدر/شبكة في نفس الوقت) بدل ما نحتاج نعمل Refresh للصفحة كلها.
     * @param {string|number} productId
     * @param {HTMLElement} [triggerBtn]
     */
    function toggleBoseFavorite(productId, triggerBtn) {
        if (!productId) return;
        const id = String(productId);
        let list = getBoseFavorites();
        const wasFavorite = list.includes(id);

        list = wasFavorite ? list.filter((favId) => favId !== id) : [...list, id];
        saveBoseFavorites(list);
        updateFavoritesBadge();
        // 💗 [نمو]: أي تغيير في المفضلة (إضافة/إزالة) بيترفع فورًا لنفس رقم
        // الموبايل المعروف لو موجود - عشان لوحة التحكم تشوف أحدث اهتمام حقيقي.
        syncBoseFavoritesToServer();

        const nowFavorite = !wasFavorite;
        let matchedButtons = 0;
        document.querySelectorAll('.bose-fav-btn[data-fav-id="' + id.replace(/"/g, '') + '"]').forEach((btn) => {
            matchedButtons++;
            btn.classList.toggle('is-active', nowFavorite);
            btn.setAttribute('aria-label', nowFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-solid', nowFavorite);
                icon.classList.toggle('fa-regular', !nowFavorite);
            }
        });
        // 🛡️ تحصين: لو الزرار اللي اتضغط مش لاقي نفسه ضمن الاستعلام فوق لأي سبب
        // (مثلاً لسه بيتحقن)، نتأكد إنه هو نفسه بيتحدّث يدوياً.
        if (matchedButtons === 0 && triggerBtn) {
            triggerBtn.classList.toggle('is-active', nowFavorite);
            const icon = triggerBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-solid', nowFavorite);
                icon.classList.toggle('fa-regular', !nowFavorite);
            }
        }

        if (typeof window.showBoseGlobalToast === 'function') {
            window.showBoseGlobalToast(nowFavorite ? '💗 تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة');
        }

        // لو إحنا فعلياً في صفحة المفضلة نفسها وشلنا منتج، نعيد رسم الشبكة فوراً
        // بدل ما تفضل الكارت المشالة ظاهرة لحد ما العميلة تعمل Refresh يدوي.
        if (wasFavorite && typeof window.renderBoseFavoritesPage === 'function') {
            window.renderBoseFavoritesPage();
        }
    }

    window.getBoseFavorites = getBoseFavorites;
    window.isBoseFavorite = isBoseFavorite;
    window.toggleBoseFavorite = toggleBoseFavorite;
    window.updateFavoritesBadge = updateFavoritesBadge;
    window.setBoseKnownPhone = setBoseKnownPhone;
    window.syncBoseFavoritesToServer = syncBoseFavoritesToServer;
    window.mergeBoseFavoritesFromServer = mergeBoseFavoritesFromServer;

    // 🛡️ الهيدر (وفيه عداد القلب) بيتحقن ديناميكياً من core-engine.js بعد ما
    // بيانات المتجر توصل - مش موجود وقت DOMContentLoaded من الأساس - فبنستنى
    // حدث BoseDatabaseLoaded كمان (نفس الحدث اللي category.html بيعتمد عليه)
    // عشان نضمن إن العداد بيتحدّث بمجرد ما الهيدر يبقى موجود فعلياً في الصفحة.
    document.addEventListener('DOMContentLoaded', updateFavoritesBadge);
    document.addEventListener('BoseDatabaseLoaded', function () {
        setTimeout(updateFavoritesBadge, 60);
        // 💗 [نمو]: لو رقم موبايل معروف بالفعل من زيارة سابقة (طلب/بحث سابق)،
        // نجيب أحدث نسخة من مفضلتها من القاعدة وندمجها هنا تلقائيًا - مرة واحدة
        // فقط لكل تحميل صفحة، بدون أي تفاعل مطلوب من العميلة.
        const knownPhone = getKnownPhone();
        if (knownPhone) mergeBoseFavoritesFromServer(knownPhone);
    });
})();
