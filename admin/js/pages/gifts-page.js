/**
 * gifts-page.js - إدارة قسم الهدايا والزينة (جداول gift_* + products)
 * =====================================================================
 * الهدية = صف عادي في جدول products (فالسلة والدفع والأوردرات بتشتغل زي ما هي)
 * + بيانات إضافية في gift_products (القسم، سطر اللي جوّاها، ملاحظة التوصيل).
 * العلامات (مناسبة / لمين / نوع / فيه إيه) في gift_tags والربط في gift_product_tags.
 * الرفوف gift_shelves، والواجهة الكبيرة gift_heroes، واللي جوّه البوكس gift_bundle_items.
 */
(function () {
    "use strict";

    const A = () => window.BoseAdmin;
    const UI = () => window.BoseAdminUI;
    const e = (v) => UI().escapeHtml(v == null ? "" : String(v));
    const T = (name) => A().giftTable(name);

    const KIND_LABELS = { occasion: "مناسبات", recipient: "لمين", type: "نوع الهدية", contains: "فيه إيه" };
    const KIND_ORDER = ["occasion", "recipient", "type", "contains"];
    const MODE_LABELS = { manual: "اخترتيها بإيدك", tag: "تلقائي من مناسبة/نوع", newest: "الأحدث" };

    let tab = "gifts";
    let sections = [], tags = [], gp = [], ptags = [], bundle = [], shelves = [], shelfItems = [], heroes = [], products = [];

    /* ============================= أدوات صغيرة ============================= */

    function toast(msg, type) { UI().showToast(msg, type || "success"); }
    function money(n) { return Number(n || 0).toLocaleString("ar-EG") + " ج"; }
    function sectionTitle(id) { return (sections.find((s) => s.id === id) || {}).title || id || "—"; }
    function tagTitle(id) { return (tags.find((t) => t.id === id) || {}).title || id; }
    function newId(prefix) { return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
    function productOf(id) { return products.find((p) => p.id === id); }
    function firstImage(p) { return p && Array.isArray(p.images) && p.images[0] ? p.images[0] : ""; }

    function fmtDay(d) {
        if (!d) return "—";
        try { return new Date(d + "T00:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" }); } catch (x) { return d; }
    }
    function fmtStamp(iso) {
        if (!iso) return "—";
        try { return new Date(iso).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch (x) { return iso; }
    }
    function toLocalInput(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const p = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    function fromLocalInput(v) {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }
    function windowStatus(row, onKey, fromKey, untilKey, isDateOnly) {
        const now = Date.now();
        if (row[onKey] === false) return { cls: "danger", text: "متوقف" };
        const f = row[fromKey] ? new Date(row[fromKey] + (isDateOnly ? "T00:00:00" : "")).getTime() : null;
        const u = row[untilKey] ? new Date(row[untilKey] + (isDateOnly ? "T23:59:59" : "")).getTime() : null;
        if (f && f > now) return { cls: "info", text: "مجدول" };
        if (u && u <= now) return { cls: "warning", text: "منتهي" };
        return { cls: "success", text: "ظاهر دلوقتي" };
    }

    function field(label, inner, hint) {
        return `<div class="adm-field"><label>${label}</label>${inner}${hint ? `<span class="adm-hint">${hint}</span>` : ""}</div>`;
    }

    /** مودال عام: بيبني الفورم، وبيقفل لوحده بعد نجاح الحفظ */
    function openModal(title, bodyHtml, onSubmit, afterMount) {
        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 600px; max-height: 92vh; overflow-y: auto;">
                <div class="adm-modal-header">
                    <h3>${e(title)}</h3>
                    <button class="adm-modal-close" type="button" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form class="gf-form">
                    ${bodyHtml}
                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary gf-save">حفظ</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);
        const close = () => overlay.remove();
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay || evt.target.closest('[data-role="close"]')) close();
        });
        const form = overlay.querySelector(".gf-form");
        const saveBtn = overlay.querySelector(".gf-save");
        form.addEventListener("submit", async (evt) => {
            evt.preventDefault();
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";
            try {
                const ok = await onSubmit(form);
                if (ok === false) { saveBtn.disabled = false; saveBtn.textContent = "حفظ"; return; }
                close();
                await reload();
            } catch (err) {
                console.warn("gifts save error:", err);
                toast("تعذر الحفظ - جربي تاني", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ";
            }
        });
        if (afterMount) afterMount(overlay, form);
        return { overlay, form, close };
    }

    /** رفع صورة واحدة أو أكتر - بيرجع روابط */
    async function pickAndUpload(inputEl, multiple) {
        const files = Array.from(inputEl.files || []);
        inputEl.value = "";
        if (!files.length) return [];
        const urls = await UI().uploadImagesToCloudinary(multiple ? files : files.slice(0, 1));
        const ok = urls.filter(Boolean);
        if (ok.length < files.length) toast("بعض الصور ماترفعتش", "warning");
        return ok;
    }

    /* ============================= التحميل ============================= */

    async function reload() {
        try {
            const [s, t, g, pt, b, sh, si, h, all] = await Promise.all([
                T("gift_sections").select("*").order("sort_order"),
                T("gift_tags").select("*").order("sort_order"),
                T("gift_products").select("*").order("created_at", { ascending: false }),
                T("gift_product_tags").select("*"),
                T("gift_bundle_items").select("*").order("sort_order"),
                T("gift_shelves").select("*").order("sort_order"),
                T("gift_shelf_items").select("*").order("sort_order"),
                T("gift_heroes").select("*").order("sort_order"),
                A().getAllProducts(),
            ]);
            [s, t, g, pt, b, sh, si, h].forEach((r) => { if (r.error) throw r.error; });
            sections = s.data || []; tags = t.data || []; gp = g.data || []; ptags = pt.data || [];
            bundle = b.data || []; shelves = sh.data || []; shelfItems = si.data || []; heroes = h.data || [];
            const giftIds = new Set(gp.map((x) => x.product_id));
            products = (all || []).filter((p) => giftIds.has(p.id));
        } catch (err) {
            console.warn("gifts load error:", err);
            toast("تعذر تحميل البيانات", "error");
        }
        render();
    }

    /* ============================= العرض ============================= */

    function setHead(cols) {
        document.getElementById("gf-thead").innerHTML = cols.map((c) => `<th>${c}</th>`).join("");
    }
    function empty(cols, icon, title, text) {
        return `<tr><td colspan="${cols}">${UI().emptyStateHTML({ icon, title, text })}</td></tr>`;
    }

    function render() {
        document.querySelectorAll("#gf-tabs [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
        const hint = document.getElementById("gf-hint");
        const label = document.getElementById("gf-add-label");
        if (tab === "gifts") { label.textContent = "إضافة هدية"; hint.innerHTML = '<i class="fa-solid fa-circle-info"></i> كل هدية بتتحط في قسم (الهدايا / زينة المناسبات / ورد تجهيز الشقق) وعليها علامات كتير. المنتج الواحد بيظهر في كل مناسبة اخترتيها.'; renderGifts(); }
        else if (tab === "shelves") { label.textContent = "إضافة رف"; hint.innerHTML = '<i class="fa-solid fa-circle-info"></i> الرف هو صف هدايا بعنوان على شكل جملة، زي "فكرة لعيد جوازكم". ممكن تختاري هداياه بإيدك، أو يتملّى لوحده من مناسبة أو نوع. الرف الفاضي مبيظهرش للعميل.'; renderShelves(); }
        else if (tab === "heroes") { label.textContent = "إضافة واجهة كبيرة"; hint.innerHTML = '<i class="fa-solid fa-circle-info"></i> الصورة الكبيرة اللي بتتفتح بيها صفحة القسم. حددي مدة ظهورها، ولو في أكتر من واحدة شغالة بيظهر الأول في الترتيب.'; renderHeroes(); }
        else { label.textContent = "إضافة مناسبة / علامة"; hint.innerHTML = '<i class="fa-solid fa-circle-info"></i> المناسبة اللي مفيهاش هدايا مبتظهرش للعميل لوحدها. اكتبي تاريخ المناسبة كل سنة، والموقع هيحسب منه "اطلبي قبل كذا" ويظهر الرف قبلها بالمدة اللي تحددوها.'; renderTags(); }
    }

    function renderGifts() {
        setHead(["الهدية", "القسم", "السعر", "العلامات", "الحالة", ""]);
        const tbody = document.getElementById("gf-tbody");
        if (!gp.length) { tbody.innerHTML = empty(6, "fa-gifts", "مفيش هدايا لسه", 'اضغطي "إضافة هدية" عشان تعملي أول واحدة.'); return; }
        tbody.innerHTML = gp.map((g) => {
            const p = productOf(g.product_id) || {};
            const my = ptags.filter((x) => x.product_id === g.product_id).map((x) => tagTitle(x.tag_id));
            const img = firstImage(p);
            const on = g.is_listed && p.is_available !== false;
            return `<tr>
                <td><div style="display:flex;gap:10px;align-items:center;">
                    ${img ? `<img src="${e(img)}" alt="" style="width:46px;height:46px;border-radius:10px;object-fit:cover;">` : ""}
                    <div><strong>${e(p.title || g.product_id)}</strong>${g.is_bundle ? ' <span class="adm-badge pink">هدية كاملة</span>' : ""}
                    <div class="adm-order-item-meta">${e(g.summary || "")}</div></div></div></td>
                <td>${e(sectionTitle(g.section_id))}</td>
                <td>${e(money(p.price))}</td>
                <td><div class="adm-order-item-meta">${e(my.slice(0, 4).join("، ") || "—")}${my.length > 4 ? " +" + (my.length - 4) : ""}</div></td>
                <td><span class="adm-badge ${on ? "success" : "danger"}">${on ? "ظاهرة" : "مخفية"}</span></td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="toggle" data-id="${e(g.product_id)}" title="${on ? "إخفاء" : "إظهار"}"><i class="fa-solid ${on ? "fa-eye-slash" : "fa-eye"}"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="edit" data-id="${e(g.product_id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="delete" data-id="${e(g.product_id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td></tr>`;
        }).join("");
    }

    function renderShelves() {
        setHead(["الرف", "القسم", "بيتملّى ازاي", "المدة", "الحالة", ""]);
        const tbody = document.getElementById("gf-tbody");
        if (!shelves.length) { tbody.innerHTML = empty(6, "fa-layer-group", "مفيش رفوف لسه", 'اضغطي "إضافة رف" وسمّيه بجملة، زي "فكرة لعيد جوازكم".'); return; }
        tbody.innerHTML = shelves.map((s) => {
            const st = windowStatus(s, "is_active", "starts_at", "ends_at", false);
            const how = s.mode === "tag" ? `${MODE_LABELS.tag}: ${tagTitle(s.tag_id)}` : (s.mode === "newest" ? MODE_LABELS.newest : `${MODE_LABELS.manual} (${shelfItems.filter((x) => x.shelf_id === s.id).length})`);
            return `<tr>
                <td><strong>${e(s.title)}</strong><div class="adm-order-item-meta">${e(s.subtitle || "")}</div></td>
                <td>${e(sectionTitle(s.section_id))}</td>
                <td>${e(how)}</td>
                <td><div class="adm-order-item-meta">من: ${e(fmtStamp(s.starts_at))}</div><div class="adm-order-item-meta">إلى: ${e(fmtStamp(s.ends_at))}</div></td>
                <td><span class="adm-badge ${st.cls}">${st.text}</span></td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="toggle" data-id="${e(s.id)}" title="${s.is_active ? "إيقاف" : "تفعيل"}"><i class="fa-solid ${s.is_active ? "fa-pause" : "fa-play"}"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="edit" data-id="${e(s.id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="copy" data-id="${e(s.id)}" title="نسخ"><i class="fa-solid fa-copy"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="delete" data-id="${e(s.id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td></tr>`;
        }).join("");
    }

    function renderHeroes() {
        setHead(["الواجهة", "القسم", "المدة", "الحالة", ""]);
        const tbody = document.getElementById("gf-tbody");
        if (!heroes.length) { tbody.innerHTML = empty(5, "fa-image", "مفيش واجهة كبيرة لسه", 'اضغطي "إضافة واجهة كبيرة" وحطي صورة وجملة قصيرة.'); return; }
        tbody.innerHTML = heroes.map((h) => {
            const st = windowStatus(h, "is_active", "starts_at", "ends_at", false);
            return `<tr>
                <td><div style="display:flex;gap:10px;align-items:center;">
                    ${h.image ? `<img src="${e(h.image)}" alt="" style="width:64px;height:44px;border-radius:8px;object-fit:cover;">` : ""}
                    <div><strong>${e(h.title)}</strong><div class="adm-order-item-meta">${e(h.subtitle || "")}</div></div></div></td>
                <td>${e(sectionTitle(h.section_id))}</td>
                <td><div class="adm-order-item-meta">من: ${e(fmtStamp(h.starts_at))}</div><div class="adm-order-item-meta">إلى: ${e(fmtStamp(h.ends_at))}</div></td>
                <td><span class="adm-badge ${st.cls}">${st.text}</span></td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="toggle" data-id="${e(h.id)}" title="${h.is_active ? "إيقاف" : "تفعيل"}"><i class="fa-solid ${h.is_active ? "fa-pause" : "fa-play"}"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="edit" data-id="${e(h.id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="copy" data-id="${e(h.id)}" title="نسخ"><i class="fa-solid fa-copy"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="delete" data-id="${e(h.id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td></tr>`;
        }).join("");
    }

    function renderTags() {
        setHead(["العلامة", "عدد الهدايا", "تاريخ المناسبة", "بتظهر من - لحد", "الحالة", ""]);
        const tbody = document.getElementById("gf-tbody");
        const rows = [];
        KIND_ORDER.forEach((kind) => {
            const list = tags.filter((t) => t.kind === kind);
            if (!list.length) return;
            rows.push(`<tr><td colspan="6" style="background:var(--adm-bg-hover);font-weight:800;">${e(KIND_LABELS[kind])}</td></tr>`);
            list.forEach((t) => {
                const n = ptags.filter((x) => x.tag_id === t.id).length;
                const st = windowStatus(t, "is_active", "show_from", "show_until", true);
                rows.push(`<tr>
                    <td><div style="display:flex;gap:10px;align-items:center;">
                        ${t.image ? `<img src="${e(t.image)}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` : ""}
                        <strong>${e(t.title)}</strong></div></td>
                    <td>${n}${n === 0 && t.is_active ? ' <span class="adm-order-item-meta">(مخفية للعميل لحد ما يبقى فيها هدايا)</span>' : ""}</td>
                    <td>${e(t.kind === "occasion" ? fmtDay(t.event_date) : "—")}</td>
                    <td><div class="adm-order-item-meta">${e(fmtDay(t.show_from))} ← ${e(fmtDay(t.show_until))}</div></td>
                    <td><span class="adm-badge ${st.cls}">${st.text}</span></td>
                    <td class="adm-table-actions">
                        <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="toggle" data-id="${e(t.id)}" title="${t.is_active ? "إيقاف" : "تفعيل"}"><i class="fa-solid ${t.is_active ? "fa-pause" : "fa-play"}"></i></button>
                        <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="edit" data-id="${e(t.id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                        <button class="adm-btn adm-btn-ghost adm-btn-icon" data-act="delete" data-id="${e(t.id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </td></tr>`);
            });
        });
        tbody.innerHTML = rows.join("") || empty(6, "fa-tags", "مفيش علامات", "");
    }

    /* ============================= الهدايا ============================= */

    function giftModal(gift) {
        const isEdit = !!gift;
        const p = isEdit ? (productOf(gift.product_id) || {}) : {};
        let imgs = Array.isArray(p.images) ? p.images.slice() : [];
        let items = isEdit ? bundle.filter((b) => b.bundle_product_id === gift.product_id).map((b) => ({ label: b.label, qty: b.qty, alone_price: b.alone_price, item_product_id: b.item_product_id, image: b.image, description: b.description || "", sell_alone: !!b.sell_alone })) : [];
        const picked = new Set(isEdit ? ptags.filter((x) => x.product_id === gift.product_id).map((x) => x.tag_id) : []);

        const body = `
            ${field("القسم", `<select class="adm-select" id="gf-section">${sections.map((s) => `<option value="${e(s.id)}" ${gift && gift.section_id === s.id ? "selected" : ""}>${e(s.title)}</option>`).join("")}</select>`)}
            ${field("اسم الهدية", `<input class="adm-input" id="gf-title" required value="${e(p.title || "")}" placeholder="مثال: هدية عيد جوازكم">`)}
            ${field("سطر واحد يقول اللي جوّاها (اختياري)", `<input class="adm-input" id="gf-summary" value="${e(gift ? gift.summary : "")}" placeholder="لو سبتيه فاضي هيتكتب لوحده من أسماء القطع">`)}
            ${field("السعر (ج)", `<input type="number" min="0" step="1" class="adm-input" id="gf-price" required value="${p.price != null ? Number(p.price) : ""}">`)}
            <div class="adm-field"><label><input type="checkbox" id="gf-bundle" ${gift && gift.is_bundle ? "checked" : ""}> دي هدية كاملة فيها أكتر من قطعة</label></div>
            <div id="gf-bundle-wrap" class="adm-field">
                <label>اللي جوّه الهدية: كل قطعة بصورتها واسمها وسعرها لوحدها</label>
                <div class="adm-hint" style="margin-bottom:8px;">العميل هيشوف كل قطعة في صفحة الهدية. لو علّمتي \"تتباع لوحدها\" هيظهر له زرار يشتريها لوحدها بسعرها.</div>
                <div id="gf-items"></div>
                <button type="button" class="adm-btn adm-btn-ghost" id="gf-add-item"><i class="fa-solid fa-plus"></i> إضافة قطعة</button>
                <div id="gf-savings" class="adm-hint" style="margin-top:8px;"></div>
            </div>
            ${field("ملاحظة التوصيل (اختياري)", `<input class="adm-input" id="gf-note" value="${e(gift ? gift.delivery_note : "")}" placeholder="مثال: بتوصل غير منفوخة">`, "بتظهر للعميل في صفحة الهدية.")}
            ${field("وصف قصير (اختياري)", `<textarea class="adm-input" id="gf-desc" rows="3">${e(p.description || "")}</textarea>`)}
            <div class="adm-field"><label>الصور (أول صورة هي الأساسية)</label>
                <div id="gf-imgs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;"></div>
                <input type="file" id="gf-file" accept="image/*" multiple></div>
            <div class="adm-field"><label>العلامات (المناسبات ولمين والنوع)</label><div id="gf-tags"></div></div>
            <div class="adm-field"><label><input type="checkbox" id="gf-avail" ${p.is_available === false ? "" : "checked"}> الهدية متاحة للطلب</label></div>
            <div class="adm-field"><label><input type="checkbox" id="gf-featured" ${p.is_featured ? "checked" : ""}> من أحلى هدايانا (بتظهر في المميزة)</label></div>
            ${field("الترتيب", `<input type="number" class="adm-input" id="gf-sort" value="${p.sort_order != null ? p.sort_order : 0}">`)}`;

        openModal(isEdit ? "تعديل هدية" : "إضافة هدية", body, async (form) => {
            const title = form.querySelector("#gf-title").value.trim();
            const price = parseFloat(form.querySelector("#gf-price").value);
            if (!title || !(price >= 0)) { toast("اكتبي الاسم والسعر", "warning"); return false; }
            if (!imgs.length) { toast("ضيفي صورة واحدة على الأقل", "warning"); return false; }
            const isBundle = form.querySelector("#gf-bundle").checked;
            const cleanItems = items.filter((i) => i.label && i.label.trim());
            if (isBundle && !cleanItems.length) { toast("اكتبي القطع اللي جوّه الهدية", "warning"); return false; }
            const badAlone = cleanItems.find((i) => i.sell_alone && !(Number(i.alone_price) > 0));
            if (isBundle && badAlone) { toast("القطعة \"" + badAlone.label + "\" معلّمة تتباع لوحدها، اكتبي سعرها", "warning"); return false; }

            const pid = isEdit ? gift.product_id : newId("gift");
            const tagIds = Array.from(picked);
            const searchTerms = [title, ...tagIds.map(tagTitle)];
            const payload = {
                title,
                description: form.querySelector("#gf-desc").value.trim() || null,
                price,
                images: imgs,
                search_terms: searchTerms,
                is_available: form.querySelector("#gf-avail").checked,
                is_featured: form.querySelector("#gf-featured").checked,
                sort_order: parseInt(form.querySelector("#gf-sort").value, 10) || 0,
            };
            if (isEdit) {
                await A().updateProduct(pid, payload);
            } else {
                await A().createProduct({
                    id: pid, category_id: null, builder_type: "standard", layout: "grid-card",
                    prices: {}, size_descriptions: {}, size_images: {}, faqs: [], stock_quantity: null,
                    ...payload,
                });
            }
            const { error: gErr } = await T("gift_products").upsert({
                product_id: pid,
                section_id: form.querySelector("#gf-section").value,
                summary: form.querySelector("#gf-summary").value.trim() || (isBundle ? cleanItems.map((i) => i.label.trim()).join(" + ") : null),
                delivery_note: form.querySelector("#gf-note").value.trim() || null,
                is_bundle: isBundle,
                is_listed: isEdit ? gift.is_listed : true,
                updated_at: new Date().toISOString(),
            }, { onConflict: "product_id" });
            if (gErr) throw gErr;

            const d1 = await T("gift_product_tags").delete().eq("product_id", pid);
            if (d1.error) throw d1.error;
            if (tagIds.length) {
                const ins = await T("gift_product_tags").insert(tagIds.map((t, i) => ({ product_id: pid, tag_id: t, sort_order: i })));
                if (ins.error) throw ins.error;
            }
            const d2 = await T("gift_bundle_items").delete().eq("bundle_product_id", pid);
            if (d2.error) throw d2.error;
            if (isBundle && cleanItems.length) {
                const sectionId = form.querySelector("#gf-section").value;
                // القطعة اللي تتباع لوحدها بتبقى منتج حقيقي (مش ظاهر في الشبكة) عشان السلة والدفع يشتغلوا عادي
                for (const i of cleanItems) {
                    const alonePrice = i.alone_price === "" || i.alone_price == null ? null : Math.max(0, Number(i.alone_price));
                    if (i.sell_alone) {
                        const sid = i.item_product_id || newId("gift");
                        const sp = { title: i.label.trim(), description: (i.description || "").trim() || null, price: alonePrice, images: i.image ? [i.image] : [], search_terms: [i.label.trim()], is_available: true };
                        if (i.item_product_id && productOf(i.item_product_id)) {
                            await A().updateProduct(sid, sp);
                        } else {
                            await A().createProduct({ id: sid, category_id: null, builder_type: "standard", layout: "grid-card", prices: {}, size_descriptions: {}, size_images: {}, faqs: [], stock_quantity: null, is_featured: false, sort_order: 0, ...sp });
                        }
                        i.item_product_id = sid;
                        const up = await T("gift_products").upsert({ product_id: sid, section_id: sectionId, summary: null, delivery_note: null, is_bundle: false, is_listed: false, updated_at: new Date().toISOString() }, { onConflict: "product_id" });
                        if (up.error) throw up.error;
                    } else if (i.item_product_id && productOf(i.item_product_id)) {
                        // اتشالت علامة "تتباع لوحدها": نقفل المنتج المنفصل بدل ما نمسحه
                        await A().updateProduct(i.item_product_id, { is_available: false });
                        i.item_product_id = null;
                    }
                }
                const ins2 = await T("gift_bundle_items").insert(cleanItems.map((i, idx) => ({
                    bundle_product_id: pid, item_product_id: i.sell_alone ? (i.item_product_id || null) : null, label: i.label.trim(),
                    qty: Math.max(1, parseInt(i.qty, 10) || 1),
                    alone_price: i.alone_price === "" || i.alone_price == null ? null : Math.max(0, Number(i.alone_price)),
                    image: i.image || null, description: (i.description || "").trim() || null, sell_alone: !!i.sell_alone, sort_order: idx,
                })));
                if (ins2.error) throw ins2.error;
            }
            toast(isEdit ? "تم تعديل الهدية" : "تمت إضافة الهدية");
        }, (overlay) => {
            const $ = (id) => overlay.querySelector(id);
            function drawImgs() {
                $("#gf-imgs").innerHTML = imgs.map((u, i) => `
                    <div style="position:relative;">
                        <img src="${e(u)}" alt="" style="width:74px;height:74px;border-radius:10px;object-fit:cover;${i === 0 ? "outline:2px solid var(--adm-pink);" : ""}">
                        <button type="button" data-rm="${i}" class="adm-btn adm-btn-ghost adm-btn-icon" style="position:absolute;top:-8px;inset-inline-start:-8px;" title="حذف"><i class="fa-solid fa-xmark"></i></button>
                        ${i > 0 ? `<button type="button" data-first="${i}" class="adm-btn adm-btn-ghost adm-btn-icon" style="position:absolute;bottom:-8px;inset-inline-start:-8px;" title="خليها الأساسية"><i class="fa-solid fa-star"></i></button>` : ""}
                    </div>`).join("");
            }
            $("#gf-imgs").addEventListener("click", (evt) => {
                const rm = evt.target.closest("[data-rm]"), fs = evt.target.closest("[data-first]");
                if (rm) imgs.splice(Number(rm.dataset.rm), 1);
                else if (fs) { const [u] = imgs.splice(Number(fs.dataset.first), 1); imgs.unshift(u); }
                else return;
                drawImgs();
            });
            $("#gf-file").addEventListener("change", async (evt) => {
                const urls = await pickAndUpload(evt.target, true);
                imgs = imgs.concat(urls);
                drawImgs();
            });
            drawImgs();

            function drawTags() {
                $("#gf-tags").innerHTML = KIND_ORDER.map((kind) => {
                    const list = tags.filter((t) => t.kind === kind && (t.is_active || picked.has(t.id)));
                    if (!list.length) return "";
                    return `<div style="margin:8px 0 4px;font-weight:800;font-size:.85rem;">${e(KIND_LABELS[kind])}</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">${list.map((t) => `<button type="button" class="adm-chip ${picked.has(t.id) ? "active" : ""}" data-tag="${e(t.id)}">${e(t.title)}</button>`).join("")}</div>`;
                }).join("");
            }
            $("#gf-tags").addEventListener("click", (evt) => {
                const b = evt.target.closest("[data-tag]");
                if (!b) return;
                const id = b.dataset.tag;
                if (picked.has(id)) picked.delete(id); else picked.add(id);
                drawTags();
            });
            drawTags();

            function savings() {
                const price = parseFloat($("#gf-price").value) || 0;
                const known = items.filter((i) => i.alone_price !== "" && i.alone_price != null && i.label);
                const allKnown = items.length > 0 && known.length === items.length;
                const sum = known.reduce((a, i) => a + Number(i.alone_price) * (parseInt(i.qty, 10) || 1), 0);
                const el = $("#gf-savings");
                if (!allKnown) { el.textContent = "اكتبي سعر كل قطعة لوحدها عشان يتحسب التوفير الحقيقي للعميل."; return; }
                el.innerHTML = sum > price
                    ? `لوحدهم: <strong>${money(sum)}</strong> · في الهدية: <strong>${money(price)}</strong> · العميل بيوفّر <strong>${money(sum - price)}</strong>`
                    : "سعر الهدية مش أقل من القطع لوحدها، فمفيش توفير هيظهر للعميل.";
            }
            function drawItems() {
                $("#gf-items").innerHTML = items.map((it, i) => `
                    <div style="border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:10px;margin-bottom:10px;background:#fff;">
                        <div style="display:flex;gap:10px;align-items:flex-start;">
                            <div style="flex:0 0 74px;text-align:center;">
                                ${it.image ? `<img src="${e(it.image)}" alt="" style="width:74px;height:74px;border-radius:10px;object-fit:cover;display:block;">` : `<div style="width:74px;height:74px;border-radius:10px;background:#f3eef0;display:flex;align-items:center;justify-content:center;font-size:11px;opacity:.6;">بدون صورة</div>`}
                                <label class="adm-btn adm-btn-ghost" style="display:block;margin-top:4px;font-size:11px;padding:4px;cursor:pointer;">صورة<input type="file" accept="image/*" data-itemfile="${i}" style="display:none;"></label>
                            </div>
                            <div style="flex:1;display:grid;gap:6px;min-width:0;">
                                <input class="adm-input" data-f="label" data-i="${i}" placeholder="اسم القطعة (مثال: دبدوب استيتش)" value="${e(it.label)}">
                                <input class="adm-input" data-f="description" data-i="${i}" placeholder="سطر عنها (مثال: ناعم، ارتفاع 30 سم)" value="${e(it.description || "")}">
                                <div style="display:flex;gap:6px;">
                                    <input class="adm-input" data-f="qty" data-i="${i}" type="number" min="1" value="${e(it.qty || 1)}" style="flex:1;" title="العدد">
                                    <input class="adm-input" data-f="alone_price" data-i="${i}" type="number" min="0" placeholder="سعرها لوحدها" value="${it.alone_price == null ? "" : e(it.alone_price)}" style="flex:2;">
                                </div>
                                <label style="font-size:13px;"><input type="checkbox" data-sell="${i}" ${it.sell_alone ? "checked" : ""}> تتباع لوحدها (يظهر للعميل زرار شراء للقطعة دي)</label>
                            </div>
                            <button type="button" class="adm-btn adm-btn-ghost adm-btn-icon" data-rmi="${i}" title="حذف القطعة"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>`).join("");
                savings();
            }
            $("#gf-items").addEventListener("change", async (evt) => {
                const sell = evt.target.closest("[data-sell]");
                if (sell) { items[Number(sell.dataset.sell)].sell_alone = sell.checked; return; }
                const fi = evt.target.closest("[data-itemfile]");
                if (fi) {
                    const urls = await pickAndUpload(fi, false);
                    if (urls[0]) { items[Number(fi.dataset.itemfile)].image = urls[0]; drawItems(); }
                }
            });
            $("#gf-items").addEventListener("input", (evt) => {
                const f = evt.target.dataset.f;
                if (!f) return;
                items[Number(evt.target.dataset.i)][f] = evt.target.value;
                savings();
            });
            $("#gf-items").addEventListener("click", (evt) => {
                const r = evt.target.closest("[data-rmi]");
                if (!r) return;
                items.splice(Number(r.dataset.rmi), 1);
                drawItems();
            });
            $("#gf-add-item").addEventListener("click", () => { items.push({ label: "", qty: 1, alone_price: "" }); drawItems(); });
            $("#gf-price").addEventListener("input", savings);
            const wrap = $("#gf-bundle-wrap");
            function syncBundle() { wrap.style.display = $("#gf-bundle").checked ? "" : "none"; if ($("#gf-bundle").checked && !items.length) { items.push({ label: "", qty: 1, alone_price: "" }); drawItems(); } }
            $("#gf-bundle").addEventListener("change", syncBundle);
            drawItems();
            wrap.style.display = $("#gf-bundle").checked ? "" : "none";
        });
    }

    async function giftAction(act, id) {
        const g = gp.find((x) => x.product_id === id);
        if (!g) return;
        if (act === "edit") return giftModal(g);
        if (act === "toggle") {
            const { error } = await T("gift_products").update({ is_listed: !g.is_listed }).eq("product_id", id);
            if (error) return toast("تعذر التغيير", "error");
            toast(g.is_listed ? "الهدية اتخفت" : "الهدية ظهرت");
            return reload();
        }
        if (act === "delete") {
            const ok = await UI().confirmAction({ title: "حذف الهدية", message: "الهدية هتتحذف نهائيًا من الموقع ومن كل الرفوف. متأكدة؟", confirmLabel: "حذف", danger: true });
            if (!ok) return;
            try { await A().deleteProduct(id); toast("تم الحذف"); } catch (x) { toast("تعذر الحذف", "error"); }
            return reload();
        }
    }

    /* ============================= الرفوف ============================= */

    function tagOptions(selected) {
        return KIND_ORDER.map((kind) => {
            const list = tags.filter((t) => t.kind === kind);
            return list.length ? `<optgroup label="${e(KIND_LABELS[kind])}">${list.map((t) => `<option value="${e(t.id)}" ${t.id === selected ? "selected" : ""}>${e(t.title)}</option>`).join("")}</optgroup>` : "";
        }).join("");
    }

    function shelfModal(shelf, asCopy) {
        const isEdit = !!shelf && !asCopy;
        const base = shelf || { section_id: sections[0] && sections[0].id, title: "", subtitle: "", mode: "manual", tag_id: null, max_items: 4, starts_at: null, ends_at: null, is_active: true, sort_order: shelves.length + 1 };
        const sel = new Set(shelf ? shelfItems.filter((x) => x.shelf_id === shelf.id).map((x) => x.product_id) : []);
        const body = `
            ${field("القسم", `<select class="adm-select" id="sh-section">${sections.map((s) => `<option value="${e(s.id)}" ${base.section_id === s.id ? "selected" : ""}>${e(s.title)}</option>`).join("")}</select>`)}
            ${field("عنوان الرف (جملة قصيرة)", `<input class="adm-input" id="sh-title" required value="${e(base.title)}" placeholder="فكرة لعيد جوازكم">`)}
            ${field("سطر صغير تحته (اختياري)", `<input class="adm-input" id="sh-sub" value="${e(base.subtitle || "")}">`)}
            ${field("الرف بيتملّى ازاي؟", `<select class="adm-select" id="sh-mode">${Object.keys(MODE_LABELS).map((m) => `<option value="${m}" ${base.mode === m ? "selected" : ""}>${MODE_LABELS[m]}</option>`).join("")}</select>`)}
            <div id="sh-tag-wrap">${field("المناسبة أو النوع", `<select class="adm-select" id="sh-tag"><option value="">— اختاري —</option>${tagOptions(base.tag_id)}</select>`)}</div>
            <div id="sh-manual-wrap" class="adm-field"><label>اختاري الهدايا (ترتيبها حسب ترتيب الهدية)</label>
                <select class="adm-select" id="sh-items" multiple size="7" style="height:auto;">
                    ${gp.map((g) => { const p = productOf(g.product_id) || {}; return `<option value="${e(g.product_id)}" ${sel.has(g.product_id) ? "selected" : ""}>${e(p.title || g.product_id)}</option>`; }).join("")}
                </select><span class="adm-hint">اضغطي Ctrl/Cmd لاختيار أكتر من واحدة.</span></div>
            ${field("أقصى عدد هدايا في الرف", `<input type="number" min="1" max="12" class="adm-input" id="sh-max" value="${Number(base.max_items) || 4}">`, "3 أو 4 أحسن عشان العميل ما يتوهش.")}
            ${field("يبدأ", `<input type="datetime-local" class="adm-input" id="sh-start" value="${toLocalInput(base.starts_at)}">`)}
            ${field("ينتهي", `<input type="datetime-local" class="adm-input" id="sh-end" value="${toLocalInput(base.ends_at)}">`, "سيبيهم فاضيين لو الرف دايم.")}
            <div class="adm-field"><label><input type="checkbox" id="sh-active" ${base.is_active ? "checked" : ""}> الرف مفعّل</label></div>
            ${field("الترتيب", `<input type="number" class="adm-input" id="sh-sort" value="${base.sort_order ?? 0}">`)}`;

        openModal(isEdit ? "تعديل رف" : (asCopy ? "نسخ رف" : "إضافة رف"), body, async (form) => {
            const mode = form.querySelector("#sh-mode").value;
            const tagId = form.querySelector("#sh-tag").value || null;
            if (mode === "tag" && !tagId) { toast("اختاري المناسبة أو النوع", "warning"); return false; }
            const startsAt = fromLocalInput(form.querySelector("#sh-start").value);
            const endsAt = fromLocalInput(form.querySelector("#sh-end").value);
            if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) { toast("تاريخ النهاية لازم يكون بعد البداية", "warning"); return false; }
            const payload = {
                section_id: form.querySelector("#sh-section").value,
                title: form.querySelector("#sh-title").value.trim(),
                subtitle: form.querySelector("#sh-sub").value.trim() || null,
                mode, tag_id: mode === "tag" ? tagId : null,
                max_items: Math.min(12, Math.max(1, parseInt(form.querySelector("#sh-max").value, 10) || 4)),
                starts_at: startsAt, ends_at: endsAt,
                is_active: form.querySelector("#sh-active").checked,
                sort_order: parseInt(form.querySelector("#sh-sort").value, 10) || 0,
                updated_at: new Date().toISOString(),
            };
            let shelfId = isEdit ? shelf.id : null;
            if (isEdit) {
                const { error } = await T("gift_shelves").update(payload).eq("id", shelfId);
                if (error) throw error;
            } else {
                const { data, error } = await T("gift_shelves").insert(payload).select("id").single();
                if (error) throw error;
                shelfId = data.id;
            }
            const del = await T("gift_shelf_items").delete().eq("shelf_id", shelfId);
            if (del.error) throw del.error;
            if (mode === "manual") {
                const chosen = Array.from(form.querySelector("#sh-items").selectedOptions).map((o) => o.value);
                if (chosen.length) {
                    const ins = await T("gift_shelf_items").insert(chosen.map((pid, i) => ({ shelf_id: shelfId, product_id: pid, sort_order: i })));
                    if (ins.error) throw ins.error;
                }
            }
            toast("تم حفظ الرف");
        }, (overlay) => {
            const modeEl = overlay.querySelector("#sh-mode");
            function sync() {
                overlay.querySelector("#sh-tag-wrap").style.display = modeEl.value === "tag" ? "" : "none";
                overlay.querySelector("#sh-manual-wrap").style.display = modeEl.value === "manual" ? "" : "none";
            }
            modeEl.addEventListener("change", sync);
            sync();
        });
    }

    async function shelfAction(act, id) {
        const s = shelves.find((x) => x.id === id);
        if (!s) return;
        if (act === "edit") return shelfModal(s, false);
        if (act === "copy") return shelfModal(s, true);
        if (act === "toggle") {
            const { error } = await T("gift_shelves").update({ is_active: !s.is_active }).eq("id", id);
            if (error) return toast("تعذر التغيير", "error");
            toast(s.is_active ? "الرف اتوقف" : "الرف اتفعّل");
            return reload();
        }
        if (act === "delete") {
            const ok = await UI().confirmAction({ title: "حذف الرف", message: "الرف هيتحذف (الهدايا نفسها مش هتتحذف). متأكدة؟", confirmLabel: "حذف", danger: true });
            if (!ok) return;
            const { error } = await T("gift_shelves").delete().eq("id", id);
            toast(error ? "تعذر الحذف" : "تم الحذف", error ? "error" : "success");
            return reload();
        }
    }

    /* ============================= الواجهة الكبيرة ============================= */

    function heroModal(hero, asCopy) {
        const isEdit = !!hero && !asCopy;
        const base = hero || { section_id: sections[0] && sections[0].id, title: "", subtitle: "", image: "", link_url: "", cta_label: "", starts_at: null, ends_at: null, is_active: true, sort_order: heroes.length + 1 };
        let image = base.image || "";
        const body = `
            ${field("القسم", `<select class="adm-select" id="hr-section">${sections.map((s) => `<option value="${e(s.id)}" ${base.section_id === s.id ? "selected" : ""}>${e(s.title)}</option>`).join("")}</select>`)}
            ${field("الجملة الكبيرة", `<input class="adm-input" id="hr-title" required value="${e(base.title)}" placeholder="هدية تقول لماما شكرًا">`)}
            ${field("سطر صغير (اختياري)", `<input class="adm-input" id="hr-sub" value="${e(base.subtitle || "")}">`)}
            <div class="adm-field"><label>الصورة</label><div id="hr-preview" style="margin-bottom:8px;"></div><input type="file" id="hr-file" accept="image/*"></div>
            ${field("رابط الزرار (اختياري)", `<input class="adm-input" id="hr-link" value="${e(base.link_url || "")}" placeholder="/gifts.html#mothers-day">`)}
            ${field("كلمة الزرار (اختياري)", `<input class="adm-input" id="hr-cta" value="${e(base.cta_label || "")}" placeholder="شوفي الهدايا">`)}
            ${field("يبدأ", `<input type="datetime-local" class="adm-input" id="hr-start" value="${toLocalInput(base.starts_at)}">`)}
            ${field("ينتهي", `<input type="datetime-local" class="adm-input" id="hr-end" value="${toLocalInput(base.ends_at)}">`)}
            <div class="adm-field"><label><input type="checkbox" id="hr-active" ${base.is_active ? "checked" : ""}> مفعّلة</label></div>
            ${field("الترتيب", `<input type="number" class="adm-input" id="hr-sort" value="${base.sort_order ?? 0}">`)}`;
        openModal(isEdit ? "تعديل واجهة" : "إضافة واجهة كبيرة", body, async (form) => {
            if (!image) { toast("ضيفي صورة", "warning"); return false; }
            const startsAt = fromLocalInput(form.querySelector("#hr-start").value);
            const endsAt = fromLocalInput(form.querySelector("#hr-end").value);
            if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) { toast("تاريخ النهاية لازم يكون بعد البداية", "warning"); return false; }
            const payload = {
                section_id: form.querySelector("#hr-section").value,
                title: form.querySelector("#hr-title").value.trim(),
                subtitle: form.querySelector("#hr-sub").value.trim() || null,
                image, link_url: form.querySelector("#hr-link").value.trim() || null,
                cta_label: form.querySelector("#hr-cta").value.trim() || null,
                starts_at: startsAt, ends_at: endsAt,
                is_active: form.querySelector("#hr-active").checked,
                sort_order: parseInt(form.querySelector("#hr-sort").value, 10) || 0,
                updated_at: new Date().toISOString(),
            };
            const { error } = isEdit ? await T("gift_heroes").update(payload).eq("id", hero.id) : await T("gift_heroes").insert(payload);
            if (error) throw error;
            toast("تم الحفظ");
        }, (overlay) => {
            const prev = overlay.querySelector("#hr-preview");
            const draw = () => { prev.innerHTML = image ? `<img src="${e(image)}" alt="" style="max-width:100%;max-height:150px;border-radius:10px;">` : ""; };
            overlay.querySelector("#hr-file").addEventListener("change", async (evt) => {
                const urls = await pickAndUpload(evt.target, false);
                if (urls[0]) { image = urls[0]; draw(); }
            });
            draw();
        });
    }

    async function heroAction(act, id) {
        const h = heroes.find((x) => x.id === id);
        if (!h) return;
        if (act === "edit") return heroModal(h, false);
        if (act === "copy") return heroModal(h, true);
        if (act === "toggle") {
            const { error } = await T("gift_heroes").update({ is_active: !h.is_active }).eq("id", id);
            if (error) return toast("تعذر التغيير", "error");
            return reload();
        }
        if (act === "delete") {
            const ok = await UI().confirmAction({ title: "حذف الواجهة", message: "متأكدة؟", confirmLabel: "حذف", danger: true });
            if (!ok) return;
            const { error } = await T("gift_heroes").delete().eq("id", id);
            toast(error ? "تعذر الحذف" : "تم الحذف", error ? "error" : "success");
            return reload();
        }
    }

    /* ============================= المناسبات والعلامات ============================= */

    function tagModal(tag) {
        const isEdit = !!tag;
        const base = tag || { kind: "occasion", title: "", image: "", event_date: null, show_from: null, show_until: null, is_active: true, sort_order: tags.length + 1 };
        let image = base.image || "";
        const body = `
            ${isEdit ? "" : field("النوع", `<select class="adm-select" id="tg-kind">${KIND_ORDER.map((k) => `<option value="${k}">${KIND_LABELS[k]}</option>`).join("")}</select>`)}
            ${field("الاسم", `<input class="adm-input" id="tg-title" required value="${e(base.title)}" placeholder="مثال: عيد الجواز">`)}
            <div class="adm-field"><label>صورة (اختياري - بتظهر في شريط المناسبات)</label><div id="tg-preview" style="margin-bottom:8px;"></div><input type="file" id="tg-file" accept="image/*"></div>
            <div id="tg-dates">
                ${field("تاريخ المناسبة (يتغير كل سنة)", `<input type="date" class="adm-input" id="tg-event" value="${e(base.event_date || "")}">`, "من هنا بيتحسب \"اطلبي قبل كذا\".")}
                ${field("تظهر من", `<input type="date" class="adm-input" id="tg-from" value="${e(base.show_from || "")}">`)}
                ${field("تظهر لحد", `<input type="date" class="adm-input" id="tg-until" value="${e(base.show_until || "")}">`, "فاضيين = بتظهر طول السنة.")}
            </div>
            <div class="adm-field"><label><input type="checkbox" id="tg-active" ${base.is_active ? "checked" : ""}> مفعّلة</label></div>
            ${field("الترتيب", `<input type="number" class="adm-input" id="tg-sort" value="${base.sort_order ?? 0}">`)}`;
        openModal(isEdit ? "تعديل علامة" : "إضافة مناسبة / علامة", body, async (form) => {
            const kind = isEdit ? tag.kind : form.querySelector("#tg-kind").value;
            const from = form.querySelector("#tg-from").value || null;
            const until = form.querySelector("#tg-until").value || null;
            if (from && until && until < from) { toast("تاريخ النهاية لازم يكون بعد البداية", "warning"); return false; }
            const payload = {
                title: form.querySelector("#tg-title").value.trim(),
                image: image || null,
                event_date: kind === "occasion" ? (form.querySelector("#tg-event").value || null) : null,
                show_from: from, show_until: until,
                is_active: form.querySelector("#tg-active").checked,
                sort_order: parseInt(form.querySelector("#tg-sort").value, 10) || 0,
                updated_at: new Date().toISOString(),
            };
            const { error } = isEdit
                ? await T("gift_tags").update(payload).eq("id", tag.id)
                : await T("gift_tags").insert({ id: newId(kind.slice(0, 3)), kind, ...payload });
            if (error) throw error;
            toast("تم الحفظ");
        }, (overlay) => {
            const prev = overlay.querySelector("#tg-preview");
            const draw = () => { prev.innerHTML = image ? `<img src="${e(image)}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">` : ""; };
            overlay.querySelector("#tg-file").addEventListener("change", async (evt) => {
                const urls = await pickAndUpload(evt.target, false);
                if (urls[0]) { image = urls[0]; draw(); }
            });
            draw();
            const kindEl = overlay.querySelector("#tg-kind");
            const dates = overlay.querySelector("#tg-dates");
            const sync = () => { dates.style.display = (isEdit ? tag.kind : kindEl.value) === "occasion" ? "" : "none"; };
            if (kindEl) kindEl.addEventListener("change", sync);
            sync();
        });
    }

    async function tagAction(act, id) {
        const t = tags.find((x) => x.id === id);
        if (!t) return;
        if (act === "edit") return tagModal(t);
        if (act === "toggle") {
            const { error } = await T("gift_tags").update({ is_active: !t.is_active }).eq("id", id);
            if (error) return toast("تعذر التغيير", "error");
            return reload();
        }
        if (act === "delete") {
            const n = ptags.filter((x) => x.tag_id === id).length;
            const ok = await UI().confirmAction({ title: "حذف العلامة", message: n ? `العلامة دي على ${n} هدية، وهتتشال منهم (الهدايا نفسها مش هتتحذف). متأكدة؟` : "متأكدة؟", confirmLabel: "حذف", danger: true });
            if (!ok) return;
            const { error } = await T("gift_tags").delete().eq("id", id);
            toast(error ? "تعذر الحذف" : "تم الحذف", error ? "error" : "success");
            return reload();
        }
    }

    /* ============================= ربط الأحداث ============================= */

    function init() {
        document.getElementById("gf-tabs").addEventListener("click", (evt) => {
            const b = evt.target.closest("[data-tab]");
            if (!b) return;
            tab = b.dataset.tab;
            render();
        });
        document.getElementById("gf-add-btn").addEventListener("click", () => {
            if (tab === "gifts") giftModal(null);
            else if (tab === "shelves") shelfModal(null, false);
            else if (tab === "heroes") heroModal(null, false);
            else tagModal(null);
        });
        document.getElementById("gf-tbody").addEventListener("click", (evt) => {
            const b = evt.target.closest("[data-act]");
            if (!b) return;
            const act = b.dataset.act, id = b.dataset.id;
            if (tab === "gifts") giftAction(act, id);
            else if (tab === "shelves") shelfAction(act, id);
            else if (tab === "heroes") heroAction(act, id);
            else tagAction(act, id);
        });
        reload();
    }

    document.addEventListener("BoseAdminReady", init);
})();
