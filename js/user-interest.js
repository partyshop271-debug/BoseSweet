/**
 * user-interest.js - اهتمامات كل عميلة على جهازها (ترتيب المنيو + "قد يعجبك أيضاً")
 * =====================================================================
 * ليه الملف ده موجود: المنيو (menu.html) وترتيب "الأنسب لك" في category.html كانوا
 * بيقروا مفتاح bose_user_behavior، بس مفيش أي كود في الموقع كان بيكتب فيه أصلاً
 * (الكود الوحيد اللي بيلمسه بيمسح منه بعد الشراء) - فالترتيب عمره ما اتغيّر.
 *
 * بيسجّل إيه (كله على جهاز العميلة نفسه في localStorage، مفيش أي بيانات بتتبعت
 * لأي سيرفر ومفيش أي بيانات شخصية):
 *   - فتح صفحة منتج: +3 للمنتج (مرة واحدة لكل منتج في الجلسة) و+1.2 لفئته
 *   - فتح صفحة فئة: +2 للفئة
 *   - إضافة للسلة: +6 للمنتج و+2.4 لفئته
 *   - إضافة للمفضلة: +5 للمنتج و+2 لفئته
 *   - شراء فعلي (markPurchased): المنتج نفسه بيتصفّر (عشان ما نقترحوش تاني فوراً)
 *     والفئة بتاخد +4 (الشراء أقوى إشارة على الاهتمام بالفئة)
 * الاهتمام بيقل مع الوقت لنصفه كل 14 يوم، فالمنيو بيتبع اللي العميلة مهتمة بيه
 * *دلوقتي* مش اللي كانت مهتمة بيه من شهور.
 *
 * لسه بنكتب نسخة في bose_user_behavior (نفس الشكل القديم {slug:{score,lastVisited}})
 * عشان ترتيب "الأنسب لك" الموجود في category.html يشتغل من غير أي تعديل فيه.
 */
(function () {
    "use strict";

    var KEY = "bose_interest_v2";
    var LEGACY_KEY = "bose_user_behavior";
    var SEEN_KEY = "bose_interest_seen";
    var CART_SEEN_KEY = "bose_interest_cart_seen";
    var HALF_LIFE_DAYS = 14;
    var DAY = 86400000;
    var MAX_PRODUCTS = 150;

    function read(key, fallback) {
        try { var v = JSON.parse(localStorage.getItem(key)); return v && typeof v === "object" ? v : fallback; } catch (e) { return fallback; }
    }
    function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* التخزين ممتلي/ممنوع - بنكمل من غير تسجيل */ } }

    function load() {
        var s = read(KEY, null);
        if (!s || typeof s.p !== "object" || typeof s.c !== "object") s = { p: {}, c: {} };
        return s;
    }
    function decayed(entry, now) {
        if (!entry || typeof entry.s !== "number") return 0;
        return entry.s * Math.pow(0.5, (now - entry.t) / (HALF_LIFE_DAYS * DAY));
    }
    function bump(map, key, pts, now) {
        map[key] = { s: decayed(map[key], now) + pts, t: now };
    }
    function products() {
        return (window.BoseStoreData && window.BoseStoreData.products) || [];
    }
    function categoryOf(slug) {
        var list = products();
        for (var i = 0; i < list.length; i++) { if (list[i].slug === slug || list[i].id === slug) return list[i].category; }
        return null;
    }
    function prune(s, now) {
        var keys = Object.keys(s.p);
        if (keys.length <= MAX_PRODUCTS) return;
        keys.sort(function (a, b) { return decayed(s.p[b], now) - decayed(s.p[a], now); });
        keys.slice(MAX_PRODUCTS).forEach(function (k) { delete s.p[k]; });
    }

    // منتجات اتسجّلت قبل ما بيانات المتجر توصل (فئتها لسه مجهولة) - بنكمّل فئتها أول ما البيانات توصل
    var pendingCats = [];
    function flushPendingCats() {
        if (!pendingCats.length || !products().length) return;
        var s = load(), now = Date.now();
        pendingCats.splice(0).forEach(function (x) { var cat = categoryOf(x.slug); if (cat) bump(s.c, cat, x.pts, now); });
        write(KEY, s);
    }

    function trackProduct(slug, pts, catPts) {
        if (!slug) return;
        var now = Date.now();
        var s = load();
        bump(s.p, slug, pts, now);
        var cat = categoryOf(slug);
        if (cat && catPts) bump(s.c, cat, catPts, now);
        else if (!cat && catPts && !products().length) pendingCats.push({ slug: slug, pts: catPts });
        prune(s, now);
        write(KEY, s);
        // نسخة بالشكل القديم لترتيب category.html
        var legacy = read(LEGACY_KEY, {});
        legacy[slug] = { score: Math.round(decayed(s.p[slug], now) * 100) / 100, lastVisited: now };
        write(LEGACY_KEY, legacy);
    }
    function trackCategory(catId, pts) {
        if (!catId) return;
        var now = Date.now();
        var s = load();
        bump(s.c, catId, pts, now);
        write(KEY, s);
    }

    function seenOnce(tag) {
        try {
            var seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "{}");
            if (seen[tag]) return true;
            seen[tag] = 1;
            sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
        } catch (e) { /* sessionStorage مش متاح - نسجّل كل مرة */ }
        return false;
    }

    function productScore(slug, now) { return decayed(load().p[slug], now || Date.now()); }
    function categoryScore(catId, now) { return decayed(load().c[catId], now || Date.now()); }

    /** ترتيب الفئات حسب اهتمام العميلة. الترتيب الأصلي بيحكم لما الاهتمام يتساوى. */
    function rankCategories(list) {
        var now = Date.now();
        var s = load();
        var scored = list.map(function (cat, i) { return { cat: cat, i: i, score: decayed(s.c[cat.id], now) }; });
        scored.sort(function (a, b) { return b.score - a.score || a.i - b.i; });
        var top = scored[0];
        return {
            list: scored.map(function (x) { return x.cat; }),
            topId: top ? top.cat.id : null,
            hasSignal: !!top && top.score >= 2
        };
    }

    function isBuilderMaster(p) { return !!(p.customBuilderUrl && p.builderType && p.builderType !== "standard"); }

    /** اقتراحات "قد يعجبك أيضاً" مخصصة للعميلة دي. */
    function recommend(current, n) {
        n = n || 8;
        var now = Date.now();
        var s = load();
        var mostSelling = (window.BoseStoreData && window.BoseStoreData.homepage && window.BoseStoreData.homepage.mostSelling) || [];
        var all = products().filter(function (p) {
            return p.slug !== current.slug && p.isAvailable !== false && !isBuilderMaster(p) && String(p.id).indexOf("promo-") !== 0 &&
                !(current.variantGroupId && p.variantGroupId === current.variantGroupId);
        });
        // منتجات الأحجام (زي الديسباسيتو) كل حجم صف منفصل - بنعرض نكهة واحدة بس مرة واحدة (أرخص حجم)
        var byGroup = {};
        var deduped = [];
        all.forEach(function (p) {
            if (!p.variantGroupId) { deduped.push(p); return; }
            var g = byGroup[p.variantGroupId];
            if (!g || (p.price || 0) < (g.price || 0)) byGroup[p.variantGroupId] = p;
        });
        Object.keys(byGroup).forEach(function (k) { deduped.push(byGroup[k]); });

        var scored = deduped.map(function (p) {
            var sc = decayed(s.p[p.slug], now) + decayed(s.c[p.category], now) * 0.6;
            if (p.category === current.category) sc += 3;
            if (p.featured) sc += 0.5;
            if (mostSelling.indexOf(p.id) !== -1 || mostSelling.indexOf(p.slug) !== -1) sc += 0.5;
            sc += Math.random() * 0.4; // تنويع بسيط عشان القايمة ماتبقاش نفسها بالحرف كل مرة
            return { p: p, sc: sc };
        }).sort(function (a, b) { return b.sc - a.sc; });

        // تنويع: حد أقصى 3 من نفس الفئة (4 لفئة المنتج الحالي) في المرحلة الأولى، وبعدها نكمّل لو لسه ناقص
        var out = [], used = {}, perCat = {};
        scored.forEach(function (x) {
            if (out.length >= n) return;
            var cap = x.p.category === current.category ? 4 : 3;
            if ((perCat[x.p.category] || 0) >= cap) return;
            perCat[x.p.category] = (perCat[x.p.category] || 0) + 1;
            used[x.p.slug] = 1;
            out.push(x.p);
        });
        scored.forEach(function (x) { if (out.length < n && !used[x.p.slug]) { used[x.p.slug] = 1; out.push(x.p); } });
        return out;
    }

    /** بعد الشراء: المنتج يتصفّر (عشان ما نقترحوش تاني فوراً) والفئة تاخد دفعة اهتمام. */
    function markPurchased(slugs) {
        var now = Date.now();
        var s = load();
        (slugs || []).forEach(function (slug) {
            var cat = categoryOf(slug);
            if (cat) bump(s.c, cat, 4, now);
            delete s.p[slug];
        });
        write(KEY, s);
    }

    /* ============================ تسجيل تلقائي ============================ */

    function trackPageViews() {
        var path = window.location.pathname;
        var params = new URLSearchParams(window.location.search);
        if (/\/product(\.html)?$/.test(path)) {
            var slug = params.get("slug");
            if (slug && !seenOnce("v:" + slug)) trackProduct(slug, 3, 1.2);
        } else if (/\/category(\.html)?$/.test(path)) {
            var cat = params.get("category");
            if (cat && !seenOnce("c:" + cat)) trackCategory(cat, 2);
        }
    }

    // إضافة للسلة: بنقارن محتوى السلة بآخر مرة شفناه (بيشتغل مهما كانت الصفحة اللي ضافت منها)
    function trackCartAdds() {
        var cart;
        try { cart = JSON.parse(localStorage.getItem("bose_cart") || "[]"); } catch (e) { return; }
        if (!Array.isArray(cart)) return;
        var last = read(CART_SEEN_KEY, {});
        var next = {};
        cart.forEach(function (item) {
            var slug = item && item.productSlug;
            if (!slug) return;
            next[slug] = (next[slug] || 0) + (parseInt(item.quantity, 10) || 1);
        });
        Object.keys(next).forEach(function (slug) {
            if (!last[slug] || next[slug] > last[slug]) trackProduct(slug, 6, 2.4);
        });
        write(CART_SEEN_KEY, next);
    }

    // مفضلة: بنقارن القايمة بآخر مرة شفناها
    function trackFavorites() {
        var favs;
        try { favs = JSON.parse(localStorage.getItem("bose_favorites") || "[]"); } catch (e) { return; }
        if (!Array.isArray(favs)) return;
        var lastSeen = read("bose_interest_fav_seen", { l: [] }).l || [];
        favs.forEach(function (id) { if (lastSeen.indexOf(id) === -1) trackProduct(id, 5, 2); });
        write("bose_interest_fav_seen", { l: favs });
    }

    window.BoseInterest = {
        trackProduct: trackProduct,
        trackCategory: trackCategory,
        rankCategories: rankCategories,
        recommend: recommend,
        markPurchased: markPurchased,
        productScore: productScore,
        categoryScore: categoryScore,
        // للفحص من الكونسول: BoseInterest.debug()
        debug: function () { return load(); }
    };

    function init() {
        trackPageViews();
        trackCartAdds();
        trackFavorites();
        document.addEventListener("BoseDatabaseLoaded", flushPendingCats);
        setTimeout(flushPendingCats, 3000);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
