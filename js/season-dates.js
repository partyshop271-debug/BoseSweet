/**
 * season-dates.js - محرك حساب تواريخ المناسبات المتكررة (ميلادي + هجري)
 * =====================================================================
 * 🎉👑 [نظام المواسم الكامل التلقائي]: بديل نظام التواريخ اليدوية (startDate/
 * endDate ثابتين لازم يتكتبوا كل سنة) - كل مناسبة دلوقتي عندها "قاعدة تكرار"
 * (recurrence) وتاريخها بيتحسب تلقائياً لأي سنة، من غير ما حد يكتب تاريخ
 * بإيده كل سنة.
 *
 * ثلاث أنواع تكرار:
 * 1. fixed-gregorian: مناسبة ميلادية ثابتة (عيد الحب 14 فبراير، رأس السنة
 *    1 يناير، عيد الأم 21 مارس في مصر) - بتتكرر بنفس اليوم/الشهر كل سنة.
 * 2. hijri: مناسبة هجرية (رأس السنة الهجرية 1 محرم، المولد النبوي 12 ربيع
 *    الأول) - بتتحول لتاريخ ميلادي عن طريق HIJRI_ANCHOR_TABLE تحت أو حساب
 *    تقريبي لو السنة مش موجودة في الجدول.
 * 3. ramadan-eid-chain: سلسلة رمضان-عيد الفطر بمنطق خاص (شغالة من قبل رمضان،
 *    تكثف قبل العيد بخمس أيام، تفضل شغالة بعد العيد بالأيام العادية).
 *
 * ⚠️ [تحذير دقة مهم جداً]: التقويم الهجري في مصر بيتحدد فعلياً برؤية الهلال
 * (دار الإفتاء) مش بحساب فلكي بحت - ده معناه أي تاريخ محسوب هنا (سواء من
 * الجدول أو من الحساب التقريبي) ممكن يختلف يوم أو يومين عن التاريخ الرسمي
 * الفعلي. الجدول تحت فيه تواريخ 2025-2027 بأفضل تقدير متاح وقت كتابة الكود
 * ده (لازم تتراجع وتتأكد من مصدر رسمي - دار الإفتاء المصرية - قبل كل موسم
 * بفترة كافية وتتعدل من لوحة التحكم لو مختلفة). أي سنة بعد 2027 بتتحسب بمعادلة
 * تقريبية (± يوم أو يومين عن الحقيقي) لحد ما الجدول يتحدّث يدوياً.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.BoseSeasonDates = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    /**
     * تواريخ ميلادية معروفة (أو بأفضل تقدير) لبداية كل مناسبة هجرية، لكل سنة
     * هجرية بيبدأ فيها. المفتاح هنا هو السنة الميلادية اللي بيبدأ فيها الحدث.
     * كل تاريخ MM-DD بالتقويم الميلادي.
     */
    var HIJRI_ANCHOR_TABLE = {
        2025: { ramadanStart: "03-01", eidalFitr: "03-30", eidAladha: "06-06", islamicNewYear: "06-26", mawlid: "09-04" },
        2026: { ramadanStart: "02-18", eidalFitr: "03-20", eidAladha: "05-27", islamicNewYear: "06-16", mawlid: "08-25" },
        2027: { ramadanStart: "02-08", eidalFitr: "03-09", eidAladha: "05-16", islamicNewYear: "06-05", mawlid: "08-14" },
    };

    // متوسط عدد أيام السنة الهجرية (بيقل عن الميلادية بحوالي 10-11 يوم)
    var HIJRI_YEAR_LENGTH_DAYS = 354.367;

    function toDate(year, mmdd) {
        var parts = mmdd.split("-");
        return new Date(year, parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
    }

    function addDays(date, days) {
        var d = new Date(date.getTime());
        d.setDate(d.getDate() + days);
        return d;
    }

    function toYMD(date) {
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    }

    /**
     * بترجع تاريخ ميلادي تقريبي لحدث هجري معين في سنة ميلادية معينة - من الجدول
     * لو موجودة، وإلا بحساب تقريبي (بالانزلاق ~10.87 يوم كل سنة عن أقرب سنة
     * معروفة في الجدول) مع علامة estimated:true للتفرقة.
     * @param {string} eventKey - ramadanStart | eidalFitr | eidAladha | islamicNewYear | mawlid
     * @param {number} year
     * @returns {{date: Date, estimated: boolean}}
     */
    function getHijriEventDate(eventKey, year) {
        if (HIJRI_ANCHOR_TABLE[year] && HIJRI_ANCHOR_TABLE[year][eventKey]) {
            return { date: toDate(year, HIJRI_ANCHOR_TABLE[year][eventKey]), estimated: false };
        }
        // مش موجودة في الجدول - بنلاقي أقرب سنة معروفة ونزلق منها بمعدل السنة الهجرية
        var knownYears = Object.keys(HIJRI_ANCHOR_TABLE).map(Number);
        var nearestYear = knownYears.reduce(function (a, b) {
            return Math.abs(b - year) < Math.abs(a - year) ? b : a;
        });
        var anchorDate = toDate(nearestYear, HIJRI_ANCHOR_TABLE[nearestYear][eventKey]);
        var yearsDiff = year - nearestYear;
        var estimatedDate = addDays(anchorDate, Math.round(yearsDiff * (HIJRI_YEAR_LENGTH_DAYS - 365.25)));
        // نظبط للسنة الميلادية المطلوبة (ممكن الانزلاق يودينا لسنة جنبها)
        estimatedDate.setFullYear(estimatedDate.getFullYear() + (year - estimatedDate.getFullYear()));
        return { date: estimatedDate, estimated: true };
    }

    /**
     * بترجع نطاق التفعيل (بداية/نهاية) لمناسبة معينة في سنة معينة، حسب نوع
     * تكرارها. النطاق ده بيتحسب "خام" من غير leadDays/trailDays - دي بتتضاف
     * في computeActiveWindow تحت.
     * @param {Object} recurrence
     * @param {number} year - السنة الميلادية اللي بنحسب المناسبة فيها
     * @returns {{start: Date, end: Date, estimated: boolean}|null}
     */
    function getOccasionCoreDates(recurrence, year) {
        if (!recurrence || !recurrence.type) return null;

        if (recurrence.type === "fixed-gregorian") {
            var d = toDate(year, String(recurrence.month).padStart(2, "0") + "-" + String(recurrence.day).padStart(2, "0"));
            return { start: d, end: d, estimated: false };
        }

        if (recurrence.type === "hijri") {
            var ev = getHijriEventDate(recurrence.event, year);
            return { start: ev.date, end: ev.date, estimated: ev.estimated };
        }

        if (recurrence.type === "ramadan-eid-chain") {
            var ramadan = getHijriEventDate("ramadanStart", year);
            var eid = getHijriEventDate("eidalFitr", year);
            return { start: ramadan.date, end: eid.date, estimated: ramadan.estimated || eid.estimated };
        }

        if (recurrence.type === "eid-aladha-window") {
            var eidAdha = getHijriEventDate("eidAladha", year);
            // فترة الأضحى بتشمل أيام التشريق (4 أيام تقريباً: يوم العيد + 3 أيام)
            return { start: eidAdha.date, end: addDays(eidAdha.date, 3), estimated: eidAdha.estimated };
        }

        return null;
    }

    /**
     * الدالة الرئيسية: بتحسب نطاق التفعيل الفعلي (بداية/نهاية كنص YYYY-MM-DD)
     * لمناسبة معينة أقرب لتاريخ اليوم - بتجرب السنة الحالية والسنة اللي قبلها
     * والسنة اللي بعدها (عشان مناسبات زي رأس السنة او رمضان اللي ممكن حدها
     * يقع قبل أو بعد حدود السنة الميلادية) وبترجع أقرب نطاق فعلي لتاريخ اليوم.
     * @param {Object} recurrence - {type, leadDays, trailDays, ...}
     * @param {Date} today
     * @returns {{startDate: string, endDate: string, intensifyDate: string|null, estimated: boolean}|null}
     */
    function computeActiveWindow(recurrence, today) {
        if (!recurrence) return null;
        var leadDays = typeof recurrence.leadDays === "number" ? recurrence.leadDays : 10;
        var trailDays = typeof recurrence.trailDays === "number" ? recurrence.trailDays : 10;
        var candidates = [];

        [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].forEach(function (year) {
            var core = getOccasionCoreDates(recurrence, year);
            if (!core) return;
            var windowStart = addDays(core.start, -leadDays);
            var windowEnd = addDays(core.end, trailDays);
            candidates.push({
                windowStart: windowStart,
                windowEnd: windowEnd,
                coreStart: core.start,
                coreEnd: core.end,
                estimated: core.estimated,
            });
        });

        // بنختار النطاق اللي تاريخ اليوم واقع جواه لو موجود، وإلا أقرب نطاق زمنياً
        var containing = candidates.find(function (c) { return today >= c.windowStart && today <= c.windowEnd; });
        var chosen = containing || candidates.reduce(function (a, b) {
            return Math.abs(b.windowStart - today) < Math.abs(a.windowStart - today) ? b : a;
        });
        if (!chosen) return null;

        var intensifyDate = null;
        if (recurrence.type === "ramadan-eid-chain" && typeof recurrence.intensifyDaysBeforeEnd === "number") {
            intensifyDate = addDays(chosen.coreEnd, -recurrence.intensifyDaysBeforeEnd);
        }

        return {
            startDate: toYMD(chosen.windowStart),
            endDate: toYMD(chosen.windowEnd),
            coreStartDate: toYMD(chosen.coreStart),
            coreEndDate: toYMD(chosen.coreEnd),
            intensifyDate: intensifyDate ? toYMD(intensifyDate) : null,
            estimated: chosen.estimated,
            isWithinWindow: !!containing,
        };
    }

    return {
        getOccasionCoreDates: getOccasionCoreDates,
        computeActiveWindow: computeActiveWindow,
        getHijriEventDate: getHijriEventDate,
        HIJRI_ANCHOR_TABLE: HIJRI_ANCHOR_TABLE,
    };
});
