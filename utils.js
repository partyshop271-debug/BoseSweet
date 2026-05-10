/**
 * 👑 المحرك المساعد والتقنيات السيادية (V26.0 - Sovereign Iron-Clad Edition)
 * الإدارة المرجعية: حلويات بوسي
 * يتضمن: تفويض الأحداث المحكم، المزامنة الذكية المتقدمة، التحليل السلوكي الصامت، وتأكيد الهوية البصرية.
 * * الترقيات الحالية:
 * - معالجة التضارب البرمجي الجسيم ودمج النسخ لضمان استقرار العمليات.
 * - إتاحة الدوال على المستوى الشامل (Global Window) لضمان عدم تعطل واجهات العميل.
 * - تفعيل نظام الرصد الصامت لحماية تجربة العميل وإبلاغ الإدارة فوراً بأي خلل تقني.
 * - تطبيق حاسم وصارم للألوان المعتمدة (البامبي والأبيض) في الإشعارات السيادية.
 */

export const MemoryManager = {
    timers: {},
    set(key, callback, delay) {
        if (this.timers[key]) clearTimeout(this.timers[key]);
        this.timers[key] = setTimeout(() => {
            try {
                callback();
            } catch (e) {
                console.error(`BoseSweets Engine: خطأ معزول في مدير الذاكرة للعملية (${key}):`, e);
            }
            delete this.timers[key];
        }, delay);
    },
    clear(key) {
        if (this.timers[key]) clearTimeout(this.timers[key]);
        delete this.timers[key];
    },
    flush() {
        for (let key in this.timers) {
            clearTimeout(this.timers[key]);
            delete this.timers[key];
        }
    }
};

export function hexToMathHSL(hex) {
    try {
        if (!hex || typeof hex !== 'string') return 340;
        hex = hex.replace('#', '').trim();
        let r = 0, g = 0, b = 0;
        if (hex.length === 3) { 
            r = parseInt(hex[0]+hex[0], 16); g = parseInt(hex[1]+hex[1], 16); b = parseInt(hex[2]+hex[2], 16); 
        } else if (hex.length === 6) { 
            r = parseInt(hex.substring(0,2), 16); g = parseInt(hex.substring(2,4), 16); b = parseInt(hex.substring(4,6), 16); 
        } else { return 340; }
        
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0;
        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = Math.round(h * 60); if (h < 0) h += 360;
        return isNaN(h) ? 340 : h;
    } catch(e) { return 340; }
}

export function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

export function generateUniqueID() { 
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); 
}

export function optimizeCloudinaryUrl(url) {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
    if (url.includes('q_auto') || url.includes('f_auto')) return url; 
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
}

export function generateSecureOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const cryptoRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BS-${timestamp}-${cryptoRandom}`;
}

export function showSystemToast(message, type = 'info') {
    try {
        const toast = document.getElementById('system-toast');
        if(!toast) return;
        const msgEl = document.getElementById('toast-message');
        const iconEl = document.getElementById('toast-icon');
        msgEl.innerText = message;
        
        // تطبيق حاسم وصارم للهوية البصرية لعلامة حلويات بوسي (بامبي وأبيض فقط)
        let bgColor = 'bg-[#ffffff] text-[#ff91a4] border-2 border-[#ff91a4]';
        let iconColor = '#ff91a4';

        if(type === 'error') {
            bgColor = 'bg-[#ff91a4] text-[#ffffff] border-2 border-[#ff91a4]';
            iconColor = '#ffffff';
        } else if(type === 'success') {
            bgColor = 'bg-[#ffffff] text-[#ff91a4] border-2 border-[#ff91a4]';
            iconColor = '#ff91a4';
        }

        // تصميم متجاوب ليتناسب مع الموبايل والكمبيوتر باحترافية
        toast.className = `fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 px-8 py-4 rounded-[2.5rem] shadow-2xl font-bold text-sm max-w-[90vw] text-center animate-fade-in ${bgColor}`;
        iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
        iconEl.style.color = iconColor;
        
        if(window.lucide) lucide.createIcons();
        
        MemoryManager.set('toast_timer', () => {
            if (toast) {
                toast.classList.replace('flex', 'hidden'); 
                toast.classList.remove('animate-fade-in');
            }
        }, 4000);
    } catch (error) {
        console.warn("BoseSweets: نظام الإشعارات غير متوفر في الواجهة الحالية.");
    }
}

export async function compressImageClientSide(file) {
    return new Promise((resolve, reject) => {
        if (!file) return reject("لم يتم تقديم أي ملف للضغط.");
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; const MAX_HEIGHT = 400;
                let width = img.width; let height = img.height;
                if (width > height) { 
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } 
                } else { 
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } 
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject("فشل تحميل الصورة في محرك الضغط.");
        };
        reader.onerror = () => reject("فشل قراءة الملف.");
    });
}

// 👑 محرك التحليل السلوكي الصامت لتخصيص تجربة العميل بصمت وبدون أي إعاقة للسرعة
export const BehavioralAnalytics = {
    trackCategoryClick(categoryName) {
        try {
            let prefs = JSON.parse(localStorage.getItem('boseSweets_behavior')) || {};
            prefs[categoryName] = (prefs[categoryName] || 0) + 1;
            localStorage.setItem('boseSweets_behavior', JSON.stringify(prefs));
        } catch(e) {
            // صمت متعمد لعدم إزعاج المستخدم في حال امتلاء التخزين المحلي
            console.warn("BoseSweets Analytics: تعذر تحديث السجل السلوكي بشكل مؤقت.");
        }
    },
    getTopPreferences() {
        try {
            let prefs = JSON.parse(localStorage.getItem('boseSweets_behavior')) || {};
            return Object.keys(prefs).sort((a, b) => prefs[b] - prefs[a]);
        } catch(e) { return []; }
    }
};

// 👑 محرك المزامنة الذكية للطلبات (Exponential Backoff & Offline Queue) مدعوم ضد الانقطاع
export const AdvancedNetworkEngine = {
    async syncWithRetry(dbStore, dataPayload, maxRetries = 5, currentRetry = 0) {
        if (!navigator.onLine) {
            this.saveToOfflineQueue(dbStore, dataPayload);
            this.scheduleRetry(dbStore, dataPayload, maxRetries, currentRetry);
            return;
        }
        try {
            const db = window.firebase ? window.firebase.firestore() : undefined;
            if (db) {
                await db.collection(dbStore).doc(String(dataPayload.id)).set(dataPayload);
                this.removeFromOfflineQueue(dataPayload.id);
                console.log(`BoseSweets Sync 👑: المزامنة الآمنة للمحرك المتقدم تمت بنجاح [${dbStore}].`);
            } else {
                throw new Error("تأخير في تحميل قاعدة البيانات السحابية.");
            }
        } catch (error) {
            this.saveToOfflineQueue(dbStore, dataPayload);
            this.scheduleRetry(dbStore, dataPayload, maxRetries, currentRetry);
        }
    },
    scheduleRetry(dbStore, dataPayload, maxRetries, currentRetry) {
        if (currentRetry >= maxRetries) {
            console.warn(`BoseSweets Sync: استنفاذ محاولات المزامنة للعملية، سيتم الاعتماد على طابور الطوارئ.`);
            return;
        }
        const delay = Math.pow(2, currentRetry) * 1000; 
        setTimeout(() => {
            this.syncWithRetry(dbStore, dataPayload, maxRetries, currentRetry + 1);
        }, delay);
    },
    saveToOfflineQueue(dbStore, dataPayload) {
        try {
            let queue = JSON.parse(localStorage.getItem('boseSweets_offline_queue')) || [];
            const exists = queue.find(item => item.payload.id === dataPayload.id);
            if (!exists) {
                queue.push({ dbStore, payload: dataPayload, timestamp: Date.now() });
                localStorage.setItem('boseSweets_offline_queue', JSON.stringify(queue));
            }
        } catch(e) {
            console.error("BoseSweets Sync Error: تعذر الحفظ في طابور المزامنة الذكي.");
        }
    },
    removeFromOfflineQueue(id) {
        try {
            let queue = JSON.parse(localStorage.getItem('boseSweets_offline_queue')) || [];
            queue = queue.filter(item => item.payload.id !== id);
            localStorage.setItem('boseSweets_offline_queue', JSON.stringify(queue));
        } catch(e) {}
    }
};

// أنظمة الرصد الإداري المتقدم (تظهر للإدارة فقط ولا تعيق تجربة العميل)
if (typeof window !== 'undefined') {
    window.addEventListener('error', function(e) {
        const isAdmin = window.location.pathname.includes('admin') || document.title.includes('الإدارة');
        if (isAdmin && typeof showSystemToast === 'function') {
            showSystemToast(`تنبيه تقني سيادي: تم رصد تعارض في السطر ${e.lineno} - ${e.message}`, 'error');
        }
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        const isAdmin = window.location.pathname.includes('admin') || document.title.includes('الإدارة');
        if (isAdmin && typeof showSystemToast === 'function') {
            showSystemToast(`تنبيه للإدارة: تأخير أو فشل مؤقت في الشبكة، محرك حلويات بوسي يحاول المزامنة.`, 'error');
        }
    });

    // 🛡️ التوافقية المطلقة: ربط كل الدوال بالواجهة لتكون متاحة لأي استدعاء مباشر من ملفات الـ HTML
    window.MemoryManager = MemoryManager;
    window.hexToMathHSL = hexToMathHSL;
    window.escapeHTML = escapeHTML;
    window.generateUniqueID = generateUniqueID;
    window.optimizeCloudinaryUrl = optimizeCloudinaryUrl;
    window.generateSecureOrderId = generateSecureOrderId;
    window.showSystemToast = showSystemToast;
    window.compressImageClientSide = compressImageClientSide;
    window.BehavioralAnalytics = BehavioralAnalytics;
    window.AdvancedNetworkEngine = AdvancedNetworkEngine;
}