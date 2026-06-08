javascript
/**
 * ------------------------------------------------------------------
 * المحرك العام والذكي لـ موقع حلويات بوسي (js/core.html.js)
 * Singleton لرفع كفاءة معالج الهواتف المحمولة وقفل الحسابات المالية
 * ------------------------------------------------------------------
 */

(function() {
    // كائن تخزين البيانات العام لمنع التكرار وحماية المعالج
    window.BoseStoreData = null; 

    // تهيئة نظام التنبيهات الراقية لمنع استخدام alert() في بيئة الهواتف
    function initializeBoseAlertSystem() {
        if (!document.getElementById('bose-alert-container')) {
            const container = document.createElement('div');
            container.id = 'bose-alert-container';
            document.body.appendChild(container);
        }
    }

    // إظهار تنبيه بوسي الفاخر والناعم للعميل
    window.showBoseAlert = function(message, icon = "🌸") {
        initializeBoseAlertSystem();
        const container = document.getElementById('bose-alert-container');
        
        const toast = document.createElement('div');
        toast.className = 'bose-toast';
        
        toast.innerHTML = `
            <span class="bose-toast-icon">${icon}</span>
            <span class="bose-toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // إغلاق تلقائي ناعم بعد 3.5 ثانية لراحة عين العميل
        setTimeout(() => {
            toast.classList.add('toast-closing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3500);
    };

    // تحميل قاعدة بيانات الموقع بذكاء ومرة واحدة لتقليل طلبات الشبكة
    async function loadStoreDatabase() {
        if (window.BoseStoreData) return;
        
        try {
            // جلب ملف البيانات الرئيسي والمعتمد
            const response = await fetch('data/site-data-final.json');
            if (!response.ok) throw new Error('تعذر تحميل قاعدة بيانات بوسي.');
            
            window.BoseStoreData = await response.json();
            console.log("✔️ BoseSweets Database Loaded & Locked Successfully.");
            
            // تهيئة الإعدادات العامة والتصميم بعد اكتمال جلب البيانات
            applyGlobalSEOAndBranding();
            buildDynamicHeaderMenu();
            buildDynamicFooterPolicies();
            updateGlobalCartCounter();
            markActiveNavLink();
            
        } catch (error) {
            console.error("❌ Critical Error Loading BoseSweets Data:", error);
            // إعادة المحاولة التلقائية بعد ثانيتين لضمان استقرار العمل عند ضعف الشبكة
            setTimeout(loadStoreDatabase, 2000);
        }
    }

    // دالة مراجعة زيادة الأسعار الرسمية وحظر الثغرات المالية في المنيو والمحركات الخاصة
    window.calculateBosePrice = function(basePrice, applyOnContext = "menu-only") {
        if (!window.BoseStoreData) return basePrice;
        const rule = window.BoseStoreData.store.priceIncrease;
        if (rule && rule.enabled && (rule.applyOn === "all" || rule.applyOn === applyOnContext)) {
            return Math.round(basePrice * (1 + (rule.percent / 100)));
        }
        return basePrice;
    };

    // تطبيق إعدادات الـ SEO والعلامة التجارية من الـ JSON مباشرة
    function applyGlobalSEOAndBranding() {
        if (!window.BoseStoreData) return;
        const data = window.BoseStoreData;
        
        // قفل عنوان الصفحة طبقاً لـ SEO الـ JSON للحفاظ على الهوية
        document.title = data.seo.title;
        
        // تحديث اللوجو الخاص بـ حلويات بوسي في جميع أرجاء الصفحة
        const logoImgs = document.querySelectorAll('img#bose-store-logo');
        logoImgs.forEach(img => {
            if(img.src !== data.store.logo) img.src = data.store.logo;
        });
        
        // تحديث نص النبذة التعريفية بالفوتر
        const aboutText = document.getElementById('footer-about-text');
        if (aboutText && !aboutText.textContent) {
            aboutText.textContent = data.footer.about;
        }

        // تحديث روابط التواصل الاجتماعي بالفوتر بدقة
        const social = data.social;
        const fbLink = document.querySelector('.social-link-facebook');
        const igLink = document.querySelector('.social-link-instagram');
        const tkLink = document.querySelector('.social-link-tiktok');
        const waLink = document.querySelector('.social-link-whatsapp');

        if (fbLink) fbLink.href = social.facebook;
        if (igLink) igLink.href = social.instagram;
        if (tkLink) tkLink.href = social.tiktok;
        if (waLink) waLink.href = `https://wa.me/2${social.whatsapp}`;
    }

    // بناء قائمة التنقل في الهيدر بشكل ديناميكي كامل لمنع التداخلات البرمجية
    function buildDynamicHeaderMenu() {
        const navMenu = document.getElementById('bose-nav-menu');
        if (!navMenu || !window.BoseStoreData) return;

        // مخرجات الروابط المترابطة بالترتيب المعياري
        const pageMapping = {
            "الرئيسية": "index.html",
            "المنيو الشامل": "menu.html",
            "السلة": "cart.html",
            "محاكي التورت": "cake-builder.html",
            "محاكي الورد": "flower-builder.html"
        };

        const menuItems = window.BoseStoreData.navigation.menuItems;
        let htmlList = `<ul class="nav-list">`;

        menuItems.forEach(item => {
            const fileName = pageMapping[item] || "index.html";
            htmlList += `<li><a href="${fileName}">${item}</a></li>`;
        });

        htmlList += `</ul>`;
        navMenu.innerHTML = htmlList;

        // تحديث النشاط الحالي للرابط المختار
        markActiveNavLink();
    }

    // بناء روابط السياسات في الفوتر ديناميكياً
    function buildDynamicFooterPolicies() {
        const policiesContainer = document.querySelector('.footer-policies-container');
        if (!policiesContainer || !window.BoseStoreData) return;

        const policies = window.BoseStoreData.footer.policies;
        let policiesHTML = '';
        
        policies.forEach(policy => {
            policiesHTML += `<a href="#">${policy}</a>`;
        });

        policiesHTML += `<div class="footer-copyright">جميع الحقوق محفوظة © حلويات بوسي ٢٠٢٦</div>`;
        policiesContainer.innerHTML = policiesHTML;
    }

    // تحديد الرابط النشط حالياً لراحة العميل البصرية وتسهيل التصفح
    function markActiveNavLink() {
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        const navLinks = document.querySelectorAll('.nav-list li a');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath) {
                link.parentElement.classList.add('active');
            } else {
                link.parentElement.classList.remove('active');
            }
        });
    }

    // العداد اللحظي للقطع داخل سلة المشتريات بالهيدر
    window.updateGlobalCartCounter = function() {
        const cartCountBadge = document.getElementById('nav-cart-count');
        if (!cartCountBadge) return;
        
        const rawCart = localStorage.getItem('bose_cart');
        const cart = rawCart ? JSON.parse(rawCart) : [];
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountBadge.textContent = totalItems;
    };

    // الاستدعاء التلقائي فور تحميل الصفحة لضمان فحص وربط المحركات
    document.addEventListener("DOMContentLoaded", () => {
        loadStoreDatabase();
    });
})();

