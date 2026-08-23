/**
 * محرك صفحة عرض التصميم المتشارك (design-view.html) - حلويات بوسي V1.0
 * بيقرأ id من رابط الصفحة، يجيب تفاصيل التصميم عبر RPC آمن (get_shared_cake_design)
 * ويعرضها بشكل واضح لأي حد افتح الرابط، مع زرار طلب مباشر عبر واتساب.
 */
(function () {
    "use strict";

    function escapeHTML(str) {
        if (typeof window.escapeBoseHTML === "function") return window.escapeBoseHTML(str);
        const div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
    }

    async function loadSharedDesign() {
        const loadingEl = document.getElementById('bose-shared-loading');
        const notFoundEl = document.getElementById('bose-shared-notfound');
        const contentEl = document.getElementById('bose-shared-content');

        const params = new URLSearchParams(window.location.search);
        const designId = params.get('id');

        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!designId || !uuidPattern.test(designId)) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (notFoundEl) notFoundEl.style.display = 'block';
            return;
        }

        // ننتظر تحميل خدمة Supabase لو لسه ما جهزتش
        let attempts = 0;
        while (!(window.BoseSupabase && typeof window.BoseSupabase.getSharedCakeDesign === 'function') && attempts < 40) {
            await new Promise((r) => setTimeout(r, 100));
            attempts++;
        }

        try {
            const design = await window.BoseSupabase.getSharedCakeDesign(designId);
            if (!design || typeof design !== 'object') throw new Error('not found');
            renderDesign(design, designId);
        } catch (err) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (notFoundEl) notFoundEl.style.display = 'block';
        }
    }

    function renderDesign(design, designId) {
        const loadingEl = document.getElementById('bose-shared-loading');
        const contentEl = document.getElementById('bose-shared-content');
        const imageEl = document.getElementById('bose-shared-image');
        const occasionLineEl = document.getElementById('bose-shared-occasion-line');
        const rowsEl = document.getElementById('bose-shared-rows');
        const priceEl = document.getElementById('bose-shared-price');
        const orderBtn = document.getElementById('btn-order-like-this');

        const imageUrl = design.replicaImageUrl || design.printImageUrl || "";
        if (imageUrl && imageEl) {
            imageEl.src = imageUrl;
            imageEl.style.display = 'block';
        }

        if (occasionLineEl) {
            occasionLineEl.textContent = design.occasion
                ? `صُممت لمناسبة: ${design.occasion}`
                : "تصميم تورتة مخصص حسب الطلب";
        }

        const rows = [];
        if (design.shapeLabel) rows.push(['الشكل', design.shapeLabel]);
        if (design.flavorLabel) rows.push(['النكهة', design.flavorLabel]);
        if (design.persons) rows.push(['عدد الأفراد', `${design.persons} فرد`]);
        if (design.printingLabel) rows.push(['طباعة الصورة', design.printingLabel]);
        if (design.message) rows.push(['رسالة على التورتة', design.message]);
        if (design.hasGiftCard) rows.push(['كارت إهداء', 'مضاف ✓']);

        if (rowsEl) {
            rowsEl.innerHTML = rows.map(([label, value]) =>
                `<div class="bose-shared-row"><span class="row-label">${escapeHTML(label)}</span><span class="row-value">${escapeHTML(value)}</span></div>`
            ).join('');
        }

        if (priceEl) {
            priceEl.textContent = design.price ? `${Math.round(design.price)} جنيه` : "بيتحدد عند التأكيد";
        }

        if (orderBtn) {
            orderBtn.addEventListener('click', () => {
                const shareUrl = window.location.href;
                const text = `عايزة أطلب تورتة زي التصميم ده من حلويات بوسي 🎂\n${shareUrl}`;
                const link = (typeof window.buildWhatsappLink === "function")
                    ? window.buildWhatsappLink('201097238441', text)
                    : `https://wa.me/201097238441?text=${encodeURIComponent(text)}`;
                window.open(link, '_blank', 'noopener,noreferrer');
            });
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
    }

    document.addEventListener('DOMContentLoaded', loadSharedDesign);
})();
