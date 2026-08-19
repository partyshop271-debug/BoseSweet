/**
 * ⭐ [حل جذري]: مكان مراجعات موحّد لصفحات المحاكيات (تصميم تورتة / تصميم بوكيه).
 *
 * المشكلة اللي بيحلها الملف ده: صفحة المنتج (product.html) بتحوّل تلقائياً أي زيارة
 * لمنتج "رئيسي" مرتبط بمحاكي (toort-custom-master / flowers-master) على طول لصفحة
 * المحاكي نفسها (شوفي الكود في product.html حوالين "customBuilderUrl") - وده معناه إن
 * قسم المراجعات اللي في product.html (فورم النجوم + التعليق + الصور) كان مستحيل حد
 * يوصله أصلاً لأي عميلة صممت تورتتها أو بوكيهها بنفسها من المحاكي، لأنها هتترمي برة
 * الصفحة اللي فيه قبل ما تشوفه. الحل: مكان مراجعات مستقل بيتحقن في آخر صفحة المحاكي
 * نفسها (مكانها المنطقي - "قيّمي تجربة التصميم دي") بدل صفحة منتج محدش بيوصلها.
 *
 * نفس منطق ونفس تجربة قسم المراجعات في product.html بالظبط (تصميم متسق للعميلة)،
 * بس معزول في ملف واحد قابل لإعادة الاستخدام في أي صفحة محاكي (تورت + ورد) من غير
 * تكرار نفس الكود مرتين.
 *
 * الاستخدام: window.initBoseReviewsWidget({ mountId, slug, title, heading, subtext })
 * - mountId: آي دي عنصر فاضي في الصفحة هيتحقن جواه القسم بالكامل.
 * - slug: نفس الـ product_id اللي بيتسجل بيه الطلب في قاعدة البيانات (توحيد مصدر الحقيقة
 *   - أي مراجعة هنا هتتجمع تلقائياً مع أي طلب اتسجل بنفس الـ slug ده).
 * - title: اسم المنتج/التجربة (بيتستخدم في رسالة واتساب فرع التقييم المنخفض بس).
 * - heading/subtext: نصوص العنوان الاختيارية (لو مش موجودة بترجع لنص افتراضي عام).
 */
(function () {
    "use strict";

    window.initBoseReviewsWidget = function (config) {
        const cfg = config || {};
        const mount = document.getElementById(cfg.mountId);
        if (!mount || !cfg.slug) return;

        const heading = cfg.heading || "قيّمي تجربتك معانا";
        const subtext = cfg.subtext || "شاركينا رأيك في تجربة التصميم دي - رأيك بيفرق مع عميلات تانية زيك.";
        const productTitle = cfg.title || "";
        const productSlug = cfg.slug;

        mount.innerHTML = `
            <div class="reviews-summary-row" style="direction: rtl;">
                <div style="text-align: right;">
                    <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--bose-black);">${escapeHTML(heading)}</h2>
                    <p style="font-size: 0.88rem; color: var(--bose-black); opacity: 0.7; margin: 6px 0 0 0;">${escapeHTML(subtext)}</p>
                    <div id="bose-simreview-summary-line" style="display:flex; align-items:center; gap:10px; margin-top: 10px;">
                        <span id="bose-simreview-summary-empty" style="font-size: 0.88rem; color: var(--bose-black); opacity: 0.7;">لسه معندناش مراجعات على التجربة دي - يشرفنا تكوني أول وحدة توثّق تجربتها 🌸</span>
                        <div id="bose-simreview-summary-filled" style="display:none; align-items:center; gap:8px;">
                            <span id="bose-simreview-summary-stars" style="color:var(--bose-gold); font-size:1rem; letter-spacing:2px;"></span>
                            <span id="bose-simreview-summary-text" style="font-size: 0.9rem; font-weight:700; color: var(--bose-black);"></span>
                        </div>
                    </div>
                </div>
                <button id="btn-toggle-simreview-form" class="btn-trigger-review-form" type="button">
                    <i class="fas fa-pen"></i> شاركي رأيك في أقل من دقيقة
                </button>
            </div>

            <div id="bose-simreview-form-wrapper" style="display: none; background: rgba(255, 145, 164, 0.03); border: 1px dashed var(--bose-pink); border-radius: 24px; padding: 24px; margin-bottom: 30px; direction: rtl;">

                <div id="bose-simreview-step-rating">
                    <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 14px;">إيه رأيك في التجربة؟</h3>
                    <div id="bose-simreview-stars-picker" style="display:flex; gap:12px; flex-direction:row-reverse; justify-content:flex-end; font-size:2rem; color:#111111;">
                        <input type="radio" id="simst5" name="bose-simreview-star-rating" value="5" style="display:none;"><label for="simst5" style="cursor:pointer;"><i class="fas fa-star"></i></label>
                        <input type="radio" id="simst4" name="bose-simreview-star-rating" value="4" style="display:none;"><label for="simst4" style="cursor:pointer;"><i class="fas fa-star"></i></label>
                        <input type="radio" id="simst3" name="bose-simreview-star-rating" value="3" style="display:none;"><label for="simst3" style="cursor:pointer;"><i class="fas fa-star"></i></label>
                        <input type="radio" id="simst2" name="bose-simreview-star-rating" value="2" style="display:none;"><label for="simst2" style="cursor:pointer;"><i class="fas fa-star"></i></label>
                        <input type="radio" id="simst1" name="bose-simreview-star-rating" value="1" style="display:none;"><label for="simst1" style="cursor:pointer;"><i class="fas fa-star"></i></label>
                    </div>
                </div>

                <div id="bose-simreview-lowrating-branch" style="display:none; margin-top:18px; background:#fff; border:1px solid rgba(17,17,17,0.08); border-radius:16px; padding:18px;">
                    <p style="font-size:0.92rem; font-weight:700; margin:0 0 8px 0;">آسفين إن التجربة متكنتش زي ما توقعتي 💔</p>
                    <p style="font-size:0.85rem; opacity:0.75; margin:0 0 14px 0; line-height:1.6;">قوليلنا المشكلة كانت في إيه وهنحلها بسرعة معاكي مباشرة، وفي نفس الوقت تقدري كمان تكتبي مراجعتك هنا لو حابة تشاركيها مع باقي الزوار.</p>
                    <a id="bose-simreview-lowrating-whatsapp" href="#" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:8px; background:#25D366; color:#fff; padding:10px 20px; border-radius:50px; text-decoration:none; font-weight:700; font-size:0.88rem;">
                        <i class="fab fa-whatsapp"></i> كلّمينا على واتساب دلوقتي
                    </a>
                </div>

                <div id="bose-simreview-step-details" style="display:none; margin-top:20px;">
                    <div id="bose-simreview-chips-row" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;"></div>

                    <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display:block; font-size:0.88rem; font-weight:700; margin-bottom:6px;">اسمك المحترم</label>
                            <input id="bose-simreview-user-name" type="text" placeholder="يمكنك كتابة اسمك هنا..." style="width:100%; padding:12px; border-radius:12px; border:1px solid rgba(17,17,17,0.12); font-family:'Cairo'; box-sizing:border-box;">
                        </div>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display:block; font-size:0.88rem; font-weight:700; margin-bottom:6px;">تجربتك بالتفصيل (جملة واحدة تكفي)</label>
                        <textarea id="bose-simreview-comment" placeholder="اضغطي على الاقتراحات فوق أو اكتبي رأيك بنفسك..." style="width:100%; height:90px; padding:12px; border-radius:12px; border:1px solid rgba(17,17,17,0.12); font-family:'Cairo'; resize:none; box-sizing:border-box;"></textarea>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display:block; font-size:0.88rem; font-weight:700; margin-bottom:6px;"><i class="fas fa-camera"></i> أضيفي صوراً حقيقية للتصميم النهائي (اختياري)</label>
                        <input id="bose-simreview-images-picker" type="file" accept="image/*" multiple style="display: none;">
                        <button id="btn-trigger-simreview-images" type="button" style="background:#fff; border:1px solid rgba(17,17,17,0.15); padding:8px 16px; border-radius:10px; cursor:pointer; font-size:0.85rem; font-weight:700;"><i class="fas fa-images" style="color:var(--bose-pink);"></i> اختيار الصور من جهازك</button>
                        <div id="bose-simreview-images-preview-zone" style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;"></div>
                    </div>

                    <button id="btn-submit-simreview" type="button" style="background:var(--bose-pink); color:#fff; border:none; padding:12px 30px; border-radius:50px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(255,145,164,0.2);">نشر مراجعتي</button>
                    <p style="font-size:0.78rem; color:#111111; opacity:0.6; margin:10px 0 0 0; line-height:1.5;">
                        <i class="fas fa-circle-info"></i> بتتراجع من فريقنا أولاً لضمان الجودة، وبعد اعتمادها هتساعد عملاء تانيين يختاروا صح 🌸
                    </p>
                </div>
            </div>

            <div id="bose-simreview-collection-list"></div>
        `;

        let uploadedImageUrls = [];
        let sessionPendingReviews = [];
        let isUploadingImages = false;

        function escapeHTML(str) {
            if (window.escapeBoseHTML) return window.escapeBoseHTML(str);
            if (str === null || str === undefined) return "";
            return String(str).replace(/[&<>'"]/g, (tag) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag));
        }

        async function fetchBackendReviews() {
            if (!window.BoseSupabase || typeof window.BoseSupabase.fetchApprovedReviews !== "function") return [];
            try {
                const rows = await window.BoseSupabase.fetchApprovedReviews(productSlug);
                return (rows || []).map((r) => ({ user: r.user_name, rating: r.rating, comment: r.comment, images: r.images || [] }));
            } catch (e) {
                console.warn("⚠️ تعذر تحميل مراجعات المحاكي:", e);
                return [];
            }
        }

        async function submitReviewToBackend(review) {
            if (!window.BoseSupabase || typeof window.BoseSupabase.submitBoseReview !== "function") {
                if (typeof window.showBoseToast === "function") window.showBoseToast("تعذر إرسال المراجعة حالياً، حاولي تحديث الصفحة أو المحاولة لاحقاً 🌸");
                return false;
            }
            await window.BoseSupabase.submitBoseReview({
                productId: productSlug,
                userName: review.user,
                rating: review.rating,
                comment: review.comment,
                images: review.images,
            });
            sessionPendingReviews.unshift({ ...review, pending: true });
            return true;
        }

        function buildReviewCardHTML(rev) {
            let starsHTML = "";
            const safeRating = parseInt(rev.rating, 10) || 0;
            for (let i = 1; i <= 5; i++) {
                starsHTML += `<i class="fas fa-star" style="color:${i <= safeRating ? "var(--bose-gold)" : "#111111"}"></i>`;
            }
            let imagesHTML = "";
            if (rev.images && rev.images.length > 0) {
                imagesHTML = `<div class="review-attach-images-row">${rev.images
                    .map((url) => `<img class="review-attached-img" src="${window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(url, 200) : url}" data-fullsrc="${url}" loading="lazy" alt="صورة مرفقة من تقييم عميلة">`)
                    .join("")}</div>`;
            }
            const pendingBadge = rev.pending
                ? `<span style="font-size:0.72rem; font-weight:700; color:var(--bose-pink); background:rgba(255,145,164,0.1); padding:3px 10px; border-radius:50px; margin-right:8px;">قيد المراجعة</span>`
                : "";
            return `
                <div class="review-card-node" style="direction: rtl; text-align: right;">
                    <div class="review-user-meta">
                        <h4 style="font-size: 0.95rem; font-weight: 700; margin: 0;">${escapeHTML(rev.user)}${pendingBadge}</h4>
                        <div class="review-stars-row">${starsHTML}</div>
                    </div>
                    <p style="font-size: 0.88rem; color: var(--bose-black); opacity: 0.85; line-height: 1.5; margin: 6px 0 0 0;">${escapeHTML(rev.comment)}</p>
                    ${imagesHTML}
                </div>
            `;
        }

        function updateSummary(ratingInfo) {
            const summaryEmpty = document.getElementById("bose-simreview-summary-empty");
            const summaryFilled = document.getElementById("bose-simreview-summary-filled");
            const summaryStars = document.getElementById("bose-simreview-summary-stars");
            const summaryText = document.getElementById("bose-simreview-summary-text");
            if (!ratingInfo) {
                if (summaryEmpty) summaryEmpty.style.display = "inline";
                if (summaryFilled) summaryFilled.style.display = "none";
                return;
            }
            const roundedAvg = Math.round(ratingInfo.avg * 10) / 10;
            if (summaryStars) {
                let s = "";
                for (let i = 1; i <= 5; i++) s += i <= Math.round(roundedAvg) ? "★" : "☆";
                summaryStars.textContent = s;
            }
            if (summaryText) summaryText.textContent = `${roundedAvg.toFixed(1)} (${ratingInfo.count} تقييم)`;
            if (summaryEmpty) summaryEmpty.style.display = "none";
            if (summaryFilled) summaryFilled.style.display = "flex";
        }

        async function renderReviews() {
            const listContainer = document.getElementById("bose-simreview-collection-list");
            if (!listContainer) return;
            const backendReviews = await fetchBackendReviews();
            const allReviews = sessionPendingReviews.concat(backendReviews);

            listContainer.innerHTML = allReviews.length
                ? allReviews.map(buildReviewCardHTML).join("")
                : `<p style="text-align:center; padding:30px 10px; font-size:0.9rem; opacity:0.6; font-weight:600;">لسه معندناش مراجعات على التجربة دي. شاركينا رأيك الصادق لتكوني أول من يوثق تجربته! 🌸</p>`;

            const ratedReviews = backendReviews.filter((r) => r.rating);
            const ratingInfo = ratedReviews.length > 0
                ? { avg: ratedReviews.reduce((s, r) => s + Number(r.rating), 0) / ratedReviews.length, count: ratedReviews.length }
                : null;
            updateSummary(ratingInfo);
        }

        // ===== ربط التفاعل =====
        const toggleFormBtn = document.getElementById("btn-toggle-simreview-form");
        const formWrapper = document.getElementById("bose-simreview-form-wrapper");
        const starRatingInputs = Array.from(document.querySelectorAll('input[name="bose-simreview-star-rating"]'));

        function updateStarVisuals(selectedValue) {
            starRatingInputs.forEach((inp) => {
                const icon = inp.nextElementSibling ? inp.nextElementSibling.querySelector("i") : null;
                if (icon) icon.style.color = parseInt(inp.value, 10) <= selectedValue ? "var(--bose-gold)" : "#111111";
            });
        }
        starRatingInputs.forEach((inp) => {
            inp.addEventListener("change", () => updateStarVisuals(parseInt(inp.value, 10)));
            if (inp.nextElementSibling) inp.nextElementSibling.addEventListener("mouseenter", () => updateStarVisuals(parseInt(inp.value, 10)));
        });
        const starsContainer = document.getElementById("bose-simreview-stars-picker");
        if (starsContainer) {
            starsContainer.addEventListener("mouseleave", () => {
                const checked = document.querySelector('input[name="bose-simreview-star-rating"]:checked');
                updateStarVisuals(checked ? parseInt(checked.value, 10) : 0);
            });
        }

        const SENTIMENT_CHIPS = {
            positive: ["التصميم طلع زي ما تخيلته بالظبط 😍", "سهل جداً أصمم بيه 🖌️", "النتيجة النهائية فاقت توقعاتي ✨", "هصمم بيه تاني أكيد 💕"],
            negative: ["التصميم النهائي مكنش زي المعاينة", "كانت فيه صعوبة في استخدام المحاكي", "التنفيذ اختلف عن اللي صممته"],
        };

        function buildLowRatingWhatsappLink() {
            const phone = (window.BoseStoreData && window.BoseStoreData.social && window.BoseStoreData.social.whatsapp) || "201097238441";
            const text = `مرحباً، عندي ملاحظة على تجربة "${productTitle}" حابة أشاركها معاكم 🌸`;
            if (typeof window.buildWhatsappLink === "function") return window.buildWhatsappLink(phone, text);
            return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        }

        function onRatingChosen(value) {
            const stepDetails = document.getElementById("bose-simreview-step-details");
            const lowBranch = document.getElementById("bose-simreview-lowrating-branch");
            const chipsRow = document.getElementById("bose-simreview-chips-row");
            const waLink = document.getElementById("bose-simreview-lowrating-whatsapp");

            stepDetails.style.display = "block";
            const isLow = value <= 3;
            lowBranch.style.display = isLow ? "block" : "none";
            if (isLow && waLink) waLink.href = buildLowRatingWhatsappLink();

            const chips = isLow ? SENTIMENT_CHIPS.negative : SENTIMENT_CHIPS.positive;
            chipsRow.innerHTML = chips
                .map((c) => `<button type="button" class="bose-review-chip" data-chip="${escapeHTML(c)}" style="background:#fff; border:1px solid rgba(255,145,164,0.4); color:var(--bose-black); padding:6px 14px; border-radius:50px; font-size:0.78rem; font-weight:700; cursor:pointer;">+ ${c}</button>`)
                .join("");
            chipsRow.querySelectorAll(".bose-review-chip").forEach((chip) => {
                chip.addEventListener("click", () => {
                    const ta = document.getElementById("bose-simreview-comment");
                    const text = chip.getAttribute("data-chip");
                    ta.value = ta.value.trim() ? `${ta.value.trim()}، ${text}` : text;
                    chip.disabled = true;
                    chip.style.opacity = "0.4";
                });
            });

            stepDetails.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        starRatingInputs.forEach((inp) => inp.addEventListener("change", () => onRatingChosen(parseInt(inp.value, 10))));

        toggleFormBtn.addEventListener("click", () => {
            if (formWrapper.style.display === "none") {
                formWrapper.style.display = "block";
                toggleFormBtn.innerHTML = `<i class="fas fa-times"></i> إغلاق لوحة التقييم`;
                formWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
                formWrapper.style.display = "none";
                toggleFormBtn.innerHTML = `<i class="fas fa-pen"></i> شاركي رأيك في أقل من دقيقة`;
            }
        });

        const imagesPicker = document.getElementById("bose-simreview-images-picker");
        const triggerImagesBtn = document.getElementById("btn-trigger-simreview-images");
        const previewContainer = document.getElementById("bose-simreview-images-preview-zone");
        const submitReviewBtn = document.getElementById("btn-submit-simreview");
        const MAX_REVIEW_IMAGES = 3;

        triggerImagesBtn.addEventListener("click", () => imagesPicker.click());

        imagesPicker.addEventListener("change", async function () {
            const files = Array.from(this.files).filter((f) => f.type.startsWith("image/"));
            const remainingSlots = MAX_REVIEW_IMAGES - uploadedImageUrls.length;
            if (remainingSlots <= 0) {
                if (typeof window.showBoseToast === "function") window.showBoseToast(`أقصى عدد صور للمراجعة ${MAX_REVIEW_IMAGES} صور 🌸`);
                this.value = "";
                return;
            }

            const filesToUpload = files.slice(0, remainingSlots);
            isUploadingImages = true;
            if (submitReviewBtn) submitReviewBtn.disabled = true;

            for (const file of filesToUpload) {
                const placeholder = document.createElement("div");
                placeholder.style.cssText = "width:73px; height:73px; border-radius:10px; background:rgba(255, 145, 164, 0.08); display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:var(--bose-pink);";
                placeholder.textContent = "...";
                previewContainer.appendChild(placeholder);

                try {
                    if (!window.BoseSupabase || typeof window.BoseSupabase.uploadBoseReferenceImage !== "function") throw new Error("خدمة رفع الصور غير متاحة حالياً");
                    const url = await window.BoseSupabase.uploadBoseReferenceImage(file);
                    uploadedImageUrls.push(url);
                    const imgNode = document.createElement("img");
                    imgNode.className = "review-attached-img";
                    imgNode.src = window.optimizeBoseImageUrl ? window.optimizeBoseImageUrl(url, 200) : url;
                    imgNode.dataset.fullsrc = url;
                    imgNode.loading = "lazy";
                    imgNode.style.cssText = "width:73px; height:73px; border-radius:10px; object-fit:cover;";
                    placeholder.replaceWith(imgNode);
                } catch (err) {
                    placeholder.remove();
                    if (typeof window.showBoseToast === "function") window.showBoseToast("تعذر رفع إحدى الصور، حاولي مرة أخرى 🌸");
                }
            }

            isUploadingImages = false;
            if (submitReviewBtn) submitReviewBtn.disabled = false;
            this.value = "";
        });

        submitReviewBtn.addEventListener("click", async () => {
            if (isUploadingImages) {
                if (typeof window.showBoseToast === "function") window.showBoseToast("لسه بترفع الصور، ثواني وهنكمل 🌸");
                return;
            }

            const userName = document.getElementById("bose-simreview-user-name").value.trim();
            const comment = document.getElementById("bose-simreview-comment").value.trim();
            const checkedRadio = document.querySelector('input[name="bose-simreview-star-rating"]:checked');
            const rating = checkedRadio ? checkedRadio.value : "5";

            if (!userName || !comment) {
                if (typeof window.showBoseToast === "function") window.showBoseToast("يرجى ملء جميع الحقول المطلوبة قبل الإرسال 🌸");
                return;
            }

            const originalSubmitLabel = submitReviewBtn.textContent;
            submitReviewBtn.disabled = true;
            submitReviewBtn.textContent = "بيتم الإرسال...";

            const wasSubmitted = await submitReviewToBackend({
                user: userName,
                rating: parseInt(rating, 10) || 5,
                comment: comment,
                images: uploadedImageUrls.slice(),
            });

            submitReviewBtn.disabled = false;
            submitReviewBtn.textContent = originalSubmitLabel;

            if (!wasSubmitted) return;

            await renderReviews();

            document.getElementById("bose-simreview-user-name").value = "";
            document.getElementById("bose-simreview-comment").value = "";
            if (checkedRadio) checkedRadio.checked = false;
            updateStarVisuals(0);
            if (previewContainer) previewContainer.innerHTML = "";
            uploadedImageUrls = [];
            document.getElementById("bose-simreview-step-details").style.display = "none";
            document.getElementById("bose-simreview-lowrating-branch").style.display = "none";

            formWrapper.style.display = "none";
            toggleFormBtn.innerHTML = `<i class="fas fa-pen"></i> شاركي رأيك في أقل من دقيقة`;

            if (typeof window.showBoseToast === "function") window.showBoseToast("تم إرسال مراجعتك بنجاح، هتظهر لباقي الزوار بعد اعتمادها من الإدارة 🌸");
        });

        renderReviews();
    };
})();
