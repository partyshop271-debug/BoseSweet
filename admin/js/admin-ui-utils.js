/**
 * admin-ui-utils.js
 * =====================================================================
 * 🧰 أدوات واجهة مشتركة لكل صفحات اللوحة: توست نجاح/خطأ، مودال تأكيد حذف،
 * ومؤشر تحميل. أي صفحة تحتاج واحدة منهم تستخدمها من هنا بدل ما تعيد كتابتها.
 *
 * ⚠️ أمان: أي نص ممكن يكون جاي من بيانات مستخدم (اسم منتج، اسم عميل...)
 * لازم يتعقّم بـ escapeHtml قبل ما يتحط جوه innerHTML. الدوال هنا بتعمل
 * الـ escape تلقائياً على النصوص اللي بتستقبلها عشان محدش ينسى.
 */

(function () {
    "use strict";

    /* ============================= تعقيم HTML ============================= */

    /**
     * بيحوّل أي نص لنسخة آمنة تتحط جوه innerHTML من غير ما تتفسر كـ HTML.
     * لازم تتستخدم مع أي نص جاي من قاعدة البيانات أو من إدخال مستخدم
     * قبل ما يتحط جوه template string هيتحط في innerHTML.
     */
    function escapeHtml(value) {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /* ============================= التوست ============================= */

    function ensureToastStack() {
        let stack = document.querySelector(".adm-toast-stack");
        if (!stack) {
            stack = document.createElement("div");
            stack.className = "adm-toast-stack";
            document.body.appendChild(stack);
        }
        return stack;
    }

    const TOAST_ICONS = { success: "fa-circle-check", error: "fa-circle-exclamation", info: "fa-circle-info" };

    /**
     * @param {string} message
     * @param {"success"|"error"|"info"} type
     */
    function showToast(message, type = "success") {
        const stack = ensureToastStack();
        const toast = document.createElement("div");
        toast.className = `adm-toast ${type}`;
        toast.innerHTML = `<i class="fa-solid ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i><span>${escapeHtml(message)}</span>`;
        stack.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.2s ease";
            setTimeout(() => toast.remove(), 200);
        }, 3200);
    }

    /* ============================= مودال التأكيد ============================= */

    /**
     * بيرجع Promise<boolean> - true لو المستخدم أكّد، false لو ألغى.
     * @param {{title: string, message: string, confirmLabel?: string, danger?: boolean}} opts
     */
    function confirmAction(opts) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "adm-modal-overlay";
            overlay.innerHTML = `
                <div class="adm-modal" style="max-width: 400px;">
                    <div class="adm-modal-header">
                        <h3>${escapeHtml(opts.title)}</h3>
                        <button class="adm-modal-close" data-role="cancel"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <p>${escapeHtml(opts.message)}</p>
                    <div class="adm-modal-actions">
                        <button class="adm-btn adm-btn-ghost" data-role="cancel">إلغاء</button>
                        <button class="adm-btn ${opts.danger ? "adm-btn-danger" : "adm-btn-primary"}" data-role="confirm">
                            ${escapeHtml(opts.confirmLabel || "تأكيد")}
                        </button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            function close(result) {
                overlay.remove();
                resolve(result);
            }

            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) close(false);
                const role = e.target.closest("[data-role]")?.getAttribute("data-role");
                if (role === "cancel") close(false);
                if (role === "confirm") close(true);
            });
        });
    }

    /* ============================= رفع الصور (Cloudinary) ============================= */

    /**
     * مصدر واحد لإعدادات ورفع الصور على Cloudinary. أي صفحة محتاجة ترفع صورة
     * (منتجات، فئات، بانرات الصفحة الرئيسية...) تستخدم من هنا بدل ما تكرر
     * الـ cloud name والـ upload preset في كل ملف صفحة لوحده.
     */
    const CLOUDINARY_CLOUD_NAME = "dyx4w0dr1";
    const CLOUDINARY_UPLOAD_PRESET = "gct8i28h";
    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    /**
     * ⚡ [إصلاح - بطء ظهور الصور]: الصور اللي بترفع من الموبايل مباشرة (كاميرا)
     * غالباً 3-8 ميجا للصورة الواحدة، وكانت بترفع للـ Cloudinary من غير أي ضغط،
     * يعني رفع كل صورة كان بياخد وقت طويل على نت الموبايل - ده اللي حاسس إنه
     * "بطء ظهور التعديلات"، لأن التعديل عملياً لسه بيترفع. الدالة دي بتصغّر أي
     * صورة لأقصى بعد 1600px وتضغطها JPEG قبل الرفع - بيقلل حجم الملف بشكل كبير
     * (غالباً 70-90%) من غير فرق واضح بالعين في جودة العرض على الموقع (اللي أصلاً
     * بيعرض بحد أقصى مشابه عبر optimizeBoseImageUrl). الصور بصيغة GIF بتتسيب
     * زي ما هي (عشان الحركة)، والصور الصغيرة أصلاً (أقل من الحد) بتتسيب برضه.
     */
    function compressImageForUpload(file, maxDim = 1600, quality = 0.82) {
        return new Promise((resolve) => {
            if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/gif") {
                resolve(file);
                return;
            }
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const { width, height } = img;
                if (width <= maxDim && height <= maxDim && file.size < 400 * 1024) {
                    resolve(file);
                    return;
                }
                const scale = Math.min(1, maxDim / Math.max(width, height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(width * scale);
                canvas.height = Math.round(height * scale);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (!blob) { resolve(file); return; }
                    resolve(new File([blob], file.name.replace(/\.(png|webp|heic|heif)$/i, ".jpg"), { type: "image/jpeg" }));
                }, "image/jpeg", quality);
            };
            img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
            img.src = objectUrl;
        });
    }

    async function uploadImageToCloudinary(file) {
        const optimized = await compressImageForUpload(file);
        const formData = new FormData();
        formData.append("file", optimized);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: formData });
        if (!res.ok) throw new Error("فشل رفع الصورة");
        const data = await res.json();
        return data.secure_url;
    }

    /**
     * رفع أكتر من صورة بالتوازي (مش الواحدة ورا التانية) مع تقرير تقدّم اختياري
     * onProgress(doneCount, totalCount) - بيسرّع رفع الصور المتعددة بشكل ملموس
     * (مثلاً 5 صور كانت بتاخد وقت 5 صور متتالية، دلوقتي بتترفع مع بعض).
     * أي صورة تفشل بترجع null في مكانها بدل ما توقف باقي الصور.
     */
    async function uploadImagesToCloudinary(files, onProgress) {
        let done = 0;
        const total = files.length;
        const results = await Promise.all(files.map(async (file) => {
            try {
                const url = await uploadImageToCloudinary(file);
                done += 1;
                if (onProgress) onProgress(done, total);
                return url;
            } catch (e) {
                done += 1;
                if (onProgress) onProgress(done, total);
                return null;
            }
        }));
        return results;
    }

    /* ============================= حالات الطلب ============================= */

    /**
     * مصدر واحد لكل حالات الطلب (التسمية العربية + لون الشارة). أي صفحة
     * محتاجة تعرض أو تفلتر بحالة الطلب (الداشبورد، صفحة الطلبات، وأي
     * صفحة تانية بعدين) تستخدم من هنا بدل ما تعيد كتابة القائمة دي -
     * كده لو ضفنا حالة جديدة أو غيّرنا تسمية، بتتغير في مكان واحد بس
     * ومفيش احتمال إن صفحة تتحدث وصفحة تتنسى فيحصل تعارض في العرض.
     */
    const ORDER_STATUSES = [
        { key: "awaiting_deposit", label: "بانتظار تأكيد العربون", cls: "warning" },
        { key: "pending", label: "قيد المراجعة", cls: "warning" },
        { key: "confirmed", label: "مؤكد", cls: "info" },
        { key: "preparing", label: "قيد التحضير", cls: "info" },
        { key: "out_for_delivery", label: "في الطريق", cls: "info" },
        { key: "delivered", label: "تم التسليم", cls: "success" },
        { key: "cancelled", label: "ملغي", cls: "danger" },
    ];

    function orderStatusMeta(status) {
        return ORDER_STATUSES.find((s) => s.key === status) || { key: status, label: status || "غير محدد", cls: "neutral" };
    }

    /** شارة حالة الطلب الجاهزة للعرض - status دايماً من القائمة الثابتة فوق، مش محتاج escape */
    function orderStatusBadgeHTML(status) {
        const meta = orderStatusMeta(status);
        return `<span class="adm-badge ${meta.cls}">${meta.label}</span>`;
    }

    /* ============================= مؤشر التحميل ============================= */

    function loadingSpinnerHTML() {
        return '<div class="adm-loading-spinner"></div>';
    }

    function emptyStateHTML({ icon = "fa-box-open", title, text }) {
        return `
            <div class="adm-empty-state">
                <i class="fa-solid ${icon}"></i>
                <strong>${escapeHtml(title)}</strong>
                <p>${escapeHtml(text || "")}</p>
            </div>`;
    }

    window.BoseAdminUI = {
        escapeHtml,
        showToast,
        confirmAction,
        loadingSpinnerHTML,
        emptyStateHTML,
        ORDER_STATUSES,
        orderStatusMeta,
        orderStatusBadgeHTML,
        uploadImageToCloudinary,
        uploadImagesToCloudinary,
        PLACEHOLDER_IMAGE_MARKER: "logo_igggsb",
    };
})();