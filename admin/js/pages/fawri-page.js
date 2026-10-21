/**
 * fawri-page.js - إدارة قسم "الفوري" (admin/fawri.html)
 * =====================================================================
 * - إعدادات الصفحة (جدول fawri_settings): شغال/واقف + العنوان + صورة البنر.
 * - وقت تجهيز الطلب الفوري (order_rules.minPreparationTimeHoursFawri) - نفس الرقم اللي السيرفر بيفرضه.
 * - القطع الفورية: صفوف عادية في جدول products بـ id بيبدأ بـ fawri-. الكمية = stock_quantity،
 *   والسيرفر بيخصمها لوحده مع كل طلب ويقفل الصنف (is_available=false) لما توصل صفر.
 * الحماية الحقيقية على السيرفر (RLS + is_bose_admin) - الصفحة دي واجهة بس.
 */
(function () {
    "use strict";

    var UI = window.BoseAdminUI;
    var client = window.BoseAdmin.client;
    var e = UI.escapeHtml;

    var editingId = null;      // null = إضافة جديدة
    var formImage = "";        // رابط صورة النموذج الحالي
    var heroImage = "";
    var products = [];

    function $(id) { return document.getElementById(id); }

    function newId() {
        var d = new Date();
        var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
        var rnd = Math.random().toString(36).slice(2, 6);
        return "fawri-" + stamp + "-" + rnd;
    }

    function setImg(imgEl, url) {
        if (url) { imgEl.src = url; imgEl.style.display = ""; } else { imgEl.removeAttribute("src"); imgEl.style.display = "none"; }
    }

    /* ---------------------- الإعدادات ---------------------- */

    async function loadSettings() {
        var res = await client.from("fawri_settings").select("*").eq("id", 1).maybeSingle();
        if (res.error) throw res.error;
        var s = res.data || {};
        $("fw-is-open").checked = s.is_open !== false;
        $("fw-hero-title").value = s.hero_title || "";
        $("fw-hero-subtitle").value = s.hero_subtitle || "";
        heroImage = s.hero_image || "";
        setImg($("fw-hero-preview"), heroImage);
        $("fw-hero-clear").style.display = heroImage ? "" : "none";

        var rulesRes = await client.from("store_settings").select("order_rules").eq("id", 1).maybeSingle();
        var rules = (rulesRes.data && rulesRes.data.order_rules) || {};
        var lead = Number(rules.minPreparationTimeHoursFawri);
        $("fw-lead-hours").value = isFinite(lead) && rules.minPreparationTimeHoursFawri !== undefined ? lead : 1;
    }

    async function saveSettings() {
        var btn = $("fw-save-settings");
        btn.disabled = true;
        try {
            var lead = parseFloat($("fw-lead-hours").value);
            if (!isFinite(lead) || lead < 0) lead = 1;

            var up = await client.from("fawri_settings").upsert({
                id: 1,
                is_open: $("fw-is-open").checked,
                hero_title: $("fw-hero-title").value.trim() || null,
                hero_subtitle: $("fw-hero-subtitle").value.trim() || null,
                hero_image: heroImage || null,
            });
            if (up.error) throw up.error;

            // نقرا order_rules الحالية ونعدّل مفتاح واحد بس (من غير ما نمسح باقي القواعد)
            var cur = await client.from("store_settings").select("order_rules").eq("id", 1).maybeSingle();
            if (cur.error) throw cur.error;
            var rules = Object.assign({}, (cur.data && cur.data.order_rules) || {}, { minPreparationTimeHoursFawri: lead });
            var upd = await client.from("store_settings").update({ order_rules: rules, updated_at: new Date().toISOString() }).eq("id", 1);
            if (upd.error) throw upd.error;

            UI.showToast("اتحفظت إعدادات الفوري ✅");
        } catch (err) {
            console.error(err);
            UI.showToast("مقدرناش نحفظ الإعدادات: " + (err.message || "خطأ غير معروف"), "error");
        } finally {
            btn.disabled = false;
        }
    }

    /* ---------------------- القطع ---------------------- */

    async function loadProducts() {
        var res = await client.from("products").select("*").like("id", "fawri-%").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
        if (res.error) throw res.error;
        products = res.data || [];
        renderList();
    }

    function renderList() {
        var box = $("fw-list");
        if (!products.length) {
            box.innerHTML = UI.emptyStateHTML({ icon: "fa-bolt", title: "مفيش قطع فورية لسه", text: "دوسي \"إضافة قطعة فورية\" وارفعي أول قطعة جاهزة." });
            return;
        }
        box.innerHTML = products.map(function (p) {
            var stock = Number(p.stock_quantity) || 0;
            var live = p.is_available !== false && stock > 0;
            var tops = (p.options && Array.isArray(p.options.toppings)) ? p.options.toppings : [];
            var img = (p.images && p.images[0]) || "";
            return '<div class="adm-pending-order-row" data-id="' + e(p.id) + '" style="align-items:center; gap:12px; flex-wrap:wrap;">' +
                (img ? '<img src="' + e(img) + '" alt="" style="width:56px;height:56px;border-radius:10px;object-fit:cover;">' : "") +
                '<div class="adm-pending-order-info" style="flex:1; min-width:180px;">' +
                "<strong>" + e(p.title) + (p.flavor_name ? " - " + e(p.flavor_name) : "") + "</strong>" +
                "<small>" + Math.round(p.price || 0) + " ج.م - باقي " + stock + " قطعة" + (tops.length ? " - توبينج: " + e(tops.join("، ")) : "") + "</small>" +
                "</div>" +
                '<span class="adm-badge ' + (live ? "success" : "warning") + '">' + (live ? "ظاهر للعملاء" : "مقفول / خلص") + "</span>" +
                '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
                '<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-act="minus" title="نقّص قطعة">−</button>' +
                '<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-act="plus" title="زوّد قطعة">+</button>' +
                '<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-act="edit"><i class="fa-solid fa-pen"></i> تعديل</button>' +
                '<button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" data-act="soldout"><i class="fa-solid fa-ban"></i> خلصت</button>' +
                '<button type="button" class="adm-btn adm-btn-danger adm-btn-sm" data-act="delete"><i class="fa-solid fa-trash"></i></button>' +
                "</div></div>";
        }).join("");
    }

    async function patchProduct(id, fields, okMsg) {
        var res = await client.from("products").update(Object.assign({ updated_at: new Date().toISOString() }, fields)).eq("id", id);
        if (res.error) { UI.showToast("مقدرناش نعدّل: " + res.error.message, "error"); return false; }
        if (okMsg) UI.showToast(okMsg);
        await loadProducts();
        return true;
    }

    async function onListClick(ev) {
        var btn = ev.target.closest("[data-act]");
        if (!btn) return;
        var row = btn.closest("[data-id]");
        var id = row && row.getAttribute("data-id");
        var p = products.filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        var act = btn.getAttribute("data-act");
        var stock = Number(p.stock_quantity) || 0;

        if (act === "plus") await patchProduct(id, { stock_quantity: stock + 1, is_available: true });
        else if (act === "minus") { var n = Math.max(0, stock - 1); await patchProduct(id, { stock_quantity: n, is_available: n > 0 }); }
        else if (act === "soldout") { await patchProduct(id, { stock_quantity: 0, is_available: false }, "اتقفلت القطعة (خلصت)"); }
        else if (act === "edit") openForm(p);
        else if (act === "delete") {
            var ok = await UI.confirmAction({ title: "حذف القطعة؟", message: "هتتحذف \"" + p.title + "\" نهائيًا. الطلبات القديمة مش هتتأثر.", confirmLabel: "حذف", danger: true });
            if (!ok) return;
            var del = await client.from("products").delete().eq("id", id);
            if (del.error) { UI.showToast("مقدرناش نحذف: " + del.error.message, "error"); return; }
            UI.showToast("اتحذفت القطعة");
            await loadProducts();
        }
    }

    /* ---------------------- النموذج ---------------------- */

    function openForm(p) {
        editingId = p ? p.id : null;
        $("fw-form-title").textContent = p ? "تعديل قطعة فورية" : "قطعة فورية جديدة";
        $("fw-f-title").value = p ? (p.title || "") : "";
        $("fw-f-flavor").value = p ? (p.flavor_name || "") : "";
        $("fw-f-price").value = p ? Math.round(p.price || 0) : "";
        $("fw-f-stock").value = p ? (Number(p.stock_quantity) || 0) : "";
        var tops = p && p.options && Array.isArray(p.options.toppings) ? p.options.toppings : [];
        $("fw-f-toppings").value = tops.join("\n");
        formImage = p && p.images && p.images[0] ? p.images[0] : "";
        setImg($("fw-f-preview"), formImage);
        $("fw-form-card").style.display = "";
        $("fw-form-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function closeForm() { $("fw-form-card").style.display = "none"; editingId = null; }

    async function saveForm() {
        var title = $("fw-f-title").value.trim();
        var price = parseFloat($("fw-f-price").value);
        var stock = parseInt($("fw-f-stock").value, 10);
        if (!title) { UI.showToast("اكتبي اسم القطعة", "error"); return; }
        if (!isFinite(price) || price <= 0) { UI.showToast("اكتبي سعر صحيح", "error"); return; }
        if (!isFinite(stock) || stock < 0) { UI.showToast("اكتبي الكمية المتاحة (0 أو أكتر)", "error"); return; }
        if (!formImage) { UI.showToast("ارفعي صورة للقطعة - من غير صورة مش هتظهر كويس", "error"); return; }

        var tops = $("fw-f-toppings").value.split(/\r?\n|\s*[\/،,|]\s*/).map(function (t) { return t.trim(); }).filter(Boolean);
        // نفس الاسم مرتين = توبينج واحد
        tops = tops.filter(function (t, i) { return tops.indexOf(t) === i; });

        var btn = $("fw-f-save");
        btn.disabled = true;
        try {
            var existing = editingId ? products.filter(function (x) { return x.id === editingId; })[0] : null;
            var options = Object.assign({}, (existing && existing.options) || {});
            if (tops.length) options.toppings = tops; else delete options.toppings;

            var row = {
                title: title,
                flavor_name: $("fw-f-flavor").value.trim() || null,
                price: price,
                base_price: price,
                images: [formImage],
                stock_quantity: stock,
                is_available: stock > 0,
                options: options,
                updated_at: new Date().toISOString(),
            };
            var res;
            if (editingId) {
                res = await client.from("products").update(row).eq("id", editingId);
            } else {
                row.id = newId();
                row.layout = "grid-card";
                row.category_id = null;
                row.sort_order = 0;
                res = await client.from("products").insert(row);
            }
            if (res.error) throw res.error;
            UI.showToast(editingId ? "اتعدّلت القطعة ✅" : "اتضافت القطعة ✅ وبقت ظاهرة في صفحة الفوري");
            closeForm();
            await loadProducts();
        } catch (err) {
            console.error(err);
            UI.showToast("مقدرناش نحفظ القطعة: " + (err.message || "خطأ غير معروف"), "error");
        } finally {
            btn.disabled = false;
        }
    }

    async function uploadInto(inputId, onUrl) {
        var input = $(inputId);
        var file = input.files && input.files[0];
        if (!file) return;
        try {
            UI.showToast("جاري رفع الصورة...", "info");
            var url = await UI.uploadImageToCloudinary(file);
            onUrl(url);
            UI.showToast("اترفعت الصورة ✅");
        } catch (err) {
            console.error(err);
            UI.showToast("فشل رفع الصورة: " + (err.message || ""), "error");
        } finally {
            input.value = "";
        }
    }

    /* ---------------------- تشغيل ---------------------- */

    async function init() {
        $("fw-save-settings").addEventListener("click", saveSettings);
        $("fw-new-btn").addEventListener("click", function () { openForm(null); });
        $("fw-f-cancel").addEventListener("click", closeForm);
        $("fw-f-save").addEventListener("click", saveForm);
        $("fw-list").addEventListener("click", onListClick);
        $("fw-f-image").addEventListener("change", function () { uploadInto("fw-f-image", function (u) { formImage = u; setImg($("fw-f-preview"), u); }); });
        $("fw-hero-input").addEventListener("change", function () {
            uploadInto("fw-hero-input", function (u) { heroImage = u; setImg($("fw-hero-preview"), u); $("fw-hero-clear").style.display = ""; });
        });
        $("fw-hero-clear").addEventListener("click", function () { heroImage = ""; setImg($("fw-hero-preview"), ""); $("fw-hero-clear").style.display = "none"; });

        try {
            await Promise.all([loadSettings(), loadProducts()]);
        } catch (err) {
            console.error(err);
            UI.showToast("مقدرناش نحمّل بيانات الفوري: " + (err.message || ""), "error");
        }
    }

    // admin-auth-guard بيشيل شاشة التحميل بعد التأكد من الجلسة - نبدأ بعد تحميل الصفحة
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
