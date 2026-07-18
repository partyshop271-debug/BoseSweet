/**
 * ╔══════════════════════════════════════════════════════════════════════════════════╗
 * ║ BRAND        : BOOSY SWEETS (حلويات بوسي)                                         ║
 * ║ FILE         : admin/admin.js                                                   ║
 * ║ DESCRIPTION  : بوابة تسجيل الدخول الآمنة المخصصة للإدارة فقط                  ║
 * ║ VERSION      : 2.1.0 (حل تضارب معرّفات الدخول وتوحيد المحرك بالكامل)            ║
 * ║ DATE         : 2026-07-18                                                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════════╝
 */

(function () {
    'use strict';

    const THEME_PALETTE = {
        primary: '#FF91A4',   
        background: '#FFFFFF',
        text: '#111111',      
        secondary: '#D4AF37'  
    };

    const SECURITY_CONFIG = {
        sessionKey: 'bose_admin_session', 
        expiryKey: 'boosy_admin_session_expiry',
        maxAttempts: 5,
        lockoutTimeMs: 15 * 60 * 1000, 
        sessionLifetimeMs: 60 * 60 * 1000 
    };

    // البيانات الصارمة المعتمدة والوحيدة على مستوى كافة ملفات الموقع
    const CREDENTIALS = {
        user: "boosy_admin",
        pass: "Boosy@2026_Secure"
    };

    const AdminSecurityManager = {
        sanitizeInput(input) {
            if (typeof input !== 'string') return '';
            return input
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        },

        checkLockout() {
            const attempts = parseInt(localStorage.getItem('boosy_login_attempts') || '0', 10);
            const lockTime = parseInt(localStorage.getItem('boosy_lockout_time') || '0', 10);
            
            if (attempts >= SECURITY_CONFIG.maxAttempts) {
                const now = Date.now();
                if (now < lockTime) {
                    const remainingMin = Math.ceil((lockTime - now) / 60000);
                    return { locked: true, minutes: remainingMin };
                } else {
                    localStorage.removeItem('boosy_login_attempts');
                    localStorage.removeItem('boosy_lockout_time');
                }
            }
            return { locked: false };
        },

        registerFailedAttempt() {
            let attempts = parseInt(localStorage.getItem('boosy_login_attempts') || '0', 10);
            attempts++;
            localStorage.setItem('boosy_login_attempts', attempts.toString());
            
            if (attempts >= SECURITY_CONFIG.maxAttempts) {
                const lockoutEndTime = Date.now() + SECURITY_CONFIG.lockoutTimeMs;
                localStorage.setItem('boosy_lockout_time', lockoutEndTime.toString());
            }
            return attempts;
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        // حارس مسار الصفحات الداخلية
        if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('products.html') || window.location.pathname.includes('orders.html')) {
            if (localStorage.getItem(SECURITY_CONFIG.sessionKey) !== "active_session") {
                window.location.href = 'index.html';
                return;
            }
        }

        // محرك التحقق الصارم والموحد
        window.verifyAdminCredentials = async function() {
            const userField = document.getElementById('admin-user');
            const passField = document.getElementById('admin-pass');
            const submitBtn = document.getElementById('btn-submit-login') || document.querySelector('.bose-btn-primary');

            if (!userField || !passField) {
                console.error("عناصر الإدخال غير موجودة بالصفحة الحالية.");
                return;
            }

            const lockStatus = AdminSecurityManager.checkLockout();
            if (lockStatus.locked) {
                window.showBoseToast(`محاولات الدخول محظورة حالياً. يرجى الانتظار ${lockStatus.minutes} دقيقة.`);
                return;
            }

            const cleanUsername = AdminSecurityManager.sanitizeInput(userField.value.trim());
            const cleanPassword = passField.value.trim(); // كلمات السر لا تُعقم بالكامل برمجياً لمنع تلف الرموز الخاصة مثل @

            if (!cleanUsername || !cleanPassword) {
                window.showBoseToast("يرجى ملء جميع الحقول المطلوبة بشكل صحيح.");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
                submitBtn.textContent = 'جاري التحقق الآمن..';
            }

            await new Promise(resolve => setTimeout(resolve, 600));

            if (cleanUsername === CREDENTIALS.user && cleanPassword === CREDENTIALS.pass) {
                localStorage.setItem(SECURITY_CONFIG.sessionKey, "active_session");
                localStorage.setItem(SECURITY_CONFIG.expiryKey, (Date.now() + SECURITY_CONFIG.sessionLifetimeMs).toString());
                
                localStorage.removeItem('boosy_login_attempts');
                localStorage.removeItem('boosy_lockout_time');

                window.showBoseToast("تم التحقق بنجاح.. جاري الانتقال للوحة التحكم.");
                
                setTimeout(() => {
                    // التوجيه الذكي للصفحة المتاحة لديك تلقائياً
                    if (window.location.pathname.includes('products.html') || window.location.pathname.includes('orders.html')) {
                        window.location.reload();
                    } else {
                        window.location.href = 'products.html'; 
                    }
                }, 1000);

            } else {
                const currentAttempts = AdminSecurityManager.registerFailedAttempt();
                const remaining = SECURITY_CONFIG.maxAttempts - currentAttempts;
                
                if (remaining <= 0) {
                    window.showBoseToast("تم حظر الدخول مؤقتاً لتجاوز حد المحاولات المسموحة.");
                } else {
                    window.showBoseToast(`بيانات الدخول غير صحيحة. متبقي ${remaining} محاولات.`);
                }

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.textContent = 'تسجيل الدخول المباشر';
                }
                passField.value = '';
            }
        };

        injectStrictTypography();
    });

    function injectStrictTypography() {
        document.body.style.fontFamily = "'Cairo', sans-serif";
        const mainHeaders = document.querySelectorAll('h1, h2');
        mainHeaders.forEach(header => {
            header.style.fontWeight = '700';
            header.style.color = THEME_PALETTE.text;
        });
    }

    window.showBoseToast = function(message) {
        let toastContainer = document.getElementById('boosy-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'boosy-toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100002;
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 90%;
                max-width: 400px;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${THEME_PALETTE.text};
            color: #FFFFFF;
            padding: 14px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 12px rgba(255,145,164,0.15);
            border-right: 4px solid ${THEME_PALETTE.primary};
            transition: all 0.3s ease;
        `;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };

})();