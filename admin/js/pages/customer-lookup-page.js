/**
 * customer-lookup-page.js - منطق صفحة متابعة العملاء فقط
 * =====================================================================
 * بتستخدم window.BoseAdmin.getCustomerLoyaltyProfile(phone) اللي بترجع
 * كل حاجة محتاجاها الصفحة دفعة واحدة: الطلبات، القسايم، وموقع العميلة
 * الحالي في دورة الولاء.
 *
 * ⚠️ ملحوظة مهمة (نفس المنطق المستخدم في القاعدة بالظبط): كل صف طلب
 * (order) هنا هو فاتورة مستقلة بذاتها بغض النظر عن عدد المنتجات جواها -
 * لو طلب واحد فيه 20 منتج مختلف في نفس الفاتورة، فده لسه "طلب واحد" في
 * ترتيب دورة الولاء. اللي بيزوّد الترتيب هو عدد صفوف الطلبات (غير الملغاة)
 * على نفس رقم الهاتف - مش عدد عناصر order_items جواها.
 *
 * 🛠️ إجراءات يدوية (كل واحدة بتتسجل في سجل النشاط الإداري تلقائياً):
 *  - منح قسيمة يدوية: إصدار قسيمة هدية لعميلة خارج الدورة التلقائية.
 *  - إلغاء قسيمة: تصفير صلاحيتها فوراً (بتبان "منتهية الصلاحية").
 *  - استبعاد/استعادة طلب من عدّاد الولاء: عن طريق تغيير حالته لـ"ملغي"
 *    أو "تم التسليم" - وده اللي فعلياً بيأثر على حساب الترتيب لأي طلب
 *    جديد، لأن مفيش عمود "ترتيب" منفصل بيتغيّر لوحده (شوف admin-data.js).
 */
(function () {
    "use strict";

    let currentPhone = null; // آخر رقم اتبحث عنه بنجاح - بنستخدمه لإعادة تحميل البيانات بعد أي إجراء يدوي

    function formatDate(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    /* ============================= المفضلة ============================= */

    function renderFavorites(products) {
        const wrap = document.getElementById("clk-favorites-list");
        const e = window.BoseAdminUI.escapeHtml;
        if (!products.length) {
            wrap.innerHTML = window.BoseAdminUI.emptyStateHTML({
                icon: "fa-heart",
                title: "المفضلة فاضية",
                text: "العميلة دي لسه معندهاش أي منتج في المفضلة.",
            });
            return;
        }
        wrap.innerHTML = `
            <div style="display:flex; flex-wrap:wrap; gap:10px;">
                ${products.map((p) => {
                    const img = (p.images && p.images[0]) || "";
                    return `
                    <div style="display:flex; align-items:center; gap:8px; background: var(--adm-bg-hover); border-radius: 10px; padding: 8px 12px;">
                        ${img ? `<img src="${e(img)}" alt="" style="width:32px; height:32px; border-radius:8px; object-fit:cover;">` : ""}
                        <span style="font-weight:700; font-size:0.86rem;">${e(p.title || p.id)}</span>
                    </div>`;
                }).join("")}
            </div>
        `;
    }

    async function loadFavorites(phone) {
        const wrap = document.getElementById("clk-favorites-list");
        wrap.innerHTML = '<p style="text-align:center; opacity:0.6; padding: 10px 0;">جاري التحميل...</p>';
        const products = await window.BoseAdmin.getCustomerFavorites(phone);
        renderFavorites(products);
    }

    /* ============================= بطاقات الملخص ============================= */

    function renderStats(profile) {
        const grid = document.getElementById("clk-stats-grid");
        const activeVouchers = profile.vouchers.filter((v) => v.remaining_amount > 0 && new Date(v.expires_at) > new Date());
        const activeVouchersTotal = activeVouchers.reduce((sum, v) => sum + parseFloat(v.remaining_amount || 0), 0);

        const cards = [
            { icon: "fa-receipt", cls: "pink", label: "إجمالي الطلبات (غير الملغاة)", value: profile.totalOrders },
            {
                icon: "fa-percent", cls: profile.nextDiscountPercent > 0 || profile.nextIsMilestone ? "success" : "info",
                label: "الطلب الجاي (رقم " + profile.nextOrderSequence + ")",
                value: profile.nextIsMilestone ? "🎁 يستحق قسيمة هدية" : (profile.nextDiscountPercent > 0 ? `خصم ${profile.nextDiscountPercent}%` : "بدون خصم"),
            },
            { icon: "fa-gift", cls: "gold", label: "قسايم نشطة", value: activeVouchers.length },
            { icon: "fa-sack-dollar", cls: "success", label: "رصيد القسايم النشطة", value: money(activeVouchersTotal) },
        ];

        grid.innerHTML = cards.map((c) => `
            <div class="adm-stat-card">
                <div class="adm-stat-card-text">
                    <span>${c.label}</span>
                    <strong>${window.BoseAdminUI.escapeHtml(String(c.value))}</strong>
                </div>
                <div class="adm-stat-icon ${c.cls}"><i class="fa-solid ${c.icon}"></i></div>
            </div>
        `).join("");
    }

    /* ============================= معاينة دورة الخصم ============================= */

    function renderCycle(profile) {
        const note = document.getElementById("clk-cycle-note");
        note.textContent = profile.nextIsMilestone
            ? `الطلب الجاي (رقم ${profile.nextOrderSequence}) بيستحق قسيمة هدية بدل نسبة الخصم العادية`
            : `الطلب الجاي (رقم ${profile.nextOrderSequence}) هو الترتيب رقم ${profile.nextCyclePosition} داخل دورة الـ${profile.cycleLength} طلبات`;

        const row = document.getElementById("clk-cycle-row");
        const dots = [];
        for (let pos = 1; pos <= profile.cycleLength; pos += 1) {
            const pct = parseFloat(profile.tiers[String(pos)]) || 0;
            const isNext = pos === profile.nextCyclePosition && !profile.nextIsMilestone;
            const cls = [pct > 0 ? "has-discount" : "", isNext ? "is-next" : ""].filter(Boolean).join(" ");
            const label = pct > 0 ? `${pct}%` : "—";
            dots.push(`<div class="clk-cycle-dot ${cls}" title="الترتيب ${pos} داخل الدورة">${label}</div>`);
        }
        if (profile.nextIsMilestone) {
            dots.push(`<div class="clk-cycle-dot is-milestone is-next" title="قسيمة هدية">🎁 هدية</div>`);
        }
        row.innerHTML = dots.join("");
    }

    /* ============================= قسايم الهدية ============================= */

    function renderVouchers(profile) {
        const wrap = document.getElementById("clk-vouchers-list");
        if (!profile.vouchers.length) {
            wrap.innerHTML = window.BoseAdminUI.emptyStateHTML({
                icon: "fa-gift", title: "لسه معندهاش أي قسيمة", text: "أول قسيمة هتتكسب تلقائياً بعد ما تتسلّم أول طلب يوصل لدورة الهدية",
            });
            return;
        }

        wrap.innerHTML = profile.vouchers.map((v) => {
            const expired = new Date(v.expires_at) <= new Date();
            const used = parseFloat(v.remaining_amount) <= 0;
            const active = !expired && !used;
            let statusBadge;
            if (used) statusBadge = '<span class="adm-badge neutral">اتصرفت بالكامل</span>';
            else if (expired) statusBadge = '<span class="adm-badge danger">منتهية الصلاحية</span>';
            else statusBadge = '<span class="adm-badge success">نشطة</span>';

            return `
                <div class="clk-voucher-item">
                    <div>
                        <div class="code">${window.BoseAdminUI.escapeHtml(v.code)}${!v.earned_order_id ? ' <span class="adm-badge neutral" style="font-size:0.62rem;">يدوية</span>' : ""}</div>
                        <div class="meta">
                            صدرت ${formatDate(v.issued_at)} · تنتهي ${formatDate(v.expires_at)}
                            ${v.last_used_at ? ` · آخر استخدام ${formatDate(v.last_used_at)}` : ""}
                        </div>
                    </div>
                    <div style="text-align:left; display:flex; align-items:center; gap:10px;">
                        <strong>${money(v.remaining_amount)} <span class="meta">من أصل ${money(v.amount)}</span></strong>
                        ${statusBadge}
                        ${active ? `<button type="button" class="clk-voucher-void-btn" data-voucher-id="${v.id}" data-voucher-code="${window.BoseAdminUI.escapeHtml(v.code)}"><i class="fa-solid fa-ban"></i> إلغاء</button>` : ""}
                    </div>
                </div>`;
        }).join("");

        wrap.querySelectorAll(".clk-voucher-void-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const code = btn.dataset.voucherCode;
                const confirmed = await window.BoseAdminUI.confirmAction({
                    title: "إلغاء القسيمة؟",
                    message: `هيتم إلغاء القسيمة ${code} فوراً وهتظهر كمنتهية الصلاحية - العميلة مش هتقدر تستخدمها تاني. الإجراء ده مينفعش يتراجع عنه.`,
                    confirmLabel: "إلغاء القسيمة",
                    danger: true,
                });
                if (!confirmed) return;
                try {
                    await window.BoseAdmin.voidLoyaltyVoucher(btn.dataset.voucherId, code);
                    window.BoseAdminUI.showToast("تم إلغاء القسيمة", "success");
                    await reloadProfile();
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر إلغاء القسيمة", "error");
                }
            });
        });
    }

    /* ============================= منح قسيمة يدوية ============================= */

    function initGrantVoucherForm() {
        const toggleBtn = document.getElementById("clk-grant-voucher-btn");
        const form = document.getElementById("clk-grant-voucher-form");
        const confirmBtn = document.getElementById("clk-grant-confirm-btn");
        const cancelBtn = document.getElementById("clk-grant-cancel-btn");

        toggleBtn.addEventListener("click", () => {
            form.style.display = form.style.display === "none" ? "" : "none";
        });
        cancelBtn.addEventListener("click", () => { form.style.display = "none"; });

        confirmBtn.addEventListener("click", async () => {
            if (!currentPhone) return;
            const amount = parseFloat(document.getElementById("clk-grant-amount").value);
            const validity = parseInt(document.getElementById("clk-grant-validity").value, 10);

            if (!amount || amount <= 0) {
                window.BoseAdminUI.showToast("اكتبي قيمة قسيمة أكبر من صفر", "error");
                return;
            }

            const confirmed = await window.BoseAdminUI.confirmAction({
                title: "منح قسيمة يدوية؟",
                message: `هيتم إصدار قسيمة بقيمة ${money(amount)} لصاحبة الرقم ${currentPhone} فوراً، صالحة لمدة ${validity || 2} شهر.`,
                confirmLabel: "تأكيد المنح",
            });
            if (!confirmed) return;

            confirmBtn.disabled = true;
            try {
                await window.BoseAdmin.grantManualLoyaltyVoucher(currentPhone, amount, validity || 2);
                window.BoseAdminUI.showToast("تم منح القسيمة بنجاح", "success");
                form.style.display = "none";
                document.getElementById("clk-grant-amount").value = "";
                await reloadProfile();
            } catch (err) {
                window.BoseAdminUI.showToast(err.message || "تعذر منح القسيمة", "error");
            } finally {
                confirmBtn.disabled = false;
            }
        });
    }

    /* ============================= سجل الطلبات ============================= */

    function renderOrders(profile) {
        const tbody = document.getElementById("clk-orders-tbody");
        if (!profile.orders.length) {
            tbody.innerHTML = `<tr><td colspan="8">${window.BoseAdminUI.emptyStateHTML({ icon: "fa-receipt", title: "مفيش أي طلبات على الرقم ده" })}</td></tr>`;
            return;
        }

        tbody.innerHTML = profile.orders.map((o, idx) => {
            const itemsList = (o.order_items || []).map((it) =>
                `<li>${window.BoseAdminUI.escapeHtml(it.title || "")}${it.flavor_name ? " - " + window.BoseAdminUI.escapeHtml(it.flavor_name) : ""} × ${it.quantity}</li>`
            ).join("");

            const loyaltyPct = parseFloat(o.loyalty_discount_percent) || 0;
            const loyaltyAmt = parseFloat(o.loyalty_discount_amount) || 0;
            const isCancelled = o.status === "cancelled";
            const actionBtn = isCancelled
                ? `<button type="button" class="clk-order-action-btn restore" data-order-id="${o.id}" data-order-number="${window.BoseAdminUI.escapeHtml(o.order_number)}" data-exclude="false">استعادة للولاء</button>`
                : `<button type="button" class="clk-order-action-btn" data-order-id="${o.id}" data-order-number="${window.BoseAdminUI.escapeHtml(o.order_number)}" data-exclude="true">استبعاد من الولاء</button>`;

            return `
                <tr class="clk-order-row" data-idx="${idx}">
                    <td>${window.BoseAdminUI.escapeHtml(o.order_number)}</td>
                    <td>${formatDate(o.created_at)}</td>
                    <td>${window.BoseAdminUI.orderStatusBadgeHTML(o.status)}</td>
                    <td>${o.status === "cancelled" ? "—" : `#${o.loyalty_order_sequence ?? "—"}`}${o.is_loyalty_milestone ? " 🎁" : ""}</td>
                    <td>${loyaltyAmt > 0 ? `${loyaltyPct}% (${money(loyaltyAmt)})` : "—"}</td>
                    <td>${o.loyalty_voucher_code_used ? `${window.BoseAdminUI.escapeHtml(o.loyalty_voucher_code_used)} (${money(o.loyalty_voucher_amount_used)})` : "—"}</td>
                    <td>${money(o.grand_total)}</td>
                    <td>${actionBtn}</td>
                </tr>
                <tr class="clk-order-items-row" data-idx-items="${idx}" style="display:none;">
                    <td colspan="8"><ul>${itemsList || "<li>لا توجد عناصر</li>"}</ul></td>
                </tr>`;
        }).join("");

        tbody.querySelectorAll(".clk-order-row").forEach((row) => {
            row.addEventListener("click", (e) => {
                if (e.target.closest(".clk-order-action-btn")) return; // متفتحيش صف التفاصيل لو دوسنا زرار الإجراء
                const detailRow = tbody.querySelector(`.clk-order-items-row[data-idx-items="${row.dataset.idx}"]`);
                if (detailRow) detailRow.style.display = detailRow.style.display === "none" ? "" : "none";
            });
        });

        tbody.querySelectorAll(".clk-order-action-btn").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const orderId = btn.dataset.orderId;
                const orderNumber = btn.dataset.orderNumber;
                const exclude = btn.dataset.exclude === "true";

                const confirmed = await window.BoseAdminUI.confirmAction({
                    title: exclude ? "استبعاد الطلب من ترتيب الولاء؟" : "استعادة الطلب لترتيب الولاء؟",
                    message: exclude
                        ? `هيتم تغيير حالة الطلب ${orderNumber} لـ"ملغي" عشان يتشال من عدّاد دورة الولاء - وده هيأثر على ترتيب كل الطلبات اللي بعده لنفس العميلة. الطلب مش هيتحذف، بس حالته هتتغير.`
                        : `هيتم إرجاع حالة الطلب ${orderNumber} لـ"تم التسليم" وإرجاعه لعدّاد دورة الولاء.`,
                    confirmLabel: exclude ? "استبعاد" : "استعادة",
                    danger: exclude,
                });
                if (!confirmed) return;

                btn.disabled = true;
                try {
                    await window.BoseAdmin.setOrderExcludedFromLoyalty(orderId, orderNumber, exclude);
                    window.BoseAdminUI.showToast(exclude ? "تم استبعاد الطلب من الولاء" : "تم استعادة الطلب", "success");
                    await reloadProfile();
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر تنفيذ الإجراء", "error");
                    btn.disabled = false;
                }
            });
        });
    }

    /* ============================= البحث وإعادة التحميل ============================= */

    async function reloadProfile() {
        if (!currentPhone) return;
        const profile = await window.BoseAdmin.getCustomerLoyaltyProfile(currentPhone);
        renderStats(profile);
        renderCycle(profile);
        renderVouchers(profile);
        renderOrders(profile);
        loadFavorites(currentPhone);
    }

    async function handleSearch() {
        const phoneInput = document.getElementById("clk-phone-input");
        const errorBox = document.getElementById("clk-error");
        const searchBtn = document.getElementById("clk-search-btn");

        errorBox.style.display = "none";
        document.getElementById("clk-empty").style.display = "none";
        document.getElementById("clk-results").style.display = "none";
        document.getElementById("clk-loading").style.display = "";

        searchBtn.disabled = true;
        try {
            const profile = await window.BoseAdmin.getCustomerLoyaltyProfile(phoneInput.value);
            currentPhone = profile.cleanPhone;
            renderStats(profile);
            renderCycle(profile);
            renderVouchers(profile);
            renderOrders(profile);
            loadFavorites(currentPhone);
            document.getElementById("clk-results").style.display = "";
        } catch (err) {
            currentPhone = null;
            errorBox.textContent = err.message || "تعذر إيجاد بيانات على الرقم ده";
            errorBox.style.display = "";
            document.getElementById("clk-empty").style.display = "";
        } finally {
            document.getElementById("clk-loading").style.display = "none";
            searchBtn.disabled = false;
        }
    }

    function init() {
        document.getElementById("clk-search-btn").addEventListener("click", handleSearch);
        document.getElementById("clk-phone-input").addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSearch();
        });
        initGrantVoucherForm();
    }

    document.addEventListener("BoseAdminReady", init);
})();
