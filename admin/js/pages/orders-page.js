/**
 * orders-page.js - منطق صفحة الطلبات فقط
 * =====================================================================
 * الفلترة (بالحالة ونص البحث) بتتبعت لـ admin-data.js وتتنفذ على مستوى
 * القاعدة مباشرة (getAllOrders) بدل ما تتعمل في المتصفح، عشان تفضل
 * سريعة حتى لو عدد الطلبات كبر مع الوقت.
 */
(function () {
    "use strict";

    const DELIVERY_LABELS = { pickup: "استلام من المتجر", delivery: "توصيل" };

    let currentOrders = [];
    let searchDebounceTimer = null;
    let selectedIds = new Set();

    /* ============================= الجدول ============================= */

    function formatDate(iso) {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" }) +
            " - " + d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    }

    function money(n) {
        return n || n === 0 ? Math.round(n) + " ج.م" : "—";
    }

    function renderTable() {
        const tbody = document.getElementById("orders-tbody");
        const e = window.BoseAdminUI.escapeHtml;

        // بنشيل من التحديد أي ID مبقاش موجود في النتيجة الحالية (بعد فلترة/بحث جديد)
        const visibleIds = new Set(currentOrders.map((o) => o.id));
        selectedIds.forEach((id) => { if (!visibleIds.has(id)) selectedIds.delete(id); });

        if (!currentOrders.length) {
            tbody.innerHTML = `<tr><td colspan="7">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-receipt",
                title: "مفيش طلبات مطابقة",
                text: "جرّب تغيّر الفلتر أو امسح نص البحث.",
            })}</td></tr>`;
            updateBulkBar();
            return;
        }

        tbody.innerHTML = currentOrders.map((o) => `
            <tr class="adm-clickable-row" data-id="${e(o.id)}">
                <td class="adm-orders-checkbox-cell">
                    <input type="checkbox" class="adm-order-row-checkbox" data-id="${e(o.id)}" ${selectedIds.has(o.id) ? "checked" : ""}>
                </td>
                <td>#${e(o.order_number || o.id)}</td>
                <td>${e(o.customer_name || "—")}</td>
                <td>${e(o.phone1 || "—")}</td>
                <td>${money(o.grand_total)}</td>
                <td>${window.BoseAdminUI.orderStatusBadgeHTML(o.status)}</td>
                <td>${formatDate(o.created_at)}</td>
            </tr>
        `).join("");

        tbody.querySelectorAll("tr[data-id]").forEach((row) => {
            row.addEventListener("click", (evt) => {
                if (evt.target.closest(".adm-order-row-checkbox")) return;
                const order = currentOrders.find((o) => o.id === row.getAttribute("data-id"));
                if (order) openOrderModal(order);
            });
        });

        tbody.querySelectorAll(".adm-order-row-checkbox").forEach((cb) => {
            cb.addEventListener("change", () => {
                const id = cb.getAttribute("data-id");
                if (cb.checked) selectedIds.add(id); else selectedIds.delete(id);
                updateBulkBar();
                syncSelectAllCheckbox();
            });
        });

        updateBulkBar();
        syncSelectAllCheckbox();
    }

    function syncSelectAllCheckbox() {
        const selectAll = document.getElementById("orders-select-all");
        if (!selectAll || !currentOrders.length) { if (selectAll) selectAll.checked = false; return; }
        selectAll.checked = currentOrders.every((o) => selectedIds.has(o.id));
    }

    function updateBulkBar() {
        const bar = document.getElementById("orders-bulk-bar");
        const countEl = document.getElementById("orders-bulk-count");
        if (!bar || !countEl) return;
        if (selectedIds.size > 0) {
            bar.style.display = "flex";
            countEl.textContent = `${selectedIds.size} طلب محدد`;
        } else {
            bar.style.display = "none";
        }
    }

    /* ============================= مودال تفاصيل الطلب ============================= */

    const SHAPE_LABELS = { circle: "دائري", heart: "قلب", square: "مربع", rectangle: "مستطيل" };
    const PRINTING_LABELS = { edible: "صورة صالحة للأكل", "non-edible": "صورة مجسمة غير صالحة للأكل" };
    const FLOWER_TYPE_LABELS = { natural: "طبيعي نضر", artificial: "صناعي فاخر", satin: "ستان مصنوع بحب" };

    /**
     * 🐛🖼️ [إصلاح جذري - تفاصيل الطلب المخصص كانت مش ظاهرة خالص للأدمن]: المودال
     * قبل كده كان بيكتفي بتاج عام "طلب مخصص (محاكي)" من غير أي تفاصيل فعلية -
     * يعني الفرع معندوش أي طريقة يرجع يشوف مناسبة/نكهة/شكل التورتة، نص كارت
     * الإهداء، ملاحظة الحساسية، أو حتى روابط الصور المرفوعة (المرجعية/الطباعة)
     * بعد إتمام الطلب، غير لو رسالة الواتساب الأصلية اتحفظت أو محدش مسحها.
     * البيانات دي كانت بالفعل محفوظة كاملة في custom_details (JSONB) في القاعدة
     * من أول يوم - المشكلة كانت في العرض بس، مش في التخزين.
     */
    function customDetailsBlockHTML(item) {
        const e = window.BoseAdminUI.escapeHtml;
        const cd = item.custom_details || {};
        if (!cd || Object.keys(cd).length === 0) return "";

        const isCake = item.item_type === "custom-cake" || item.item_type === "mini-cake";
        const isFlower = item.item_type === "custom-flower";
        const rows = [];

        if (isCake) {
            if (cd.occasionLabel) rows.push(["المناسبة", e(cd.occasionLabel)]);
            if (cd.cakeType && cd.cakeType !== "none") rows.push(["طعم الكيك", e(cd.cakeType)]);
            if (cd.shape) rows.push(["الشكل", SHAPE_LABELS[cd.shape] || e(cd.shape)]);
            if (cd.persons) rows.push(["عدد الأفراد", `${cd.persons} فرد`]);
            if (cd.printingType && cd.printingType !== "none") rows.push(["الطباعة", PRINTING_LABELS[cd.printingType] || e(cd.printingType)]);
            if (cd.customMessage) rows.push(["الرسالة المكتوبة", `"${e(cd.customMessage)}"`]);
            if (cd.allergyNote) rows.push(["⚠️ ملاحظة حساسية", e(cd.allergyNote)]);
            if (cd.hasGiftCard && cd.giftCardText) rows.push(["كارت إهداء مطبوع", `"${e(cd.giftCardText)}"`]);
        } else if (isFlower) {
            if (cd.flowerType && cd.flowerType !== "none") rows.push(["نوع الورد", FLOWER_TYPE_LABELS[cd.flowerType] || e(cd.flowerType)]);
            if (cd.flowerCount) rows.push(["عدد الورد", `${cd.flowerCount} وردة`]);
            if (cd.cashAmount) rows.push(["الكاش المدمج", `+${cd.cashAmount} ج.م`]);
            if (cd.hasChocolate && cd.chocolateBudget) rows.push(["ميزانية الشوكولاتة", `+${cd.chocolateBudget} ج.م`]);
            if (cd.hasGiftCard && cd.giftCardText) rows.push(["كارت الإهداء", `"${e(cd.giftCardText)}"`]);
        } else if (cd.sizeLabel) {
            rows.push(["الحجم", e(cd.sizeLabel)]);
        }

        const photoLinks = [];
        if (cd.printImageUrl) photoLinks.push(`<a href="${e(cd.printImageUrl)}" target="_blank" rel="noopener"><img src="${e(cd.printImageUrl)}" alt="صورة الطباعة" loading="lazy" style="width:52px;height:52px;border-radius:8px;object-fit:cover;"></a>`);
        if (cd.replicaImageUrl) photoLinks.push(`<a href="${e(cd.replicaImageUrl)}" target="_blank" rel="noopener"><img src="${e(cd.replicaImageUrl)}" alt="صورة التصميم المرجعي" loading="lazy" style="width:52px;height:52px;border-radius:8px;object-fit:cover;"></a>`);
        // 🛡️👑📸 [إصلاح - صورة تصميم الباقة والصور الشخصية كانتا مش ظاهرين هنا
        // خالص]: item.image هي صورة التصميم اللي رفعتها العميلة في خطوة 3
        // (بوكيه نعمل زيه) - مكانتش بتتعرض في لوحة التحكم أصلاً. وcd.personalPhotoUrls
        // هي الصور الشخصية الحقيقية المرفوعة في خطوة 5 (منفصلة تماماً عن صورة
        // التصميم - راجع شرح الفصل في js/flower-engine.js).
        if (isFlower && item.reference_images && item.reference_images.length) {
            item.reference_images.forEach((url) => {
                photoLinks.push(`<a href="${e(url)}" target="_blank" rel="noopener"><img src="${e(url)}" alt="صورة تصميم الباقة" loading="lazy" style="width:52px;height:52px;border-radius:8px;object-fit:cover;border:2px solid #FF91A4;"></a>`);
            });
        }
        if (isFlower && Array.isArray(cd.personalPhotoUrls)) {
            cd.personalPhotoUrls.forEach((url) => {
                photoLinks.push(`<a href="${e(url)}" target="_blank" rel="noopener"><img src="${e(url)}" alt="صورة شخصية للطباعة" loading="lazy" style="width:52px;height:52px;border-radius:8px;object-fit:cover;border:2px solid #111;"></a>`);
            });
        }
        if (!isFlower && item.reference_images && item.reference_images.length) {
            item.reference_images.forEach((url) => {
                photoLinks.push(`<a href="${e(url)}" target="_blank" rel="noopener"><img src="${e(url)}" alt="صورة مرجعية" loading="lazy" style="width:52px;height:52px;border-radius:8px;object-fit:cover;"></a>`);
            });
        }

        if (rows.length === 0 && photoLinks.length === 0) return "";

        return `
            <div class="adm-order-item-custom-details" style="font-size:12.5px; color:#111; background:rgba(255,145,164,0.05); padding:8px 10px; border-radius:10px; margin-top:6px; border-right:3px solid #FF91A4; display:flex; flex-direction:column; gap:3px;">
                ${rows.map(([label, val]) => `<div><strong>${label}:</strong> ${val}</div>`).join("")}
                ${photoLinks.length ? `<div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap;">${photoLinks.join("")}</div>` : ""}
            </div>`;
    }

    function orderItemRowHTML(item) {
        const e = window.BoseAdminUI.escapeHtml;
        const isCustom = item.custom_details && Object.keys(item.custom_details).length > 0;
        return `
            <div class="adm-order-item-row" style="flex-direction: column; align-items: stretch;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div>
                        <strong>${e(item.title)}</strong>
                        <span class="adm-order-item-meta">
                            ${item.flavor_name ? e(item.flavor_name) + " · " : ""}الكمية: ${item.quantity}
                            ${isCustom ? " · طلب مخصص (محاكي)" : ""}
                            ${item.reference_images && item.reference_images.length ? ` · ${item.reference_images.length} صورة مرجعية` : ""}
                        </span>
                    </div>
                    <div>${money(item.line_total)}</div>
                </div>
                ${customDetailsBlockHTML(item)}
            </div>`;
    }

    function openOrderModal(order) {
        const e = window.BoseAdminUI.escapeHtml;
        const items = order.order_items || [];

        const overlay = document.createElement("div");
        overlay.className = "adm-modal-overlay";
        overlay.innerHTML = `
            <div class="adm-modal" style="max-width: 560px;">
                <div class="adm-modal-header">
                    <h3>طلب #${e(order.order_number || order.id)}</h3>
                    <button class="adm-modal-close" data-role="close"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="adm-order-detail-grid">
                    <div><span>اسم العميل</span><strong>${e(order.customer_name || "—")}</strong></div>
                    <div><span>الهاتف</span><strong>${e(order.phone1 || "—")}${order.phone2 ? " / " + e(order.phone2) : ""}</strong></div>
                    <div><span>طريقة الاستلام</span><strong>${e(DELIVERY_LABELS[order.delivery_method] || order.delivery_method || "—")}</strong></div>
                    <div><span>الموعد</span><strong>${order.scheduled_date ? e(order.scheduled_date) : "—"}${order.scheduled_time ? " - " + e(order.scheduled_time) : ""}</strong></div>
                    ${order.delivery_method === "delivery" ? `
                    <div class="adm-order-detail-full"><span>العنوان</span><strong>${e(order.address || "—")}</strong></div>
                    ` : ""}
                    ${order.notes ? `
                    <div class="adm-order-detail-full"><span>ملاحظات العميل</span><strong>${e(order.notes)}</strong></div>
                    ` : ""}
                    ${order.coupon_code ? `
                    <div><span>كود الخصم</span><strong>${e(order.coupon_code)}</strong></div>
                    ` : ""}
                </div>

                <div class="adm-order-items-list">
                    ${items.length ? items.map(orderItemRowHTML).join("") : `<p style="text-align:center; padding: 10px 0;">مفيش عناصر مسجلة لهذا الطلب</p>`}
                </div>

                <div class="adm-order-totals">
                    <div><span>الإجمالي الفرعي</span><span>${money(order.subtotal)}</span></div>
                    <div><span>الشحن</span><span>${money(order.shipping_fee)}</span></div>
                    ${order.discount_amount ? `<div><span>الخصم</span><span>-${money(order.discount_amount)}</span></div>` : ""}
                    <div class="adm-order-grand-total"><span>الإجمالي الكلي</span><span>${money(order.grand_total)}</span></div>
                </div>

                <!-- 💵 [عربون/دفع مقدم] -->
                <div class="adm-order-totals" style="margin-top: 10px; border-top: 1px dashed #eee; padding-top: 10px;">
                    <div>
                        <span>${order.delivery_method === "delivery" ? "المبلغ الكامل المطلوب (توصيل)" : "عربون تأكيد الحجز (50%)"}</span>
                        <span>${money(order.deposit_amount)}</span>
                    </div>
                    <div>
                        <span>حالة الدفع</span>
                        <span>${order.deposit_status === "confirmed"
                            ? `<span class="adm-badge success">تم تأكيد استلام المبلغ${order.deposit_confirmed_at ? " - " + new Date(order.deposit_confirmed_at).toLocaleString("ar-EG") : ""}</span>`
                            : `<span class="adm-badge warning">بانتظار تأكيد الاستلام</span>`}</span>
                    </div>
                </div>
                ${order.deposit_status !== "confirmed" ? `
                <div class="adm-mt-16">
                    <button type="button" class="adm-btn adm-btn-primary" id="order-confirm-deposit-btn" style="width:100%;">
                        ✅ تأكيد استلام ${order.delivery_method === "delivery" ? "المبلغ" : "العربون"} (${money(order.deposit_amount)})
                    </button>
                </div>
                ` : ""}

                <div class="adm-field adm-mt-16">
                    <label for="order-status-select">حالة الطلب</label>
                    <select class="adm-select" id="order-status-select">
                        ${window.BoseAdminUI.ORDER_STATUSES.map((s) => `
                            <option value="${s.key}" ${s.key === order.status ? "selected" : ""}>${s.label}</option>
                        `).join("")}
                    </select>
                </div>

                <div class="adm-modal-actions">
                    <button type="button" class="adm-btn adm-btn-danger" id="order-delete-btn" style="margin-inline-end:auto;">
                        <i class="fa-solid fa-trash"></i> حذف الطلب
                    </button>
                    <button type="button" class="adm-btn adm-btn-ghost" data-role="close">إغلاق</button>
                    <button type="button" class="adm-btn adm-btn-primary" id="order-status-save-btn">تحديث الحالة</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }

        overlay.addEventListener("click", (evt) => {
            if (evt.target === overlay) close();
            if (evt.target.closest('[data-role="close"]')) close();
        });

        const confirmDepositBtn = document.getElementById("order-confirm-deposit-btn");
        if (confirmDepositBtn) {
            confirmDepositBtn.addEventListener("click", async () => {
                confirmDepositBtn.disabled = true;
                confirmDepositBtn.textContent = "جاري التأكيد...";
                try {
                    await window.BoseAdmin.confirmOrderDeposit(order.id);
                    window.BoseAdminUI.showToast("تم تأكيد استلام المبلغ وانتقل الطلب لحالة مؤكد", "success");
                    close();
                    await loadOrders();
                } catch (err) {
                    window.BoseAdminUI.showToast("تعذر تأكيد استلام المبلغ", "error");
                    confirmDepositBtn.disabled = false;
                    confirmDepositBtn.textContent = "✅ تأكيد استلام المبلغ";
                }
            });
        }

        document.getElementById("order-delete-btn").addEventListener("click", async () => {
            const confirmed = await window.BoseAdminUI.confirmAction({
                title: "تأكيد حذف الطلب",
                message: `هل أنت متأكدة من حذف الطلب #${order.order_number || order.id} نهائياً؟ الإجراء ده هيمسح كل تفاصيل الطلب ومش هينفع يتراجع.`,
                confirmLabel: "حذف نهائي",
                danger: true,
            });
            if (!confirmed) return;

            const btn = document.getElementById("order-delete-btn");
            btn.disabled = true;
            btn.textContent = "جاري الحذف...";
            try {
                await window.BoseAdmin.deleteOrder(order.id);
                window.BoseAdminUI.showToast("تم حذف الطلب", "success");
                selectedIds.delete(order.id);
                close();
                await loadOrders();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر حذف الطلب", "error");
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-trash"></i> حذف الطلب`;
            }
        });

        document.getElementById("order-status-save-btn").addEventListener("click", async () => {
            const newStatus = document.getElementById("order-status-select").value;
            const btn = document.getElementById("order-status-save-btn");
            if (newStatus === order.status) { close(); return; }

            btn.disabled = true;
            btn.textContent = "جاري الحفظ...";
            try {
                await window.BoseAdmin.updateOrderStatus(order.id, newStatus);
                window.BoseAdminUI.showToast("تم تحديث حالة الطلب", "success");
                close();
                await loadOrders();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر تحديث حالة الطلب", "error");
                btn.disabled = false;
                btn.textContent = "تحديث الحالة";
            }
        });
    }

    /* ============================= التحميل والفلترة ============================= */

    async function loadOrders() {
        const tbody = document.getElementById("orders-tbody");
        tbody.innerHTML = `<tr><td colspan="7"><div class="adm-loading-spinner"></div></td></tr>`;

        const status = document.getElementById("orders-status-filter").value;
        const search = document.getElementById("orders-search-input").value.trim();

        currentOrders = await window.BoseAdmin.getAllOrders({ status, search });
        renderTable();
    }

    function buildStatusFilterOptions() {
        const select = document.getElementById("orders-status-filter");
        const e = window.BoseAdminUI.escapeHtml;
        select.innerHTML = `<option value="">كل الحالات</option>` +
            window.BoseAdminUI.ORDER_STATUSES.map((s) => `<option value="${s.key}">${e(s.label)}</option>`).join("");
    }

    function wireControls() {
        document.getElementById("orders-search-input").addEventListener("input", () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(loadOrders, 350);
        });
        document.getElementById("orders-status-filter").addEventListener("change", loadOrders);

        document.getElementById("orders-select-all").addEventListener("change", (evt) => {
            if (evt.target.checked) {
                currentOrders.forEach((o) => selectedIds.add(o.id));
            } else {
                currentOrders.forEach((o) => selectedIds.delete(o.id));
            }
            renderTable();
        });

        document.getElementById("orders-bulk-clear-btn").addEventListener("click", () => {
            selectedIds.clear();
            renderTable();
        });

        document.getElementById("orders-bulk-delete-btn").addEventListener("click", async () => {
            const count = selectedIds.size;
            if (!count) return;
            const confirmed = await window.BoseAdminUI.confirmAction({
                title: "تأكيد الحذف الجماعي",
                message: `هل أنت متأكدة من حذف ${count} طلب نهائياً؟ الإجراء ده مش هينفع يتراجع.`,
                confirmLabel: "حذف نهائي",
                danger: true,
            });
            if (!confirmed) return;

            const btn = document.getElementById("orders-bulk-delete-btn");
            btn.disabled = true;
            btn.textContent = "جاري الحذف...";
            try {
                const deleted = await window.BoseAdmin.deleteOrders(Array.from(selectedIds));
                window.BoseAdminUI.showToast(`تم حذف ${deleted} طلب`, "success");
                selectedIds.clear();
                await loadOrders();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر حذف الطلبات المحددة", "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-trash"></i> حذف المحدد`;
            }
        });

        document.getElementById("orders-delete-cancelled-btn").addEventListener("click", async () => {
            const btn = document.getElementById("orders-delete-cancelled-btn");
            btn.disabled = true;
            try {
                const cancelledOrders = await window.BoseAdmin.getAllOrders({ status: "cancelled" });
                if (!cancelledOrders.length) {
                    window.BoseAdminUI.showToast("مفيش طلبات ملغية حالياً", "success");
                    return;
                }
                const confirmed = await window.BoseAdminUI.confirmAction({
                    title: "تأكيد حذف الطلبات الملغية",
                    message: `في ${cancelledOrders.length} طلب ملغي هيتم حذفهم نهائياً. الإجراء ده مش هينفع يتراجع.`,
                    confirmLabel: "حذف الكل",
                    danger: true,
                });
                if (!confirmed) return;

                const deleted = await window.BoseAdmin.deleteOrders(cancelledOrders.map((o) => o.id));
                window.BoseAdminUI.showToast(`تم حذف ${deleted} طلب ملغي`, "success");
                await loadOrders();
            } catch (err) {
                window.BoseAdminUI.showToast("تعذر حذف الطلبات الملغية", "error");
            } finally {
                btn.disabled = false;
            }
        });
    }

    document.addEventListener("BoseAdminReady", async () => {
        buildStatusFilterOptions();
        wireControls();
        await loadOrders();
    });
})();