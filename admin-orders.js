/**
 * ============================================================================
 * محرك إدارة العمليات والطلبات | BoseSweets Orders Engine V20.0 Sovereign Edition
 * ============================================================================
 * 👑 التحديث السيادي للسيطرة على تدفق البيانات: 
 * تم تطوير هذا المحرك لضمان الرصد اللحظي للطلبات، معالجة الحسابات المالية بدقة تامة، 
 * وتأمين التواصل المهني مع عملاء حلويات بوسي عبر القنوات المعتمدة.
 * تم دمج أنظمة العرض (المكتبي والهاتفي) في نواة واحدة لضمان التوافق المطلق.
 */

// تهيئة متغيرات الفلترة العالمية لضمان النطاق الشامل
window.adminOrderFilter = 'all';

/**
 * 🛠️ رندر أزرار الفلترة للطلبات (Admin Order Filters)
 */
window.renderAdminOrderFilters = function() {
    const filtersEl = document.getElementById('admin-order-filters');
    if(!filtersEl) return;
    
    const filters = [ 
        { id: 'all', label: 'الكل' }, 
        { id: 'pending', label: '🟡 مراجعة' }, 
        { id: 'processing', label: '🟠 تجهيز' }, 
        { id: 'completed', label: '🟢 مكتمل' }, 
        { id: 'cancelled', label: '🔴 ملغي' } 
    ];
    
    filtersEl.innerHTML = filters.map(f => `
        <button onclick="window.setAdminOrderFilter('${f.id}')" 
            class="whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm border relative z-20 pointer-events-auto 
            ${window.adminOrderFilter === f.id ? 'bg-[#ff91a4] text-white border-[#ff91a4] scale-105 shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700'}">
            ${f.label}
        </button>
    `).join('');
};

/**
 * 🎯 تعيين الفلتر النشط وتحديث العرض بقرار مهني
 */
window.setAdminOrderFilter = function(f) { 
    window.adminOrderFilter = f; 
    window.renderAdminOrderFilters(); 
    window.renderAdminOrders(); 
};

window.filterOrdersByDate = function() { 
    window.renderAdminOrders(); 
};

window.refreshOrders = function() { 
    if(typeof window.showSystemToast === 'function') {
        window.showSystemToast('جاري فحص السحابة لجلب أحدث التحركات الميدانية لطلبات حلويات بوسي... 🔄', 'info'); 
    }
    window.renderAdminOrders(); 
};

/**
 * 📊 المحرك السيادي الرئيسي لرندر الطلبات (يدعم جميع شاشات العرض بدون المساس بالهيكل)
 */
window.renderAdminOrders = function() {
    const tbody = document.getElementById('admin-orders-tbody');
    const mobileContainer = document.getElementById('mobile-orders-container');
    const listContainer = document.getElementById('admin-orders-list'); // دعم حاوية الكروت المطورة
    
    // التحقق من وجود أي واجهة عرض لتغذيتها بالبيانات
    if(!tbody && !mobileContainer && !listContainer) return;
    
    const emptyMessageHTML = `<div class="p-12 text-center text-slate-500 font-bold bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">لا توجد طلبات مسجلة حالياً في مركز قيادة حلويات بوسي.</div>`;
    
    if(!window.globalOrders || !Array.isArray(window.globalOrders) || window.globalOrders.length === 0) {
        if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-500 font-bold bg-slate-900/50 border border-dashed border-slate-700">لا توجد طلبات مسجلة حالياً في مركز قيادة حلويات بوسي.</td></tr>`; 
        if(mobileContainer) mobileContainer.innerHTML = emptyMessageHTML;
        if(listContainer) listContainer.innerHTML = emptyMessageHTML;
        return; 
    }
    
    // الترتيب الزمني الدقيق (الأحدث أولاً)
    let list = [...window.globalOrders].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // الفرز حسب الحالة
    if (window.adminOrderFilter !== 'all') {
        list = list.filter(o => (o.status || 'pending') === window.adminOrderFilter);
    }
    
    // الفرز حسب التاريخ الدقيق
    const dateFilterEl = document.getElementById('order-filter-date');
    if(dateFilterEl && dateFilterEl.value) {
        list = list.filter(o => o.date && o.date.includes(dateFilterEl.value));
    }

    // تحديث شارة التنبيهات السيادية
    const pendingCount = window.globalOrders.filter(o => (o.status || 'pending') === 'pending').length;
    const navBadge = document.getElementById('nav-order-badge');
    if(navBadge) { 
        if(pendingCount > 0) {
            navBadge.classList.remove('hidden');
            navBadge.innerText = pendingCount > 9 ? '+9' : pendingCount;
        } else {
            navBadge.classList.add('hidden');
        }
    }

    // حالة عدم وجود نتائج مطابقة للبحث
    if(list.length === 0) { 
        const noMatchHTML = `<div class="text-center text-slate-500 py-8 text-xs font-bold border border-dashed border-slate-700 rounded-2xl">لا توجد طلبات مطابقة للقرار البحثي الحالي.</div>`;
        if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-500 font-bold">لا توجد نتائج مطابقة للبحث.</td></tr>`; 
        if(mobileContainer) mobileContainer.innerHTML = noMatchHTML;
        if(listContainer) listContainer.innerHTML = noMatchHTML;
        return; 
    }
    
    // تأمين دالة الهروب لتفادي الأخطاء
    const safeEscapeHTML = (str) => typeof window.escapeHTML === 'function' ? window.escapeHTML(str) : String(str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

    // 1. تغذية العرض المكتبي (Desktop Table)
    if(tbody) {
        tbody.innerHTML = list.map(o => {
            const s = o.status || 'pending'; 
            let statusBadge = getStatusBadgeHTML(s);
            
            return `
            <tr class="hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer group" onclick="window.openOrderDetails('${o.id || o.orderId}')">
                <td class="p-4 font-mono text-[#ff91a4] whitespace-nowrap font-bold text-[11px]">#${safeEscapeHTML((o.id || o.orderId || '').substring(0,8))}</td>
                <td class="p-4 text-[11px] text-slate-400 whitespace-nowrap" dir="ltr">${safeEscapeHTML(o.date || '---')}</td>
                <td class="p-4 min-w-[150px]">
                    <p class="font-bold text-slate-200 text-xs">${safeEscapeHTML(o.name || o.customerName || 'عميل محترم')}</p>
                    <p class="text-[10px] text-slate-500 mt-1 font-mono">${safeEscapeHTML(o.phone || o.customerPhone || '')}</p>
                </td>
                <td class="p-4 font-black text-emerald-400 whitespace-nowrap text-xs">${Number(o.total || 0).toLocaleString()} ج</td>
                <td class="p-4 whitespace-nowrap">${statusBadge}</td>
                <td class="p-4 text-center whitespace-nowrap">
                    <button class="text-slate-400 group-hover:text-[#ff91a4] p-2 bg-slate-900 group-hover:bg-[#ff91a4]/10 rounded-lg transition-all border border-slate-700 group-hover:border-[#ff91a4]/30 shadow-sm">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }

    // 2. تغذية العرض الهاتفي القياسي (Mobile Cards Old Format)
    if(mobileContainer) {
        mobileContainer.innerHTML = list.map(o => {
            const s = o.status || 'pending';
            const statusConfig = getStatusConfig(s);
            
            return `
            <div onclick="window.openOrderDetails('${o.id || o.orderId}')" class="bg-[#101726] border border-slate-800 rounded-[1.5rem] p-5 flex flex-col gap-4 active:scale-95 transition-all cursor-pointer shadow-md">
                <div class="flex justify-between items-center border-b border-slate-800/50 pb-3">
                    <span class="text-[10px] font-mono text-[#ff91a4] font-black">#${(o.id || o.orderId || '').substring(0, 8)}</span>
                    <span class="text-[9px] font-black px-2.5 py-1 rounded-lg border ${statusConfig.class}">${statusConfig.label}</span>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex flex-col gap-0.5">
                        <span class="text-xs font-black text-white truncate max-w-[150px]">${safeEscapeHTML(o.name || o.customerName || 'عميل محترم')}</span>
                        <span class="text-[10px] text-slate-500 font-mono">${o.phone || o.customerPhone || ''}</span>
                    </div>
                    <span class="text-sm font-black text-[#ff91a4]">${Number(o.total || 0).toLocaleString()} ج.م</span>
                </div>
                <div class="text-[10px] text-slate-400 flex justify-between pt-2">
                    <span class="flex items-center gap-1.5"><i data-lucide="map-pin" class="w-3 h-3 text-emerald-500"></i> ${safeEscapeHTML(o.area || 'غير محدد')}</span>
                    <span class="flex items-center gap-1.5"><i data-lucide="calendar" class="w-3 h-3 text-indigo-400"></i> ${(o.date || '').split(',')[0]}</span>
                </div>
            </div>`;
        }).join('');
    }

    // 3. تغذية العرض الهاتفي المطور (Boosy Cards)
    if(listContainer) {
        listContainer.innerHTML = list.map(o => {
            let dateStr = o.date;
            if (o.timestamp) {
                dateStr = new Date(o.timestamp).toLocaleString('ar-EG', {hour:'2-digit', minute:'2-digit', day:'numeric', month:'short'});
            }
            const statusCfg = getStatusConfig(o.status || 'pending');
            
            return `
            <div class="boosy-card mb-4 border-r-4 bg-[#101726] p-4 rounded-xl shadow-sm ${o.status === 'pending' ? 'border-yellow-400' : 'border-slate-700'}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="text-[10px] text-[#ff91a4] font-black mb-1 uppercase tracking-tighter font-mono"># ${(o.id || o.orderId || '').substring(0, 8)}</div>
                        <h3 class="font-bold text-[#f8fafc] text-sm">${safeEscapeHTML(o.name || o.customerName || 'عميل محترم')}</h3>
                        <div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${dateStr}</div>
                    </div>
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black border ${statusCfg.class}">${statusCfg.label}</span>
                </div>
                
                <div class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/50">
                    <button onclick="window.openOrderDetails('${o.id || o.orderId}')" class="flex-1 bg-slate-800 text-white text-[10px] font-bold py-2.5 rounded-xl border border-slate-700 hover:bg-slate-700 hover:border-[#ff91a4]/50 transition-colors">مراجعة القرار</button>
                    ${(o.phone || o.customerPhone) ? `
                    <a href="https://wa.me/${(o.phone || o.customerPhone).replace(/\D/g, '')}" target="_blank" class="w-10 h-10 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                        <i data-lucide="phone" class="w-4 h-4"></i>
                    </a>` : ''}
                </div>
            </div>`;
        }).join('');
    }

    if(window.lucide) lucide.createIcons();
};

/**
 * 🔍 المراجعة الشاملة لتفاصيل الطلب (Order Details & Financial Audit)
 */
window.openOrderDetails = function(orderId) {
    const order = window.globalOrders.find(o => String(o.id || o.orderId) === String(orderId));
    if(!order) return;

    window.currentEditOrderId = orderId;
    const safeEscapeHTML = (str) => typeof window.escapeHTML === 'function' ? window.escapeHTML(str) : String(str || '');

    // تعبئة البيانات الأساسية في واجهة القرار
    if(document.getElementById('modal-order-id')) document.getElementById('modal-order-id').innerText = (order.id || order.orderId || '');
    if(document.getElementById('modal-order-date')) document.getElementById('modal-order-date').innerText = order.date || '---';
    if(document.getElementById('modal-order-name')) document.getElementById('modal-order-name').innerText = order.name || order.customerName || '---';
    
    // تأمين بيانات التواصل
    const phoneEl = document.getElementById('modal-order-phone');
    if(phoneEl) {
        phoneEl.innerText = order.phone || order.customerPhone || '---';
        if(order.phone || order.customerPhone) phoneEl.href = `tel:${order.phone || order.customerPhone}`;
    }
    
    // التوجيه المهني لواتساب (WhatsApp Routing)
    const waBtn = document.getElementById('modal-order-whatsapp');
    if(waBtn && (order.phone || order.customerPhone)) {
        let phoneStr = String(order.phone || order.customerPhone).replace(/\D/g,''); 
        // ضمان إضافة كود الدولة المصري باحترافية
        if(phoneStr.startsWith('01')) phoneStr = '2' + phoneStr; 
        waBtn.href = `https://wa.me/${phoneStr}?text=${encodeURIComponent(`تحية طيبة من إدارة حلويات بوسي 👑 بخصوص طلبكم الموقر رقم: ${(order.id || order.orderId || '').substring(0,8)}`)}`;
    }

    if(document.getElementById('modal-order-area')) document.getElementById('modal-order-area').innerText = order.area || 'غير محدد';
    if(document.getElementById('modal-order-address')) document.getElementById('modal-order-address').innerText = order.address || 'لا يوجد تفاصيل للعنوان';
    
    // معالجة الملاحظات المرفقة
    const notesEl = document.getElementById('modal-order-notes');
    if(notesEl) { 
        if(order.notes) { 
            notesEl.classList.remove('hidden'); 
            notesEl.innerText = `ملاحظات العميل: ${order.notes}`; 
        } else { 
            notesEl.classList.add('hidden'); 
        } 
    }

    // التدقيق المالي ومراجعة أصناف الطلب
    const itemsContainer = document.getElementById('modal-order-items');
    let calculatedSubtotal = 0;

    if(itemsContainer) {
        if (Array.isArray(order.itemsArray) && order.itemsArray.length > 0) {
            itemsContainer.innerHTML = order.itemsArray.map(item => {
                const itemQty = Number(item.qty || item.quantity || 1);
                const itemPrice = Number(item.price || 0);
                const itemTotal = itemPrice * itemQty;
                calculatedSubtotal += itemTotal;

                return `
                <div class="flex justify-between items-center bg-[#03050a] p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div class="flex items-center gap-3">
                        <span class="w-7 h-7 flex items-center justify-center bg-slate-900 text-[#ff91a4] font-black rounded-lg text-[11px] border border-slate-800">${itemQty}x</span>
                        <div>
                            <p class="text-xs font-black text-white">${safeEscapeHTML(item.name || 'صنف غير محدد')}</p>
                            ${item.isCustom ? '<span class="text-[9px] bg-[#ff91a4]/10 text-[#ff91a4] px-1.5 py-0.5 rounded mt-1 inline-block font-bold">مخصص 👑</span>' : ''}
                            ${(item.desc || item.notes) ? `<p class="text-[9px] text-amber-400 mt-1 leading-relaxed">${safeEscapeHTML(item.desc || item.notes)}</p>` : ''}
                        </div>
                    </div>
                    <div class="text-left">
                        <p class="text-[11px] font-mono text-emerald-400 font-bold">${itemTotal.toLocaleString()} ج</p>
                    </div>
                </div>
            `}).join('');
        } else if(typeof order.items === 'string') { 
            itemsContainer.innerHTML = `<div class="p-4 bg-slate-900/50 rounded-xl text-xs text-slate-300 leading-relaxed border border-slate-800">${safeEscapeHTML(order.items).replace(/\n/g, '<br>')}</div>`; 
            // تعذر التدقيق المالي الآلي بسبب نظام النصوص القديم
            calculatedSubtotal = Number((order.total || 0) - (order.shippingFee || 0));
        } else { 
            itemsContainer.innerHTML = `<div class="p-4 bg-slate-900/50 rounded-xl text-xs text-slate-500 italic text-center border border-slate-800">التفاصيل الفنية غير متوفرة حالياً</div>`; 
            calculatedSubtotal = Number((order.total || 0) - (order.shippingFee || 0));
        }
    }

    // اعتماد الأرقام المالية السيادية (الاعتماد على التدقيق المالي أولاً إن أمكن)
    const finalShipping = Number(order.shippingFee || 0);
    const finalTotal = calculatedSubtotal + finalShipping;

    if(document.getElementById('modal-order-subtotal')) document.getElementById('modal-order-subtotal').innerText = calculatedSubtotal.toLocaleString() + ' ج.م';
    if(document.getElementById('modal-order-shipping')) document.getElementById('modal-order-shipping').innerText = finalShipping.toLocaleString() + ' ج.م';
    if(document.getElementById('modal-order-total')) document.getElementById('modal-order-total').innerText = finalTotal.toLocaleString() + ' ج.م';

    // ضبط حالة القرار الحالية
    const statusSelect = document.getElementById('modal-order-status');
    if(statusSelect) { 
        statusSelect.value = order.status || 'pending'; 
        statusSelect.setAttribute('data-current-id', String(order.id || order.orderId)); 
    }

    // تفعيل نافذة العرض
    const modal = document.getElementById('admin-order-modal');
    if(modal) { 
        modal.classList.remove('hidden'); 
        setTimeout(() => modal.classList.add('opacity-100'), 10); 
    }
    if(window.lucide) lucide.createIcons();
};

window.closeOrderModal = function() {
    const modal = document.getElementById('admin-order-modal');
    if(modal) { 
        modal.classList.remove('opacity-100'); 
        setTimeout(() => modal.classList.add('hidden'), 400); 
    }
};

/**
 * ⚖️ اعتماد القرار المهني بتحديث حالة الطلب (Execute Status Decision)
 */
window.updateOrderStatus = async function() {
    const selectEl = document.getElementById('modal-order-status');
    if(!selectEl) return;
    
    const id = selectEl.getAttribute('data-current-id') || window.currentEditOrderId; 
    const newStatus = selectEl.value;
    const orderIdx = window.globalOrders.findIndex(o => String(o.id || o.orderId) === String(id));
    
    if (orderIdx > -1) {
        const orderData = window.globalOrders[orderIdx];
        const oldStatus = orderData.status;
        
        // التحديث الفوري في الذاكرة لضمان سرعة استجابة الإدارة
        orderData.status = newStatus;
        if(typeof window.saveEngineMemory === 'function') window.saveEngineMemory('ord');
        
        try {
            // التزامن مع قاعدة البيانات السيادية
            if(typeof window.db !== 'undefined' && window.db && typeof window.db.collection === 'function') {
                await window.db.collection('orders').doc(String(id)).set({ status: newStatus }, { merge: true });
            } else if (typeof window.NetworkEngine !== 'undefined') {
                await window.NetworkEngine.safeWrite('orders', String(id), { status: newStatus });
            }
            
            if(typeof window.showSystemToast === 'function') {
                window.showSystemToast(`تم اعتماد القرار المهني بتحديث الحالة إلى "${getLabelForStatus(newStatus)}" 👑 لطلب حلويات بوسي.`, 'success');
            }

            // إطلاق بروتوكول الإشعارات الخارجي (Webhook) بقرار إداري
            if (oldStatus !== newStatus && (newStatus === 'processing' || newStatus === 'completed')) {
                window.triggerMakeWebhook(orderData, newStatus);
            }

            // تحديث لوحات القيادة
            if(typeof window.renderAdminOverview === 'function') window.renderAdminOverview(); 
            window.renderAdminOrders(); 
            window.closeOrderModal();
            if(typeof window.updateAdminDashboardStatsUI === 'function') window.updateAdminDashboardStatsUI();

        } catch (e) { 
            console.error("Firebase Sync Error:", e);
            if(typeof window.showSystemToast === 'function') {
                window.showSystemToast('تم تسجيل القرار في الذاكرة المحلية مؤقتاً لحين استقرار خطوط الاتصال.', 'info'); 
            }
            window.closeOrderModal();
        }
    }
};

/**
 * 📡 إرسال بروتوكولات الإشعارات المؤمنة (Webhook Trigger)
 */
window.triggerMakeWebhook = async function(orderData, status) {
    try {
        if (typeof window.auth === 'undefined' || !window.auth.currentUser) return;
        
        const idToken = await window.auth.currentUser.getIdToken();
        const secureEndpoint = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureWebhookTrigger';

        await fetch(secureEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({
                orderId: orderData.id || orderData.orderId,
                customerName: orderData.name || orderData.customerName,
                customerPhone: orderData.phone || orderData.customerPhone,
                status: status,
                total: orderData.total,
                brand: "حلويات بوسي" // 👑 تأكيد الهوية التجارية
            })
        });
    } catch(e) {
        // يتم الاحتفاظ بالهدوء الإداري، كتم الأخطاء الفرعية لضمان استمرارية تجربة الاستخدام
        console.warn("Webhook communication bypassed silently.");
    }
};

/**
 * 🖨️ إصدار الوثيقة الورقية (Invoice Printing)
 */
window.printOrderInvoice = function() { 
    window.print(); 
};

// ==========================================
// ⚙️ الأدوات الداخلية لمعالجة البيانات (Internal Core Tools)
// ==========================================

function getStatusConfig(status) {
    const configs = {
        'pending': { label: 'مراجعة', class: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
        'processing': { label: 'تجهيز', class: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
        'completed': { label: 'مكتمل', class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        'cancelled': { label: 'ملغي', class: 'text-red-400 bg-red-500/10 border-red-500/20' }
    };
    return configs[status] || configs['pending'];
}

function getStatusBadgeHTML(status) {
    const config = getStatusConfig(status);
    return `<span class="px-2.5 py-1.5 rounded-lg border text-[10px] font-black shadow-sm ${config.class}">${config.label}</span>`;
}

function getLabelForStatus(status) {
    const labels = { 'pending': 'مراجعة', 'processing': 'تجهيز', 'completed': 'مكتمل', 'cancelled': 'ملغي' };
    return labels[status] || 'مراجعة';
}