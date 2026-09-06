/**
 * gift-cards-page.js - منطق صفحة بطاقات الهدايا المُباعة
 * =====================================================================
 * نفس نمط loyalty-vouchers-page.js بالظبط، لكن على جدول gift_cards
 * (بطاقات هدايا اشتراها عملاء بفلوسهم الفعلية عبر منتج is_gift_card=true،
 * بتتصدر تلقائياً عند التسليم بعد تأكيد الدفع - عكس قسائم الولاء المجانية).
 * البحث والفلترة بيتصفوا محلياً بعد التحميل، زي صفحة قسائم الولاء بالظبط.
 */
(function () {
    "use strict";

    let allGiftCards = [];
    let defaultGiftCardValidityMonths = 12;

    function formatDate(iso) {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    function cardStatus(c) {
        if (parseFloat(c.remaining_amount) <= 0) return "used";
        if (new Date(c.expires_at) <= new Date()) return "expired";
        return "active";
    }

    function statusBadgeHTML(status) {
        if (status === "used") return '<span class="adm-badge neutral">اتصرفت بالكامل</span>';
        if (status === "expired") return '<span class="adm-badge danger">منتهية الصلاحية</span>';
        return '<span class="adm-badge success">نشطة</span>';
    }

    /* ============================= بطاقات الملخص ============================= */

    function renderStats() {
        const grid = document.getElementById("gc-stats-grid");
        const active = allGiftCards.filter((c) => cardStatus(c) === "active");
        const used = allGiftCards.filter((c) => cardStatus(c) === "used");
        const expired = allGiftCards.filter((c) => cardStatus(c) === "expired");
        const soldTotal = allGiftCards.reduce((sum, c) => sum + (c.purchase_order ? parseFloat(c.amount || 0) : 0), 0);
        const spentTotal = allGiftCards.reduce((sum, c) => sum + (parseFloat(c.amount || 0) - parseFloat(c.remaining_amount || 0)), 0);

        const cards = [
            { icon: "fa-wallet", cls: "pink", label: "إجمالي البطاقات الصادرة", value: allGiftCards.length },
            { icon: "fa-circle-check", cls: "success", label: "نشطة حالياً", value: active.length },
            { icon: "fa-hand-holding-dollar", cls: "gold", label: "إجمالي مبيعات البطاقات (بفلوس حقيقية)", value: money(soldTotal) },
            { icon: "fa-sack-dollar", cls: "warning", label: "إجمالي المصروف من البطاقات", value: money(spentTotal) },
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

    /* ============================= الجدول ============================= */

    function renderTable() {
        const tbody = document.getElementById("gc-tbody");
        const e = window.BoseAdminUI.escapeHtml;
        const search = document.getElementById("gc-search-input").value.trim().toLowerCase();
        const statusFilter = document.getElementById("gc-status-filter").value;

        let rows = allGiftCards;
        if (search) {
            rows = rows.filter((c) => (c.code || "").toLowerCase().includes(search) || (c.purchaser_phone || "").includes(search));
        }
        if (statusFilter) {
            rows = rows.filter((c) => cardStatus(c) === statusFilter);
        }

        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="10">${window.BoseAdminUI.emptyStateHTML({ icon: "fa-wallet", title: "مفيش بطاقات مطابقة", text: "جربي تغيير البحث أو الفلتر" })}</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map((c) => {
            const status = cardStatus(c);
            const canVoid = status === "active";
            return `
            <tr>
                <td class="gc-code">${e(c.code)}</td>
                <td style="direction:ltr; text-align:right;">${e(c.purchaser_phone)}</td>
                <td>${money(c.amount)}</td>
                <td>${money(c.remaining_amount)}</td>
                <td>${c.purchase_order ? e(c.purchase_order.order_number) : `<span class="adm-order-item-meta">صدرت يدوي</span>`}</td>
                <td>${c.last_used_order ? e(c.last_used_order.order_number) : "—"}</td>
                <td>${formatDate(c.issued_at)}</td>
                <td>${formatDate(c.expires_at)}</td>
                <td>${statusBadgeHTML(status)}</td>
                <td class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="edit" data-id="${e(c.id)}" title="تعديل الرصيد أو تاريخ الانتهاء"><i class="fa-solid fa-pen"></i></button>
                    ${canVoid ? `<button class="adm-btn adm-btn-ghost adm-btn-icon" data-action="void" data-id="${e(c.id)}" title="إلغاء البطاقة"><i class="fa-solid fa-ban"></i></button>` : ""}
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener("click", () => openEditModal(btn.getAttribute("data-id")));
        });
        tbody.querySelectorAll('[data-action="void"]').forEach((btn) => {
            btn.addEventListener("click", () => handleVoid(btn.getAttribute("data-id")));
        });
    }

    async function handleVoid(giftCardId) {
        const card = allGiftCards.find((c) => c.id === giftCardId);
        if (!card) return;
        const confirmed = await window.BoseAdminUI.confirmAction({
            title: "إلغاء بطاقة الهدية",
            message: `هيتصفّر رصيد بطاقة "${card.code}" (${money(card.remaining_amount)} متبقي) نهائياً ومش هترجع تشتغل تاني. الإجراء ده لا يمكن التراجع عنه.`,
            confirmLabel: "إلغاء البطاقة",
            danger: true,
        });
        if (!confirmed) return;

        try {
            await window.BoseAdmin.voidGiftCard(giftCardId, card.code);
            window.BoseAdminUI.showToast("تم إلغاء البطاقة", "success");
            await loadGiftCards();
        } catch (e) {
            window.BoseAdminUI.showToast("تعذر إلغاء البطاقة", "error");
        }
    }

    /* ============================= مودال التعديل ============================= */

    function openEditModal(giftCardId) {
        const card = allGiftCards.find((c) => c.id === giftCardId);
        if (!card) return;

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        const currentExpiryValue = card.expires_at ? new Date(card.expires_at).toISOString().slice(0, 10) : "";

        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 440px;">
                <div class="adm-modal-header">
                    <h3>تعديل بطاقة ${window.BoseAdminUI.escapeHtml(card.code)}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <p style="font-size:0.82rem; color: var(--adm-text-muted, #7a7a7a); margin: 0 0 14px;">
                    الكود ورقم المشتري والقيمة الأصلية ثابتين ومينفعش يتغيّروا - تقدري بس تعدّلي الرصيد المتبقي وتاريخ الانتهاء.
                </p>
                <form id="gc-edit-form">
                    <div class="adm-field">
                        <label for="gc-ef-remaining">الرصيد المتبقي (جنيه) - من أصل ${money(card.amount)}</label>
                        <input type="number" min="0" max="${card.amount}" step="1" class="adm-input" id="gc-ef-remaining" value="${card.remaining_amount}" required>
                    </div>
                    <div class="adm-field">
                        <label for="gc-ef-expires">تاريخ الانتهاء</label>
                        <input type="date" class="adm-input" id="gc-ef-expires" value="${currentExpiryValue}" required>
                    </div>
                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="gc-ef-save-btn">حفظ التعديل</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("gc-edit-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("gc-ef-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الحفظ...";

            const remainingRaw = document.getElementById("gc-ef-remaining").value;
            const expiresRaw = document.getElementById("gc-ef-expires").value;
            const remainingAmount = parseFloat(remainingRaw);

            if (isNaN(remainingAmount) || remainingAmount < 0 || remainingAmount > card.amount) {
                window.BoseAdminUI.showToast(`الرصيد لازم يكون بين 0 و${card.amount}`, "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ التعديل";
                return;
            }

            try {
                await window.BoseAdmin.updateGiftCard(giftCardId, {
                    remainingAmount,
                    expiresAt: new Date(`${expiresRaw}T23:59:59`).toISOString(),
                });
                window.BoseAdminUI.showToast("تم تعديل البطاقة", "success");
                close();
                await loadGiftCards();
            } catch (err) {
                window.BoseAdminUI.showToast(err.message || "تعذر حفظ التعديل", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "حفظ التعديل";
            }
        });
    }

    /* ============================= مودال الإصدار اليدوي ============================= */

    function openIssueModal() {
        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        const defaultExpiry = new Date();
        defaultExpiry.setMonth(defaultExpiry.getMonth() + defaultGiftCardValidityMonths);
        const defaultExpiryValue = defaultExpiry.toISOString().slice(0, 10);

        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 460px;">
                <div class="adm-modal-header">
                    <h3>إصدار بطاقة هدية يدوي</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form id="gc-issue-form">
                    <div class="adm-field">
                        <label for="gc-if-phone">رقم موبايل المُهدي (المشتري)</label>
                        <input type="tel" class="adm-input" id="gc-if-phone" style="direction:ltr;" placeholder="01012345678" required>
                        <span class="adm-hint">مجرد بيانات تعريفية - أي حد معاه الكود يقدر يستخدم البطاقة فعلياً</span>
                    </div>
                    <div class="adm-form-grid">
                        <div class="adm-field">
                            <label for="gc-if-amount">قيمة البطاقة (جنيه)</label>
                            <input type="number" min="1" step="1" class="adm-input" id="gc-if-amount" value="300" required>
                        </div>
                        <div class="adm-field">
                            <label for="gc-if-expires">تاريخ الانتهاء</label>
                            <input type="date" class="adm-input" id="gc-if-expires" value="${defaultExpiryValue}" required>
                            <span class="adm-hint">افتراضياً ${defaultGiftCardValidityMonths} شهر من دلوقتي (زي بطاقات الشراء التلقائية)</span>
                        </div>
                    </div>
                    <div class="adm-modal-actions">
                        <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إلغاء</button>
                        <button type="submit" class="adm-btn adm-btn-primary" id="gc-if-save-btn">إصدار البطاقة</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        document.getElementById("gc-issue-form").addEventListener("submit", async (evt) => {
            evt.preventDefault();
            const saveBtn = document.getElementById("gc-if-save-btn");
            saveBtn.disabled = true;
            saveBtn.textContent = "جاري الإصدار...";

            const phone = document.getElementById("gc-if-phone").value.trim();
            const amount = parseFloat(document.getElementById("gc-if-amount").value) || 0;
            const expiresRaw = document.getElementById("gc-if-expires").value;

            try {
                const code = await window.BoseAdmin.issueManualGiftCard({
                    phone,
                    amount,
                    expiresAt: new Date(`${expiresRaw}T23:59:59`).toISOString(),
                });
                window.BoseAdminUI.showToast(`تم إصدار البطاقة بنجاح - الكود: ${code}`, "success");
                close();
                await loadGiftCards();
            } catch (err) {
                window.BoseAdminUI.showToast(err.message || "تعذر إصدار البطاقة", "error");
                saveBtn.disabled = false;
                saveBtn.textContent = "إصدار البطاقة";
            }
        });
    }

    /* ============================= التحميل ============================= */

    async function loadGiftCards() {
        allGiftCards = await window.BoseAdmin.getAllGiftCards();
        renderStats();
        renderTable();
    }

    async function init() {
        document.getElementById("gc-search-input").addEventListener("input", renderTable);
        document.getElementById("gc-status-filter").addEventListener("change", renderTable);
        document.getElementById("gc-issue-btn").addEventListener("click", openIssueModal);

        loadGiftCards();
    }

    document.addEventListener("BoseAdminReady", init);
})();
