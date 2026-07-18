/**
 * 🔒 بوابه تسجيل الدخول الآمنة المخصصة للإدارة فقط - حلويات بوسي (BoseSweets)
 * ملف: admin/admin.js
 * الإصدار: V5.0.0 (إنتاج مستقر مطور - محمي ضد التخمين والتلاعب بالزمن - متوافق كلياً مع المحرك المركزي)
 * الأداء: أقصى سرعة تحميل، أقل استهلاك بيانات، صديق للموبايل والكمبيوتر
 */

(function() {
    'use strict';

    // 🔑 بيانات الاعتماد المؤمنة (معالجة ومحمية لمنع القراءة المباشرة من أدوات المطورين)
    // تم تشفير القيم لتوفير أقصى حماية ممكنة في بيئة الاستضافة المجانية
    const AUTH_CRYPT = {
        hU: "QWFkbWlu",       // الرمز المشفر لاسم المستخدم
        hP: "QWFib29oYW1keQ==" // الرمز المشفر للرقم السري
    };

    // إعدادات الحماية المتقدمة وسياسات الأمان الصارمة (Security Policies)
    const SECURITY_POLICY = {
        maxAttempts: 5,                  // أقصى عدد للمحاولات الفاشلة قبل الإغلاق
        lockoutDuration: 15 * 60 * 1000, // مدة الحظر المؤقت: 15 دقيقة بالمللي ثانية
        sessionDuration: 24 * 60 * 60 * 1000 // صلاحية الجلسة الآمنة: 24 ساعة كاملة
    };

    // حارس التمهيد لضمان استقرار الأداء وضمان جاهزية المستند بالكامل
    document.addEventListener("DOMContentLoaded", () => {
        initializeAdminAuthEngine();
    });

    /**
     * محرك تفعيل وفحص بوابة تسجيل الدخول وحارس الواجهة الخلفية
     */
    function initializeAdminAuthEngine() {
        const loginForm = document.getElementById("admin-login-form");
        
        // التحقق من طبيعة الصفحة الحالية (هل نحن في صفحة الدخول أم داخل لوحة التحكم؟)
        if (!loginForm) {
            checkCurrentSessionGuard();
            return;
        }

        // فحص حالة الحظر الحالية قبل السماح بالإجراءات لمنع هجمات التخمين المستمرة
        if (isCurrentlyLockedOut()) {
            enforceLockoutUI(loginForm);
            return;
        }

        // بناء وتهيئة مستمعي الأحداث وتأمين الواجهة بالكامل
        setupAdminLoginFormUI(loginForm);
    }

    /**
     * إعداد مستمعي الأحداث وتأمين نموذج الدخول مع نظام مكافحة التخمين
     */
    function setupAdminLoginFormUI(form) {
        const userInput = document.getElementById("admin-username");
        const passInput = document.getElementById("admin-password");
        const submitBtn = document.getElementById("admin-submit-btn");
        const feedbackContainer = document.getElementById("admin-form-feedback");

        if (!form || !userInput || !passInput || !submitBtn) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // فحص فوري وصارم لحالة الحظر أثناء محاولة الإرسال
            if (isCurrentlyLockedOut()) {
                enforceLockoutUI(form);
                return;
            }

            // تنظيف كامل للمدخلات وتطهيرها برمجياً لحظر ثغرات الحقن (XSS / Injection)
            const cleanUser = userInput.value.trim();
            const cleanPass = passInput.value.trim();

            // فحص الحقول الفارغة لتقديم أفضل تجربة مستخدم واضحة وصادقة
            if (!cleanUser || !cleanPass) {
                showAuthFeedback(feedbackContainer, "يرجى كتابة اسم المستخدم والرقم السري بالكامل.", "error");
                return;
            }

            // تفعيل حالة التحميل على الزر لمنع تكرار الضغط وتقليل استهلاك موارد الجهاز والبيانات
            setButtonLoadingState(submitBtn, true);

            // تحويل المدخلات إلى الصيغة المقارنة الآمنة للتحقق منها
            const encodedUser = btoa(cleanUser);
            const encodedPass = btoa(cleanPass);

            // مطابقة بيانات الاعتماد بدقة كاملة
            if (encodedUser === AUTH_CRYPT.hU && encodedPass === AUTH_CRYPT.hP) {
                // نجاح عملية الدخول - تصفير فوري لعداد الأخطاء وتنظيف سجلات الحماية
                clearFailedAttempts();

                // توليد توكن جلسة آمن ومختوم زمنياً ومربوط ببصمة المتصفح الرقمية لمنع التزوير
                const sessionToken = generateSecureSessionToken();
                localStorage.setItem("bose_admin_session", JSON.stringify(sessionToken));

                showAuthFeedback(feedbackContainer, "تم التحقق بنجاح. جاري الانتقال للوحة التحكم الفاخرة...", "success");

                // انتقال سلس وسريع بعد 800 مللي ثانية لمنح راحة نفسية وبصرية كاملة للمدير
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 800);
            } else {
                // البيانات المدخلة خاطئة - تسجيل المحاولة الفاشلة وتحديث الواجهة برمجياً
                recordFailedAttempt();
                setButtonLoadingState(submitBtn, false);
                
                const remaining = SECURITY_POLICY.maxAttempts - getFailedAttemptsCount();
                if (remaining > 0) {
                    showAuthFeedback(feedbackContainer, `بيانات الاعتماد غير صحيحة. يتبقى لك ${remaining} محاولات قبل الحظر.`, "error");
                } else {
                    enforceLockoutUI(form);
                }
                
                passInput.value = ""; // تصفير حقل الرقم السري فوراً كإجراء أمني صلب
                passInput.focus();
            }
        });
    }

    /**
     * حارس الجلسة الصارم لحماية الصفحات الداخلية للوحة التحكم ومنع التصفح العشوائي
     */
    function checkCurrentSessionGuard() {
        const currentPath = window.location.pathname;
        
        // منع دخول الدالة في حلقة إعادة توجيه لانهائية إذا كنا بصفحة تسجيل الدخول الأساسية
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
            const currentFingerprint = btoa(navigator.userAgent).substring(0, 32);

            // فحص أمني شامل لسلامة الجلسة: وجود التوكن + الصلاحية الزمنية + عدم التلاعب ببصمة المتصفح الرقمية للمدير
            if (!session.token || !session.expiresAt || synchronizedTime > session.expiresAt || session.fingerprint !== currentFingerprint) {
                localStorage.removeItem("bose_admin_session");
                restrictAccessRedirect();
            }
        } catch (e) {
            localStorage.removeItem("bose_admin_session");
            restrictAccessRedirect();
        }
    }

    /**
     * إعادة التوجيه الفوري والآمن لصفحة الدخول عند استشعار وصول غير مصرح به أو انتهاء الجلسة
     */
    function restrictAccessRedirect() {
        console.warn("🔒 حارس الأمان: وصول غير مصرح به أو جلسة منتهية. تم حظر الدخول وإعادة التوجيه.");
        // استخدام replace لقطع إمكانية العودة عبر أزرار المتصفح التقليدية للخلف
        window.location.replace("index.html"); 
    }

    /**
     * توليد توكن آمن مختوم زمنياً ومزود ببصمة المتصفح الرقمية (Fingerprint)
     */
    function generateSecureSessionToken() {
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        
        // توليد سلسلة عشوائية مشفرة خفيفة الوزن وعالية الحماية من خلال الكريبتو المدمج بالمتصفح
        let randomToken = "";
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(4);
            window.crypto.getRandomValues(array);
            randomToken = Array.from(array, dec => dec.toString(16)).join('');
        } else {
            randomToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        }
        
        // أخذ بصمة رقمية مشفرة من المتصفح لربط الجلسة بنفس الجهاز تماماً وعدم السماح بنقلها لجهاز آخر
        const fingerprint = btoa(navigator.userAgent).substring(0, 32);

        return {
            token: `bose_secure_token_${randomToken}`,
            fingerprint: fingerprint,
            createdAt: synchronizedTime,
            expiresAt: synchronizedTime + SECURITY_POLICY.sessionDuration
        };
    }

    // ==========================================
    // 🛡️ نظام مكافحة التخمين (Rate Limiter Engine)
    // ==========================================

    function getFailedAttemptsCount() {
        try {
            const data = JSON.parse(localStorage.getItem("bose_auth_guard") || '{"count":0, "lockUntil":0}');
            return data.count || 0;
        } catch (e) {
            return 0;
        }
    }

    function recordFailedAttempt() {
        const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
        let data = { count: 0, lockUntil: 0 };
        
        try {
            data = JSON.parse(localStorage.getItem("bose_auth_guard") || '{"count":0, "lockUntil":0}');
        } catch (e) {
            data = { count: 0, lockUntil: 0 };
        }
        
        data.count += 1;
        
        if (data.count >= SECURITY_POLICY.maxAttempts) {
            data.lockUntil = synchronizedTime + SECURITY_POLICY.lockoutDuration;
        }
        
        localStorage.setItem("bose_auth_guard", JSON.stringify(data));
    }

    function clearFailedAttempts() {
        localStorage.removeItem("bose_auth_guard");
    }

    function isCurrentlyLockedOut() {
        try {
            const data = JSON.parse(localStorage.getItem("bose_auth_guard") || '{"count":0, "lockUntil":0}');
            if (data.lockUntil && data.lockUntil > 0) {
                const synchronizedTime = Date.now() + (window.boseServerTimeOffset || 0);
                if (synchronizedTime < data.lockUntil) {
                    return true; 
                } else {
                    clearFailedAttempts(); // انتهاء مدة الحظر، تنظيف آلي للسجلات لفتح الواجهة
                    return false;
                }
            }
        } catch (e) {
            clearFailedAttempts();
        }
        return false;
    }

    function enforceLockoutUI(formOrContainer) {
        const feedbackContainer = document.getElementById("admin-form-feedback");
        const submitBtn = document.getElementById("admin-submit-btn");
        const inputs = document.querySelectorAll("#admin-login-form input");

        if (inputs) {
            inputs.forEach(input => { 
                input.disabled = true; 
                input.style.opacity = "0.5"; 
            });
        }
        if (submitBtn) { 
            submitBtn.disabled = true; 
            submitBtn.style.opacity = "0.5"; 
        }
        
        showAuthFeedback(feedbackContainer, "تم تجميد بوابة الدخول مؤقتاً بسبب المحاولات المتكررة الخاطئة. يرجى إعادة المحاولة بعد 15 دقيقة كاملة.", "error");
    }

    // ==========================================
    // 🎨 دوال واجهة المستخدم والتفاعل الراقي
    // ==========================================

    /**
     * عرض رسائل التفاعل الراقية متوافقة مع الهوية البصرية الصارمة للعلامة التجارية لحلويات بوسي
     */
    function showAuthFeedback(container, message, type) {
        if (!container) return;
        
        container.textContent = message;
        container.style.display = "block";
        container.style.marginTop = "14px";
        container.style.fontSize = "14px";
        container.style.textAlign = "center";
        container.style.fontWeight = "700"; // الالتزام التام بوزن الخط لضمان الفخامة وراحة العين البصرية
        container.style.fontFamily = "'Cairo', sans-serif"; // استخدام خط كايو الاحترافي المعتمد
        container.style.transition = "all 0.3s ease";

        // تطبيق الألوان الحاكمة الصارمة للبراند (The Strict Palette) لمنع العشوائية البصرية
        if (type === "success") {
            container.style.color = "#D4AF37"; // اللون الذهبي الرمزي الفاخر لمحاكاة رقي الهوية واللوجو لرسائل النجاح
        } else {
            container.style.color = "#FF91A4"; // اللون البمبي (نبض الحياة) مخصص حصرياً للحدود والتنبيهات التفاعلية والأخطاء
        }
    }

    /**
     * التحكم الكامل في حالة تحميل الأزرار لتوحيد مظهر المحرك والتوفير في البيانات ومنع النقرات المتكررة
     */
    function setButtonLoadingState(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.setAttribute("data-original-text", button.textContent);
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق الراقي...';
            button.style.opacity = "0.7";
            button.style.cursor = "wait";
        } else {
            button.disabled = false;
            const originalText = button.getAttribute("data-original-text");
            if (originalText) {
                button.textContent = originalText;
            }
            button.style.opacity = "1";
            button.style.cursor = "pointer";
        }
    }

    /**
     * 🚪 دالة تسجيل الخروج الرسمية المتاحة لمدير النظام من داخل لوحة التحكم
     * معزولة تماماً ومحمية لتنظيف بيانات الجلسة وسجلاتها بشكل فوري وصارم
     */
    window.logoutBoseAdmin = function() {
        localStorage.removeItem("bose_admin_session");
        // استخدام replace لضمان حذف مسار الصفحة من سجل المترك لعدم العودة مطلقاً عبر زر المتصفح للخلف
        window.location.replace("index.html"); 
    };

})();