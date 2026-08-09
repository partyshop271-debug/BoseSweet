/**
 * admin-auth-guard.js
 * =====================================================================
 * 🛡️ حارس الدخول - أول ملف منطق يتحمل في أي صفحة إدارية (بعد admin-data.js).
 * بيتأكد إن فيه جلسة Auth سليمة وإن صاحبها موجود في جدول admins قبل ما
 * يسمح بظهور أي محتوى، ولو لأ بيرجّعه لصفحة تسجيل الدخول فوراً.
 *
 * ملحوظة أمان: الحماية الحقيقية هي RLS في القاعدة. الحارس ده تجربة استخدام
 * بس (منع الدخول من الواجهة) - حتى لو حد لعب في الكود وعدّاه، مش هيقدر
 * يكتب أي بيانات فعلياً لأن القاعدة نفسها هترفضه.
 */

(function () {
    "use strict";

    async function guardCurrentPage() {
        if (!window.BoseAdmin) {
            console.error("❌ admin-data.js لازم يتحمل قبل admin-auth-guard.js");
            window.location.href = "/admin/login.html";
            return;
        }

        try {
            const adminInfo = await window.BoseAdmin.verifyIsAdmin();
            if (!adminInfo) {
                window.location.href = "/admin/login.html";
                return;
            }

            // بيانات المستخدم متاحة لأي صفحة تحتاجها (زي admin-shell.js لعرض الاسم)
            window.BoseAdminCurrentUser = adminInfo;
            document.documentElement.classList.add("adm-ready");
            document.dispatchEvent(new CustomEvent("BoseAdminReady", { detail: adminInfo }));
        } catch (e) {
            console.error("خطأ أثناء التحقق من الجلسة:", e);
            window.location.href = "/admin/login.html";
        }
    }

    // لو الجلسة اتلغت من تبويب تاني (تسجيل خروج مثلاً) - رجّعه للوجين فوراً
    if (window.BoseAdmin) {
        window.BoseAdmin.onAuthStateChange((session) => {
            if (!session && document.documentElement.classList.contains("adm-ready")) {
                window.location.href = "/admin/login.html";
            }
        });
    }

    guardCurrentPage();
})();
