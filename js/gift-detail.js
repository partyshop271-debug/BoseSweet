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
        var picture = src
            ? '<img class="gd-item__img" src="' + esc(src) + '" alt="' + esc(b.label) + '" width="96" height="96" loading="lazy">'
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

            if (items.length) {
                var total = 0, allKnown = true, pieces = 0;
                items.forEach(function (b) {
                    var q = parseInt(b.qty, 10) || 1;
                    pieces += q;
                    if (b.alone_price == null || b.alone_price === "") allKnown = false;
                    else total += Number(b.alone_price) * q;
                });
                html += '<header class="gd-head"><h3>اللي جوه الهدية</h3><span>' + esc(items.length) + (items.length === 1 ? " قطعة" : " قطع") + "</span></header>";
                html += '<p class="gd-sub">دي كل حاجة هتوصلك في البوكس. وأي قطعة عليها زرار تقدري تشتريها لوحدها.</p>';
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
