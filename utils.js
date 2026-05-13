/**
 * 👑 BoseSweets Helper Engine & Sovereign Utils (V26.5 - Sovereign Monitor Edition)
 * الإدارة المرجعية: حلويات بوسي
 * يتضمن: تفويض الأحداث، المزامنة الذكية، التحليل السلوكي، وتأكيد الهوية البصرية.
 * 🛡️ التحديث الأمني: زراعة مستشعر BoseMonitor لمراقبة نزاهة العمليات العصبية للموقع.
 */

/**
 * 👑 مدير الذاكرة والعمليات المؤجلة (Memory & Lifecycle Manager)
 * تم تحصينه لضمان عدم حدوث تسريب في الذاكرة أثناء التنقل السريع.
 */
export const MemoryManager = {
    timers: {},
    set(key, callback, delay) {
        try {
            if (this.timers[key]) clearTimeout(this.timers[key]);
            this.timers[key] = setTimeout(() => {
                try {
                    callback();
                } catch (e) {
                    if(window.BoseMonitor) window.BoseMonitor.report(e, 'utils.js', null, null, `MemoryManager.exec (${key})`);
                    console.error(`BoseSweets Engine: خطأ معزول في مدير الذاكرة للعملية (${key}):`, e);
                }
                delete this.timers[key];
            }, delay);
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'MemoryManager.set');
        }
    },
    clear(key) {
        try {
            if (this.timers[key]) clearTimeout(this.timers[key]);
            delete this.timers[key];
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'MemoryManager.clear');
        }
    },
    flush() {
        try {
            for (let key in this.timers) {
                clearTimeout(this.timers[key]);
                delete this.timers[key];
            }
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'MemoryManager.flush');
        }
    }
};

/**
 * محول الألوان الحسابي لضمان دقة الهوية البصرية
 */
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
    } catch(e) { 
        if(window.BoseMonitor) window.BoseMonitor.report(e, 'utils.js', null, null, 'hexToMathHSL');
        return 340; 
    }
}

/**
 * تطهير النصوص لضمان أمن الواجهة (XSS Protection)
 */
export function escapeHTML(str) {
    try {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'escapeHTML');
        return '';
    }
}

export function generateUniqueID() { 
    try {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); 
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'generateUniqueID');
        return 'ID_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * معالج صور Cloudinary لضمان سرعة التحميل واستهلاك أقل للبيانات
 */
export function optimizeCloudinaryUrl(url) {
    try {
        if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
        if (url.includes('q_auto') || url.includes('f_auto')) return url; 
        return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'optimizeCloudinaryUrl');
        return url;
    }
}

export function generateSecureOrderId() {
    try {
        const timestamp = Date.now().toString(36).toUpperCase();
        const cryptoRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `BS-${timestamp}-${cryptoRandom}`;
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'generateSecureOrderId');
        return `BS-ERR-${Date.now()}`;
    }
}

/**
 * 👑 الإشعارات السيادية (Sovereign Toast System)
 * تم تحصينها ببروتوكول الألوان المعتمد لعلامة حلويات بوسي.
 */
export function showSystemToast(message, type = 'info') {
    try {
        const toast = document.getElementById('system-toast');
        if(!toast) return;
        const msgEl = document.getElementById('toast-message');
        const iconEl = document.getElementById('toast-icon');
        if(!msgEl || !iconEl) return;

        msgEl.innerText = message;
        
        let bgColor = 'bg-[#ffffff] text-[#ff91a4] border-2 border-[#ff91a4]';
        let iconColor = '#ff91a4';

        if(type === 'error') {
            bgColor = 'bg-[#ff91a4] text-[#ffffff] border-2 border-[#ff91a4]';
            iconColor = '#ffffff';
        } else if(type === 'success') {
            bgColor = 'bg-[#ffffff] text-[#ff91a4] border-2 border-[#ff91a4]';
            iconColor = '#ff91a4';
        }

        toast.className = `fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 px-8 py-4 rounded-[2.5rem] shadow-2xl font-bold text-sm max-w-[90vw] text-center animate-fade-in ${bgColor}`;
        iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
        iconEl.style.color = iconColor;
        
        if(window.lucide) window.lucide.createIcons();
        
        MemoryManager.set('toast_timer', () => {
            const currentToast = document.getElementById('system-toast');
            if (currentToast) {
                currentToast.classList.replace('flex', 'hidden'); 
                currentToast.classList.remove('animate-fade-in');
            }
        }, 4000);
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'showSystemToast');
        console.warn("BoseSweets: نظام الإشعارات غير متوفر حالياً.");
    }
}

/**
 * ضاغط الصور البرمجي لضمان تقليل حجم الطلبات المخصصة
 */
export async function compressImageClientSide(file) {
    return new Promise((resolve, reject) => {
        try {
            if (!file) return reject("لم يتم تقديم أي ملف للضغط.");
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    try {
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
                    } catch (canvasErr) {
                        if(window.BoseMonitor) window.BoseMonitor.report(canvasErr, 'utils.js', null, null, 'compressImage - Canvas Logic');
                        reject(canvasErr);
                    }
                };
                img.onerror = () => reject("فشل تحميل الصورة في محرك الضغط.");
            };
            reader.onerror = () => reject("فشل قراءة الملف.");
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'compressImageClientSide');
            reject(error);
        }
    });
}

/**
 * 👑 التحليل السلوكي الصامت (Behavioral Analytics)
 */
export const BehavioralAnalytics = {
    trackCategoryClick(categoryName) {
        try {
            let prefs = JSON.parse(localStorage.getItem('boseSweets_behavior')) || {};
            prefs[categoryName] = (prefs[categoryName] || 0) + 1;
            localStorage.setItem('boseSweets_behavior', JSON.stringify(prefs));
        } catch(e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'utils.js', null, null, 'Analytics.trackCategoryClick');
            console.warn("BoseSweets Analytics: تعذر تحديث السجل السلوكي.");
        }
    },
    getTopPreferences() {
        try {
            let prefs = JSON.parse(localStorage.getItem('boseSweets_behavior')) || {};
            return Object.keys(prefs).sort((a, b) => prefs[b] - prefs[a]);
        } catch(e) { 
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'utils.js', null, null, 'Analytics.getTopPreferences');
            return []; 
        }
    }
};

/**
 * 👑 محرك الشبكة المتقدم (Advanced Network Engine)
 * تم تدعيمه بالمستشعر لمراقبة نزاهة المزامنة السحابية.
 */
export const AdvancedNetworkEngine = {
    async syncWithRetry(dbStore, dataPayload, maxRetries = 5, currentRetry = 0) {
        try {
            if (!navigator.onLine) {
                this.saveToOfflineQueue(dbStore, dataPayload);
                this.scheduleRetry(dbStore, dataPayload, maxRetries, currentRetry);
                return;
            }
            const db = window.firebase ? window.firebase.firestore() : (window.db || undefined);
            if (db) {
                await db.collection(dbStore).doc(String(dataPayload.id)).set(dataPayload);
                this.removeFromOfflineQueue(dataPayload.id);
                console.log(`BoseSweets Sync 👑: المزامنة الآمنة تمت بنجاح [${dbStore}].`);
            } else {
                throw new Error("Cloud Database Engine not found.");
            }
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, `syncWithRetry: ${dbStore}`);
            this.saveToOfflineQueue(dbStore, dataPayload);
            this.scheduleRetry(dbStore, dataPayload, maxRetries, currentRetry);
        }
    },
    scheduleRetry(dbStore, dataPayload, maxRetries, currentRetry) {
        try {
            if (currentRetry >= maxRetries) {
                if(window.BoseMonitor) window.BoseMonitor.report("Exhausted sync retries", 'utils.js', null, null, `scheduleRetry: ${dbStore}`);
                return;
            }
            const delay = Math.pow(2, currentRetry) * 1000; 
            setTimeout(() => {
                this.syncWithRetry(dbStore, dataPayload, maxRetries, currentRetry + 1);
            }, delay);
        } catch (error) {
            if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'scheduleRetry');
        }
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
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'utils.js', null, null, 'saveToOfflineQueue');
        }
    },
    removeFromOfflineQueue(id) {
        try {
            let queue = JSON.parse(localStorage.getItem('boseSweets_offline_queue')) || [];
            queue = queue.filter(item => item.payload.id !== id);
            localStorage.setItem('boseSweets_offline_queue', JSON.stringify(queue));
        } catch(e) {
            if(window.BoseMonitor) window.BoseMonitor.report(e, 'utils.js', null, null, 'removeFromOfflineQueue');
        }
    }
};

/**
 * 👑 بروتوكولات الأمان الشاملة (Global Security Listeners)
 */
if (typeof window !== 'undefined') {
    try {
        window.addEventListener('error', function(e) {
            const isAdmin = window.location.pathname.includes('admin') || document.title.includes('الإدارة');
            if(window.BoseMonitor) window.BoseMonitor.report(e.error || e.message, 'Global/window', e.lineno, e.colno, 'Runtime Error');
            if (isAdmin && typeof showSystemToast === 'function') {
                showSystemToast(`تنبيه تقني سيادي: تم رصد تعارض في السطر ${e.lineno}`, 'error');
            }
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            const isAdmin = window.location.pathname.includes('admin') || document.title.includes('الإدارة');
            if(window.BoseMonitor) window.BoseMonitor.report(e.reason, 'Global/window', null, null, 'Unhandled Promise Rejection');
            if (isAdmin && typeof showSystemToast === 'function') {
                showSystemToast(`تنبيه للإدارة: فشل مؤقت في مزامنة البيانات السحابية.`, 'error');
            }
        });

        // 🛡️ التوافقية المطلقة والربط بجذر المتصفح
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
        
        console.log("👑 BoseSweets Engine: Sovereign Utils finalized and monitored.");
    } catch (error) {
        if(window.BoseMonitor) window.BoseMonitor.report(error, 'utils.js', null, null, 'Final Global Bindings');
    }
}