/**
 * login-page.js - منطق صفحة تسجيل الدخول فقط
 */
(function () {
    "use strict";

    const form = document.getElementById("login-form");
    const errorBox = document.getElementById("login-error-box");
    const submitBtn = document.getElementById("login-submit-btn");

    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = "block";
    }

    function hideError() {
        errorBox.style.display = "none";
    }

    // لو أصلاً معاه جلسة أدمن سليمة، متعرضش اللوجين تاني - يوديه للداشبورد على طول
    (async function redirectIfAlreadyLoggedIn() {
        if (!window.BoseAdmin) return;
        const adminInfo = await window.BoseAdmin.verifyIsAdmin();
        if (adminInfo) window.location.href = "index.html";
    })();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الدخول...';

        try {
            await window.BoseAdmin.signIn(email, password);
            const adminInfo = await window.BoseAdmin.verifyIsAdmin();

            if (!adminInfo) {
                // الحساب سجل دخول بنجاح في Auth لكنه مش موجود في جدول admins
                await window.BoseAdmin.signOut();
                showError("هذا الحساب غير مصرّح له بدخول لوحة التحكم.");
                return;
            }

            window.location.href = "index.html";
        } catch (err) {
            showError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> دخول';
        }
    });
})();
