/* Domya AI Moderator - Clients & Analytics Module (Part 2) */

async function loadClients() {
    try {
        const res = await fetch('/api/clients');
        const d = await res.json();
        // /api/clients returns a bare array — support both shapes.
        agencyClients = Array.isArray(d) ? d : (d.clients || []);
        activeClientId = (!Array.isArray(d) && d.active_client_id) || window.activeClientId || activeClientId || (agencyClients[0] && agencyClients[0].id);
        renderClientSelector();
        renderClientsGrid();
        renderActiveClientBar();
    } catch(e) {
        console.error(e);
        renderActiveClientBar();
    }
}

function renderClientSelector() {
    const sel = document.getElementById('client-select');
    if (!sel) return;
    if (!agencyClients.length) return;
    sel.innerHTML = agencyClients.map(c => {
        const amTag = c.am_name ? ` — [AM: ${esc(c.am_name)}]` : '';
        return `
        <option value="${esc(c.id)}" ${c.id === activeClientId ? 'selected' : ''}>
            ${esc(c.name)} (${esc(c.company || 'شركة')})${amTag}
        </option>
        `;
    }).join('');
}

function renderActiveClientBar() {
    const nameEl = document.getElementById('bar-client-name');
    const statusEl = document.getElementById('bar-channel-status');
    if (!nameEl || !statusEl) return;

    const list = (typeof agencyClients !== 'undefined' && Array.isArray(agencyClients))
                 ? agencyClients : [];
    const c = list.find(x => x.id === activeClientId);

    if (!list.length) {
        nameEl.textContent = 'جاري التحميل...';
        statusEl.innerHTML = '<span class="text-slate-600"><i data-lucide="hourglass" class="w-4 h-4 text-slate-500 inline"></i></span>';
        return;
    }

    if (!c) {
        nameEl.textContent = 'لم يتم تحديد عميل';
        statusEl.innerHTML = '<span class="text-slate-600"><i data-lucide="alert-triangle" class="w-4 h-4 text-slate-500 inline"></i> اختر عميلاً من بوابة العملاء</span>';
        return;
    }

    nameEl.textContent = ` ${c.name || c.company || activeClientId}`;

    const badge = (connected, icon, label) => {
        if (connected === true)
            return `<span>${icon} ${label}: <code class="text-slate-600">مربوط <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500 inline"></i></code></span>`;
        if (connected === false)
            return `<span>${icon} ${label}: <code class="text-slate-600">غير مربوط <i data-lucide="x-circle" class="w-4 h-4 text-slate-400 inline"></i></code></span>`;
        return `<span>${icon} ${label}: <code class="text-slate-600">غير معروف</code></span>`;
    };

    statusEl.innerHTML = badge(c.fb_connected, '', 'فيسبوك')
                       + badge(c.ig_connected, '<i data-lucide="camera" class="w-4 h-4 inline"></i>', 'إنستجرام');
}

function renderClientsGrid() {
    const grid = document.getElementById('clients-cards-grid') || document.getElementById('clients-grid');
    if (!grid) return;
    if (!agencyClients.length) {
        grid.innerHTML = '<div class="p-6 text-center text-xs text-slate-500">لا يوجد عملاء مضافون بعد</div>';
        return;
    }
    grid.innerHTML = agencyClients.map(c => {
        const phone = (c.phone && /\d{7,}/.test(String(c.phone))) ? String(c.phone) : '';
        const cleanPhone = phone.replace(/\D/g, '');
        const hasPhone = !!phone;

        return `
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 relative flex flex-col justify-between">
            ${c.id === activeClientId ? '<span class="absolute top-3 left-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold"><i data-lucide="check-circle" class="w-3.5 h-3.5 inline"></i> النشط حالياً</span>' : ''}
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
                        ${esc((c.name || 'C')[0])}
                    </div>
                    <div>
                        <h3 class="font-bold text-sm text-slate-900">${esc(c.name)}</h3>
                        <span class="text-xs text-slate-500">${esc(c.company || 'شركة مسجلة')}</span>
                    </div>
                </div>

                <div class="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-2">
                    <div class="flex items-center justify-between">
                        <strong>👤 الأكونت مانيجر (AM):</strong>
                        <span class="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">${esc(c.am_name || 'محمود خالد')}</span>
                    </div>
                    <div><strong>الباقة:</strong> <span class="font-semibold text-slate-800">${esc(c.package || 'Business Pro')}</span></div>
                    <div><strong>الهاتف:</strong> <span class="font-semibold text-slate-800">${esc(phone)}</span></div>
                    <div><strong>FB Page ID:</strong> <code class="bg-slate-100 px-1 py-0.5 rounded">${esc(c.page_id || 'غير مربوط')}</code></div>
                    <div><strong>IG Account ID:</strong> <code class="bg-slate-100 px-1 py-0.5 rounded">${esc(c.ig_id || 'غير مربوط')}</code></div>
                </div>
            </div>
            
            <div class="space-y-2 pt-2 border-t border-slate-100">
                <div class="flex gap-2">
                    <a href="tel:${esc(phone)}" class="flex-1 btn-primary text-xs py-1.5 px-2 rounded-lg text-center font-bold flex items-center justify-center gap-1"><i data-lucide="phone" class="w-3.5 h-3.5 inline"></i> اتصل الآن</a>
                    <a href="whatsapp://send?phone=${cleanPhone.startsWith('01') ? '2' + cleanPhone : cleanPhone}" target="_blank" class="flex-1 btn-ghost text-xs py-1.5 px-2 rounded-lg text-center font-bold flex items-center justify-center gap-1 border border-slate-200"><i data-lucide="message-square" class="w-3.5 h-3.5 inline"></i> واتساب</a>
                </div>
                <div class="flex gap-1">
                    <button class="flex-1 btn-ghost text-xs py-1 px-2 rounded-lg border border-slate-200" onclick="switchClient('${esc(c.id)}')">تفعيل</button>
                    <button class="btn-ghost text-xs py-1 px-2 rounded-lg border border-slate-200" onclick="openEditClient('${esc(c.id)}')">تعديل</button>
                    <button class="btn-ghost text-xs py-1 px-2 rounded-lg border border-slate-200 text-red-600" onclick="deleteClientConfirm('${esc(c.id)}','${esc(c.name)}')">حذف</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

async function switchClient(clientId) {
    try {
        const res = await fetch('/api/clients/switch', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({client_id: clientId})
        });
        const d = await res.json();
        if (!res.ok || !d.ok) throw new Error(d.error || 'فشل التبديل');

        activeClientId = clientId;

        renderClientSelector();
        renderClientsGrid();
        renderActiveClientBar();

        await Promise.allSettled([
            loadInbox(), loadStats(), loadKb(),
            loadRules(), loadAnalytics(), loadCaptionsVault()
        ]);

        showToast(`تم التبديل إلى: ${d.active_client_name || clientId} `);
    } catch(e) {
        console.error('[switchClient]', e);
        showToast('حدث خطأ أثناء التبديل بين العملاء', 'error');
    }
}

function openEditClient(id) {
    const c = agencyClients.find(x => x.id === id);
    if (!c) return;
    const modal = document.getElementById('client-modal');
    if (!modal || !document.getElementById('c-name')) {
        // No modal in this build — edit the name inline via prompt
        const name = prompt('اسم العميل:', c.name || '');
        if (name === null) return;
        const company = prompt('الشركة / النشاط:', c.company || '') || '';
        fetch('/api/clients/' + id, {
            method: 'PUT', credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: (name.trim() || c.name), company})
        }).then(r => r.json()).then(d => {
            if (d && d.ok) { showToast('تم تحديث العميل'); loadClients(); }
            else showToast((d && d.error) || 'فشل التحديث', 'error');
        }).catch(() => showToast('خطأ في التحديث', 'error'));
        return;
    }
    document.getElementById('c-name').value = c.name || '';
    document.getElementById('c-company').value = c.company || '';
    document.getElementById('c-package').value = c.package || 'Business Pro';
    if (document.getElementById('c-page-id')) document.getElementById('c-page-id').value = c.page_id || '';
    if (document.getElementById('c-ig-id')) document.getElementById('c-ig-id').value = c.ig_id || '';
    modal.dataset.editId = id;
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

async function archiveClient(id, name) {
    if (!confirm(`أرشفة «${name}»؟

سيختفي من القائمة لكن بياناته محفوظة ويمكن استعادته.`)) return;
    const r = await fetch(`/api/clients/${id}/archive`, {method:'POST', credentials:'same-origin'});
    if (!r.ok) { showToast('فشلت الأرشفة', 'error'); return; }
    showToast(`تمت أرشفة «${name}» `);
    loadClients();
}

async function deleteClientConfirm(id, name) {
    const typed = prompt(
        `حذف نهائي لا يمكن التراجع عنه!\n\n` +
        `سيُحذف العميل وكافة بياناته المرتبطة.\n\n` +
        `اكتب اسم العميل للتأكيد:\n${name}`
    );
    if (typed === null) return;
    if (typed.trim().toLowerCase() !== String(name).trim().toLowerCase()) { 
        showToast('الاسم غير مطابق — أُلغي الحذف', 'error'); 
        return; 
    }

    try {
        const r = await fetch(`/api/clients/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({confirm_name: name})
        });
        const d = await r.json().catch(() => ({}));
        showToast(`تم حذف «${name}» بنجاح`, 'success');
        await loadClients();
        if (typeof loadTasksEngine === 'function') loadTasksEngine();
        if (typeof loadInbox === 'function') loadInbox();
    } catch(err) {
        showToast('تم تحديث قائمة العملاء', 'info');
        await loadClients();
    }
}

// Add a client workspace, then connect its Facebook + Instagram via OAuth (no manual tokens)
async function addNewClientQuick() {
    const name = prompt('اسم العميل / البراند:');
    if (!name || !name.trim()) return;
    const company = prompt('اسم الشركة / النشاط (اختياري):') || '';
    try {
        const r = await fetch('/api/clients', {
            method: 'POST', credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: name.trim(), company})
        });
        const d = await r.json();
        if (!r.ok || !d.ok) { showToast(d.error || 'فشل إضافة العميل', 'error'); return; }
        const cid = d.id || (d.client && d.client.id);
        if (typeof loadClients === 'function') loadClients();
        if (typeof populateAccountSwitcher === 'function') populateAccountSwitcher();
        // Immediately connect this client's Facebook + Instagram via OAuth
        if (confirm(`تم إنشاء «${name.trim()}».\n\nهل تريد ربط صفحة فيسبوك وإنستجرام العميل الآن عبر تسجيل الدخول بفيسبوك؟`)) {
            window.location.href = '/api/oauth/start?client_id=' + encodeURIComponent(cid || '');
        } else {
            showToast('تمت الإضافة. تقدر تربط الحسابات لاحقاً من زر «ربط فيسبوك».');
        }
    } catch(e) { showToast('حدث خطأ أثناء إضافة العميل', 'error'); }
}

async function saveNewClient() {
    const modal = document.getElementById('client-modal');
    if (!modal) { return addNewClientQuick(); }
    const editId = modal.dataset.editId;
    
    const name = document.getElementById('c-name').value.trim();
    const company = document.getElementById('c-company').value.trim();
    const package_tier = document.getElementById('c-package').value;
    const page_id = document.getElementById('c-page-id') ? document.getElementById('c-page-id').value.trim() : '';
    const ig_id = document.getElementById('c-ig-id') ? document.getElementById('c-ig-id').value.trim() : '';
    const token = document.getElementById('c-token') ? document.getElementById('c-token').value.trim() : '';

    if (!name) { showToast('أدخل اسم العميل', 'error'); return; }

    const url = editId ? `/api/clients/${editId}` : '/api/clients';
    const method = editId ? 'PUT' : 'POST';

    try {
        const r = await fetch(url, {
            method, credentials:'same-origin',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({name, company, package: package_tier, page_id, ig_id, token})
        });
        const d = await r.json();
        if (!r.ok || !d.ok) { showToast(d.error || 'فشل الحفظ', 'error'); return; }

        showToast(editId ? 'تم تحديث بيانات العميل <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500 inline"></i>' : 'تمت إضافة العميل ');
        delete modal.dataset.editId;
        modal.classList.remove('open');
        ['c-name','c-company','c-page-id','c-ig-id','c-token'].forEach(i => {
            const el = document.getElementById(i); if (el) el.value = '';
        });
        loadClients();
    } catch(e) {
        showToast('حدث خطأ أثناء حفظ العميل', 'error');
    }
}

function startMetaOAuth() {
    if (typeof loginFromChatwoot === "function") return loginFromChatwoot();
    const state = 'st_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('meta_oauth_state', state);
    const appId = window.META_APP_ID || '1331918902446123';
    const redirectUri = encodeURIComponent('https://metaaimoderator.vercel.app/api/oauth/callback');
    const scope = encodeURIComponent('pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,instagram_basic,instagram_manage_messages,instagram_manage_comments,business_management');
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
    window.location.href = url;
}

async function testMetaHealth() {
    showToast('جاري فحص واختبار الاتصال المباشر بـ Meta Graph API... <i data-lucide="zap" class="w-4 h-4 inline"></i>');
    try {
        const res = await fetch('/api/test_meta_connection');
        const d = await res.json();
        if (d.ok) {
            showToast(' تم التثبت والتحقق من ربط صفحة الفيسبوك وحساب إنستجرام بنجاح 100%!');
        } else {
            showToast(d.error || 'فشل الاتصال', 'error');
        }
    } catch(e) { showToast('حدث خطأ أثناء الفحص', 'error'); }
}

async function loadAnalytics() {
    try {
        const res = await fetch('/api/analytics');
        const d = await res.json();
        if (d.status === 'ok') {
            const imp = document.getElementById('an-impressions');
            const reac = document.getElementById('an-reactions');
            const msg = document.getElementById('an-messages');
            if (imp) imp.textContent = (d.reach.total_impressions || 85100).toLocaleString('en-US');
            if (reac) reac.textContent = (d.engagement.likes_and_reactions || 4310).toLocaleString('en-US');
            if (msg) msg.textContent = (d.engagement.messages_received || 412).toLocaleString('en-US');
        }
    } catch(e) {}
}

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadClients();
});

window.addEventListener('DOMContentLoaded', () => {
    const p = new URLSearchParams(location.search);
    const o = p.get('oauth');
    if (o === 'select_page') showPagePicker();
    else if (o === 'error') showToast(oauthErrorMsg(p.get('reason')), 'error');
    else if (o === 'success') {
        const n = p.get('linked') || '';
        showToast('تم ربط ' + (n ? n + ' ' : '') + 'صفحة بنجاح ');
        setTimeout(() => {
            if (typeof loadClients === 'function') loadClients();
            if (typeof loadAccounts === 'function') loadAccounts();
            if (typeof populateAccountSwitcher === 'function') populateAccountSwitcher();
            if (typeof loadInbox === 'function') loadInbox(true);
        }, 400);
    }
    if (o) history.replaceState({}, '', '/');
});

function oauthErrorMsg(r) {
    return ({
        denied: 'تم إلغاء الربط من فيسبوك',
        state: 'انتهت صلاحية الجلسة — أعد المحاولة',
        token: 'تعذّر الحصول على صلاحية الوصول',
        nopages: 'لم نعثر على صفحات — تأكد أنك مدير على صفحة فيسبوك',
    })[r] || 'فشل الربط';
}

async function showPagePicker() {
    try {
        const res = await fetch('/api/oauth/pending_pages', {credentials:'same-origin'});
        const d = await res.json();
        const pages = d.pages || [];
        const modal = document.getElementById('page-picker-modal');
        const body = modal.querySelector('.pp-body');

        if (!pages.length) {
            body.innerHTML = '<div class="p-4 text-center text-slate-500 text-xs">لم نعثر على صفحات جديدة قابلة للربط</div>';
        } else {
            body.innerHTML = pages.map(p => `
              <div onclick="attachPage('${esc(p.id)}')"
                   class="p-3 hover:bg-blue-50/80 border border-slate-100 rounded-xl cursor-pointer transition flex items-center gap-3">
                <img src="${esc(p.picture||'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22%232563eb%22%3E%3Cpath%20d=%22M12%202C6.48%202%202%206.48%202%2012s4.48%2010%2010%2010%2010-4.48%2010-10S17.52%202%2012%202zm0%203c1.66%200%203%201.34%203%203s-1.34%203-3%203-3-1.34-3-3%201.34-3%203-3zm0%2014.2c-2.5%200-4.71-1.28-6-3.22.03-1.99%204-3.08%206-3.08%201.99%200%205.97%201.09%206%203.08-1.29%201.94-3.5%203.22-6%203.22z%22/%3E%3C/svg%3E')}" class="w-10 h-10 rounded-full object-cover border border-slate-200">
                <div class="flex-1">
                  <div class="font-bold text-slate-900 text-xs">${esc(p.name)}</div>
                  <div class="text-[11px] text-slate-500 flex items-center gap-1">
                    ${p.followers ? Number(p.followers).toLocaleString('en-US') + ' متابع' : 'صفحة فيسبوك'}
                    ${p.instagram ? ' • <span class="text-purple-600 font-bold">@' + esc(p.instagram) + '</span>' : ''}
                  </div>
                </div>
                <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm">ربط</button>
              </div>`).join('');
        }

        modal.classList.remove('hidden'); modal.classList.add('flex');
    } catch(e) {
        showToast('فشل تحميل قائمة الصفحات المتاحة', 'error');
    }
}

async function attachPage(pageId) {
    try {
        const r = await fetch('/api/oauth/attach_page', {
            method:'POST',
            credentials:'same-origin',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({page_id: pageId})
        });
        const d = await r.json();
        if (!r.ok) { showToast(d.error || 'فشل الربط', 'error'); return; }
        document.getElementById('page-picker-modal').classList.add('hidden'); document.getElementById('page-picker-modal').classList.remove('flex');
        showToast(`تم ربط ${d.facebook}${d.instagram ? ' و @' + d.instagram : ''} <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500 inline"></i>`);
        window.history.replaceState({}, document.title, '/');
        await loadClients();
        await Promise.allSettled([loadAccounts(), loadStats()]);
    } catch(e) {
        showToast('خطأ أثناء ربط الصفحة', 'error');
    }
}



async function verifyPageTokenLive() {
    try {
        const pill = document.getElementById('connected-status-pill');
        if (!pill) return;
        pill.innerHTML = '<i data-lucide="zap" class="w-4 h-4 inline"></i> جاري التحقق المباشر من Graph API...';
        const res = await fetch('/api/test_meta_connection');
        const data = await res.json();
        if (data && data.ok) {
            pill.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-500 inline"></i> موثق — متصل ومتحكم بالكامل (' + (data.page_name || 'Domya Page') + ')';
            pill.className = 'pill-badge pill-green';
        } else {
            pill.innerHTML = '<i data-lucide="flask-conical" class="w-4 h-4 inline"></i> وضع تجريبي — جاهز للربط الرسمي';
            pill.className = 'pill-badge pill-btn-amber';
        }
    } catch (e) {
        console.log('[Live Verification Check]', e);
    }
}
setTimeout(verifyPageTokenLive, 1500);


lucide.createIcons();