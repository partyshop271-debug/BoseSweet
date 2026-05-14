/**
 * ============================================================================
 * 👑 BoseSweets UI Logic Engine | محرك الواجهة التفاعلي
 * ============================================================================
 * الإصدار: V1.0
 * الوظيفة: إدارة الحركات الديناميكية، الشلال البصري، والسلايدر الذكي في الصفحة الرئيسية.
 */

// استدعاء النواة المركزية
import boseConfig from './core-engine.js';

document.addEventListener('DOMContentLoaded', () => {
    initMasterySlider();
    initDynamicSections();
});

/* -------------------------------------------------------------------------- */
/* 1. نظام "عقد من الإتقان" (Mastery Slider) - يتحدث كل 3 ساعات             */
/* -------------------------------------------------------------------------- */
function initMasterySlider() {
    const sliderContainer = document.getElementById('mastery-slider-container');
    if (!sliderContainer) return;

    // هذه الصور ستسحب لاحقاً من قاعدة البيانات، وضعنا هنا صوراً مبدئية لاختبار الحركة
    const masteryImages = [
        `${boseConfig.cloudinary.baseDeliveryUrl}v1712586716/logo_bose_gold.jpg`,
        // سيتم إضافة المزيد من الروابط الاحترافية للمنتجات هنا
    ];

    let currentIndex = 0;

    const changeSlide = () => {
        // تأثير انتقال ناعم (Fade in/out) يتماشى مع الراحة البصرية
        sliderContainer.style.opacity = 0;
        
        setTimeout(() => {
            sliderContainer.innerHTML = `<img src="${masteryImages[currentIndex]}" style="width: 100%; height: 100%; object-fit: cover;" alt="إبداعات حلويات بوسي">`;
            sliderContainer.style.opacity = 1;
            currentIndex = (currentIndex + 1) % masteryImages.length;
        }, 500); // نصف ثانية للتبديل الناعم
    };

    // إضافة خصائص الحركة للحاوية
    sliderContainer.style.transition = 'opacity 0.5s ease-in-out';

    // التشغيل الأول
    changeSlide();

    // ضبط المؤقت: 3 ساعات = 3 * 60 دقيقة * 60 ثانية * 1000 ملي ثانية = 10,800,000
    setInterval(changeSlide, 10800000);
}

/* -------------------------------------------------------------------------- */
/* 2. تحضير أقسام المنتجات (Product Sections Injection)                       */
/* -------------------------------------------------------------------------- */
function initDynamicSections() {
    const newArrivalsContainer = document.getElementById('new-arrivals-container');
    const bestSellersContainer = document.getElementById('best-sellers-container');

    // هذه الدالة ستكون نقطة الاتصال مع Firebase لسحب المنتجات الحقيقية
    // ووضعها داخل الكروت التي صممناها في ملف style.css
    console.log("🛡️ مستشعر الواجهة: الأقسام الديناميكية جاهزة لاستقبال البيانات من السحابة.");
}