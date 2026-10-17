/**
 * 🔍 عارض صور الهدايا (منبثق بملء الشاشة)
 * - أي صورة هدية (في كروت صفحة الهدايا، صورة صفحة الهدية، صور القطع) لما العميل يضغط عليها تتفتح كبيرة.
 * - جوه العارض نفسه يقدر يتنقل بين كل صور الهدية وقطعها (سحب بالإصبع، أسهم، صور مصغرة تحت) من غير ما يقفل.
 * - زرار الرجوع في الموبايل بيقفل العارض بس (مش بيطلّع العميل من الصفحة).
 * مفيش inline scripts ولا onclick (الـ CSP صارم): كله مستمعات هنا.
 */
(function () {
    "use strict";
    if (window.BoseGiftLightbox) return;
    var REG = {};
    var st = { list: [], i: 0, open: false, zoom: false };
    var root, imgEl, capEl, cntEl, thumbsEl, prevBtn, nextBtn;

    function esc(v) {
        v = v == null ? "" : String(v);
        return v.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
    }
    function big(u) { return window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(u, 1400) : u; }
    function small(u) { return window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(u, 160) : u; }
    function money(n) { return Math.round(Number(n) || 0).toLocaleString("ar-EG") + " ج"; }
    function okUrl(u) { return /^https:\/\//i.test(String(u || "")); }

    /* بنبني قايمة الصور: صور الهدية الأساسية + صور القطع (من غير تكرار) ومعاها اسم القطعة وسعرها */
    function registerGift(product, bundleItems) {
        if (!product || !product.id) return;
        injectCss();
        var list = [], seen = {};
        var byUrl = {};
        (bundleItems || []).forEach(function (b) { if (b && b.image) byUrl[b.image] = b; });
        (product.images || []).forEach(function (u, idx) {
            if (!okUrl(u) || seen[u]) return;
            seen[u] = 1;
            var b = byUrl[u];
            list.push(b ? { src: u, title: b.label, sub: b.description, price: b.alone_price }
                        : { src: u, title: idx === 0 ? product.title : "", sub: "", price: null });
        });
        (bundleItems || []).forEach(function (b) {
            if (!b || !okUrl(b.image) || seen[b.image]) return;
            seen[b.image] = 1;
            list.push({ src: b.image, title: b.label, sub: b.description, price: b.alone_price });
        });
        REG[product.id] = list;
    }

    var LB_CSS = "/* ===== عارض الصور المنبثق ===== */\n.gf-card .product-card-img, .bose-product-page-layout .product-card-unified > .product-card-img, .gf-contents__row img, .gd-item__img { cursor: zoom-in; }\nhtml.gl-lock, html.gl-lock body { overflow: hidden; }\n.gl-root { position: fixed; inset: 0; z-index: 100000; background: rgba(10,8,9,.96); display: flex; flex-direction: column; align-items: center; justify-content: center; direction: rtl; }\n.gl-root[hidden] { display: none; }\n.gl-stage { flex: 1; width: 100%; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: auto; touch-action: pan-y; padding: 56px 12px 8px; box-sizing: border-box; }\n.gl-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; cursor: zoom-in; transition: transform .2s ease; user-select: none; -webkit-user-drag: none; }\n.gl-img.is-zoomed { transform: scale(2); cursor: zoom-out; }\n.gl-close { position: absolute; top: max(12px, env(safe-area-inset-top)); inset-inline-start: 12px; width: 46px; height: 46px; border-radius: 50%; border: 0; background: rgba(255,255,255,.16); color: #fff; font-size: 20px; cursor: pointer; z-index: 3; }\n.gl-count { position: absolute; top: max(22px, calc(env(safe-area-inset-top) + 10px)); inset-inline-end: 16px; color: #fff; font-weight: 800; font-size: 15px; background: rgba(255,255,255,.14); padding: 4px 12px; border-radius: 999px; z-index: 3; }\n.gl-nav { position: absolute; top: 45%; width: 46px; height: 46px; border-radius: 50%; border: 0; background: rgba(255,255,255,.18); color: #fff; font-size: 18px; cursor: pointer; z-index: 3; }\n.gl-prev { right: 10px; }\n.gl-next { left: 10px; }\n.gl-cap { width: 100%; max-width: 640px; color: #fff; text-align: center; padding: 6px 16px; display: grid; gap: 2px; box-sizing: border-box; }\n.gl-cap strong { font-size: 18px; }\n.gl-cap span { font-size: 14.5px; opacity: .85; line-height: 1.7; }\n.gl-cap em { font-style: normal; font-weight: 800; font-size: 15px; color: #ffb3c6; }\n.gl-thumbs { display: flex; gap: 8px; overflow-x: auto; max-width: 100%; padding: 8px 14px calc(14px + env(safe-area-inset-bottom)); box-sizing: border-box; }\n.gl-th { flex: 0 0 auto; width: 58px; height: 58px; border-radius: 12px; border: 2px solid transparent; padding: 0; overflow: hidden; background: #222; cursor: pointer; opacity: .6; }\n.gl-th img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.gl-th.is-on { border-color: #ff8fab; opacity: 1; }\n@media (max-width: 600px) { .gl-nav { width: 40px; height: 40px; top: 40%; } }\n\n/* ===== كروت الهدايا بنفس المقاس: صورة + اسم + (جواها N قطع) + سعر + زرار ===== */\n.gf-grid { align-items: stretch; }\n.gf-card { display: flex; }\n.gf-card .product-card-unified { height: 100%; width: 100%; display: flex; flex-direction: column; }\n.gf-card .product-card-desc,\n.gf-card .bose-desc-toggle-btn,\n.gf-card .product-card-flavor-name,\n.gf-card .bose-card-size-pill,\n.gf-card .bose-mini-size-note { display: none !important; }\n.gf-card .product-card-title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; min-height: 3em; margin-bottom: 6px; }\n.gf-card .product-card-price { margin-top: auto; }\n.gf-contents--mini { margin: 0 0 8px; padding: 6px 10px; font-size: 13px; font-weight: 800; color: var(--bose-pink); background: rgba(var(--bose-pink-rgb), .1); border-radius: 999px; width: fit-content; }\n\n";
    function injectCss() {
        if (document.getElementById("gl-style")) return;
        var s = document.createElement("style");
        s.id = "gl-style";
        s.textContent = LB_CSS;
        document.head.appendChild(s);
    }

    function build() {
        if (root) return;
        injectCss();
        root = document.createElement("div");
        root.className = "gl-root";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.setAttribute("aria-label", "عرض صور الهدية");
        root.hidden = true;
        root.innerHTML =
            '<button type="button" class="gl-close" data-gl="close" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>' +
            '<div class="gl-count" id="gl-count"></div>' +
            '<button type="button" class="gl-nav gl-prev" data-gl="prev" aria-label="الصورة السابقة"><i class="fa-solid fa-chevron-right"></i></button>' +
            '<div class="gl-stage" id="gl-stage"><img class="gl-img" id="gl-img" alt="" draggable="false"></div>' +
            '<button type="button" class="gl-nav gl-next" data-gl="next" aria-label="الصورة التالية"><i class="fa-solid fa-chevron-left"></i></button>' +
            '<div class="gl-cap" id="gl-cap"></div>' +
            '<div class="gl-thumbs" id="gl-thumbs"></div>';
        document.body.appendChild(root);
        imgEl = root.querySelector("#gl-img");
        capEl = root.querySelector("#gl-cap");
        cntEl = root.querySelector("#gl-count");
        thumbsEl = root.querySelector("#gl-thumbs");
        prevBtn = root.querySelector(".gl-prev");
        nextBtn = root.querySelector(".gl-next");

        root.addEventListener("click", function (e) {
            var a = e.target.closest("[data-gl]");
            if (a) {
                var k = a.getAttribute("data-gl");
                if (k === "close") close(true);
                else if (k === "prev") go(-1);
                else if (k === "next") go(1);
                return;
            }
            var th = e.target.closest("[data-gl-i]");
            if (th) { show(Number(th.getAttribute("data-gl-i"))); return; }
            if (e.target === imgEl) { toggleZoom(); return; }
            if (e.target.id === "gl-stage" || e.target === root) close(true);
        });

        /* سحب بالإصبع يمين/شمال */
        var sx = null, sy = null;
        var stage = root.querySelector("#gl-stage");
        stage.addEventListener("touchstart", function (e) {
            if (st.zoom || e.touches.length !== 1) { sx = null; return; }
            sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        }, { passive: true });
        stage.addEventListener("touchend", function (e) {
            if (sx == null) return;
            var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
            sx = null;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
        }, { passive: true });
    }

    function toggleZoom() {
        st.zoom = !st.zoom;
        imgEl.classList.toggle("is-zoomed", st.zoom);
    }

    function preload(i) {
        var it = st.list[i];
        if (it) { var im = new Image(); im.src = big(it.src); }
    }

    function show(i) {
        var n = st.list.length;
        if (!n) return;
        st.i = (i + n) % n;
        st.zoom = false;
        imgEl.classList.remove("is-zoomed");
        var it = st.list[st.i];
        imgEl.src = big(it.src);
        imgEl.alt = it.title || "صورة الهدية";
        cntEl.textContent = (st.i + 1) + " / " + n;
        var cap = "";
        if (it.title) cap += '<strong>' + esc(it.title) + "</strong>";
        if (it.sub) cap += "<span>" + esc(it.sub) + "</span>";
        if (Number(it.price) > 0) cap += '<em>لوحدها: ' + esc(money(it.price)) + "</em>";
        capEl.innerHTML = cap;
        capEl.style.display = cap ? "" : "none";
        prevBtn.style.display = nextBtn.style.display = n > 1 ? "" : "none";
        thumbsEl.style.display = n > 1 ? "" : "none";
        Array.prototype.forEach.call(thumbsEl.children, function (c, idx) { c.classList.toggle("is-on", idx === st.i); });
        var active = thumbsEl.children[st.i];
        if (active && active.scrollIntoView) { try { active.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) { /* مش حرج */ } }
        preload(st.i + 1); preload(st.i - 1);
    }
    function go(d) { show(st.i + d); }

    function open(id, src) {
        var list = REG[id];
        if (!list || !list.length) return false;
        build();
        st.list = list;
        thumbsEl.innerHTML = list.map(function (it, i) {
            return '<button type="button" class="gl-th" data-gl-i="' + i + '" aria-label="صورة ' + (i + 1) + '"><img src="' + esc(small(it.src)) + '" alt="" loading="lazy"></button>';
        }).join("");
        var start = 0;
        if (src) { for (var k = 0; k < list.length; k++) if (list[k].src === src) { start = k; break; } }
        root.hidden = false;
        document.documentElement.classList.add("gl-lock");
        st.open = true;
        show(start);
        try { history.pushState({ glOpen: 1 }, ""); } catch (e) { /* مش حرج */ }
        var cb = root.querySelector(".gl-close");
        if (cb) cb.focus();
        return true;
    }

    function close(fromUi) {
        if (!st.open) return;
        st.open = false;
        root.hidden = true;
        imgEl.removeAttribute("src");
        document.documentElement.classList.remove("gl-lock");
        if (fromUi && history.state && history.state.glOpen) { try { history.back(); } catch (e) { /* مش حرج */ } }
    }

    window.addEventListener("popstate", function () { if (st.open) close(false); });
    document.addEventListener("keydown", function (e) {
        if (!st.open) return;
        if (e.key === "Escape") close(true);
        else if (e.key === "ArrowLeft") go(1);   /* الصفحة RTL: الشمال = التالي */
        else if (e.key === "ArrowRight") go(-1);
    });

    /* التقاط الضغطة قبل ما كارت الهدية يودّي لصفحة التفاصيل */
    document.addEventListener("click", function (e) {
        var t = e.target;
        if (!t || !t.closest || st.open) return;
        var ex = t.closest("[data-lb-id]");
        if (ex) {
            if (open(ex.getAttribute("data-lb-id"), ex.getAttribute("data-lb-src"))) { e.preventDefault(); e.stopPropagation(); }
            return;
        }
        var img = t.closest("img.product-card-img");
        if (!img) return;
        var card = img.closest(".product-card-unified");
        var id = card && card.getAttribute("data-id");
        if (!id || !REG[id]) return;
        if (!img.closest(".gf-card") && !img.closest(".bose-product-page-layout")) return;
        if (open(id, null)) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    window.BoseGiftLightbox = { registerGift: registerGift, open: open, close: function () { close(true); } };
})();

/**
 * 🎁 تفاصيل الهدية (product.html): اللي جوه الهدية قطعة قطعة
 * كل قطعة: صورة + اسم + سطر عنها + سعرها لوحدها + زرار "اشتريها لوحدها" (لو متعلّمة تتباع لوحدها).
 * تحت القطع: لوحدهم كام / الهدية كاملة كام / بتوفري كام (بس لو كل الأسعار مكتوبة والتوفير حقيقي).
 * مفيش inline scripts ولا onclick (الـ CSP صارم): الضغط بيتمسك بمستمع واحد على document.
 */
(function () {
    "use strict";

    var esc = function (v) {
        v = v == null ? "" : String(v);
        return window.escapeBoseHTML ? window.escapeBoseHTML(v) : v.replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    };
    function money(n) { return Math.round(Number(n) || 0).toLocaleString("ar-EG") + " ج"; }
    function img(u, w) {
        u = String(u || "");
        if (!/^https:\/\//i.test(u)) return "";
        return window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(u, w) : u;
    }
    function productById(id) {
        var list = (window.BoseStoreData && window.BoseStoreData.products) || [];
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
    }

    function itemHTML(b) {
        var alone = b.item_product_id ? productById(b.item_product_id) : null;
        var canBuy = !!(b.sell_alone && alone && alone.isAvailable !== false);
        var price = canBuy ? Number(alone.price) : Number(b.alone_price);
        var src = img(b.image || (alone && alone.images && alone.images[0]), 240);
        var qty = parseInt(b.qty, 10) || 1;
        var rawSrc = b.image || (alone && alone.images && alone.images[0]) || "";
        var picture = src
            ? '<img class="gd-item__img" src="' + esc(src) + '" alt="' + esc(b.label) + '" width="96" height="96" loading="lazy" data-lb-id="' + esc(b.bundle_product_id) + '" data-lb-src="' + esc(rawSrc) + '">'
            : '<div class="gd-item__img gd-item__img--none"><i class="fa-solid fa-gift"></i></div>';
        var action = canBuy
            ? '<button type="button" class="gd-buy" data-gift-add="' + esc(alone.id) + '"><i class="fa-solid fa-basket-shopping"></i> اشتريها لوحدها بـ ' + esc(money(price)) + "</button>"
            : '<span class="gd-only">بتيجي جوه الهدية</span>';
        return '<li class="gd-item">' + picture +
            '<div class="gd-item__body">' +
            '<h4 class="gd-item__name">' + esc(b.label) + (qty > 1 ? ' <span class="gd-qty">× ' + esc(qty) + "</span>" : "") + "</h4>" +
            (b.description ? '<p class="gd-item__desc">' + esc(b.description) + "</p>" : "") +
            (price > 0 ? '<p class="gd-item__price">لوحدها: <strong>' + esc(money(price)) + "</strong>" + (qty > 1 ? " للواحدة" : "") + "</p>" : "") +
            action + "</div></li>";
    }

    function render(product, anchorEl) {
        if (!product || !product.isGift || !anchorEl) return;
        if (!window.BoseSupabase || !window.BoseSupabase.loadBoseGiftsData) return;
        window.BoseSupabase.loadBoseGiftsData().then(function (g) {
            var items = (g.bundleItems || []).filter(function (b) { return b.bundle_product_id === product.id; });
            var meta = (g.giftProducts || []).filter(function (x) { return x.product_id === product.id; })[0] || {};
            var price = Number(product.price) || 0;
            var html = "";
            if (window.BoseGiftLightbox) window.BoseGiftLightbox.registerGift(product, items);

            if (items.length) {
                var total = 0, allKnown = true, pieces = 0;
                items.forEach(function (b) {
                    var q = parseInt(b.qty, 10) || 1;
                    pieces += q;
                    if (b.alone_price == null || b.alone_price === "") allKnown = false;
                    else total += Number(b.alone_price) * q;
                });
                html += '<header class="gd-head"><h3>اللي جوه الهدية</h3><span>' + esc(items.length) + (items.length === 1 ? " قطعة" : " قطع") + "</span></header>";
                html += '<p class="gd-sub">دي كل حاجة هتوصلك في البوكس. اضغطي على أي صورة تكبّريها وتتصفحي باقي الصور. وأي قطعة عليها زرار تقدري تشتريها لوحدها.</p>';
                html += '<ul class="gd-list">' + items.map(itemHTML).join("") + "</ul>";
                if (allKnown && total > price) {
                    html += '<div class="gd-sum"><div><span>لو اشتريتيهم لوحدهم</span><b class="gd-sum__old">' + esc(money(total)) + "</b></div>" +
                        '<div><span>الهدية كاملة</span><b>' + esc(money(price)) + "</b></div>" +
                        '<div class="gd-sum__save"><span>بتوفري</span><b>' + esc(money(total - price)) + "</b></div></div>";
                }
            } else if (meta.summary) {
                html += '<header class="gd-head"><h3>اللي جوه الهدية</h3></header><p class="gd-plain">' + esc(meta.summary) + "</p>";
            }

            html += '<p class="gd-note"><i class="fa-regular fa-clock"></i> ' + esc(meta.delivery_note || "الهدايا بتتجهز مخصوص لطلبك، فلازم الحجز قبل ميعاد التسليم بـ 3 أيام على الأقل.") + "</p>";

            var old = document.querySelector(".bose-gift-contents");
            if (old) old.remove();
            var box = document.createElement("section");
            box.className = "bose-gift-contents";
            box.innerHTML = html;
            anchorEl.insertAdjacentElement("afterend", box);
        }).catch(function () { /* الصفحة تفضل شغالة من غير القسم ده */ });
    }

    document.addEventListener("click", function (e) {
        var btn = e.target.closest && e.target.closest("[data-gift-add]");
        if (!btn || btn.disabled) return;
        var id = btn.getAttribute("data-gift-add");
        if (typeof window.handleBoseDirectAddToCart === "function") window.handleBoseDirectAddToCart(btn, id);
    });

    window.BoseGiftDetail = { render: render };
})();
