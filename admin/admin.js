/**
 * حلويات بوسي - محرك الإدارة البرمجي المعزول والمطور (admin.js)
 * نظام المصادقة المشفر وحارس المسارات المتوافق مع الاستضافات السحابية وVercel
 */

(function () {
    'use strict';

    // 1. بصمات التعمية المشفرة لبيانات الدخول المطلوبة (SHA-256 Hashes)
    const AUTH_CONFIG = {
        uHex: "4be4cc254924c8c7d8df9305fa4e61fbb9c60655c63d63b2f9a7391a329971db", // Aadmin Hash
        pHex: "a9d7cd19fdfb74c43cb4e488152e00ef7cb4a23450a21d51c70e281bb8de0867"  // Aaboohamdy Hash
    };

    // 2. دالة تشفير النصوص المحلية بالاعتماد على خوارزمية المتصفح الأصلية الخفيفة
    async function computeHash(string) {
        const msgUint8 = new TextEncoder().encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 3. دالة تنظيف وتطهير المدخلات لمنع ثغرات XSS وحقن النصوص
    function sanitizeInput(input) {
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML.replace(/['"`;()]/g, '');
    }

    // 4. نظام حارس المسار المطور (Route Guard System) - متوافق مع Vercel Clean URLs
    function verifyRouteAccess() {
        const currentPath = window.location.pathname.toLowerCase();
        const sessionToken = sessionStorage.getItem('boosy_admin_session');
        const sessionVerify = localStorage.getItem('boosy_session_active');

        // فحص ذكي وشامل لكل الاحتمالات الممكنة لرابط صفحة تسجيل الدخول على Vercel
        const isLoginPage = currentPath.endsWith('index.html') || 
                            currentPath.endsWith('/admin/') || 
                            currentPath.endsWith('/admin');

        if (isLoginPage) {
            // إذا كان المستخدم مسجل دخول بالفعل، يتم توجيهه للوحة التحكم تلقائياً
            if (sessionToken && sessionVerify === 'true') {
                window.location.href = 'dashboard.html';
            }
            return; // السماح بالبقاء في صفحة تسجيل الدخول دون حظر
        }

        // بالنسبة لباقي الصفحات الإدارية (مثل dashboard.html): إذا لم تتوفر البصمة يتم الحظر فوراً
        if (!sessionToken || sessionVerify !== 'true') {
            sessionStorage.removeItem('boosy_admin_session');
            localStorage.removeItem('boosy_session_active');
            window.location.href = 'index.html';
        }
    }

    // تشغيل الحارس بشكل استباقي وفوري لمنع تعارض الصفحات
    verifyRouteAccess();

    // 5. ربط أحداث واجهة تسجيل الدخول إذا كانت متواجدة في الصفحة الحالية
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('adminLoginForm');
        if (!loginForm) return; // إنهاء التنفيذ إذا كان الملف يعمل كحارس بصفحة أخرى

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const submitBtn = document.getElementById('submitBtn');
        const msgBox = document.getElementById('msgBox');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // تعطيل الزرار لمنع النقرات المتعددة المستهلكة للبيانات
            submitBtn.disabled = true;
            showSystemMessage("جاري التحقق أمنياً...", "success");

            // جلب وتطهير البيانات المدخلة
            const cleanUser = sanitizeInput(usernameInput.value.trim());
            const cleanPass = sanitizeInput(passwordInput.value.trim());

            if (!cleanUser || !cleanPass) {
                showSystemMessage("برجاء ملء الحقول المطلوبة بشكل صحيح.", "error");
                submitBtn.disabled = false;
                return;
            }

            try {
                // حساب الهاشات ومقارنتها بالبصمات المحفوظة
                const inputUserHash = await computeHash(cleanUser);
                const inputPassHash = await computeHash(cleanPass);

                if (inputUserHash === AUTH_CONFIG.uHex && inputPassHash === AUTH_CONFIG.pHex) {
                    // توليد توكن عشوائي مؤقت غير قابل للتخمين
                    const secureToken = btoa(Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => String.fromCharCode(b)).join(''));
                    
                    // حفظ الجلسة مشفرة في نطاق التصفح الحالي
                    sessionStorage.setItem('boosy_admin_session', secureToken);
                    localStorage.setItem('boosy_session_active', 'true');

                    showSystemMessage("تمت المصادقة بنجاح. جاري الانتقال للوحة التحكم.", "success");

                    // التوجيه السلس الفوري بعد 800 مللي ثانية
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 800);
                } else {
                    showSystemMessage("بيانات الدخول غير صحيحة.", "error");
                    submitBtn.disabled = false;
                }
            } catch (error) {
                showSystemMessage("حدث خطأ في معالجة البيانات، حاول مجدداً.", "error");
                submitBtn.disabled = false;
            }
        });

        function showSystemMessage(text, type) {
            msgBox.textContent = text;
            msgBox.className = `system-message ${type}`;
        }
    });
})();
