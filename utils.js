export const MemoryManager = {
    timers: {},
    set(key, callback, delay) {
        if (this.timers[key]) clearTimeout(this.timers[key]);
        this.timers[key] = setTimeout(() => {
            callback();
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

export function generateUniqueID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

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
    const toast = document.getElementById('system-toast');
    if(!toast) return;
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    msgEl.innerText = message;
    
    let bgColor = 'bg-slate-900';
    if(type === 'error') bgColor = 'bg-[#ff3377]';
    if(type === 'success') bgColor = 'bg-emerald-600';

    toast.className = `fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl font-bold text-sm max-w-[90vw] text-center border border-transparent animate-fade-in ${bgColor}`;
    iconEl.setAttribute('data-lucide', type === 'error' ? 'alert-triangle' : (type === 'success' ? 'check-circle' : 'info'));
    iconEl.style.color = '#ffffff';
    
    if(window.lucide) lucide.createIcons();
    
    MemoryManager.set('toast_timer', () => {
        toast.classList.replace('flex', 'hidden'); 
        toast.classList.remove('animate-fade-in');
    }, 4000);
}
// محرك ضغط الصور الصديق للبيانات (Client-Side)
export async function compressImageClientSide(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; const MAX_HEIGHT = 400;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6)); // ضغط قوي لعدم استنزاف المساحة
            };
        };
    });
}

// محرك رصد الأخطاء الصامت (مخصص للإدارة فقط)
window.addEventListener('error', function(e) {
    const isAdmin = window.location.pathname.includes('admin') || document.title.includes('الإدارة');
    if (isAdmin && typeof showSystemToast === 'function') {
        showSystemToast(`تنبيه للإدارة: عطل برمجي في السطر ${e.lineno} - ${e.message}`, 'error');
    }
});
window.addEventListener('unhandledrejection', function(e) {
    const isAdmin = window.location.pathname.includes('admin') || document.title.includes('الإدارة');
    if (isAdmin && typeof showSystemToast === 'function') {
        showSystemToast(`تنبيه للإدارة: فشل في الاتصال بالشبكة أو قاعدة البيانات.`, 'error');
    }
});
