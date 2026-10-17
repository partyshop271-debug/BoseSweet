/**
 * 🎁 محرك صفحة الهدايا والزينة (gifts.html)
 * - بيقرأ بيانات القسم من جداول gift_* (عن طريق BoseSupabase.loadBoseGiftsData)
 * - منتجات الهدايا نفسها بتيجي من window.BoseStoreData.products (العلامة isGift)
 *   فالسلة والدفع والمفضلة وصفحة المنتج بتشتغل بنفس الكود الموجود من غير تغيير.
 * - مفيش أي سؤال للعميلة ولا خطوات إجبارية: رفوف جاهزة + فلتر هادي اختياري.
 * - مفيش inline handlers (الـ CSP صارم) - كله addEventListener.
 */
(function () {
    "use strict";

    var LEAD_DAYS = 3;          // مدة التجهيز الدنيا (بتتفرض في السيرفر كمان)
    var STATE_KEY = "bose_gifts_state_v1";
    var PRICE_BUCKETS = [
        { id: "p1", label: "لحد 300", min: 0, max: 300 },
        { id: "p2", label: "300 - 600", min: 300, max: 600 },
        { id: "p3", label: "600 - 1000", min: 600, max: 1000 },
        { id: "p4", label: "أكتر من 1000", min: 1000, max: Infinity }
    ];
    var KIND_LABELS = { occasion: "المناسبة", recipient: "لمين", type: "النوع", contains: "فيها إيه" };
    var KINDS = ["occasion", "recipient", "type", "contains"];

    var esc = function (v) {
        v = v == null ? "" : String(v);
        return window.escapeBoseHTML ? window.escapeBoseHTML(v) : v.replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    };
    function $(id) { return document.getElementById(id); }
    function thumb(u, w, ratio) {
        u = String(u || "");
        if (u.indexOf("res.cloudinary.com") > -1 && u.indexOf("/upload/") > -1 && !/\/upload\/[a-z]+_/.test(u)) {
            return u.replace("/upload/", "/upload/f_auto,q_auto,c_fill," + (ratio || "ar_1:1") + ",w_" + w + "/");
        }
        return u;
    }
    function safeUrl(u) {
        u = String(u || "").trim();
        if (/^(\/|#|https:\/\/)/.test(u) && u.indexOf("//") !== 0 && u.toLowerCase().indexOf("javascript:") === -1) return u;
        return "";
    }
    function money(n) {
        n = Math.round(Number(n) || 0);
        return n.toLocaleString("en-US") + " ج";
    }
    // تاريخ اليوم بتوقيت القاهرة (YYYY-MM-DD) - عشان نوافذ ظهور المناسبات تبقى مظبوطة
    function todayStr() {
        try {
            var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
            return p;
        } catch (e) {
            var d = new Date();
            return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        }
    }
    function dayNum(s) { var a = String(s).split("-"); return Math.round(Date.UTC(+a[0], +a[1] - 1, +a[2]) / 86400000); }
    function fmtDate(s) {
        try {
            var a = String(s).split("-");
            return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2], 12)).toLocaleDateString("ar-EG", { timeZone: "UTC", day: "numeric", month: "long" });
        } catch (e) { return s; }
    }
    function inWindow(startIso, endIso, nowMs) {
        if (startIso && new Date(startIso).getTime() > nowMs) return false;
        if (endIso && new Date(endIso).getTime() < nowMs) return false;
        return true;
    }

    var S = {
        raw: null,
        sections: [],
        tags: {},          // id -> tag
        items: [],         // [{p, meta, tags:Set, bundle:[], saving, aloneTotal}]
        byId: {},
        section: "gifts",
        f: { occasion: [], recipient: [], type: [], contains: [] },
        price: "",
        sort: "default",
        q: "",
        today: todayStr()
    };

    /* ---------- حفظ/استرجاع اختيارات العميلة ---------- */
    function saveState() {
        try {
            sessionStorage.setItem(STATE_KEY, JSON.stringify({ section: S.section, f: S.f, price: S.price, sort: S.sort, q: S.q }));
        } catch (e) { /* التخزين ممنوع */ }
    }
    function loadState() {
        try {
            var s = JSON.parse(sessionStorage.getItem(STATE_KEY) || "null");
            if (!s) return;
            if (s.f) KINDS.forEach(function (k) { if (Array.isArray(s.f[k])) S.f[k] = s.f[k].filter(function (x) { return typeof x === "string"; }); });
            if (typeof s.price === "string") S.price = s.price;
            if (typeof s.sort === "string") S.sort = s.sort;
            if (typeof s.q === "string") S.q = s.q;
            if (typeof s.section === "string") S.section = s.section;
        } catch (e) { /* تجاهل */ }
    }

    /* ---------- بناء النموذج ---------- */
    function build(raw) {
        var nowMs = Date.now();
        S.raw = raw;
        S.sections = (raw.sections || []).filter(function (s) { return s.is_active !== false; });
        S.tags = {};
        (raw.tags || []).forEach(function (t) { if (t.is_active !== false) S.tags[t.id] = t; });

        var products = (window.BoseStoreData && window.BoseStoreData.products) || [];
        var prodById = {};
        products.forEach(function (p) { if (p.isGift) prodById[p.id] = p; });

        var tagsByProduct = {};
        (raw.productTags || []).forEach(function (pt) {
            if (!S.tags[pt.tag_id]) return;
            (tagsByProduct[pt.product_id] = tagsByProduct[pt.product_id] || {})[pt.tag_id] = true;
        });
        var bundleByProduct = {};
        (raw.bundleItems || []).forEach(function (b) { (bundleByProduct[b.bundle_product_id] = bundleByProduct[b.bundle_product_id] || []).push(b); });

        S.items = [];
        S.byId = {};
        (raw.giftProducts || []).forEach(function (gp) {
            if (gp.is_listed === false) return;
            var p = prodById[gp.product_id];
            if (!p || p.isAvailable === false) return;
            var bundle = bundleByProduct[gp.product_id] || [];
            var aloneTotal = 0;
            bundle.forEach(function (b) { aloneTotal += (Number(b.alone_price) || 0) * (parseInt(b.qty, 10) || 1); });
            var price = Number(p.price) || 0;
            var saving = aloneTotal > price ? Math.round(aloneTotal - price) : 0;
            var it = { p: p, meta: gp, tags: tagsByProduct[gp.product_id] || {}, bundle: bundle, aloneTotal: aloneTotal, saving: saving, price: price };
            S.items.push(it);
            S.byId[p.id] = it;
        });
        S.nowMs = nowMs;
    }

    function tagVisible(t) {
        if (!t) return false;
        if (t.kind !== "occasion") return true;
        if (t.show_from && S.today < t.show_from) return false;
        if (t.show_until && S.today > t.show_until) return false;
        return true;
    }
    function sectionItems() {
        return S.items.filter(function (it) { return it.meta.section_id === S.section; });
    }
    function tagItems(tagId, list) {
        return (list || sectionItems()).filter(function (it) { return it.tags[tagId]; });
    }

    /* ---------- الفلترة ---------- */
    function matches(it, f, price, q, skipKind) {
        for (var i = 0; i < KINDS.length; i++) {
            var k = KINDS[i];
            if (k === skipKind) continue;
            var sel = f[k];
            if (sel && sel.length) {
                var ok = false;
                for (var j = 0; j < sel.length; j++) { if (it.tags[sel[j]]) { ok = true; break; } }
                if (!ok) return false;
            }
        }
        if (price) {
            var b = PRICE_BUCKETS.filter(function (x) { return x.id === price; })[0];
            if (b && !(it.price >= b.min && it.price < b.max) && !(b.max === Infinity && it.price >= b.min)) return false;
        }
        if (q) {
            var hay = (it.p.title + " " + (it.meta.summary || "") + " " + (it.p.description || "") + " " +
                Object.keys(it.tags).map(function (id) { return S.tags[id] ? S.tags[id].title : ""; }).join(" ") + " " +
                it.bundle.map(function (b) { return b.label || ""; }).join(" ")).toLowerCase();
            var words = q.toLowerCase().split(/\s+/).filter(Boolean);
            for (var w = 0; w < words.length; w++) { if (hay.indexOf(words[w]) === -1) return false; }
        }
        return true;
    }
    function filtered() {
        var list = sectionItems().filter(function (it) { return matches(it, S.f, S.price, S.q); });
        if (S.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
        else if (S.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
        else if (S.sort === "newest") list.sort(function (a, b) { return String(b.p.createdAt || "").localeCompare(String(a.p.createdAt || "")); });
        else if (S.sort === "popular") {
            var ms = (window.BoseStoreData && window.BoseStoreData.homepage && window.BoseStoreData.homepage.mostSelling) || [];
            list.sort(function (a, b) { var ia = ms.indexOf(a.p.id), ib = ms.indexOf(b.p.id); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); });
        }
        return list;
    }
    function hasActiveFilter() {
        return !!(S.q || S.price || KINDS.some(function (k) { return S.f[k].length; }));
    }

    /* ---------- "اطلبي قبل" ---------- */
    function deadlineFor(tag) {
        if (!tag || !tag.event_date) return null;
        var left = dayNum(tag.event_date) - dayNum(S.today);
        if (left < 0) return null;
        var deadlineNum = dayNum(tag.event_date) - LEAD_DAYS;
        var d = new Date(deadlineNum * 86400000);
        var iso = d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
        return { iso: iso, passed: deadlineNum < dayNum(S.today), daysToEvent: left };
    }
    function deadlineText(tag) {
        var dl = deadlineFor(tag);
        if (!dl) return "";
        if (!dl.passed) return "اطلبي قبل " + fmtDate(dl.iso) + " عشان توصل في ميعادها";
        return "الهدايا بتتجهز في " + LEAD_DAYS + " أيام - اختاري ميعاد استلام بعد كده";
    }

    /* ---------- الكروت ---------- */
    /* اللي جوّا الهدية: صور صغيرة + أسماء بخط واضح جوه الكارت نفسه */
    function contentsHTML(it) {
        if (it.bundle.length) {
            var n = it.bundle.length;
            var thumbs = it.bundle.slice(0, 4).map(function (b) {
                var u = safeUrl(b.image);
                return u ? '<img src="' + esc(thumb(u, 80)) + '" alt="" loading="lazy" width="38" height="38" data-lb-id="' + esc(it.p.id) + '" data-lb-src="' + esc(b.image) + '">' : "";
            }).join("");
            var more = n > 4 ? '<span class="gf-contents__more">+' + (n - 4) + "</span>" : "";
            var names = it.bundle.map(function (b) { return esc(b.label || ""); }).join(" · ");
            return '<div class="gf-contents"><div class="gf-contents__t"><span>جواها ' + n + (n === 1 ? " قطعة" : " قطع") + "</span></div>" +
                (thumbs ? '<div class="gf-contents__row">' + thumbs + more + "</div>" : "") +
                '<p class="gf-contents__names">' + names + "</p></div>";
        }
        if (it.meta.summary) return '<div class="gf-contents gf-contents--plain"><p class="gf-contents__names">' + esc(it.meta.summary) + "</p></div>";
        return "";
    }
    function cardHTML(it, opts) {
        opts = opts || {};
        var inner = typeof window.createProductCardHTML === "function" ? window.createProductCardHTML(it.p) : "";
        var badge = "";
        if (it.bundle.length || it.meta.is_bundle) badge = '<span class="gf-badge"><i class="fa-solid fa-gift"></i> هدية كاملة</span>';
        if (window.BoseGiftLightbox) window.BoseGiftLightbox.registerGift(it.p, it.bundle);
        var contents = contentsHTML(it);
        if (contents && inner.indexOf('<div class="product-card-price"') !== -1) inner = inner.replace('<div class="product-card-price"', contents + '<div class="product-card-price"');
        else if (contents) inner += contents;
        var inside = "";
        var save = it.saving > 0 ? '<p class="gf-save"><i class="fa-solid fa-tag"></i> بتوفري ' + money(it.saving) + "</p>" : "";
        var note = it.meta.delivery_note ? '<p class="gf-note">' + esc(it.meta.delivery_note) + "</p>" : "";
        return '<div class="gf-card' + (opts.compact ? " gf-card--compact" : "") + '" data-gift-id="' + esc(it.p.id) + '">' + badge + inner + inside + save + note + "</div>";
    }
    function skeleton(n) {
        var h = "";
        for (var i = 0; i < n; i++) h += '<div class="gf-card gf-skel" aria-hidden="true"><div class="gf-skel-img"></div><div class="gf-skel-line"></div><div class="gf-skel-line gf-skel-line--s"></div></div>';
        return h;
    }

    /* ---------- الأقسام (تبويبات) ---------- */
    function renderSections() {
        var box = $("gf-sections");
        if (!box) return;
        var avail = S.sections.filter(function (s) { return S.items.some(function (it) { return it.meta.section_id === s.id; }); });
        if (!avail.some(function (s) { return s.id === S.section; })) S.section = avail.length ? avail[0].id : "gifts";
        if (avail.length < 2) { box.innerHTML = ""; box.hidden = true; return; }
        box.hidden = false;
        box.innerHTML = avail.map(function (s) {
            return '<button type="button" class="gf-tab' + (s.id === S.section ? " is-active" : "") + '" data-section="' + esc(s.id) + '">' + esc(s.title) + "</button>";
        }).join("");
    }

    /* ---------- الواجهة الكبيرة ---------- */
    function renderHero() {
        var box = $("gf-hero");
        if (!box) return;
        var now = Date.now();
        var hero = (S.raw.heroes || []).filter(function (h) {
            return h.is_active !== false && h.section_id === S.section && inWindow(h.starts_at, h.ends_at, now);
        })[0];
        var sec = S.sections.filter(function (s) { return s.id === S.section; })[0] || {};
        var title = hero ? hero.title : sec.title;
        var sub = hero ? hero.subtitle : sec.subtitle;
        var img = hero ? hero.image : sec.image;
        if (!title && !img) { box.hidden = true; box.innerHTML = ""; return; }
        box.hidden = false;
        var link = hero ? safeUrl(hero.link_url) : "";
        var cta = hero && hero.cta_label && link ? '<a class="gf-hero__cta" href="' + esc(link) + '">' + esc(hero.cta_label) + "</a>" : "";
        box.innerHTML =
            (img ? '<img class="gf-hero__img" src="' + esc(thumb(img, 1200, "ar_16:9")) + '" alt="" fetchpriority="high" decoding="async">' : "") +
            '<div class="gf-hero__txt">' + (title ? "<h1>" + esc(title) + "</h1>" : "") + (sub ? "<p>" + esc(sub) + "</p>" : "") + cta + "</div>";
        box.classList.toggle("gf-hero--noimg", !img);
    }

    /* ---------- شريط المناسبات (زي الستوريز) ---------- */
    function visibleTags(kind) {
        var list = sectionItems();
        return Object.keys(S.tags).map(function (id) { return S.tags[id]; })
            .filter(function (t) { return t.kind === kind && tagVisible(t) && tagItems(t.id, list).length > 0; })
            .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
    }
    function renderStories() {
        var box = $("gf-stories");
        if (!box) return;
        var occ = visibleTags("occasion");
        if (!occ.length) { box.hidden = true; box.innerHTML = ""; return; }
        box.hidden = false;
        box.innerHTML = occ.map(function (t) {
            var active = S.f.occasion.indexOf(t.id) !== -1;
            var img = t.image ? '<img src="' + esc(thumb(t.image, 140)) + '" alt="" loading="lazy" decoding="async" width="70" height="70">' : '<i class="fa-solid fa-gift"></i>';
            return '<button type="button" class="gf-story' + (active ? " is-active" : "") + '" data-tag-kind="occasion" data-tag-id="' + esc(t.id) + '"><span class="gf-story__ring">' + img + "</span><span class=\"gf-story__t\">" + esc(t.title) + "</span></button>";
        }).join("");
    }

    /* ---------- الرفوف ---------- */
    function shelfProducts(sh) {
        var list = sectionItems();
        var max = Math.max(1, Math.min(parseInt(sh.max_items, 10) || 4, 8));
        var out = [];
        if (sh.mode === "tag") out = sh.tag_id ? tagItems(sh.tag_id, list) : [];
        else if (sh.mode === "newest") out = list.slice().sort(function (a, b) { return String(b.p.createdAt || "").localeCompare(String(a.p.createdAt || "")); });
        else {
            var ids = (S.raw.shelfItems || []).filter(function (x) { return x.shelf_id === sh.id; }).sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
            ids.forEach(function (x) { var it = S.byId[x.product_id]; if (it && it.meta.section_id === S.section) out.push(it); });
        }
        return out.slice(0, max);
    }
    function shelfHTML(title, sub, note, items) {
        return '<section class="gf-shelf"><header class="gf-shelf__h"><h2>' + esc(title) + "</h2>" +
            (sub ? "<p>" + esc(sub) + "</p>" : "") + (note ? '<p class="gf-shelf__note"><i class="fa-regular fa-clock"></i> ' + esc(note) + "</p>" : "") +
            '</header><div class="gf-grid gf-grid--shelf">' + items.map(function (it) { return cardHTML(it, { compact: true }); }).join("") + "</div></section>";
    }
    function nearestOccasion() {
        var best = null;
        visibleTags("occasion").forEach(function (t) {
            var dl = deadlineFor(t);
            if (!dl || dl.daysToEvent > 30) return;
            if (!best || dl.daysToEvent < best.dl.daysToEvent) best = { t: t, dl: dl };
        });
        return best;
    }
    function renderShelves() {
        var box = $("gf-shelves");
        if (!box) return;
        var html = "";
        var used = {};
        var near = nearestOccasion();
        if (near) {
            var its = tagItems(near.t.id).slice(0, 4);
            if (its.length) {
                html += shelfHTML("قريب منك: " + near.t.title, "", deadlineText(near.t), its);
                used["tag:" + near.t.id] = true;
            }
        }
        var now = Date.now();
        (S.raw.shelves || []).filter(function (sh) {
            return sh.is_active !== false && sh.section_id === S.section && inWindow(sh.starts_at, sh.ends_at, now);
        }).forEach(function (sh) {
            if (sh.mode === "tag" && used["tag:" + sh.tag_id]) return;
            var its = shelfProducts(sh);
            if (!its.length) return; // رف فاضي مبيظهرش
            var tag = sh.mode === "tag" ? S.tags[sh.tag_id] : null;
            html += shelfHTML(sh.title, sh.subtitle, tag && tag.kind === "occasion" ? deadlineText(tag) : "", its);
        });
        box.innerHTML = html;
    }

    /* ---------- الفلتر ---------- */
    function counts(kind) {
        var map = {};
        var list = sectionItems().filter(function (it) { return matches(it, S.f, S.price, S.q, kind); });
        list.forEach(function (it) { Object.keys(it.tags).forEach(function (id) { map[id] = (map[id] || 0) + 1; }); });
        return map;
    }
    function priceCounts() {
        var map = {};
        var list = sectionItems().filter(function (it) { return matches(it, S.f, "", S.q); });
        PRICE_BUCKETS.forEach(function (b) {
            map[b.id] = list.filter(function (it) { return it.price >= b.min && (b.max === Infinity || it.price < b.max); }).length;
        });
        return map;
    }
    function renderFilter() {
        var box = $("gf-filter-body");
        if (!box) return;
        var html = "";
        KINDS.forEach(function (kind) {
            var c = counts(kind);
            var opts = visibleTags(kind).filter(function (t) { return c[t.id] > 0 || S.f[kind].indexOf(t.id) !== -1; });
            if (!opts.length) return;
            html += '<fieldset class="gf-fgroup"><legend>' + KIND_LABELS[kind] + '</legend><div class="gf-fopts">' +
                opts.map(function (t) {
                    var on = S.f[kind].indexOf(t.id) !== -1;
                    return '<button type="button" class="gf-opt' + (on ? " is-on" : "") + '" data-tag-kind="' + kind + '" data-tag-id="' + esc(t.id) + '" aria-pressed="' + on + '">' + esc(t.title) + ' <small>' + (c[t.id] || 0) + "</small></button>";
                }).join("") + "</div></fieldset>";
        });
        var pc = priceCounts();
        var pOpts = PRICE_BUCKETS.filter(function (b) { return pc[b.id] > 0 || S.price === b.id; });
        if (pOpts.length) {
            html += '<fieldset class="gf-fgroup"><legend>السعر</legend><div class="gf-fopts">' + pOpts.map(function (b) {
                var on = S.price === b.id;
                return '<button type="button" class="gf-opt' + (on ? " is-on" : "") + '" data-price="' + b.id + '" aria-pressed="' + on + '">' + b.label + ' <small>' + (pc[b.id] || 0) + "</small></button>";
            }).join("") + "</div></fieldset>";
        }
        box.innerHTML = html || '<p class="gf-muted">مفيش اختيارات تصفية دلوقتي.</p>';
        var cnt = $("gf-filter-count");
        var n = KINDS.reduce(function (a, k) { return a + S.f[k].length; }, 0) + (S.price ? 1 : 0);
        if (cnt) { cnt.textContent = n ? String(n) : ""; cnt.hidden = !n; }
    }
    function renderChips() {
        var box = $("gf-chips");
        if (!box) return;
        var chips = [];
        KINDS.forEach(function (k) {
            S.f[k].forEach(function (id) { if (S.tags[id]) chips.push({ label: S.tags[id].title, kind: k, id: id }); });
        });
        if (S.price) { var b = PRICE_BUCKETS.filter(function (x) { return x.id === S.price; })[0]; if (b) chips.push({ label: b.label, price: true }); }
        if (S.q) chips.push({ label: "بحث: " + S.q, q: true });
        box.hidden = !chips.length;
        box.innerHTML = chips.map(function (c) {
            return '<button type="button" class="gf-chip" ' + (c.price ? 'data-rm-price="1"' : c.q ? 'data-rm-q="1"' : 'data-rm-kind="' + c.kind + '" data-rm-id="' + esc(c.id) + '"') + ">" + esc(c.label) + ' <i class="fa-solid fa-xmark"></i></button>';
        }).join("") + (chips.length > 1 ? '<button type="button" class="gf-chip gf-chip--clear" data-rm-all="1">مسح الكل</button>' : "");
    }

    /* ---------- النتائج ---------- */
    function renderResults() {
        var head = $("gf-results-head");
        var grid = $("gf-grid");
        var empty = $("gf-empty");
        var list = filtered();
        var active = hasActiveFilter();
        // ملاحظة "اطلبي قبل" لو مناسبة واحدة بتاريخ مختارة
        var note = "";
        if (S.f.occasion.length === 1) note = deadlineText(S.tags[S.f.occasion[0]]);
        if (head) {
            head.innerHTML = '<h2>' + (active ? "النتائج" : "كل " + esc((S.sections.filter(function (s) { return s.id === S.section; })[0] || {}).title || "الهدايا")) +
                ' <small>(' + list.length + ")</small></h2>" + (note ? '<p class="gf-shelf__note"><i class="fa-regular fa-clock"></i> ' + esc(note) + "</p>" : "");
        }
        var showMore = $("gf-more");
        if (!list.length) {
            grid.innerHTML = "";
            // مفيش صفحة فاضية: نعرض أقرب هدايا
            var fallback = sectionItems().slice(0, 4);
            empty.hidden = false;
            empty.innerHTML = '<p>مفيش هدايا بالاختيارات دي بالظبط. دي أقرب حاجات ممكن تعجبك:</p><div class="gf-grid gf-grid--shelf">' + fallback.map(function (it) { return cardHTML(it, { compact: true }); }).join("") + "</div>" +
                '<button type="button" class="gf-btn-ghost" data-rm-all="1">مسح التصفية</button>';
            if (showMore) showMore.hidden = true;
            return;
        }
        empty.hidden = true;
        empty.innerHTML = "";
        var limit = S._limit || 12;
        grid.innerHTML = list.slice(0, limit).map(function (it) { return cardHTML(it); }).join("");
        if (showMore) showMore.hidden = list.length <= limit;
    }

    function renderAll(opts) {
        opts = opts || {};
        var active = hasActiveFilter();
        renderSections();
        renderStories();
        var top = $("gf-top");
        if (top) top.hidden = active;
        if (!active) { renderHero(); renderShelves(); } else { var sh = $("gf-shelves"); if (sh) sh.innerHTML = ""; }
        renderFilter();
        renderChips();
        renderResults();
        var sortSel = $("gf-sort");
        if (sortSel && sortSel.value !== S.sort) sortSel.value = S.sort;
        var qi = $("gf-search");
        if (qi && qi !== document.activeElement && qi.value !== S.q) qi.value = S.q;
        saveState();
        if (opts.scroll) { var r = $("gf-results"); if (r && r.scrollIntoView) r.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }

    /* ---------- التفاعل ---------- */
    function toggleTag(kind, id) {
        var arr = S.f[kind];
        var i = arr.indexOf(id);
        if (i === -1) arr.push(id); else arr.splice(i, 1);
        S._limit = 12;
    }
    function openSheet(on) {
        var f = $("gf-filters");
        if (!f) return;
        f.classList.toggle("is-open", !!on);
        document.body.classList.toggle("gf-sheet-open", !!on);
        var bd = $("gf-backdrop");
        if (bd) bd.hidden = !on;
    }
    function bind() {
        document.addEventListener("click", function (e) {
            var t = e.target;
            var tab = t.closest && t.closest("[data-section]");
            if (tab && tab.classList.contains("gf-tab")) {
                S.section = tab.getAttribute("data-section");
                S.f = { occasion: [], recipient: [], type: [], contains: [] }; S.price = ""; S.q = ""; S._limit = 12;
                renderAll();
                return;
            }
            var opt = t.closest && t.closest("[data-tag-id]");
            if (opt && (opt.classList.contains("gf-opt") || opt.classList.contains("gf-story"))) {
                toggleTag(opt.getAttribute("data-tag-kind"), opt.getAttribute("data-tag-id"));
                renderAll({ scroll: opt.classList.contains("gf-story") });
                return;
            }
            var pr = t.closest && t.closest("[data-price]");
            if (pr) { S.price = S.price === pr.getAttribute("data-price") ? "" : pr.getAttribute("data-price"); S._limit = 12; renderAll(); return; }
            var rm = t.closest && t.closest("[data-rm-kind],[data-rm-price],[data-rm-q],[data-rm-all]");
            if (rm) {
                if (rm.hasAttribute("data-rm-all")) { S.f = { occasion: [], recipient: [], type: [], contains: [] }; S.price = ""; S.q = ""; }
                else if (rm.hasAttribute("data-rm-price")) S.price = "";
                else if (rm.hasAttribute("data-rm-q")) S.q = "";
                else toggleTag(rm.getAttribute("data-rm-kind"), rm.getAttribute("data-rm-id"));
                renderAll();
                return;
            }
            if (t.closest && t.closest("#gf-open-filter")) { openSheet(true); return; }
            if (t.closest && (t.closest("#gf-close-filter") || t.closest("#gf-backdrop") || t.closest("#gf-apply-filter"))) { openSheet(false); return; }
            if (t.closest && t.closest("#gf-more")) { S._limit = (S._limit || 12) + 12; renderResults(); return; }
        });
        var sortSel = $("gf-sort");
        if (sortSel) sortSel.addEventListener("change", function () { S.sort = sortSel.value; renderAll(); });
        var qi = $("gf-search");
        if (qi) {
            var timer = null;
            qi.addEventListener("input", function () {
                clearTimeout(timer);
                timer = setTimeout(function () { S.q = qi.value.trim(); S._limit = 12; renderAll(); }, 250);
            });
        }
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") openSheet(false); });
    }

    function applyUrlParams() {
        try {
            var p = new URLSearchParams(window.location.search);
            var sec = p.get("section");
            if (sec) { S.section = sec; }
            var occ = p.get("occasion") || p.get("tag");
            if (occ && S.tags[occ]) { var k = S.tags[occ].kind; if (S.f[k] && S.f[k].indexOf(occ) === -1) S.f[k].push(occ); }
        } catch (e) { /* تجاهل */ }
    }

    function showFatal() {
        var g = $("gf-grid");
        if (g) g.innerHTML = '<p class="gf-muted">مش قادرين نحمّل الهدايا دلوقتي - جرّبي تحدّثي الصفحة.</p>';
    }

    function init(storeData) {
        if (!window.BoseSupabase || typeof window.BoseSupabase.loadBoseGiftsData !== "function") { showFatal(); return; }
        window.BoseSupabase.loadBoseGiftsData().then(function (raw) {
            build(raw);
            loadState();
            applyUrlParams();
            if (!S.items.length) {
                $("gf-grid").innerHTML = "";
                var e = $("gf-empty"); e.hidden = false;
                e.innerHTML = '<p>بنجهّز تشكيلة الهدايا - هتلاقيها هنا قريب!</p><a class="gf-btn-ghost" href="/menu.html">تصفحي الحلويات</a>';
                var f = $("gf-filters"); if (f) f.hidden = true;
                var ob = $("gf-open-filter"); if (ob) ob.hidden = true;
                return;
            }
            bind();
            renderAll();
        }).catch(showFatal);
    }

    document.addEventListener("DOMContentLoaded", function () {
        var g = $("gf-grid");
        if (g) g.innerHTML = skeleton(6); // الهيكل يظهر فورًا والصور تحمل بعده
        if (window.BoseStoreData && window.BoseStoreData.products) init(window.BoseStoreData);
        else document.addEventListener("BoseDatabaseLoaded", function (e) { init(e.detail || window.BoseStoreData); }, { once: true });
    });
})();
