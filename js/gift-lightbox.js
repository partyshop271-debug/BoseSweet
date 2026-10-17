/**
 * 🔍 عارض صور الهدايا (منبثق بملء الشاشة)
 * - أي صورة هدية (في كروت صفحة الهدايا، صورة صفحة الهدية، صور القطع) لما العميل يضغط عليها تتفتح كبيرة.
 * - جوه العارض نفسه يقدر يتنقل بين كل صور الهدية وقطعها (سحب بالإصبع، أسهم، صور مصغرة تحت) من غير ما يقفل.
 * - زرار الرجوع في الموبايل بيقفل العارض بس (مش بيطلّع العميل من الصفحة).
 * مفيش inline scripts ولا onclick (الـ CSP صارم): كله مستمعات هنا.
 */
(function () {
    "use strict";
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

    function build() {
        if (root) return;
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
