function renderAdminOrderFilters() {
    const filtersEl = document.getElementById('admin-order-filters');
    if(!filtersEl) return;
    const filters = [ { id: 'all', label: 'الكل' }, { id: 'pending', label: '🟡 مراجعة' }, { id: 'processing', label: '🟠 تجهيز' }, { id: 'completed', label: '🟢 مكتمل' }, { id: 'cancelled', label: '🔴 ملغي' } ];
    filtersEl.innerHTML = filters.map(f => `
        <button onclick="setAdminOrderFilter('${f.id}')" class="whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm border ${adminOrderFilter === f.id ? 'bg-[#ff3377] text-white border-pink-400 scale-105' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700'}">${f.label}</button>
    `).join('');
}

function setAdminOrderFilter(f) { adminOrderFilter = f; renderAdminOrderFilters(); renderAdminOrders(); }
function filterOrdersByDate() { renderAdminOrders(); }
function refreshOrders() { showSystemToast('الرصد الحي يعمل بكفاءة. القائمة محدثة...', 'info'); renderAdminOrders(); }

function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    const mobileContainer = document.getElementById('mobile-orders-container');
    
    if(!tbody && !mobileContainer) return;
    
    if(!globalOrders || globalOrders.length === 0) {
        if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-500 font-bold bg-slate-900/50">لا توجد طلبات مسجلة حالياً في مركز القيادة.</td></tr>`; 
        if(mobileContainer) mobileContainer.innerHTML = `<div class="text-center text-slate-500 py-8 text-xs font-bold border border-dashed border-slate-700 rounded-2xl">لا توجد طلبات لعرضها حالياً</div>`;
        return; 
    }
    
    let list = [...globalOrders].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (adminOrderFilter !== 'all') list = list.filter(o => (o.status || 'pending') === adminOrderFilter);
    
    const dateFilter = document.getElementById('order-filter-date')?.value;
    if(dateFilter) {
        const filterDate = new Date(dateFilter); const startOfFilter = filterDate.setHours(0,0,0,0); const endOfFilter = filterDate.setHours(23,59,59,999);
        list = list.filter(o => o.timestamp >= startOfFilter && o.timestamp <= endOfFilter);
    }

    const pendingCount = globalOrders.filter(o => o.status === 'pending').length;
    const navBadge = document.getElementById('nav-order-badge');
    if(navBadge) { if(pendingCount > 0) navBadge.classList.remove('hidden'); else navBadge.classList.add('hidden'); }

    if(list.length === 0) { 
        if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-500 font-bold bg-slate-900/50">لا توجد طلبات مطابقة لمعايير البحث.</td></tr>`; 
        if(mobileContainer) mobileContainer.innerHTML = `<div class="text-center text-slate-500 py-8 text-xs font-bold border border-dashed border-slate-700 rounded-2xl">لا توجد طلبات مطابقة لمعايير البحث.</div>`;
        return; 
    }
    
    if(tbody) {
        tbody.innerHTML = list.map(o => {
            const s = o.status || 'pending'; let statusBadge = '';
            if(s === 'pending') statusBadge = '<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-bold">قيد المراجعة</span>';
            if(s === 'processing') statusBadge = '<span class="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded text-[10px] font-bold">جاري التجهيز</span>';
            if(s === 'completed') statusBadge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold">مكتمل</span>';
            if(s === 'cancelled') statusBadge = '<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[10px] font-bold">ملغي</span>';
            return `
            <tr class="hover:bg-slate-800 transition-colors border-b border-slate-800/50 cursor-pointer group" onclick="openOrderDetails('${o.id}')">
                <td class="p-4 font-mono text-[#ff3377] whitespace-nowrap font-bold text-xs">#${escapeHTML((o.id||'').substring(0,8))}</td>
                <td class="p-4 text-[11px] text-slate-400 whitespace-nowrap" dir="ltr">${escapeHTML(o.date || '')}</td>
                <td class="p-4 min-w-[150px]"><p class="font-bold text-slate-200">${escapeHTML(o.name || 'عميل')}</p><p class="text-[10px] text-slate-500 mt-1 font-mono">${escapeHTML(o.phone || '')}</p></td>
                <td class="p-4 font-black text-emerald-400 whitespace-nowrap">${escapeHTML((o.total||0).toString())} ج</td>
                <td class="p-4 whitespace-nowrap">${statusBadge}</td>
                <td class="p-4 text-center whitespace-nowrap"><button class="text-slate-400 group-hover:text-[#ff3377] p-2 bg-slate-900 group-hover:bg-pink-500/10 rounded-lg transition-colors border border-slate-700 group-hover:border-pink-500/30"><i data-lucide="eye" class="w-4 h-4"></i></button></td>
            </tr>
        `}).join('');
    }

    if(mobileContainer) {
        mobileContainer.innerHTML = list.map(o => {
            let s = o.status || 'pending';
            let statusColor = s === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                              s === 'processing' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                              s === 'cancelled' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                              'text-amber-400 bg-amber-500/10 border-amber-500/20';
            let statusText = s === 'completed' ? 'مكتمل' : s === 'processing' ? 'تجهيز' : s === 'cancelled' ? 'ملغي' : 'مراجعة';
            
            return `
            <div onclick="openOrderDetails('${o.id}')" class="bg-[#101726] border border-slate-800 rounded-[1.5rem] p-4 flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer shadow-sm">
                <div class="flex justify-between items-center">
                    <span class="text-[10px] font-mono text-[#ff3377]">#${(o.id||'').substring(3, 9)}</span>
                    <span class="text-[9px] font-bold px-2 py-1 rounded-lg border ${statusColor}">${statusText}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-black text-white truncate max-w-[60%]">${escapeHTML(o.name || 'عميل')}</span>
                    <span class="text-sm font-black text-[#ff3377]">${escapeHTML((o.total||0).toString())} ج.م</span>
                </div>
                <div class="text-[10px] text-slate-400 flex justify-between border-t border-slate-800/50 pt-2 mt-1">
                    <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${escapeHTML(o.area || 'غير محدد')}</span>
                    <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${escapeHTML((o.date||'').split(',')[0])}</span>
                </div>
            </div>`;
        }).join('');
    }

    if(window.lucide) lucide.createIcons();
}

function openOrderDetails(orderId) {
    const order = globalOrders.find(o => String(o.id) === String(orderId));
    if(!order) return;
    if(document.getElementById('modal-order-id')) document.getElementById('modal-order-id').innerText = `#${(order.id||'').substring(0,8)}`;
    if(document.getElementById('modal-order-date')) document.getElementById('modal-order-date').innerText = order.date || '';
    if(document.getElementById('modal-order-name')) document.getElementById('modal-order-name').innerText = order.name || '';
    if(document.getElementById('modal-order-phone')) document.getElementById('modal-order-phone').innerText = order.phone || '';
    
    const waBtn = document.getElementById('modal-order-whatsapp');
    if(waBtn && order.phone) {
        let phoneStr = order.phone.replace(/\D/g,''); if(phoneStr.startsWith('0')) phoneStr = '2' + phoneStr; 
        waBtn.href = `https://wa.me/${phoneStr}?text=أهلاً بك يا فندم من إدارة حلويات بوسي 👑 بخصوص طلبك رقم: ${(order.id||'').substring(0,6)}`;
    }

    if(document.getElementById('modal-order-area')) document.getElementById('modal-order-area').innerText = order.area || 'غير محدد';
    if(document.getElementById('modal-order-address')) document.getElementById('modal-order-address').innerText = order.address || 'لا يوجد عنوان تفصيلي';
    
    const notesEl = document.getElementById('modal-order-notes');
    if(notesEl) { if(order.notes) { notesEl.classList.remove('hidden'); notesEl.innerText = `ملاحظات العميل: ${order.notes}`; } else { notesEl.classList.add('hidden'); } }

    const itemsContainer = document.getElementById('modal-order-items');
    if(itemsContainer) {
        if (Array.isArray(order.itemsArray)) {
            itemsContainer.innerHTML = order.itemsArray.map(item => `
                <div class="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div class="flex items-center gap-3"><span class="w-6 h-6 flex items-center justify-center bg-slate-900 text-[#ff3377] font-bold rounded text-xs">${item.qty || item.quantity || 1}x</span><div><p class="text-sm font-bold text-white">${escapeHTML(item.name || '')}</p>${item.desc || item.notes ? `<p class="text-[10px] text-amber-400 mt-0.5">${escapeHTML(item.desc || item.notes)}</p>` : ''}</div></div>
                    <span class="text-sm font-mono text-emerald-400">${(item.price || 0) * (item.qty || item.quantity || 1)} ج</span>
                </div>
            `).join('');
        } else if(typeof order.items === 'string') { itemsContainer.innerHTML = `<div class="p-3 bg-slate-800 rounded-lg text-sm text-slate-300 leading-relaxed">${escapeHTML(order.items).replace(/\n/g, '<br>')}</div>`; } 
        else if(typeof order.itemsDesc === 'string') { itemsContainer.innerHTML = `<div class="p-3 bg-slate-800 rounded-lg text-sm text-slate-300 leading-relaxed">${escapeHTML(order.itemsDesc).replace(/\n/g, '<br>')}</div>`; } 
        else { itemsContainer.innerHTML = `<div class="p-3 bg-slate-800 rounded-lg text-sm text-slate-500 italic">التفاصيل الفنية غير متوفرة</div>`; }
    }

    if(document.getElementById('modal-order-subtotal')) document.getElementById('modal-order-subtotal').innerText = ((order.total || 0) - (order.shippingFee || 0)) + ' ج.م';
    if(document.getElementById('modal-order-shipping')) document.getElementById('modal-order-shipping').innerText = (order.shippingFee || 0) + ' ج.م';
    if(document.getElementById('modal-order-total')) document.getElementById('modal-order-total').innerText = (order.total || 0) + ' ج.م';

    const statusSelect = document.getElementById('modal-order-status');
    if(statusSelect) { statusSelect.value = order.status || 'pending'; statusSelect.setAttribute('data-current-id', order.id); }

    const modal = document.getElementById('admin-order-modal');
    if(modal) { modal.classList.remove('hidden'); setTimeout(() => modal.classList.remove('opacity-0'), 10); }
    if(window.lucide) lucide.createIcons();
}

function closeOrderModal() {
    const modal = document.getElementById('admin-order-modal');
    if(modal) { modal.classList.add('opacity-0'); setTimeout(() => modal.classList.add('hidden'), 300); }
}

async function updateOrderStatus() {
    const selectEl = document.getElementById('modal-order-status');
    if(!selectEl) return;
    const id = selectEl.getAttribute('data-current-id'); 
    const newStatus = selectEl.value;
    const orderIdx = globalOrders.findIndex(o => String(o.id) === String(id));
    
    if (orderIdx > -1) {
        const oldStatus = globalOrders[orderIdx].status;
        globalOrders[orderIdx].status = newStatus;
        saveEngineMemory('ord');
        
        try {
            if(typeof NetworkEngine !== 'undefined') await NetworkEngine.safeWrite('orders', String(id), globalOrders[orderIdx]);
            showSystemToast('تم تحديث حالة الطلب بقرار مهني بنجاح 👑', 'success');

            if (oldStatus !== newStatus && (newStatus === 'processing' || newStatus === 'completed')) {
                triggerMakeWebhook(globalOrders[orderIdx], newStatus);
            }

        } catch (e) { showSystemToast('تم تحديث الحالة محلياً', 'info'); }
        renderAdminOverview(); renderAdminOrders(); closeOrderModal();
    }
}

async function triggerMakeWebhook(orderData, status) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const idToken = await user.getIdToken();
        const secureEndpoint = 'https://us-central1-bosy-sweets.cloudfunctions.net/secureWebhookTrigger';

        await fetch(secureEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` 
            },
            body: JSON.stringify({
                orderId: orderData.id,
                customerName: orderData.name,
                customerPhone: orderData.phone,
                status: status,
                total: orderData.total,
                brand: siteSettings.brandName
            })
        });
    } catch(e) {}
}

function printOrderInvoice() { window.print(); }
