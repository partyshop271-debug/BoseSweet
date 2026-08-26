/**
 * reports-page.js - منطق صفحة التقارير فقط
 * =====================================================================
 * بتستخدم اثنين RPC كانوا موجودين وجاهزين فعلياً في قاعدة البيانات
 * (get_admin_sales_report و get_admin_top_products) من غير أي صفحة
 * في اللوحة تستخدمهم - راجعي admin-data.js (getSalesReport/getTopProducts).
 *
 * الرسم البياني هنا SVG بسيط مرسوم يدوياً (bar chart) من غير أي مكتبة
 * خارجية، عشان يفضل متوافق مع فلسفة الموقع (Vanilla JS بالكامل، بدون
 * تبعيات) ويشتغل بسرعة من غير تحميل ملف إضافي.
 */
(function () {
    "use strict";

    function money(n) {
        return `${Math.round(n || 0).toLocaleString("ar-EG")} ج.م`;
    }

    function renderSummary(rows) {
        const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
        const totalOrders = rows.reduce((sum, r) => sum + Number(r.orders_count || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const bestDay = rows.reduce((best, r) => (Number(r.revenue || 0) > Number(best?.revenue || 0) ? r : best), null);

        const cards = [
            { icon: "fa-sack-dollar", cls: "success", label: "إجمالي الإيراد في المدة دي", value: money(totalRevenue) },
            { icon: "fa-receipt", cls: "pink", label: "إجمالي الطلبات", value: totalOrders },
            { icon: "fa-scale-balanced", cls: "info", label: "متوسط قيمة الطلب", value: money(avgOrderValue) },
            { icon: "fa-star", cls: "gold", label: "أفضل يوم", value: bestDay && bestDay.revenue > 0 ? money(bestDay.revenue) : "—" },
        ];
        document.getElementById("reports-summary-row").innerHTML = cards.map((c) => `
            <div class="adm-stat-card">
                <div class="adm-stat-card-text">
                    <span>${c.label}</span>
                    <strong>${c.value}</strong>
                </div>
                <div class="adm-stat-icon ${c.cls}"><i class="fa-solid ${c.icon}"></i></div>
            </div>
        `).join("");
    }

    /** رسم بياني أعمدة SVG بسيط لإيراد كل يوم، بدون أي مكتبة خارجية */
    function renderChart(rows) {
        const wrap = document.getElementById("reports-chart-wrap");
        if (!rows.length) {
            wrap.innerHTML = window.BoseAdminUI.emptyStateHTML({
                icon: "fa-chart-line",
                title: "مفيش بيانات كفاية لسه",
                text: "الرسم البياني هيظهر أول ما يبدأ يوصل طلبات.",
            });
            return;
        }

        const maxRevenue = Math.max(1, ...rows.map((r) => Number(r.revenue || 0)));
        const width = 900;
        const height = 220;
        const padding = 28;
        const barGap = 4;
        const barWidth = Math.max(2, (width - padding * 2) / rows.length - barGap);

        const bars = rows.map((r, idx) => {
            const revenue = Number(r.revenue || 0);
            const barHeight = Math.max(revenue > 0 ? 3 : 0, (revenue / maxRevenue) * (height - padding * 2));
            const x = padding + idx * ((width - padding * 2) / rows.length);
            const y = height - padding - barHeight;
            const dayLabel = new Date(r.day).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit" });
            return `
                <g class="adm-chart-bar-group">
                    <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3" class="adm-chart-bar"></rect>
                    <title>${dayLabel} - ${money(revenue)} (${r.orders_count} طلب)</title>
                </g>`;
        }).join("");

        // خط قاعدة + تسميات أول/وسط/آخر يوم بس (عشان الزحمة لو المدى 90 يوم)
        const firstLabel = new Date(rows[0].day).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit" });
        const lastLabel = new Date(rows[rows.length - 1].day).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit" });

        wrap.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="adm-chart-svg" preserveAspectRatio="none" style="width:100%; height:220px;">
                <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="adm-chart-baseline"></line>
                ${bars}
            </svg>
            <div class="adm-chart-labels">
                <span>${firstLabel}</span>
                <span>${lastLabel}</span>
            </div>
        `;
    }

    /**
     * 🧭🆕 [4.1-ب - عرض مصادر العملاء]: قائمة بسيطة (بار أفقي مرسوم بـ div عادي،
     * بدون أي مكتبة، زي فلسفة الرسم البياني اللي فوق) لكل مصدر وعدد العميلات
     * الجداد الجايين منه. أيقونة مختلفة لكل مصدر معروف عشان تتقرا بسرعة.
     */
    function attributionIcon(source) {
        const map = {
            facebook: "fa-facebook",
            instagram: "fa-instagram",
            tiktok: "fa-tiktok",
            whatsapp: "fa-whatsapp",
            google: "fa-google",
            direct: "fa-arrow-right-to-bracket",
        };
        return map[source] ? `fa-brands ${map[source]}` : "fa-solid fa-link";
    }
    function attributionLabel(source) {
        const map = {
            facebook: "فيسبوك", instagram: "انستجرام", tiktok: "تيك توك",
            whatsapp: "واتساب", google: "جوجل", direct: "زيارة مباشرة",
        };
        return map[source] || source;
    }

    function renderAttribution(rows) {
        const wrap = document.getElementById("reports-attribution-wrap");
        const e = window.BoseAdminUI.escapeHtml;
        if (!rows.length) {
            wrap.innerHTML = window.BoseAdminUI.emptyStateHTML({
                icon: "fa-compass",
                title: "مفيش عميلات جداد كفاية لسه",
                text: "هيظهر هنا أول ما تدخل عميلة جديدة من مصدر معروف.",
            });
            return;
        }
        const total = rows.reduce((sum, r) => sum + r.count, 0);
        wrap.innerHTML = rows.map((r) => {
            const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
            return `
                <div style="margin-bottom: 14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:0.86rem;">
                        <span style="display:flex; align-items:center; gap:8px; font-weight:700; color: var(--adm-text-secondary);">
                            <i class="${attributionIcon(r.source)}"></i> ${e(attributionLabel(r.source))}
                        </span>
                        <span style="color: var(--adm-text-muted);">${r.count} عميلة (${pct}%)</span>
                    </div>
                    <div style="background: var(--adm-bg-hover); border-radius: 8px; height: 10px; overflow:hidden;">
                        <div style="background: var(--adm-pink); height:100%; width:${pct}%; border-radius: 8px;"></div>
                    </div>
                </div>`;
        }).join("");
    }

    function renderTopProducts(rows) {
        const tbody = document.getElementById("reports-top-products-tbody");
        const e = window.BoseAdminUI.escapeHtml;
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="3">${window.BoseAdminUI.emptyStateHTML({
                icon: "fa-crown",
                title: "مفيش مبيعات في المدة دي لسه",
                text: "جرّب مدى زمني أطول.",
            })}</td></tr>`;
            return;
        }
        tbody.innerHTML = rows.map((r, idx) => `
            <tr>
                <td>${idx === 0 ? '<i class="fa-solid fa-crown" style="color: var(--adm-gold); margin-left:6px;"></i>' : ""}${e(r.title || r.product_id)}</td>
                <td>${r.qty_sold}</td>
                <td>${money(r.revenue)}</td>
            </tr>
        `).join("");
    }

    async function loadReports(days) {
        document.getElementById("reports-chart-wrap").innerHTML = '<div class="adm-loading-spinner"></div>';
        document.getElementById("reports-top-products-tbody").innerHTML =
            '<tr><td colspan="3"><div class="adm-loading-spinner"></div></td></tr>';
        document.getElementById("reports-attribution-wrap").innerHTML = '<div class="adm-loading-spinner"></div>';

        const [salesRows, topProducts, attributionRows] = await Promise.all([
            window.BoseAdmin.getSalesReport(days),
            window.BoseAdmin.getTopProducts(days, 8),
            window.BoseAdmin.getCustomerAttributionBreakdown(days),
        ]);

        renderSummary(salesRows);
        renderChart(salesRows);
        renderTopProducts(topProducts);
        renderAttribution(attributionRows);
    }

    function wireControls() {
        document.getElementById("reports-range-select").addEventListener("change", (e) => {
            loadReports(Number(e.target.value));
        });
    }

    document.addEventListener("BoseAdminReady", async () => {
        wireControls();
        await loadReports(30);
    });
})();
