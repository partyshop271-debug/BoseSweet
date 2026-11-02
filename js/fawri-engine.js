/**
 * fawri-engine.js - صفحة "الفوري" (fawri.html)
 * =====================================================================
 * ⚡ قطع جاهزة دلوقتي بكمية محدودة. المنتجات هنا id بتاعها بيبدأ بـ fawri- في جدول products،
 * والسيرفر (create_order_with_items) هو اللي بيخصم الكمية فعليًا ويقفل الصنف لما تخلص - الأرقام
 * اللي هنا للعرض والتنبيه بس، مش هي اللي بتحمي من البيع الزايد.
 * - البيانات دايمًا لايف (من غير كاش) وبتتحدّث كل 25 ثانية (وبتوقف لما التاب مخفي).
 * - التوبينج (اختياري) بيتحدد من لوحة التحكم في products.options.toppings، وكل توبينج = سطر مستقل في السلة.
 * - مفيش أي inline script في الصفحة (الـCSP) - كل المنطق هنا.
 */
(function () {
    "use strict";

    var POLL_MS = 25000;
    var MAX_LINE_QTY = 20; // نفس سقف السلة في باقي الموقع

    var gridEl, stateEl, perksEl, heroEl, titleEl, subtitleEl, statsEl, liveEl, liveTextEl;
    var data = { settings: { isOpen: true, heroImage: "", heroTitle: "", heroSubtitle: "" }, products: [] };
    var sel = {};          // اختيارات العميلة لكل صنف: { [id]: { topping, qty } }
    var lastSig = "";
    var loadedOnce = false;

    function esc(s) {
        return String(s === null || s === undefined ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    function safeUrl(u) { return /^https?:\/\//i.test(String(u || "")) ? String(u) : ""; }

    function readCart() {
        try { var c = JSON.parse(localStorage.getItem("bose_cart") || "[]"); return Array.isArray(c) ? c : []; }
        catch (e) { return []; }
    }
    function inCartQty(productId) {
        return readCart().reduce(function (sum, it) {
            return sum + (it && it.productSlug === productId ? (parseInt(it.quantity, 10) || 0) : 0);
        }, 0);
    }
    function unitPrice(p) {
        try {
            if (typeof window.calculateProductFinalPrice === "function") {
                var v = Number(window.calculateProductFinalPrice(p, {}));
                if (isFinite(v) && v > 0) return v;
            }
        } catch (e) { /* نرجع للسعر الخام */ }
        return Number(p.price || p.basePrice || 0);
    }
    function toppingsOf(p) {
        var t = p.options && p.options.toppings;
        if (!Array.isArray(t)) return [];
        // 🛡️ لو الأدمن كتب كذا توبينج في سطر واحد (مفصولين بـ / أو ، أو -) نفصلهم لخيارات مستقلة،
        // عشان ضغطة واحدة ماتختارش كل النكهات مع بعض.
        var out = [];
        t.forEach(function (x) {
            String(x || "").split(/\s*[\/،,|]\s*/).forEach(function (part) {
                part = part.trim();
                if (part && out.indexOf(part) === -1) out.push(part);
            });
        });
        return out;
    }
    function maxQtyFor(p) {
        var left = Math.max(0, Number(p.stockQuantity) - inCartQty(p.id));
        return Math.min(left, MAX_LINE_QTY);
    }

    function fmtHour(t) {
        var parts = String(t || "").split(":");
        var h = parseInt(parts[0], 10), m = parseInt(parts[1], 10) || 0;
        if (isNaN(h)) return t;
        var period = h >= 12 ? "مساءً" : "صباحًا";
        var h12 = h % 12; if (h12 === 0) h12 = 12;
        return m === 0 ? h12 + " " + period : h12 + ":" + (m < 10 ? "0" + m : m) + " " + period;
    }
    function leadLabel(hours) {
        if (typeof window.formatBoseLeadTimeAr === "function") return window.formatBoseLeadTimeAr(hours);
        return hours === 1 ? "ساعة" : hours + " ساعة";
    }

    function earliestOf(products) {
        var best = null;
        (products || []).forEach(function (p) {
            var raw = p && p.options && p.options.earliestPickup;
            if (!raw) return;
            var d = new Date(String(raw));
            if (!isNaN(d.getTime()) && (!best || d > best)) best = d;
        });
        return best;
    }

    function renderPerks() {
        if (!perksEl) return;
        var rules = (window.BoseStoreData && window.BoseStoreData.orderRules) || {};
        var raw = Number(rules.minPreparationTimeHoursFawri);
        var lead = isFinite(raw) && raw >= 0 ? raw : 1;
        var start = rules.businessHoursStart || "09:00";
        var end = rules.businessHoursEnd || "22:00";
        var earliest = earliestOf(data.products);
        function perk(icon, title, sub) {
            return '<div class="fw-perk"><span class="fw-perk-ic"><i class="fa-solid ' + icon + '"></i></span>' +
                '<strong>' + esc(title) + '</strong><small>' + esc(sub) + "</small></div>";
        }
        perksEl.innerHTML =
            (earliest
                ? perk("fa-calendar-check", "الاستلام " + earliest.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }), "ابتداءً من " + fmtHour(("0" + earliest.getHours()).slice(-2) + ":" + ("0" + earliest.getMinutes()).slice(-2)))
                : perk("fa-bolt", "جاهز خلال " + leadLabel(lead), "من تأكيد طلبك")) +
            perk("fa-clock", "كل يوم", "من " + fmtHour(start) + " لحد " + fmtHour(end)) +
            perk("fa-store", "استلام أو توصيل", "اختاري اللي يناسبك");
        perksEl.hidden = false;
    }

    function renderHeroStats() {
        if (!statsEl) return;
        var open = data.settings.isOpen !== false;
        var items = data.products.length;
        var pieces = data.products.reduce(function (n, p) { return n + (Number(p.stockQuantity) || 0); }, 0);
        if (liveTextEl) liveTextEl.textContent = !open ? "واقف دلوقتي" : (items ? "متاح دلوقتي" : "خلص دلوقتي");
        if (liveEl) liveEl.classList.toggle("is-off", !open || !items);
        if (!open || !items) { statsEl.hidden = true; return; }
        statsEl.innerHTML =
            '<span><i class="fa-solid fa-cake-candles"></i> ' + items + (items === 1 ? " صنف جاهز" : " أصناف جاهزة") + "</span>" +
            '<span><i class="fa-solid fa-box-open"></i> باقي ' + pieces + (pieces === 1 ? " قطعة" : " قطع") + " بس</span>";
        statsEl.hidden = false;
    }

    function renderShifa() {
        var el = document.getElementById("fw-shifa");
        if (!el) return;
        var p = data.products.filter(function (x) { return x && x.options && x.options.shifa; })[0];
        if (!p || data.settings.isOpen === false) { el.hidden = true; el.innerHTML = ""; return; }
        var n = p.options.shifa;
        var details = Array.isArray(n.details) ? n.details : [];
        el.innerHTML = '<div class="fw-shifa-ic" aria-hidden="true">🤍</div>' +
            '<div class="fw-shifa-body"><h2>' + esc(n.title || "") + '</h2><p class="fw-shifa-dua">' + esc(n.dua || "") + '</p>' +
            (details.length ? '<ul class="fw-shifa-list">' + details.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
        el.hidden = false;
    }

    function showState(icon, title, text, withMenuBtn) {
        stateEl.innerHTML = '<i class="fa-solid ' + icon + '"></i><h2>' + esc(title) + "</h2><p>" + esc(text) + "</p>" +
            (withMenuBtn ? '<a class="fw-btn" href="/menu.html"><i class="fa-solid fa-cake-candles"></i> شوفي المنيو الكامل</a>' : "");
        stateEl.hidden = false;
        gridEl.innerHTML = "";
    }

    function applyHero() {
        var s = data.settings;
        if (titleEl) titleEl.textContent = s.heroTitle || "فوري دلوقتي";
        if (subtitleEl) subtitleEl.textContent = s.heroSubtitle || "اطلبي دلوقتي واستلمي دلوقتي";
        var img = safeUrl(s.heroImage);
        if (img) {
            heroEl.classList.add("has-image");
            heroEl.style.backgroundImage = "url(\"" + img.replace(/["\\\n\r]/g, "") + "\")";
        } else {
            heroEl.classList.remove("has-image");
            heroEl.style.backgroundImage = "";
        }
    }

    // 🍓 وضع "اختيار أكتر من نكهة": options.multiPick = true => كل نكهة ليها عدّاد خاص، والمجموع ≤ المتاح، وكل نكهة بتتضاف كسطر مستقل في السلة.
    function isMulti(p) { return !!(p && p.options && p.options.multiPick) && toppingsOf(p).length > 0; }
    function picksTotal(st) {
        var n = 0;
        Object.keys(st.picks || {}).forEach(function (k) { n += st.picks[k] || 0; });
        return n;
    }

    function cardHTML(p) {
        var st = sel[p.id] || (sel[p.id] = { topping: "", qty: 1 });
        var tops = toppingsOf(p);
        var max = maxQtyFor(p);
        var multi = isMulti(p);
        st.picks = st.picks || {};
        Object.keys(st.picks).forEach(function (k) { if (tops.indexOf(k) === -1 || !(st.picks[k] > 0)) delete st.picks[k]; });
        // لو الكمية المتاحة قلّت (حد تاني طلب) نقلّل اختيارات العميلة لحد المتاح
        var over = picksTotal(st) - max;
        if (over > 0) {
            Object.keys(st.picks).reverse().forEach(function (k) {
                while (over > 0 && st.picks[k] > 0) { st.picks[k]--; over--; }
                if (!st.picks[k]) delete st.picks[k];
            });
        }
        var pickedTotal = picksTotal(st);
        if (tops.length && !multi && tops.indexOf(st.topping) === -1) st.topping = "";
        if (st.qty > max) st.qty = Math.max(1, max);
        if (st.qty < 1) st.qty = 1;

        var left = Number(p.stockQuantity) || 0;
        var img = safeUrl(p.images && p.images[0]) || "https://res.cloudinary.com/dyx4w0dr1/image/upload/v1780054759/logo_igggsb.png";
        var price = Math.round(unitPrice(p));
        var oldPrice = Math.round(Number(p.oldPrice) || 0);
        var id = esc(p.id);

        var topsHTML = "";
        if (multi) {
            var mlabel = esc((p.options && p.options.toppingsLabel) || "اختاري النكهات");
            topsHTML = '<p class="fw-opt-label">' + mlabel + ' <span class="fw-opt-hint">(تقدري تختاري أكتر من نكهة)</span></p><div class="fw-flavors" role="group" aria-label="' + mlabel + '">' +
                tops.map(function (f) {
                    var n = st.picks[f] || 0;
                    return '<div class="fw-flavor' + (n ? " is-picked" : "") + '"><span class="fw-flavor-name">' + esc(f) + '</span>' +
                        '<div class="fw-qty fw-qty-sm"><button type="button" data-fw-act="fminus" data-fw-flavor="' + esc(f) + '" aria-label="نقّصي ' + esc(f) + '"' + (n < 1 ? " disabled" : "") + '>−</button>' +
                        '<span>' + n + '</span>' +
                        '<button type="button" data-fw-act="fplus" data-fw-flavor="' + esc(f) + '" aria-label="زوّدي ' + esc(f) + '"' + (pickedTotal >= max ? " disabled" : "") + '>+</button></div></div>';
                }).join("") + '</div><p class="fw-pick-total">' + (pickedTotal ? "اخترتي " + pickedTotal + (pickedTotal === 1 ? " قطعة" : " قطع") : "لسه ما اخترتيش نكهات") + "</p>";
        } else if (tops.length) {
            var label = esc((p.options && p.options.toppingsLabel) || "اختاري التوبينج");
            topsHTML = '<p class="fw-opt-label">' + label + '</p><div class="fw-chips" role="group" aria-label="' + label + '">' +
                tops.map(function (t) {
                    return '<button type="button" class="fw-chip" data-fw-topping="' + esc(t) + '" aria-pressed="' + (st.topping === t ? "true" : "false") + '">' + esc(t) + "</button>";
                }).join("") + "</div>";
        }

        return '<article class="fw-card" data-fw-id="' + id + '">' +
            '<div class="fw-card-img"><img src="' + esc(img) + '" alt="' + esc(p.title) + '" loading="lazy">' +
            '<span class="fw-left' + (left <= 2 ? " is-low" : "") + '">باقي ' + left + (left === 1 ? " قطعة" : " قطع") + "</span></div>" +
            '<div class="fw-card-body">' +
            '<h2 class="fw-card-title">' + esc(p.title) + "</h2>" +
            (p.flavorName ? '<p class="fw-card-flavor">' + esc(p.flavorName) + "</p>" : "") +
            '<div class="fw-price-row">' +
            (oldPrice > price ? '<span class="fw-price-old" aria-label="السعر الأصلي ' + oldPrice + ' جنيه"><s>' + oldPrice + ' جنيه</s></span>' : "") +
            '<div class="fw-price">' + price + "<small>جنيه</small></div>" +
            (oldPrice > price ? '<span class="fw-price-save">وفّرتي ' + (oldPrice - price) + ' جنيه</span>' : "") + "</div>" +
            topsHTML +
            '<div class="fw-row">' +
            (multi ? "" : '<div class="fw-qty"><button type="button" data-fw-act="minus" aria-label="نقّصي"' + (st.qty <= 1 ? " disabled" : "") + '>−</button>' +
            '<span data-fw-qty>' + st.qty + '</span>' +
            '<button type="button" data-fw-act="plus" aria-label="زوّدي"' + (st.qty >= max ? " disabled" : "") + '>+</button></div>') +
            '<button type="button" class="fw-btn" data-fw-act="add"' + (max < 1 ? " disabled" : "") + '><i class="fa-solid fa-cart-plus"></i> ' + (max < 1 ? "كل المتاح في سلتك" : (multi && pickedTotal ? "أضيفي " + pickedTotal + (pickedTotal === 1 ? " قطعة" : " قطع") + " للسلة" : "أضيفي للسلة")) + "</button></div>" +
            '<p class="fw-note" data-fw-note></p>' +
            "</div></article>";
    }

    function render(force) {
        var s = data.settings;
        applyHero();
        renderHeroStats();
        renderShifa();
        if (s.isOpen === false) { lastSig = "closed"; showState("fa-moon", "الفوري واقف دلوقتي", "هنفتحه تاني قريب. لحد وقتها تقدري تطلبي من المنيو الكامل.", true); return; }
        if (!data.products.length) { lastSig = "empty"; showState("fa-box-open", "القطع الفورية خلصت دلوقتي", "كل اللي جهزناه اتباع 💗 رجعي بعد شوية تلحقي الدفعة الجديدة، أو اطلبي من المنيو الكامل.", true); return; }

        var sig = data.products.map(function (p) { return p.id + ":" + p.stockQuantity + ":" + p.price; }).join("|");
        if (!force && sig === lastSig && gridEl.children.length) return; // مفيش تغيير = مفيش إعادة رسم (عشان ما نبوّظش اختيار العميلة)
        lastSig = sig;
        stateEl.hidden = true;
        gridEl.innerHTML = data.products.map(cardHTML).join("");
    }

    function findProduct(id) {
        for (var i = 0; i < data.products.length; i++) if (data.products[i].id === id) return data.products[i];
        return null;
    }
    function setNote(card, msg) { var n = card && card.querySelector("[data-fw-note]"); if (n) n.textContent = msg || ""; }

    function refreshCard(id) {
        var old = gridEl.querySelector('[data-fw-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
        var p = findProduct(id);
        if (!old || !p) return;
        var tmp = document.createElement("div");
        tmp.innerHTML = cardHTML(p);
        old.replaceWith(tmp.firstElementChild);
    }

    // بيضيف سطر (أو يزوّد سطر موجود) لنكهة واحدة. بيرجّع false لو حصلت مشكلة.
    function upsertLine(p, cart, topping, qty) {
        var lineId = p.id + (topping ? "-top-" + encodeURIComponent(topping) : "");
        for (var i = 0; i < cart.length; i++) {
            if (cart[i] && cart[i].id === lineId) {
                cart[i].quantity = Math.min((parseInt(cart[i].quantity, 10) || 0) + qty, MAX_LINE_QTY);
                return true;
            }
        }
        var opts = topping ? { flavorName: (p.flavorName ? p.flavorName + " • " : "") + topping } : {};
        var item = window.createCartItem(p, opts, qty);
        if (!item) return false;
        item.id = lineId;
        item.customDetails = item.customDetails || {};
        item.customDetails.fawri = true;
        if (p.options && p.options.earliestPickup) item.customDetails.earliestPickup = String(p.options.earliestPickup);
        if (topping) item.customDetails.fawriTopping = topping;
        cart.push(item);
        return true;
    }

    function addToCart(p, card) {
        var st = sel[p.id] || { topping: "", qty: 1 };
        var tops = toppingsOf(p);
        var multi = isMulti(p);
        var max = maxQtyFor(p);
        if (max < 1) { setNote(card, "كل المتاح من الصنف ده في سلتك بالفعل."); return; }

        var entries = [];
        if (multi) {
            Object.keys(st.picks || {}).forEach(function (k) { if (st.picks[k] > 0) entries.push({ topping: k, qty: st.picks[k] }); });
            if (!entries.length) { setNote(card, "اختاري نكهة واحدة على الأقل."); return; }
        } else {
            if (tops.length && !st.topping) { setNote(card, "اختاري التوبينج الأول."); return; }
            entries.push({ topping: st.topping, qty: Math.min(st.qty, max) });
        }
        var qty = entries.reduce(function (s, e) { return s + e.qty; }, 0);
        if (qty > max) { setNote(card, "الكمية المتاحة دلوقتي " + max + " بس."); return; }

        if (typeof window.createCartItem !== "function") { setNote(card, "الصفحة لسه بتحمّل، جرّبي كمان ثانية."); return; }

        var cart = readCart();
        for (var k = 0; k < entries.length; k++) {
            if (!upsertLine(p, cart, entries[k].topping, entries[k].qty)) { setNote(card, "حصلت مشكلة، جرّبي تاني."); return; }
        }
        try { localStorage.setItem("bose_cart", JSON.stringify(cart)); } catch (e) { setNote(card, "مش قادرين نحفظ السلة على الجهاز ده."); return; }
        if (typeof window.updateGlobalCartCounter === "function") window.updateGlobalCartCounter();
        try {
            if (typeof window.fireBoseCommerceEvent === "function") {
                window.fireBoseCommerceEvent("add_to_cart", { value: unitPrice(p) * qty, currency: "EGP", contentId: p.id, contentName: p.title, quantity: qty });
            }
        } catch (e) { /* التتبع مش لازم يوقف الإضافة */ }
        if (typeof window.showBosePostAddToCartPrompt === "function") {
            window.showBosePostAddToCartPrompt({ message: "تمت الإضافة ⚡ كمّلي طلبك قبل ما الكمية تخلص." });
        }
        st.qty = 1;
        st.picks = {};
        refreshCard(p.id);
    }

    function onClick(e) {
        var t = e.target;
        if (!t || !t.closest) return;
        var card = t.closest("[data-fw-id]");
        if (!card) return;
        var id = card.getAttribute("data-fw-id");
        var p = findProduct(id);
        if (!p) return;
        var st = sel[id] || (sel[id] = { topping: "", qty: 1 });

        var chip = t.closest("[data-fw-topping]");
        if (chip) { st.topping = chip.getAttribute("data-fw-topping"); refreshCard(id); return; }

        var btn = t.closest("[data-fw-act]");
        if (!btn) return;
        var act = btn.getAttribute("data-fw-act");
        if (act === "fplus" || act === "fminus") {
            var fl = btn.getAttribute("data-fw-flavor");
            st.picks = st.picks || {};
            var cur = st.picks[fl] || 0;
            if (act === "fplus") { if (picksTotal(st) < maxQtyFor(p)) st.picks[fl] = cur + 1; }
            else if (cur > 0) { st.picks[fl] = cur - 1; if (!st.picks[fl]) delete st.picks[fl]; }
            refreshCard(id);
            return;
        }
        if (act === "plus") { st.qty = Math.min(st.qty + 1, Math.max(1, maxQtyFor(p))); refreshCard(id); }
        else if (act === "minus") { st.qty = Math.max(1, st.qty - 1); refreshCard(id); }
        else if (act === "add") { addToCart(p, card); }
    }

    function load(force) {
        if (!window.BoseSupabase || typeof window.BoseSupabase.loadBoseFawriData !== "function") return Promise.resolve();
        return window.BoseSupabase.loadBoseFawriData().then(function (d) {
            data = d;
            loadedOnce = true;
            renderPerks();
            render(!!force);
        }).catch(function (err) {
            console.warn("تعذر تحميل بيانات الفوري:", err);
            if (!loadedOnce) showState("fa-triangle-exclamation", "مش قادرين نحمّل الفوري دلوقتي", "اتأكدي من الإنترنت وجرّبي تحدّثي الصفحة.", true);
        });
    }

    function init() {
        gridEl = document.getElementById("fw-grid");
        stateEl = document.getElementById("fw-state");
        perksEl = document.getElementById("fw-perks");
        statsEl = document.getElementById("fw-hero-stats");
        liveEl = document.getElementById("fw-live");
        liveTextEl = document.getElementById("fw-live-text");
        heroEl = document.getElementById("fw-hero");
        titleEl = document.getElementById("fw-title");
        subtitleEl = document.getElementById("fw-subtitle");
        if (!gridEl) return;

        gridEl.addEventListener("click", onClick);
        renderPerks();
        window.addEventListener("BoseDatabaseLoaded", function () { renderPerks(); render(true); });
        window.addEventListener("storage", function (ev) { if (ev.key === "bose_cart" && loadedOnce) render(true); });

        load(true);
        setInterval(function () { if (!document.hidden) load(false); }, POLL_MS);
        document.addEventListener("visibilitychange", function () { if (!document.hidden) load(false); });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
