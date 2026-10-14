/**
 * quantity-promos-page.js - إدارة "عروض الكمية" (جدول quantity_promos)
 * =====================================================================
 * عرض كمية = شرط على عدد القطع من فئة/منتجات + مكافأة تلقائية في السلة:
 *   - percent_off    : خصم % على قطع نطاق العرض
 *   - free_shipping  : شحن مجاني (للتوصيل بس)
 *   - free_piece     : قطعة هدية مع كل N قطع (أرخص قطعة في النطاق)
 * الموقع بيطبّق أفضل عرض واحد بس للسلة، والحساب الملزم على السيرفر
 * (create_order_with_items) - الصفحة دي بتدير القواعد بس.
 */
(function () {
    "use strict";

    let allPromos = [];
    let allCategories = [];
    let allProducts = [];

    const REWARD_LABELS = {
        percent_off: "خصم %",
        free_shipping: "شحن مجاني",
        free_piece: "قطعة هدية",
    };

    function fmtDate(iso) {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleString("ar-EG", {
                timeZone: "Africa/Cairo", weekday: "short", day: "numeric", month: "short",
                hour: "numeric", minute: "2-digit",
            });
        } catch (e) { return iso; }
    }

    /** ISO → قيمة input[type=datetime-local] بتوقيت جهاز الأدمن */
    function toLocalInput(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function fromLocalInput(v) {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }

    function statusOf(p) {
        const now = Date.now();
        if (!p.is_active) return { cls: "danger", text: "متوقف" };
        if (p.starts_at && new Date(p.starts_at).getTime() > now) return { cls: "info", text: "مجدول" };
        if (p.ends_at && new Date(p.ends_at).getTime() <= now) return { cls: "warning", text: "منتهي" };
        return { cls: "success", text: "شغال دلوقتي" };
    }

    function ruleText(p) {
        const n = p.min_pieces;
        if (p.reward_type === "percent_off") return `من ${n} قطع ← خصم ${Number(p.percent)}%`;
        if (p.reward_type === "free_shipping") return `من ${n} قطع ← شحن مجاني`;
        if (p.reward_type === "free_piece") return `من ${n} قطع ← كل ${p.free_every || n} قطع، قطعة هدية`;
        return "—";
    }

    function scopeText(p) {
        const ids = Array.isArray(p.scope_ids) ? p.scope_ids : [];
        if (p.scope_type === "category") {
            const names = ids.map((id) => (allCategories.find((c) => c.id === id) || {}).title || id);
            return "فئة: " + (names.join("، ") || "—");
        }
        return `${ids.length} منتج محدد`;
    }

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("promos-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        if (!allPromos.length) {
            tbody.innerHTML = `<tr><td colspan="6">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-gift",
                title: "مفيش عروض كمية لسه",
                text: "اضغطي \"إضافة عرض كمية\" عشان تعملي أول عرض.",
            })}</td></tr>`;
            return;
        }

        tbody.innerHTML = allPromos.map((p) => {
            const st = statusOf(p);
            return `
            <tr>
                <td><span class="adm-badge ${st.cls}">${st.text}</span></td>
                <td>
                    <strong>${e(p.title)}</strong>
                    ${p.campaign ? `<div class="adm-order-item-meta">${e(p.campaign)}</div>` : ""}
                </td>
                <td>
                    ${e(ruleText(p))}
                    <div class="adm-order-item-meta">${REWARD_LABELS[p.reward_type] || ""}${p.allow_loyalty_stack ? " · بيتجمع مع خصم الولاء" : " · بيلغي خصم الولاء"}${p.lowers_min_order ? " · بيخفّض الحد الأدنى للحجز" : ""}</div>
                </td>
                <td>${e(scopeText(p))}</td>
                <td>
                    <div class="adm-order-item-meta">من: ${e(fmtDate(p.starts_at))}</div>
                    <div class="adm-order-item-meta">إلى: ${e(fmtDate(p.ends_at))}</div>
                </td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="toggle" data-id="${e(p.id)}" title="${p.is_active ? "إيقاف" : "تفعيل"}">
                        <i class="fa-solid ${p.is_active ? "fa-pause" : "fa-play"}"></i>
                    </button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(p.id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="copy" data-id="${e(p.id)}" title="نسخ كعرض جديد"><i class="fa-solid fa-copy"></i></button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="delete" data-id="${e(p.id)}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll("[data-action]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const promo = allPromos.find((x) => x.id === btn.getAttribute("data-id"));
                if (!promo) return;
                const action = btn.getAttribute("data-action");
                if (action === "edit") openModal(promo, false);
                else if (action === "copy") openModal(promo, true);
                else if (action === "delete") handleDelete(promo);
                else if (action === "toggle") handleToggle(promo);
            });
        });
    }

    async function handleToggle(promo) {
        try {
            await window.BoseAdmin.updateQuantityPromo(promo.id, { is_active: !promo.is_active });
            window.BoseAdminUI.showToast(promo.is_active ? "تم إيقاف العرض" : "تم تفعيل العرض", "success");
            await loadPromos();
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر تغيير حالة العرض", "error");
        }
    }

    async function handleDelete(promo) {
        const ok = await window.BoseAdminUI.confirmAction({
            title: "تأكيد الحذف",
            message: `حذف عرض "${promo.title}" نهائيًا؟ الطلبات اللي اتسجلت بيه قبل كده هتفضل محفوظة بقيمة الخصم اللي خدته. لو عايزة بس توقفيه مؤقتًا استخدمي زرار الإيقاف.`,
            confirmLabel: "حذف",
            danger: true,
        });
        if (!ok) return;
        try {
            await window.BoseAdmin.deleteQuantityPromo(promo.id);
            window.BoseAdminUI.showToast("تم حذف العرض", "success");
            await loadPromos();
        } catch (err) {
            window.BoseAdminUI.showToast("تعذر حذف العرض", "error");
        }
    }

    /* ============================= المودال ============================= */

    function scopeOptionsHtml(scopeType, selectedIds) {
        const e = window.BoseAdminUI.escapeHtml;
        const sel = new Set(selectedIds || []);
        if (scopeType === "category") {
            return allCategories.map((c) =>
                `<option value="${e(c.id)}" ${sel.has(c.id) ? "selected" : ""}>${e(c.title)}</option>`).join("");
        }
        const groups = new Map();
        allProducts.forEach((p) => {
            const g = (p.categories && p.categories.title) || "بدون فئة";
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g).push(p);
        });
        return Array.from(groups.entries()).map(([g, items]) => `
            <optgroup label="${e(g)}">${items.map((p) =>
                `<option value="${e(p.id)}" ${sel.has(p.id) ? "selected" : ""}>${e(p.title)}${p.flavor_name ? " - " + e(p.flavor_name) : ""}</option>`).join("")}
            </optgroup>`).join("");
    }

    function openModal(promo, asCopy) {
        const isEdit = !!promo && !asCopy;
        const e = window.BoseAdminUI.escapeHtml;
        const base = promo || {
            campaign: "", title: "", description: "", is_active: true, starts_at: null, ends_at: null,
            scope_type: "category", scope_ids: [], reward_type: "percent_off", min_pieces: 3, percent: 10,
            free_every: null, lowers_min_order: true, allow_loyalty_stack: true, sort_order: allPromos.length + 1,
        };

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 560px; max-height: 92vh; overflow-y: auto;">
                <div class="adm-modal-header">
                    <h3>${isEdit ? "تعديل عرض كمية" : (asCopy ? "نسخ عرض كمية" : "إضافة عرض كمية")}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="promo-form">
                    <div class="adm-field">
                        <label for="pm-campaign">اسم الحملة (للتنظيم بس)</label>
                        <input class="adm-input" id="pm-campaign" value="${e(base.campaign || "")}" placeholder="مثال: خصم الدوناتس - الأربعاء 14/10">
                    </div>
                    <div class="adm-field">
                        <label for="pm-title">نص العرض (بيظهر للعميلة)</label>
                        <input class="adm-input" id="pm-title" required value="${e(base.title || "")}" placeholder="مثال: اختاري 3 قطع دوناتس واحصلي على خصم 10%">
                    </div>
                    <div class="adm-field">
                        <label for="pm-scope-type">العرض على إيه؟</label>
                        <select class="adm-select" id="pm-scope-type">
                            <option value="category" ${base.scope_type === "category" ? "selected" : ""}>فئة كاملة (كل نكهاتها)</option>
                            <option value="product" ${base.scope_type === "product" ? "selected" : ""}>منتجات محددة</option>
                        </select>
                    </div>
                    <div class="adm-field">
                        <label for="pm-scope-ids">اختاري (ممكن أكتر من واحد - اضغطي Ctrl/Cmd أو اسحبي)</label>
                        <select class="adm-select" id="pm-scope-ids" multiple size="6" style="height:auto;">
                            ${scopeOptionsHtml(base.scope_type, base.scope_ids)}
                        </select>
                    </div>
                    <div class="adm-field">
                        <label for="pm-reward">المكافأة</label>
                        <select class="adm-select" id="pm-reward">
                            <option value="percent_off" ${base.reward_type === "percent_off" ? "selected" : ""}>خصم نسبة %</option>
                            <option value="free_shipping" ${base.reward_type === "free_shipping" ? "selected" : ""}>شحن مجاني (للتوصيل بس)</option>
                            <option value="free_piece" ${base.reward_type === "free_piece" ? "selected" : ""}>قطعة هدية</option>
                        </select>
                    </div>
                    <div class="adm-field">
                        <label for="pm-min">أقل عدد قطع عشان العرض يشتغل</label>
                        <input type="number" min="1" class="adm-input" id="pm-min" required value="${Number(base.min_pieces) || 3}">
                    </div>
                    <div class="adm-field" id="pm-percent-wrap">
                        <label for="pm-percent">نسبة الخصم %</label>
                        <input type="number" min="1" max="100" step="0.5" class="adm-input" id="pm-percent" value="${base.percent != null ? Number(base.percent) : 10}">
                    </div>
                    <div class="adm-field" id="pm-every-wrap">
                        <label for="pm-every">قطعة هدية كل كام قطعة؟</label>
                        <input type="number" min="2" class="adm-input" id="pm-every" value="${base.free_every || ""}" placeholder="مثال: 8 = القطعة الثامنة هدية">
                        <span class="adm-hint">القطعة الهدية = أرخص قطعة في نطاق العرض. ولو العميلة طلبت 16 قطعة، بتاخد قطعتين هدية.</span>
                    </div>
                    <div class="adm-field">
                        <label for="pm-start">يبدأ</label>
                        <input type="datetime-local" class="adm-input" id="pm-start" value="${toLocalInput(base.starts_at)}">
                    </div>
                    <div class="adm-field">
                        <label for="pm-end">ينتهي</label>
                        <input type="datetime-local" class="adm-input" id="pm-end" value="${toLocalInput(base.ends_at)}">
                        <span class="adm-hint">سيبيهم فاضيين لو العرض مفتوح من غير مدة. للعرض ليوم واحد: من 12:00 صباحًا لحد 12:00 صباحًا تاني يوم.</span>
                    </div>
                    <div class="adm-field">
                        <label><input type="checkbox" id="pm-lowers" ${base.lowers_min_order ? "checked" : ""}> يخفّض الحد الأدنى للحجز في الفئة وقت العرض (مثلاً الدوناتس من 6 قطع لـ 3)</label>
                    </div>
                    <div class="adm-field">
                        <label><input type="checkbox" id="pm-stack" ${base.allow_loyalty_stack ? "checked" : ""}> يتجمع مع خصم الولاء (لو مش متعلّم، خصم الولاء بيتلغي لما العرض يتطبق)</label>
                    </div>
                    <div class="adm-field">
                        <label><input type="checkbox" id="pm-active" ${base.is_active ? "checked" : ""}> العرض مفعّل</label>
                    </div>
                    <div class="adm-field">
                        <label for="pm-sort">الترتيب</label>
                        <input type="number" class="adm-input" id="pm-sort" value="${base.sort_order ?? 0}">
                    </div>
                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="pm-save-btn">حفظ</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        const scopeTypeEl = document.getElementById("pm-scope-type");
        const scopeIdsEl = document.getElementById("pm-scope-ids");
        const rewardEl = document.getElementById("pm-reward");

        function syncFields() {
            const r = rewardEl.value;
            document.getElementById("pm-percent-wrap").style.display = r === "percent_off" ? "" : "none";
            document.getElementById("pm-every-wrap").style.display = r === "free_piece" ? "" : "none";
        }
        syncFields();
        rewardEl.addEventListener("change", syncFields);
        scopeTypeEl.addEventListener("change", () => {
            scopeIdsEl.innerHTML = scopeOptionsHtml(scopeTypeEl.value, []);
        });

        document.getElementById("promo-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("pm-save-btn");

            const scopeIds = Array.from(scopeIdsEl.selectedOptions).map((o) => o.value);
            const reward = rewardEl.value;
            const minPieces = parseInt(document.getElementById("pm-min").value, 10) || 0;
            const startsAt = fromLocalInput(document.getElementById("pm-start").value);
            const endsAt = fromLocalInput(document.getElementById("pm-end").value);

            if (!scopeIds.length) { window.BoseAdminUI.showToast("اختاري الفئة أو المنتجات اللي العرض عليها", "warning"); return; }
            if (minPieces < 1) { window.BoseAdminUI.showToast("أقل عدد قطع لازم يكون 1 أو أكتر", "warning"); return; }
            if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
                window.BoseAdminUI.showToast("تاريخ النهاية لازم يكون بعد البداية", "warning"); return;
            }
            let percent = null, freeEvery = null;
            if (reward === "percent_off") {
                percent = parseFloat(document.getElementById("pm-percent").value);
                if (!(percent > 0 && percent <= 100)) { window.BoseAdminUI.showToast("نسبة الخصم لازم تكون بين 1 و100", "warning"); return; }
            }
            if (reward === "free_piece") {
                freeEvery = parseInt(document.getElementById("pm-every").value, 10);
                if (!(freeEvery >= 2)) { window.BoseAdminUI.showToast("اكتبي قطعة هدية كل كام قطعة (2 أو أكتر)", "warning"); return; }
            }

            const payload = {
                campaign: document.getElementById("pm-campaign").value.trim() || null,
                title: document.getElementById("pm-title").value.trim(),
                is_active: document.getElementById("pm-active").checked,
                starts_at: startsAt,
                ends_at: endsAt,
                scope_type: scopeTypeEl.value,
                scope_ids: scopeIds,
                reward_type: reward,
                min_pieces: minPieces,
                percent: percent,
                free_every: freeEvery,
                lowers_min_order: document.getElementById("pm-lowers").checked,
                allow_loyalty_stack: document.getElementById("pm-stack").checked,
                sort_order: parseInt(document.getElementById("pm-sort").value, 10) || 0,
            };

            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";
            try {
                if (isEdit) {
                    await window.BoseAdmin.updateQuantityPromo(promo.id, payload);
                    window.BoseAdminUI.showToast("تم تعديل العرض", "success");
                } else {
                    await window.BoseAdmin.createQuantityPromo(payload);
                    window.BoseAdminUI.showToast("تم إضافة العرض", "success");
                }
                close();
                await loadPromos();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر حفظ العرض: " + (err && err.message ? err.message : ""), "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadPromos() {
        document.getElementById("promos-tbody").innerHTML = `<tr><td colspan="6"><div class="adm-loading-spinner"></div></td></tr>`;
        allPromos = await window.BoseAdmin.getAllQuantityPromos();
        renderTable();
    }

    document.addEventListener("BoseAdminReady", async () => {
        document.getElementById("add-promo-btn").addEventListener("click", () => openModal(null, false));
        [allPromos, allCategories, allProducts] = await Promise.all([
            window.BoseAdmin.getAllQuantityPromos(),
            window.BoseAdmin.getAllCategories(),
            window.BoseAdmin.getAllProducts(),
        ]);
        renderTable();
    });
})();
