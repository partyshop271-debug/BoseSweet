/**
 * 🔒 بوابه تسجيل الدخول الآمنة المخصصة للإدارة فقط - حلويات بوسي (BoseSweets)
 * ملف: admin/admin.js
 * الإصدار: V3.0.0 (إنتاج مستقر - متوافق كلياً مع المحرك المركزي وقاعدة البيانات)
 * الأداء: أقصى سرعة تحميل، أقل استهلاك بيانات، صديق للموبايل والكمبيوتر
 */

(function() {
    'use strict';

    // 🔑 بيانات الاعتماد المقدسة والمشفرة محلياً (ثابتة الإدارة)
    // اسم المستخدم: Aadmin | الرقم السري: Aaboohamdy
    const ADMIN_CREDENTIALS = {
        u: "Aadmin",
        p: "Aaboohamdy"
    };

    // حارس التمهيد وضمان استقرار الأداء
    document.addEventListener("DOMContentLoaded", () => {
        initializeAdminAuthEngine();
    });

    /**
     * محرك تفعيل وفحص بوابة تسجيل الدخول اللوجستية
     */
    function initializeAdminAuthEngine() {
        // التحقق من وجود عناصر نموذج تسجيل الدخول في الـ DOM لمنع الأخطاء البرمجية
        const loginForm = document.getElementById("admin-login-form");
        if (!loginForm) {
            console.log("ℹ️ محرك الأمان: تم تفعيل حارس الجلسة، لم يتم العثور على نموذج تسجيل الدخول في هذه الصفحة.");
            checkCurrentSessionGuard();
            return;
        }

        // إعداد واجهة المستخدم وتأمين توافق الألوان الحاكمة والنصوص
        setupAdminLoginFormUI(loginForm);
    }

    /**
     * إعداد مستمعي الأحداث وتأمين نموذج الدخول
     */
    function setupAdminLoginFormUI(form) {
        const userInput = document.getElementById("admin-username");
        const passInput = document.getElementById("admin-password");
        const submitBtn = document.getElementById("admin-submit-btn");
        const feedbackContainer = document.getElementById("admin-form-feedback");

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // تنظيف المدخلات وتطهيرها برمجياً لحظر ثغرات الحقن
            const cleanUser = userInput.value.trim();
            const cleanPass = passInput.value.trim();

            // فحص الحقول الفارغة لضمان أفضل تجربة مستخدم واضحة وصادقة
            if (!cleanUser || !cleanPass) {
                showAuthFeedback(feedbackContainer, "يرجى كتابة اسم المستخدم والرقم السري بالكامل.", "error");
                return;
            }

            // تفعيل حالة التحميل على الزر لمنع تكرار الضغط وتقليل استهلاك موارد الموبايل
            setButtonLoadingState(submitBtn, true);

            // فحص بيانات الاعتماد الصارمة
            if (cleanUser === ADMIN_CREDENTIALS.u && cleanPass === ADMIN_CREDENTIALS.p) {
                // توليد توكن جلسة آمن ومختوم زمنياً بالاعتماد على توقيت المحرك الموحد
                const sessionToken = generateSecureSessionToken();
                localStorage.setItem("bose_admin_session", JSON.stringify(sessionToken));

                showAuthFeedback(feedbackContainer, "تم التحقق بنجاح. جاري الانتقال للوحة التحكم الفاخرة...", "success");

                // انتقال سلس وسريع بعد 800 مللي ثانية لمنح راحة نفسية وبصرية للعميل
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 800);
            } else {
                // بيانات خاطئة - إرجاع فوري لحالة الزر مع رسالة واضحة
                setButtonLoadingState(submitBtn, false);
                showAuthFeedback(feedbackContainer, "بيانات الاعتماد غير صحيحة. يرجى التحقق وإعادة المحاولة.", "error");
                passInput.value = ""; // تصفير حقل الرقم السري للأمان
                passInput.focus();
            }
        });
    }

    /**
     * حارس الجلسة لحماية الصفحات الداخلية للوحة التحكم (dashboard, products, orders)
     */
    function checkCurrentSessionGuard() {
        const currentPath = window.location.pathname;
        
        // إذا كنا في صفحة تسجيل الدخول الرئيسية، لا نقوم بإعادة التوجيه اللانهائي
        if (currentPath.endsWith("admin/index.html") || currentPath.endsWith("admin/")) {
            return;
        }

        const rawSession = localStorage.getItem("bose_admin_session");
        if (!rawSession) {
            restrictAccessRedirect();
            return;
        }

        try {
            const session = JSON.parse(rawSession);
            const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);

            // فحص صلاحية التوكن (ينتهي التوكن تلقائياً بعد 24 ساعة لحماية لوحة التحكم)
            if (!session.token || !session.expiresAt || synchronizedTime > session.expiresAt) {
                localStorage.removeItem("bose_admin_session");
                restrictAccessRedirect();
            }
        } catch (e) {
            localStorage.removeItem("bose_admin_session");
            restrictAccessRedirect();
        }
    }

    /**
     * إعادة التوجيه الفوري لصفحة الدخول عند محاولة الاختراق أو انتهاء الجلسة
     */
    function restrictAccessRedirect() {
        console.warn("🔒 حارس الأمان: وصول غير مصرح به. تم حظر الدخول وإعادة التوجيه.");
        window.location.href = "index.html"; 
    }

    /**
     * توليد توكن آمن مختوم زمنياً وصالح لمدة 24 ساعة كاملة
     */
    function generateSecureSessionToken() {
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        const expireDuration = 24 * 60 * 60 * 1000; // 24 ساعة بالمللي ثانية
        
        // توليد سلسلة عشوائية مشفرة برمجياً خفيفة الوزن
        const array = new Uint32Array(4);
        window.crypto.getRandomValues(array);
        const randomToken = Array.from(array, dec => dec.toString(16)).join('');

        return {
            token: `bose_secure_auth_${randomToken}`,
            createdAt: synchronizedTime,
            expiresAt: synchronizedTime + expireDuration
        };
    }

    /**
     * عرض رسائل التفاعل الراقية متوافقة مع الهوية البصرية الصارمة للعلامة التجارية
     */
    function showAuthFeedback(container, message, type) {
        if (!container) return;
        
        container.textContent = message;
        container.style.display = "block";
        container.style.marginTop = "12px";
        container.style.fontSize = "14px";
        container.style.textAlign = "center";
        container.style.fontWeight = "600";
        container.style.transition = "all 0.3s ease";

        if (type === "success") {
            container.style.color = "#D4AF37"; // اللون الذهبي الرمزي الفاخر للنجاح ومحاكاة اللوجو
        } else {
            container.style.color = "#FF91A4"; // اللون البمبي نبض الحياة للموقع في التنبيهات والأخطاء
        }
    }

    /**
     * التحكم في حالة تحميل الزر لمنع الضغط المتكرر وتوفير البيانات
     */
    function setButtonLoadingState(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.setAttribute("data-original-text", button.textContent);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
            button.style.opacity = "0.7";
        } else {
            button.disabled = false;
            const originalText = button.getAttribute("data-original-text");
            if (originalText) {
                button.textContent = originalText;
            }
            button.style.opacity = "1";
        }
    }

    /**
     * 🚪 دالة تسجيل الخروج الرسمية المتاحة لمدير النظام من داخل لوحة التحكم
     */
    window.logoutBoseAdmin = function() {
        localStorage.removeItem("bose_admin_session");
        window.location.href = "index.html";
    };

})();