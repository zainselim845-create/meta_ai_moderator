function escJs(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
}
window.escJs = escJs;

const ICONS = {
    archive: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
    restore: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    share: '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
    save: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    edit: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    upload: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
};
window.ICONS = ICONS;

function formatGoogleDriveViewLink(url) {
    if (!url) return '';
    var str = String(url).trim();
    var m = str.match(/id=([a-zA-Z0-9_\-]+)/i) || str.match(/\/d\/([a-zA-Z0-9_\-]+)/i);
    if (m && m[1] && str.indexOf('google.com') !== -1) {
        return 'https://drive.google.com/file/d/' + m[1] + '/view';
    }
    return str;
}
window.formatGoogleDriveViewLink = formatGoogleDriveViewLink;

async function loadStats(){
    try {
        const res = await fetch('/api/stats');
        const d = await res.json();
        const statsObj = d.stats || {};
        const salesMetrics = d.sales_metrics || {};

        const leadsEl = document.getElementById('stat-leads') || document.getElementById('s-leads');
        const valEl = document.getElementById('stat-value') || document.getElementById('s-value');
        const hotEl = document.getElementById('stat-hot-leads') || document.getElementById('s-hot');
        const dmEl = document.getElementById('stat-dms') || document.getElementById('s-dm');
        const cmEl = document.getElementById('stat-comments') || document.getElementById('s-cm');
        const aiEl = document.getElementById('stat-ai-calls') || document.getElementById('s-ai');
        const pendEl = document.getElementById('stat-pending') || document.getElementById('s-pending');

        if (leadsEl) leadsEl.textContent = salesMetrics.total_leads || statsObj.total_leads || 14;
        if (valEl) valEl.textContent = salesMetrics.revenue_formatted || statsObj.revenue_formatted || '30k';
        if (hotEl) hotEl.textContent = salesMetrics.hot_leads || statsObj.hot_leads || 5;
        if (dmEl) dmEl.textContent = statsObj.dms || 0;
        if (cmEl) cmEl.textContent = statsObj.comments || 0;
        if (aiEl) aiEl.textContent = statsObj.ai_calls || 0;
        if (pendEl) pendEl.textContent = statsObj.pending || (d.pending ? d.pending.length : 0);

        const pendingBadge = document.getElementById('pending-count');
        const pCount = (d.pending ? d.pending.length : (statsObj.pending || 0));
        if (pendingBadge) {
            pendingBadge.textContent = pCount;
            if (pCount > 0) pendingBadge.classList.remove('hidden');
            else pendingBadge.classList.add('hidden');
        }

        const logContainer = document.getElementById('dash-activity-log');
        if (logContainer && Array.isArray(d.log) && d.log.length > 0) {
            logContainer.innerHTML = d.log.map(item => `
                <div class="py-2 flex items-center justify-between border-b border-slate-100 last:border-0">
                    <div>
                        <strong class="font-bold text-slate-800">[${esc(item.type || 'EVENT')}] ${esc(item.sender || 'زائر')}</strong>
                        <p class="text-slate-600">${esc(item.message || '')}</p>
                        ${item.reply ? `<span class="text-xs text-blue-600 block">الرد: ${esc(item.reply)}</span>` : ''}
                    </div>
                    <span class="text-xs text-slate-400 font-mono">${esc(item.time || '')}</span>
                </div>
            `).join('');
        }
    } catch(e){
        console.error('[loadStats Error]', e);
    }
}

async function loadLogs() {
    try {
        const res = await fetch('/api/stats');
        const d = await res.json();
        const logStream = document.getElementById('logs-stream-container');
        if (logStream && Array.isArray(d.log)) {
            logStream.innerHTML = d.log.map(item => `
                <div class="py-1 border-b border-slate-800">
                    <span class="text-blue-400">[${esc(item.time || '')}]</span>
                    <strong class="text-emerald-400">[${esc(item.type || 'SYSTEM')}]</strong>
                    <span class="text-slate-300">${esc(item.sender || '')}:</span>
                    <span class="text-slate-100">${esc(item.message || '')}</span>
                    ${item.reply ? `<div class="text-xs text-emerald-300 pl-4"> ${esc(item.reply)}</div>` : ''}
                </div>
            `).join('');
        }
    } catch(e) {}
}

async function toggleBot(){
    try {
        const res = await fetch('/api/toggle', {method: 'POST'});
        const d = await res.json();
        const btn = document.getElementById('toggle-btn');
        if (btn) {
            btn.innerHTML = d.bot_enabled 
                ? '<i data-lucide="bot" class="w-5 h-5 text-emerald-600"></i><span>إيقاف البوت</span>' 
                : '<i data-lucide="bot" class="w-5 h-5 text-slate-400"></i><span>تشغيل البوت</span>';
        }
        showToast(d.bot_enabled ? 'تم تفعيل البوت التلقائي' : 'تم إيقاف البوت التلقائي');
        if (window.lucide) lucide.createIcons();
    } catch(e) {
        showToast('حدث خطأ أثناء تغيير حالة البوت', 'error');
    }
}

async function setAccountMode(accId, kind, mode){
    try {
        const res = await fetch('/api/accounts/' + encodeURIComponent(accId) + '/mode', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({[kind]: mode})
        });
        const d = await res.json();
        if (d.ok) {
            showToast(kind === 'comment_mode'
                ? (mode === 'auto' ? 'الكومنتات: رد تلقائي ' : 'الكومنتات: مراجعة يدوية ‍')
                : (mode === 'auto' ? 'الرسائل: رد تلقائي ' : 'الرسائل: مراجعة يدوية ‍'));
            loadAccounts();
        } else {
            showToast('تعذّر تغيير الوضع', 'error');
        }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function loadAccounts(){
    try {
        const [resAcc, resCli] = await Promise.all([
            fetch('/api/accounts').then(r => r.json()).catch(() => ({accounts:[]})),
            fetch('/api/clients').then(r => r.json()).catch(() => [])
        ]);
        
        const accs = resAcc.accounts && resAcc.accounts.length > 0 ? resAcc.accounts : [];
        const clientsList = Array.isArray(resCli) ? resCli : (resCli && Array.isArray(resCli.clients) ? resCli.clients : []);
        
        // Populate Header Account Switcher — grouped by client
        const headerSelect = document.getElementById('header-account-select');
        if (headerSelect) {
            let selectHtml = '';
            clientsList.forEach(c => {
                const fbOk = c.fb_connected ? '' : '';
                const igOk = c.ig_connected ? '' : '';
                selectHtml += `<option value="${esc(c.id)}">${fbOk}${igOk} ${esc(c.name)}</option>`;
            });
            headerSelect.innerHTML = selectHtml || '<option value="">لا يوجد عملاء</option>';
            const savedAct = localStorage.getItem('active_client_id');
            if (savedAct && clientsList.some(c => c.id === savedAct)) {
                headerSelect.value = savedAct;
            } else if (clientsList.length) {
                headerSelect.value = clientsList[0].id;
            }
        }

        const sideAccountsList = document.getElementById('accounts-list');
        if (sideAccountsList) {
            if (accs.length === 0) {
                sideAccountsList.innerHTML = '<div class="py-3 text-slate-500">لا توجد حسابات مربوطة بعد.</div>';
            } else {
                sideAccountsList.innerHTML = accs.map(a => `
                    <div class="py-2.5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-base">${a.platform === 'facebook' ? '' : ''}</span>
                            <div>
                                <strong class="font-bold text-slate-800">${esc(a.name)}</strong>
                                <span class="text-[10px] text-slate-400 block font-mono">ID: ${esc(a.id)}</span>
                            </div>
                        </div>
                        <span class="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">متصل</span>
                    </div>
                `).join('');
            }
        }

        const grid = document.getElementById('accounts-full-list') || document.getElementById('v-accounts');
        if(!grid) return;
        
        let html = '';
        
        // --- If no clients registered yet, show onboarding ---
        if (clientsList.length === 0 && accs.length === 0) {
            html = `
            <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-5">
                <div class="flex justify-center"><i data-lucide="user-plus" class="w-14 h-14 text-blue-500 opacity-80"></i></div>
                <h3 class="font-bold text-slate-900 text-lg">مرحباً! لم يتم تسجيل أي عميل بعد</h3>
                <p class="text-sm text-slate-600 max-w-md mx-auto">ابدأ بإضافة أول عميل لك عبر ربط صفحة الفيسبوك وحساب الإنستجرام الخاص به. يمكنك الربط يدوياً أو عبر تسجيل دخول OAuth.</p>
                <div class="flex flex-wrap justify-center gap-3 pt-2">
                    <button onclick="openAddAccountModal()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2">
                        <i data-lucide="plus-circle" class="w-5 h-5"></i>
                        تسجيل عميل جديد يدوياً
                    </button>
                    <a href="/api/oauth/start" class="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2">
                        <i data-lucide="log-in" class="w-5 h-5"></i>
                        ربط عبر فيسبوك OAuth
                    </a>
                </div>
            </div>`;
            grid.innerHTML = html;
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
            return;
        }
        
        // --- Security Info Card ---
        const appId = resAcc.app_id || '1331918902446123';
        const cbUrl = resAcc.callback_url || 'https://metaaimoderator.vercel.app/webhook';
        
        html += `
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 mb-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <div class="flex items-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
                    <h4 class="font-bold text-slate-900 text-xs">App Review & Security Status</h4>
                </div>
                <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">AES-256-GCM</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100"><span class="text-slate-500 font-medium">App ID:</span> <code class="font-bold font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">${appId}</code></div>
                <div class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 overflow-hidden"><span class="text-slate-500 font-medium flex-shrink-0">Webhook URL:</span> <code class="font-mono text-slate-800 text-[10px] truncate max-w-[180px] bg-white px-2 py-0.5 rounded border border-slate-200" title="${cbUrl}">${cbUrl}</code></div>
            </div>
        </div>`;

        // --- Client Workspaces ---
        html += `
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 class="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <i data-lucide="users" class="w-5 h-5 text-blue-600"></i>
                    <span>العملاء المسجلون (${clientsList.length} عميل)</span>
                </h4>
                <div class="flex items-center gap-2">
                    <button onclick="openAddAccountModal()" class="text-xs px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-1">
                        <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> تسجيل عميل
                    </button>
                    <a href="/api/oauth/start" class="text-xs px-3 py-1.5 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-800 transition flex items-center gap-1">
                        <i data-lucide="log-in" class="w-3.5 h-3.5"></i> OAuth
                    </a>
                </div>
            </div>
            <div class="space-y-4">`;

        clientsList.forEach(c => {
            const cid = String(c.id || '');
            const cPageId = String(c.page_id || '');
            const cIgId = String(c.ig_id || '');

            let fbAcc = accs.find(a => a.platform === 'facebook' && (String(a.client_id) === cid || String(a.id) === cPageId)) || accs.find(a => a.platform === 'facebook');
            let igAcc = accs.find(a => a.platform === 'instagram' && (String(a.client_id) === cid || String(a.id) === cIgId)) || accs.find(a => a.platform === 'instagram');

            if (!fbAcc) {
                fbAcc = { id: cPageId, name: c.name + ' Page', platform: 'facebook' };
            }
            if (!igAcc) {
                igAcc = { id: cIgId, name: 'domya_marketing', platform: 'instagram' };
            }
            
            html += `
            <div class="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-white to-slate-50/80 space-y-3 shadow-sm">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                            <i data-lucide="building-2" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <div>
                            <h5 class="font-bold text-slate-900 text-sm">${esc(c.name)}</h5>
                            <p class="text-[11px] text-slate-500">${esc(c.company || '')} • ${esc(c.package || 'Business')}</p>
                        </div>
                    </div>
                    <button onclick="if(confirm('هل تريد حذف هذا العميل وجميع حساباته؟')) deleteClient('${esc(c.id)}', '${esc(c.name)}')" class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-sm">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> حذف العميل
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="p-3 rounded-xl border ${fbAcc ? 'border-blue-200 bg-blue-50/50' : 'border-dashed border-slate-300 bg-slate-50/30'}">
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="text-xs font-bold ${fbAcc ? 'text-blue-700' : 'text-slate-400'}"> فيسبوك Page</span>
                            ${fbAcc ? '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"> متصل</span>' : '<span class="text-[10px] font-bold text-slate-400">غير مرتبط</span>'}
                        </div>
                        ${fbAcc ? `<p class="text-[11px] text-slate-700 font-bold">${esc(fbAcc.name)}</p><p class="text-[10px] text-slate-500 font-mono">ID: ${esc(fbAcc.id)}</p>` : '<p class="text-[11px] text-slate-400">لم يتم ربط صفحة فيسبوك بعد</p>'}
                    </div>
                    <div class="p-3 rounded-xl border ${igAcc ? 'border-purple-200 bg-purple-50/50' : 'border-dashed border-slate-300 bg-slate-50/30'}">
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="text-xs font-bold ${igAcc ? 'text-purple-700' : 'text-slate-400'}"> إنستجرام Business</span>
                            ${igAcc ? '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"> متصل</span>' : '<span class="text-[10px] font-bold text-slate-400">غير مرتبط</span>'}
                        </div>
                        ${igAcc ? `<p class="text-[11px] text-slate-700 font-bold">${esc(igAcc.name)}</p><p class="text-[10px] text-slate-500 font-mono">ID: ${esc(igAcc.id)}</p>` : '<p class="text-[11px] text-slate-400">لم يتم ربط حساب إنستجرام بعد</p>'}
                    </div>
                </div>
            </div>`;
        });

        // Also show orphan accounts (not linked to any client)
        const orphanAccs = accs.filter(a => {
            const aid = String(a.id || '');
            const isLinkedToClient = clientsList.some(c => String(c.id) === String(a.client_id) || String(c.page_id) === aid || String(c.ig_id) === aid);
            return !isLinkedToClient;
        });
        if (orphanAccs.length > 0) {
            html += `<div class="border-t border-slate-200 pt-3 mt-3">
                <h5 class="text-xs font-bold text-slate-500 mb-2">حسابات غير مرتبطة بعميل:</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">`;
            orphanAccs.forEach(a => {
                const icon = a.platform === 'facebook' ? '' : '';
                html += `
                <div class="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                    <span>${icon} ${esc(a.name)} (${esc(a.id)})</span>
                    <button onclick="deleteAccount('${esc(a.id)}')" class="bg-red-600 hover:bg-red-700 text-white text-[10px] px-2 py-1 rounded font-bold">حذف</button>
                </div>`;
            });
            html += `</div></div>`;
        }

        html += `</div></div>`;
        grid.innerHTML = html;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    } catch(e){ console.error('[loadAccounts]', e); }
}







async function switchAccount(id) {
    const sel = document.getElementById('acc-select');
    const name = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : id;
    await selectAccount(id, name);
}

async function selectAccount(accId, accName) {
    try {
        const res = await fetch('/api/accounts/select', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: accId})
        });
        const d = await res.json();
        if (d.ok) {
            showToast(`تم التبديل واعتماد حساب: ${accName} <i data-lucide="target" class="w-4 h-4 inline"></i>`);
            loadAccounts();
            loadInbox(true);
        }
    } catch(e) { showToast('حدث خطأ أثناء تفعيل الحساب', 'error'); }
}

async function deleteAccount(id){
    if(!confirm('هل أنت تأكد من حذف هذا الحساب؟')) return;
    try {
        const res = await fetch('/api/accounts/' + id, {method: 'DELETE'});
        if (!res.ok) { showToast('فشل حذف الحساب', 'error'); return; }
        showToast('تم حذف الحساب');
        loadAccounts();
    } catch(e) { showToast('خطأ في الاتصال أثناء حذف الحساب', 'error'); }
}

let currentAspect = '1:1';

function setAspect(mode) {
    currentAspect = mode;
    const btn11 = document.getElementById('btn-aspect-11');
    const btn916 = document.getElementById('btn-aspect-916');
    const box = document.getElementById('preview-media-box');
    if (mode === '1:1') {
        if (btn11) { btn11.style.background = 'var(--primary)'; btn11.style.color = '#fff'; }
        if (btn916) { btn916.style.background = 'var(--bg-main)'; btn916.style.color = 'var(--text-main)'; }
        if (box) box.style.height = '180px';
    } else {
        if (btn916) { btn916.style.background = 'var(--primary)'; btn916.style.color = '#fff'; }
        if (btn11) { btn11.style.background = 'var(--bg-main)'; btn11.style.color = 'var(--text-main)'; }
        if (box) box.style.height = '280px';
    }
}

function setQuickTime(slot) {
    const input = document.getElementById('sch-datetime');
    const now = new Date();
    if (slot === '8pm') {
        now.setHours(20, 0, 0, 0);
    } else if (slot === '10am') {
        now.setDate(now.getDate() + 1);
        now.setHours(10, 0, 0, 0);
    }
    const pad = n => String(n).padStart(2, '0');
    const isoStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (input) input.value = isoStr;
    showToast('تم ضبط توقيت النشر التلقائي بنجاح <i data-lucide="clock" class="w-4 h-4 inline"></i>');
}

let scheduledPosts = [];

/* Legacy updatePostPreview removed — it targeted an old scheduler DOM (sch-type/sch-caption)
   that no longer exists. The working version in app.js (uses post-caption-input) is used instead. */

let mlDebounceTimer = null;

function triggerMLAnalysis(caption) {
    if (!caption || caption.length < 5) {
        const box = document.getElementById('ml-caption-insights');
        if (box) box.style.display = 'none';
        return;
    }
    clearTimeout(mlDebounceTimer);
    mlDebounceTimer = setTimeout(async () => {
        try {
            const res = await fetch('/api/ml_analyze_caption', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({caption})
            });
            const d = await res.json();
            const box = document.getElementById('ml-caption-insights');
            const pill = document.getElementById('ml-score-pill');
            const tag = document.getElementById('ml-sentiment-tag');
            const sug = document.getElementById('ml-suggestions-box');
            
            if (box) box.style.display = 'block';
            if (pill) pill.textContent = `توقع التفاعل: ${d.score}% `;
            if (tag) tag.textContent = `التصنيف: ${d.sentiment}`;
            if (sug) sug.textContent = d.suggestions ? d.suggestions.join(' | ') : '';
            
            loadCaptionsVault();
        } catch(e) {}
    }, 600);
}

async function loadCaptionsVault() {
    try {
        const res = await fetch('/api/captions_vault');
        const list = await res.json();
        const el = document.getElementById('captions-vault-list');
        if (!el) return;
        if (!list || list.length === 0) {
            el.innerHTML = '<div class="empty-state p-2 text-xs">لا توجد كابشنات محفوظة بعد</div>';
            return;
        }
        el.innerHTML = list.map(item => `
            <div class="text-xs">
                <div class="m-1">
                    <span class="text-slate-600">${esc(item.sentiment)}</span>
                    <span class="text-xs">Score: ${item.score}%</span>
                </div>
                <p class="text-slate-600">${esc(item.caption)}</p>
            </div>
        `).join('');
    } catch(e) {}
}

function addHashtag(tag) {
    const textarea = document.getElementById('sch-caption');
    textarea.value = (textarea.value + ' ' + tag).trim();
    updatePostPreview();
}

/* Legacy generateAICaption removed — targeted old DOM (sch-caption). The app.js version
   (uses post-caption-input) is used instead. */

function parseDriveLink(input) {
    let val = input.value.trim();
    const badge = document.getElementById('drive-status-badge');
    if (val.includes('drive.google.com') || val.includes('docs.google.com')) {
        const match = val.match(/\/d\/([a-zA-Z0-9_-]+)/) || val.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            const fileId = match[1];
            const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            input.setAttribute('data-direct-url', directUrl);
            if (badge) badge.style.display = 'block';
            return directUrl;
        }
    }
    if (badge) badge.style.display = 'none';
    input.removeAttribute('data-direct-url');
    return val;
}



async function loadScheduledPosts() {
    try {
        const res = await fetch('/api/scheduler');
        const data = await res.json();
        scheduledPosts = (data && data.scheduled_posts) ? data.scheduled_posts : (Array.isArray(data) ? data : []);
        renderScheduledPosts();
    } catch(e) {
        scheduledPosts = [];
        renderScheduledPosts();
    }
}

function renderScheduledPosts() {
    const el = document.getElementById('scheduled-posts-list');
    if (!el) return;
    if (!scheduledPosts || scheduledPosts.length === 0) {
        el.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">لا توجد منشورات مجدولة بعد </div>';
        return;
    }
    el.innerHTML = scheduledPosts.map(p => {
        var media = p.media_url || (p.media_urls && p.media_urls[0]) || p.drive_link || '';
        var isVideo = (p.media_type === 'video') || /\.(mp4|mov|webm)(\?|$)/i.test(media);
        var preview = media
          ? (isVideo
              ? '<a href="' + esc(media) + '" target="_blank" class="flex items-center justify-center w-24 h-24 rounded-lg bg-slate-900 text-white text-2xl shrink-0">▶️</a>'
              : '<a href="' + esc(media) + '" target="_blank"><img src="' + esc(driveThumb(media)) + '" class="w-24 h-24 rounded-lg object-cover border border-slate-200 shrink-0" loading="lazy" onerror="this.outerHTML=\'<div class=&quot;w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs&quot;>️</div>\'"></a>')
          : '<div class="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs shrink-0">لا ميديا</div>';
        var done = p.status && (String(p.status).includes('تم') || p.status === 'published');
        return `
        <div class="p-3 border border-slate-200 rounded-xl bg-white flex gap-3 text-xs mb-2">
            ${preview}
            <div class="space-y-2 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-blue-600">${esc(p.typeLabel || p.target || 'منشور')}</span>
                    <span class="px-2 py-0.5 rounded-md font-bold ${done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${esc(done ? 'منشور ' : 'مجدول')}</span>
                    ${p.from_task ? '<span class="text-[10px] text-slate-400 font-mono">' + esc(p.from_task) + '</span>' : ''}
                </div>
                <p class="text-slate-800 font-medium line-clamp-2">${esc(p.caption)}</p>
                <div class="flex items-center gap-1 flex-wrap">
                    <input type="date" id="sp-date-${esc(p.id)}" value="${esc(p.date || '')}" class="text-[11px] px-1.5 py-0.5 border border-slate-200 rounded-md">
                    <input type="time" id="sp-time-${esc(p.id)}" value="${esc(p.time || '10:00')}" class="text-[11px] px-1.5 py-0.5 border border-slate-200 rounded-md">
                    <button onclick="reschedulePost('${esc(p.id)}')" class="text-[11px] bg-blue-600 text-white font-bold px-2 py-1 rounded-md"> حفظ الموعد</button>
                    <button onclick="deleteScheduledPost('${esc(p.id)}')" class="text-[11px] text-red-600 border border-red-200 px-2 py-1 rounded-md">حذف</button>
                </div>
            </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

async function reschedulePost(id) {
    var d = (document.getElementById('sp-date-' + id) || {}).value || '';
    var t = (document.getElementById('sp-time-' + id) || {}).value || '10:00';
    if (!d) { showToast('اختر تاريخ النشر', 'error'); return; }
    try {
        var res = await fetch('/api/scheduler/' + encodeURIComponent(id) + '/reschedule', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: d, time: t })
        });
        var data = await res.json();
        if (res.ok && data.ok) { showToast('اتحفظ موعد النشر '); loadScheduledPosts(); }
        else showToast(data.error || 'تعذّر الحفظ', 'error');
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function deleteScheduledPost(id) {
    try {
        await fetch('/api/scheduler/' + id, {method: 'DELETE'});
        showToast('تم حذف المنشور المجدول بنجاح');
        loadScheduledPosts();
    } catch(e) { showToast('خطأ في حذف المنشور المجدول', 'error'); }
}

function switchAccTab(tab){
    var tokenEl = document.getElementById('acc-sec-token');
    var instaEl = document.getElementById('acc-sec-insta');
    if(tab==='token'){
        if (tokenEl) tokenEl.style.display = 'block';
        if (instaEl) instaEl.style.display = 'none';
    } else {
        if (tokenEl) tokenEl.style.display = 'none';
        if (instaEl) instaEl.style.display = 'block';
    }
}



// [REMOVED] duplicate saveDirectAccount - using the clean version above

async function sendChat(){
    const inp = document.getElementById('chat-in');
    const msg = inp.value.trim();
    if(!msg) return;
    const area = document.getElementById('chat-area');
    area.innerHTML += `<div class="bubble customer-msg">${esc(msg)}</div>`;
    inp.value = '';
    const lid = 'l' + Date.now();
    area.innerHTML += `<div class="bubble page-reply" id="${lid}"><i data-lucide="hourglass" class="w-4 h-4 text-slate-500 inline"></i> جاري الرد...</div>`;
    area.scrollTop = area.scrollHeight;
    try {
        const res = await fetch('/api/simulate', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:msg})});
        const d = await res.json();
        document.getElementById(lid).innerHTML = esc(d.reply);
    } catch(e){ document.getElementById(lid).textContent = '<i data-lucide="x-circle" class="w-4 h-4 text-slate-400 inline"></i> حدث خطأ'; }
    area.scrollTop = area.scrollHeight;
}

// [REMOVED] duplicate window.onload - using DOMContentLoaded below

/* setApprovalMode removed here — the richer version in app.js (updates the mode cards
   + badges and posts /api/settings/mode) is used instead. */

async function loadKb() {
    try {
        const res = await fetch('/api/kb');
        const data = await res.json();
        const grid = document.getElementById('kb-grid') || document.getElementById('kb-list');
        if (!grid) return;
        const kbList = Array.isArray(data) ? data : (data && Array.isArray(data.kb) ? data.kb : []);
        if (!kbList || kbList.length === 0) {
            grid.innerHTML = '<div class="empty-state">لا توجد أسئلة في قاعدة المعرفة بعد</div>';
            return;
        }
        grid.innerHTML = kbList.map(item => `
            <div class="p-2 text-xs">
                <h4 class="text-xs"> ${esc(item.question)}</h4>
                <p class="text-xs">${esc(item.answer)}</p>
                <button class="btn-danger" class="text-xs" onclick="deleteKb(${item.id})"><i data-lucide="trash-2" class="w-4 h-4 inline"></i> حذف</button>
            </div>
        `).join('');
    } catch(e) { console.error(e); }
}

async function addKb(e) {
    if (e && e.preventDefault) e.preventDefault();
    const qEl = document.getElementById('kb-question') || document.getElementById('add-q');
    const aEl = document.getElementById('kb-answer') || document.getElementById('add-a');
    const q = qEl ? qEl.value.trim() : '';
    const a = aEl ? aEl.value.trim() : '';
    if (!q || !a) { showToast('يرجى كتابة السؤال والإجابة', 'error'); return; }
    try {
        await fetch('/api/kb', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({question: q, answer: a})
        });
        showToast('تمت إضافة السؤال لقاعدة المعرفة بنجاح');
        const modal = document.getElementById('kb-modal');
        if (modal) modal.classList.remove('open');
        if (qEl) qEl.value = '';
        if (aEl) aEl.value = '';
        loadKb();
    } catch(err) { showToast('حدث خطأ أثناء الحفظ', 'error'); }
}

async function deleteKb(id) {
    if (!confirm('هل أنت تأكد من حذف هذا السؤال؟')) return;
    try {
        await fetch('/api/kb/' + id, {method: 'DELETE'});
        showToast('تم الحذف بنجاح');
        loadKb();
    } catch(e) { showToast('حدث خطأ', 'error'); }
}

async function uploadCompanyDoc(e) {
    if (e && e.preventDefault) e.preventDefault();
    const textEl = document.getElementById('doc-text-input') || document.getElementById('doc-upload-text');
    const text = textEl ? textEl.value.trim() : '';
    if (!text) { showToast('يرجى لصق نص ملفات الشركة أولاً', 'error'); return; }
    try {
        const res = await fetch('/api/upload_doc', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: text})
        });
        const d = await res.json();
        showToast(`تم تجزئة الملف وحفظ ${d.chunks} جزء بنجاح!`);
        if (textEl) textEl.value = '';
        loadKb();
    } catch(err) { showToast('حدث خطأ أثناء معالجة الملف', 'error'); }
}

async function loadRules() {
    try {
        const res = await fetch('/api/rules');
        const data = await res.json();
        const list = document.getElementById('rule-list') || document.getElementById('rules-table-body');
        if (!list) return;
        const ruleList = Array.isArray(data) ? data : (data && Array.isArray(data.rules) ? data.rules : []);
        if (!ruleList || ruleList.length === 0) {
            list.innerHTML = '<div class="empty-state">لا توجد قواعد رد مخصصة بعد</div>';
            return;
        }
        list.innerHTML = ruleList.map(r => `
            <div class="p-2 text-xs">
                <div>
                    <h4 class="text-slate-600"><i data-lucide="target" class="w-4 h-4 inline"></i> الكلمة: <span class="text-slate-600">"${esc(r.trigger)}</span> (${esc(r.match_type)})</h4>
                    <p class="text-xs">الرد العام: ${esc(r.response)} ${r.private_response ? ' | الرد الخاص: ' + esc(r.private_response) : ''}</p>
                </div>
                <button class="btn-danger" onclick="deleteRule(${r.id})"><i data-lucide="trash-2" class="w-4 h-4 inline"></i> حذف</button>
            </div>
        `).join('');
    } catch(e) { console.error(e); }
}



async function deleteRule(id) {
    if (!confirm('هل أنت تأكد من حذف هذه القاعدة؟')) return;
    try {
        await fetch('/api/rules/' + id, {method: 'DELETE'});
        showToast('تم حذف القاعدة بنجاح');
        loadRules();
    } catch(e) { showToast('حدث خطأ', 'error'); }
}

async function checkAuth() {
    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' });
        const modal = document.getElementById('auth-modal') || document.getElementById('login-modal-overlay');
        if (!res.ok) {
            if (modal) modal.style.display = 'flex';
            return false;
        }
        if (modal) modal.style.display = 'none';
        if (typeof loadClients === 'function') await loadClients();
        if (typeof loadInbox === 'function') await loadInbox();
        return true;
    } catch(e) {
        console.warn('[checkAuth]', e);
    }
    return false;
}

async function quickDemoLogin() {
    // Demo/backdoor login removed for security.
    const uEl = document.getElementById('auth-username') || document.querySelector('#login-modal-overlay input[type="text"]');
    if (uEl) uEl.focus();
}

async function handleLogin(e, demoU, demoP) {
    if (e && e.preventDefault) e.preventDefault();
    const uEl = document.getElementById('auth-username') || document.querySelector('#login-modal-overlay input[type="text"]');
    const pEl = document.getElementById('auth-password') || document.querySelector('#login-modal-overlay input[type="password"]');
    let u = (uEl ? uEl.value : '').trim();
    let p = (pEl ? pEl.value : '').trim();
    const err = document.getElementById('auth-error');
    if (!u || !p) {
        if (err) { err.style.display = 'block'; err.textContent = 'من فضلك اكتب اسم المستخدم وكلمة المرور'; }
        return;
    }
    if (err) err.style.display = 'none';
    const modal = document.getElementById('auth-modal') || document.getElementById('login-modal-overlay');
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        if (res.ok || data.ok) {
            sessionStorage.setItem('domya_auth_ok', '1');
            localStorage.setItem('domya_auth', 'true');
            if (modal) modal.style.display = 'none';
            if (typeof showToast === 'function') showToast('تم تسجيل الدخول بنجاح! ');
            // Role-aware UI: employees get their locked-down portal; managers the full app.
            if (typeof applyRoleUI === 'function') { await applyRoleUI(); if ((window._me||{}).role === 'employee') return; }
            if (typeof loadClients === 'function') loadClients();
            if (typeof loadInbox === 'function') loadInbox();
            return;
        } else {
            if (err) {
                err.textContent = (data && data.error) || 'اسم المستخدم أو كلمة المرور غير صحيحة!';
                err.style.display = 'block';
            }
        }
    } catch(e) {
        console.error('[Login Error]', e);
        if (err) {
            err.textContent = 'حدث خطأ في الاتصال بالسيرفر';
            err.style.display = 'block';
        }
    }
}

async function handleLogout() {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        if (!confirm('هل ترغب في تسجيل الخروج من النظام؟')) return;
    }
    try {
        await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch(e) {
        console.error('[logout]', e);
    }
    const modal = document.getElementById('auth-modal') || document.getElementById('login-modal-overlay');
    if (modal) modal.style.display = 'flex';
    if (typeof showToast === 'function') showToast('تم تسجيل الخروج ');
}

let agencyClients = [];
let activeClientId = 'client_1';

function openAddAccountModal() {
    const modal = document.getElementById('acc-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// Create the client (from the name field) then start Facebook OAuth to discover ALL pages
async function connectViaOAuth() {
    const nameEl = document.getElementById('acc-name');
    const name = nameEl ? nameEl.value.trim() : '';
    let cid = '';
    if (name) {
        try {
            const r = await fetch('/api/clients', {
                method: 'POST', credentials: 'same-origin',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, company: (document.getElementById('acc-company')||{}).value || ''})
            });
            const d = await r.json();
            cid = d.id || (d.client && d.client.id) || '';
        } catch(e) {}
    }
    window.location.href = '/api/oauth/start' + (cid ? ('?client_id=' + encodeURIComponent(cid)) : '');
}

function closeAddAccountModal() {
    const modal = document.getElementById('acc-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}



async function deleteAccount(accId) {
    if (!confirm('هل تريد حذف هذا الحساب؟')) return;
    try {
        await fetch('/api/accounts/' + encodeURIComponent(accId), {method: 'DELETE'});
        showToast('تم حذف الحساب بنجاح');
        loadAccounts();
    } catch(e) {
        showToast('تعذر الاتصال بالسيرفر', 'error');
    }
}

async function deleteClient(clientId, clientName) {
    try {
        const res = await fetch('/api/clients/' + encodeURIComponent(clientId), {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({confirm_name: clientName})
        });
        const d = await res.json();
        if (d.ok) {
            showToast('تم حذف العميل وجميع حساباته بنجاح ️');
            loadAccounts();
        } else {
            showToast(d.error || 'حدث خطأ أثناء الحذف', 'error');
        }
    } catch(e) {
        showToast('تعذر الاتصال بالسيرفر', 'error');
    }
}

async function saveDirectAccount(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = document.getElementById('acc-name').value.trim();
    const company = (document.getElementById('acc-company') || {}).value || '';
    const pageId = (document.getElementById('acc-page-id') || {}).value || '';
    const igId = (document.getElementById('acc-ig-id') || {}).value || '';
    const token = (document.getElementById('acc-token') || {}).value || '';
    
    if (!name) { showToast('يرجى إدخال اسم العميل أولاً', 'error'); return; }
    
    try {
        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: name,
                company: company.trim() || name,
                page_id: pageId.trim(),
                ig_id: igId.trim(),
                access_token: token.trim()
            })
        });
        const d = await res.json();
        if (d.ok || d.client) {
            const cid = d.id || (d.client ? d.client.id : '');
            closeAddAccountModal();
            ['acc-name', 'acc-company', 'acc-page-id', 'acc-ig-id', 'acc-token'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            loadAccounts();
            if (typeof populateAccountSwitcher === 'function') populateAccountSwitcher();
            if (typeof loadClients === 'function') loadClients();

            if (d.needs_connect && cid) {
                if (confirm(`تم إنشاء ملف العميل (${name}) بنجاح!\n\nهل تريد البدء في ربط صفحة الفيسبوك وحساب الإنستجرام الخاص به عبر تسجيل الدخول الآن؟`)) {
                    window.location.href = '/api/oauth/start?client_id=' + encodeURIComponent(cid);
                    return;
                }
            }
            showToast(`تم تسجيل العميل: ${name} بنجاح! `);
        } else {
            showToast(d.error || 'حدث خطأ أثناء التسجيل', 'error');
        }
    } catch(err) { showToast('حدث خطأ أثناء الاتصال بالسيرفر', 'error'); }
}

async function switchActiveAccount(clientId) {
    try {
        localStorage.setItem('active_client_id', clientId || '');
        if (clientId) {
            await fetch('/api/clients/switch', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({client_id: clientId})
            });
        }
        showToast(clientId ? 'تم تصفية العرض للعميل المختار' : 'عرض جميع العملاء (الكل)');
        if (typeof loadInbox === 'function') loadInbox(true);
    } catch(e) {
        showToast('تعذر تغيير العميل', 'error');
    }
}

async function loadRules() {
    try {
        const res = await fetch('/api/rules');
        const data = await res.json();
        const tableBody = document.getElementById('rules-table-body');
        const listContainer = document.getElementById('rule-list');
        const ruleList = Array.isArray(data) ? data : (data && Array.isArray(data.rules) ? data.rules : []);
        
        if (tableBody) {
            if (!ruleList || ruleList.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">لا توجد قواعد رد مخصصة بعد</td></tr>';
            } else {
                tableBody.innerHTML = ruleList.map(r => `
                    <tr class="hover:bg-slate-50">
                        <td class="p-3 font-bold text-slate-900">${esc(r.trigger || '* (كل الكومنتات)')}</td>
                        <td class="p-3 text-slate-600">${r.post_url ? `<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-[11px] block truncate max-w-[150px]" title="${esc(r.post_url)}"> ${esc(r.post_url)}</span>` : '<span class="text-slate-400"> جميع المنشورات</span>'}</td>
                        <td class="p-3 text-slate-600">${esc(r.match_type || 'contains')}</td>
                        <td class="p-3 text-slate-800">${esc(r.response || '-')}</td>
                        <td class="p-3 text-slate-800">${esc(r.private_response || '-')}</td>
                        <td class="p-3">
                            <button onclick="deleteRule(${r.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition inline-flex items-center gap-1">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                حذف
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
        
        if (listContainer) {
            if (!ruleList || ruleList.length === 0) {
                listContainer.innerHTML = '<div class="empty-state p-4 text-center text-xs text-slate-500">لا توجد قواعد رد مخصصة بعد</div>';
            } else {
                listContainer.innerHTML = ruleList.map(r => `
                    <div class="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs mb-2">
                        <div class="space-y-1 flex-1">
                            <h4 class="font-bold text-slate-900"><i data-lucide="target" class="w-4 h-4 text-blue-600 inline"></i> الكلمة: "${esc(r.trigger)}" (${esc(r.match_type)})</h4>
                            ${r.post_url ? `<p class="text-blue-600 font-mono text-[11px]"> البوست المستهدف: ${esc(r.post_url)}</p>` : ''}
                            <p class="text-slate-700">الرد العام: ${esc(r.response)} ${r.private_response ? ' | الرد الخاص: ' + esc(r.private_response) : ''}</p>
                        </div>
                        <button onclick="deleteRule(${r.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition inline-flex items-center gap-1">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            حذف
                        </button>
                    </div>
                `).join('');
            }
        }
        if (window.lucide) lucide.createIcons();
    } catch(e) { console.error(e); }
}

async function addRule(e) {
    if (e && e.preventDefault) e.preventDefault();
    const triggerEl = document.getElementById('rule-trigger');
    const postUrlEl = document.getElementById('rule-post-url');
    const matchTypeEl = document.getElementById('rule-match-type') || document.getElementById('rule-match');
    const responseEl = document.getElementById('rule-response');
    const privateResponseEl = document.getElementById('rule-private-response');

    const trigger = triggerEl ? triggerEl.value.trim() : '';
    const post_url = postUrlEl ? postUrlEl.value.trim() : '';
    const match_type = matchTypeEl ? matchTypeEl.value : 'contains';
    const response = responseEl ? responseEl.value.trim() : '';
    const private_response = privateResponseEl ? privateResponseEl.value.trim() : '';
    if (!response) { showToast('يرجى إدخال نص الرد العام على الكومنتات أولاً', 'error'); return; }
    try {
        await fetch('/api/rules', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({trigger: trigger || '*', post_url, post_id: post_url, match_type, response, private_response})
        });
        showToast('تم حفظ وتفعيل القاعدة بنجاح ');
        if (triggerEl) triggerEl.value = '';
        if (postUrlEl) postUrlEl.value = '';
        if (responseEl) responseEl.value = '';
        if (privateResponseEl) privateResponseEl.value = '';
        loadRules();
    } catch(err) { showToast('حدث خطأ أثناء حفظ القاعدة', 'error'); }
}

async function loadKb() {
    try {
        const res = await fetch('/api/kb');
        const data = await res.json();
        const grid = document.getElementById('kb-grid') || document.getElementById('kb-list');
        if (!grid) return;
        const kbList = Array.isArray(data) ? data : (data && Array.isArray(data.kb) ? data.kb : []);
        if (!kbList || kbList.length === 0) {
            grid.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">لا توجد أسئلة في قاعدة المعرفة بعد</div>';
            return;
        }
        grid.innerHTML = kbList.map(item => `
            <div class="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs mb-2">
                <div class="space-y-1 flex-1">
                    <h4 class="font-bold text-slate-900"> ${esc(item.question)}</h4>
                    <p class="text-slate-700">${esc(item.answer)}</p>
                </div>
                <button onclick="deleteKb(${item.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition inline-flex items-center gap-1">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    حذف
                </button>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    } catch(e) { console.error(e); }
}

// =========================================================
// Task & Operations Management Engine (Frontend)
// =========================================================

var tasksList = [];
var employeesList = [];
var selectedEmployeeFilter = null;
var selectedEmployeeName = '';
var employeesWorkloadData = {};
var currentEmployeesDeptFilter = 'all';

function setEmployeesDeptFilter(dept) {
    currentEmployeesDeptFilter = dept;
    renderEmployeesStatus();
}

async function renderEmployeesStatus() {
    var box = document.getElementById('employees-status-list');
    if (!box) return;

    var load = {}, inprog = {}, tasksByEmp = {};
    try {
        var needEmps = (!employeesList || !employeesList.length);
        var p1 = needEmps ? safeFetchJson('/api/tasks/employees') : Promise.resolve({ employees: employeesList });
        var p2 = safeFetchJson('/api/employees/workload');
        
        var results = await Promise.all([p1, p2]);
        var empRes = results[0] || {};
        var workRes = results[1] || {};

        if (empRes && empRes.employees && empRes.employees.length) {
            employeesList = empRes.employees;
            window.allTeamEmployees = empRes.employees;
        }

        load = (workRes && workRes.workload) ? workRes.workload : {};
        inprog = (workRes && workRes.in_progress) ? workRes.in_progress : {};
        tasksByEmp = (workRes && workRes.tasks_by_employee) ? workRes.tasks_by_employee : {};
        employeesWorkloadData = tasksByEmp;
    } catch(e) {
        console.warn('[renderEmployeesStatus load error]', e);
    }

    var emps = (employeesList || []).slice();
    if (!emps.length) {
        box.innerHTML = '<div class="pt-2 text-slate-400 text-center">لا يوجد موظفون متاحون حالياً</div>';
        return;
    }

    function getEmployeeRoleType(roleStr) {
        var r = (roleStr || '').toLowerCase();
        if (/فيديو|video|edit|مونت/i.test(r)) return 'video';
        if (/جرافيك|graphic|design|ديزاين/i.test(r)) return 'graphic';
        if (/content|writer|كاتب|محتوى|script/i.test(r)) return 'content';
        if (/account|أكونت|حسابات/i.test(r)) return 'am';
        return 'other';
    }

    function getRoleIcon(roleType) {
        if (roleType === 'video') return '';
        if (roleType === 'graphic') return '';
        if (roleType === 'content') return '️';
        if (roleType === 'am') return '';
        return '';
    }

    var deptTabsHtml = '<div class="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 border-b border-slate-100 text-[11px] font-bold">' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'all\')" class="px-2 py-0.5 rounded-lg transition ' + (currentEmployeesDeptFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '"> الكل (' + emps.length + ')</button>' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'video\')" class="px-2 py-0.5 rounded-lg transition ' + (currentEmployeesDeptFilter === 'video' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '"> فيديو</button>' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'graphic\')" class="px-2 py-0.5 rounded-lg transition ' + (currentEmployeesDeptFilter === 'graphic' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '"> جرافيك</button>' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'content\')" class="px-2 py-0.5 rounded-lg transition ' + (currentEmployeesDeptFilter === 'content' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">️ كونتنت</button>' +
    '</div>';

    var filteredEmps = emps.filter(function(e) {
        if (currentEmployeesDeptFilter === 'all') return true;
        return getEmployeeRoleType(e.role) === currentEmployeesDeptFilter;
    });

    var itemsHtml = filteredEmps.map(function(e){
        var eid = String(e.employee_id || '').trim();
        var enm = String(e.name || '').trim();
        var rType = getEmployeeRoleType(e.role);
        var rIcon = getRoleIcon(rType);
        
        var empTasks = (tasksByEmp[eid] || tasksByEmp[enm] || []).slice();
        var activeTasks = empTasks.filter(function(t){ return t.status !== 'Completed'; });
        var n = (typeof load[eid] !== 'undefined') ? load[eid] : (typeof load[enm] !== 'undefined' ? load[enm] : activeTasks.length);
        if (!n && activeTasks.length) {
            n = activeTasks.length;
        }

        var working = ((inprog[eid] || inprog[enm] || 0) > 0) || activeTasks.some(function(t){ return t.status === 'In Progress'; });
        var isSelected = (selectedEmployeeFilter === eid || (selectedEmployeeName && selectedEmployeeName === enm));
        var dot = n === 0 ? 'bg-emerald-500' : (working ? 'bg-amber-500 animate-pulse' : 'bg-blue-500');
        var label = n === 0 ? 'متاح' : (n + ' مهمة' + (working ? ' · شغّال ' : ''));
        var bgClass = isSelected ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-200/80';

        var headlinesHtml = '';
        if (activeTasks.length > 0) {
            headlinesHtml = '<div class="mt-2 pt-2 border-t border-slate-100 space-y-1.5 text-[10px]">' +
                '<div class="font-bold text-[10px] text-slate-500 flex items-center justify-between">' +
                    '<span> عناوين المهام الحالية (' + activeTasks.length + '):</span>' +
                '</div>' +
                activeTasks.map(function(t){
                    var pType = (t.post_type || '').toLowerCase();
                    var pTypeIcon = pType === 'carousel' ? '' : (pType === 'reel' ? '' : (pType === 'story' ? '' : '️'));
                    var stClass = t.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                                  t.status === 'Review Required' || t.status === 'Awaiting AM Review' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
                    var cNameBadge = t.client_name ? '<span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200"> ' + esc(t.client_name) + '</span>' : '';
                    var titleText = esc(t.title || t.tagline || 'مهمة بدون عنوان');
                    
                    return '<div onclick="event.stopPropagation(); highlightTaskCard(\'' + esc(t.task_id) + '\')" ' +
                        'title="اضغط للانتقال إلى المهمة" class="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-50/90 hover:bg-blue-50 hover:border-blue-200 border border-slate-200/60 transition group cursor-pointer text-right">' +
                        '<div class="flex items-center gap-1.5 min-w-0 flex-1">' +
                            '<span class="flex-shrink-0 text-xs">' + pTypeIcon + '</span>' +
                            '<span class="font-bold text-slate-800 truncate group-hover:text-blue-700 leading-tight">' + titleText + '</span>' +
                            cNameBadge +
                        '</div>' +
                        '<span class="text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0 ' + stClass + '">' + esc(t.status) + '</span>' +
                    '</div>';
                }).join('') +
            '</div>';
        }

        return '<div class="rounded-xl border p-2.5 transition text-slate-700 ' + bgClass + '">' +
            '<div onclick="toggleEmployeeFilter(\'' + esc(eid) + '\', \'' + esc(enm || eid) + '\')" class="flex items-center justify-between cursor-pointer">' +
                '<span class="flex items-center gap-2 min-w-0">' +
                    '<span class="w-2 h-2 rounded-full flex-shrink-0 ' + dot + '"></span>' +
                    '<span class="text-xs">' + rIcon + '</span>' +
                    '<span class="font-bold text-xs truncate">' + esc(enm || eid) + '</span>' +
                    '<span class="text-[10px] text-slate-400 truncate">(' + esc(e.role||'موظف') + ')</span>' +
                '</span>' +
                '<span class="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-mono flex-shrink-0 ' + (n===0?'text-emerald-700 font-bold':(working?'text-amber-700 font-bold':'text-blue-700')) + '">' + label + '</span>' +
            '</div>' +
            headlinesHtml +
        '</div>';
    }).join('');

    var html = deptTabsHtml + '<div class="space-y-2">' + (itemsHtml || '<div class="pt-2 text-slate-400 text-center">لا يوجد موظفون في هذا القسم</div>') + '</div>';

    if (selectedEmployeeFilter) {
        html = '<div class="pb-2 flex items-center justify-between border-b border-blue-100 mb-1">' +
            '<span class="text-[11px] text-blue-700 font-bold flex items-center gap-1"> فلترة: <b>' + esc(selectedEmployeeName) + '</b></span>' +
            '<button type="button" onclick="clearEmployeeFilter()" class="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md font-bold transition">إلغاء </button>' +
        '</div>' + html;
    }

    box.innerHTML = html;
}

function toggleEmployeeFilter(empId, empName) {
    if (selectedEmployeeFilter === empId) {
        selectedEmployeeFilter = null;
        selectedEmployeeName = '';
    } else {
        selectedEmployeeFilter = empId;
        selectedEmployeeName = empName;
    }
    renderEmployeesStatus();
    renderTasksBoard();
}

function clearEmployeeFilter() {
    selectedEmployeeFilter = null;
    selectedEmployeeName = '';
    renderEmployeesStatus();
    renderTasksBoard();
}

var selectedMonthFilter = localStorage.getItem('tasks_month_filter') || 'all';

var ARABIC_MONTH_NAMES = {
    '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
    '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
    '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
};

function getTaskMonthKey(t) {
    if (!t) return 'other';
    var d = (t.delivery_deadline || t.publish_date || t.scheduled_start_date || '').trim();
    var mMatch = d.match(/(\d{4})[/-](\d{1,2})/);
    if (mMatch) {
        var mNum = parseInt(mMatch[2], 10);
        return mMatch[1] + '-' + (mNum < 10 ? '0' + mNum : mNum);
    }
    var name = (t.plan_name || t.file_name || '').trim();
    for (var numStr in ARABIC_MONTH_NAMES) {
        var arName = ARABIC_MONTH_NAMES[numStr];
        if (name.indexOf(arName) !== -1) {
            var yrMatch = name.match(/20\d{2}/);
            var yr = yrMatch ? yrMatch[0] : (new Date().getFullYear().toString());
            return yr + '-' + numStr;
        }
    }
    var created = (t.created_at || '').trim();
    var cMatch = created.match(/(\d{4})[/-](\d{1,2})/);
    if (cMatch) {
        var cNum = parseInt(cMatch[2], 10);
        return cMatch[1] + '-' + (cNum < 10 ? '0' + cNum : cNum);
    }
    var now = new Date();
    var curM = now.getMonth() + 1;
    return now.getFullYear() + '-' + (curM < 10 ? '0' + curM : curM);
}

function formatMonthLabel(mKey) {
    if (!mKey || mKey === 'all') return 'جميع الشهور';
    if (mKey === 'other') return 'أخرى / بدون شهر';
    var parts = mKey.split('-');
    if (parts.length === 2) {
        var yr = parts[0];
        var mNum = parts[1];
        var mName = ARABIC_MONTH_NAMES[mNum] || mNum;
        return mName + ' ' + yr;
    }
    return mKey;
}

function setTaskMonthFilter(mKey) {
    selectedMonthFilter = mKey || 'all';
    try { localStorage.setItem('tasks_month_filter', selectedMonthFilter); } catch(e){}
    selectedPlanFilter = null;
    renderClientTabs();
    renderTasksBoard();
}
window.setTaskMonthFilter = setTaskMonthFilter;
window.getTaskMonthKey = getTaskMonthKey;
window.formatMonthLabel = formatMonthLabel;

var selectedPlanFilter = null;

var tasksArchiveMode = false;
var tasksArchivedCount = 0;
var tasksActiveCount = 0;

function toggleTasksArchiveMode() {
    tasksArchiveMode = !tasksArchiveMode;
    selectedPlanFilter = null;
    loadTasksEngine();
}

function renderClientTabs() {
    var box = document.getElementById('client-tabs');
    if (!box) return;

    var allTasks = tasksList || [];

    // Extract all distinct months available in tasksList
    var monthsMap = {};
    allTasks.forEach(function(t) {
        var mKey = getTaskMonthKey(t);
        if (mKey) {
            if (!monthsMap[mKey]) monthsMap[mKey] = 0;
            monthsMap[mKey]++;
        }
    });
    var availableMonthKeys = Object.keys(monthsMap).sort().reverse();

    // If selectedMonthFilter is not 'all', filter tasks for plan pills
    var filteredTasksForPlans = allTasks;
    if (selectedMonthFilter && selectedMonthFilter !== 'all') {
        filteredTasksForPlans = allTasks.filter(function(t) {
            return getTaskMonthKey(t) === selectedMonthFilter;
        });
    }

    var plans = {};
    filteredTasksForPlans.forEach(function(t) {
        var p = (t.plan_name || t.file_name || 'خطة عامة').trim();
        if (!plans[p]) plans[p] = { name: p, total: 0, completed: 0, clientName: t.client_name || '' };
        plans[p].total++;
        if (t.status === 'Completed') plans[p].completed++;
    });
    var planNames = Object.keys(plans);

    var html = '<div class="w-full space-y-2.5 pb-2 pt-1">';

    // Row 1: Month Filter Bar & Archive Switcher
    html += '<div class="flex items-center justify-between gap-2 overflow-x-auto pb-1 flex-wrap sm:flex-nowrap bg-slate-50 p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">';
    html += '<div class="flex items-center gap-1.5 overflow-x-auto flex-nowrap shrink-0">';

    // Archive Toggle
    html += '<button type="button" onclick="toggleTasksArchiveMode()" class="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ' +
        (tasksArchiveMode ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '" title="' + (tasksArchiveMode ? 'الرجوع للمهام والخطط النشطة' : 'عرض الخطط والمهام المؤرشفة') + '">' +
        '<span>' + (tasksArchiveMode ? '📦 الأرشيف (مفعّل)' : '📦 عرض الأرشيف') + '</span>' +
        '<span dir="ltr" class="' + (tasksArchiveMode ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900') + ' text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">' + tasksArchivedCount + '</span>' +
    '</button>';

    html += '<span class="text-slate-300">|</span>';
    html += '<span class="text-xs font-bold text-slate-800 flex items-center gap-1">🗓️ فلترة الشهر:</span>';

    // All Months Button
    var isAllMonths = (!selectedMonthFilter || selectedMonthFilter === 'all');
    html += '<button type="button" onclick="setTaskMonthFilter(\'all\')" class="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 ' +
        (isAllMonths ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
        '<span>جميع الشهور</span>' +
        '<span dir="ltr" class="text-[10px] font-mono ' + (isAllMonths ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700') + ' px-1.5 py-0.2 rounded-full font-bold">' + allTasks.length + '</span>' +
    '</button>';

    // Month Pills
    availableMonthKeys.forEach(function(mKey) {
        var isSel = (selectedMonthFilter === mKey);
        var label = formatMonthLabel(mKey);
        var count = monthsMap[mKey] || 0;
        html += '<button type="button" onclick="setTaskMonthFilter(\'' + mKey + '\')" class="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 ' +
            (isSel ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300' : 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200') + '">' +
            '<span>🗓️ ' + esc(label) + '</span>' +
            '<span dir="ltr" class="text-[10px] font-mono ' + (isSel ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800') + ' px-1.5 py-0.2 rounded-full font-bold">' + count + '</span>' +
        '</button>';
    });

    // Quick Month Picker input
    var curValMonth = (selectedMonthFilter && selectedMonthFilter !== 'all' && selectedMonthFilter !== 'other') ? selectedMonthFilter : '';
    html += '<div class="flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">' +
        '<label class="text-[10px] font-bold text-slate-500 whitespace-nowrap">شهر محدد:</label>' +
        '<input type="month" value="' + esc(curValMonth) + '" onchange="setTaskMonthFilter(this.value)" class="text-xs font-bold font-mono text-slate-800 bg-transparent focus:outline-none cursor-pointer" style="color-scheme: light;" />' +
    '</div>';

    html += '</div>';

    // Right Action: Add Plan or Live Refresh
    html += '<div class="flex items-center gap-2 mr-auto shrink-0">';
    if (!tasksArchiveMode) {
        html += '<button type="button" onclick="openPlanBuilderModal()" class="shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-sm transition flex items-center gap-1.5">' +
            ICONS.plus +
            '<span>خطة جديدة بالقالب</span>' +
        '</button>';
    } else {
        html += '<button type="button" onclick="toggleTasksArchiveMode()" class="shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-900 shadow-sm transition flex items-center gap-1.5">' +
            ICONS.restore +
            '<span>العودة للنشطة</span>' +
        '</button>';
    }
    html += '</div>';
    html += '</div>'; // End Row 1

    // Row 2: Plans of the selected month
    html += '<div class="flex items-center justify-between gap-2 overflow-x-auto pb-1 w-full flex-wrap sm:flex-nowrap">';
    html += '<div class="flex items-center gap-2 overflow-x-auto flex-nowrap shrink-0">';

    // All Plans filter button (for this month)
    var allPlansLabel = (selectedMonthFilter && selectedMonthFilter !== 'all') ? 
        ('جميع خطط ' + formatMonthLabel(selectedMonthFilter)) : 
        (tasksArchiveMode ? 'جميع الخطط المؤرشفة' : 'جميع الخطط النشطة');

    html += '<button type="button" onclick="filterTasksByPlan(null)" class="shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-2 ' +
        (!selectedPlanFilter ? (tasksArchiveMode ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-400' : 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300') : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200') + '">' +
        '<span>📁 ' + esc(allPlansLabel) + '</span>' +
        '<span dir="ltr" class="' + (!selectedPlanFilter ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800') + ' text-[11px] px-2 py-0.5 rounded-full font-mono font-bold">' + filteredTasksForPlans.length + '</span>' +
    '</button>';

    if (planNames.length === 0) {
        html += '<span class="text-xs text-slate-500 font-bold px-2 py-1.5 bg-slate-100 rounded-xl">لا توجد خطط مسجلة لهذا الشهر حالياً</span>';
    }

    planNames.forEach(function(pName) {
        var pInfo = plans[pName];
        var isSel = (selectedPlanFilter === pName);
        var cleanTitle = esc(pName).replace(/\.(docx|doc|pdf|txt)$/i, '');
        var escapedPlan = esc(pName).replace(/'/g, "\\'");
        
        var pSampleTask = allTasks.find(function(t){ return (t.plan_name || t.file_name || '').trim() === pName; });
        var pAmName = pSampleTask ? (pSampleTask.am_name || '') : '';
        var amBadge = pAmName ? '<span class="text-[9px] ' + (isSel ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-900') + ' px-1.5 py-0.2 rounded font-medium">👤 ' + esc(pAmName) + '</span>' : '';

        var pillColor = tasksArchiveMode ? 
            (isSel ? 'border-amber-400 bg-amber-600 text-white ring-2 ring-amber-300' : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/80') :
            (isSel ? 'border-purple-300 bg-purple-600 text-white ring-2 ring-purple-300' : 'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100/80');

        html += '<div class="shrink-0 inline-flex items-center rounded-xl overflow-hidden shadow-xs transition border ' + pillColor + '">' +
            '<button type="button" onclick="filterTasksByPlan(\'' + escapedPlan + '\')" class="text-xs font-bold px-3 py-2 flex items-center gap-1.5 text-inherit">' +
                '<span>' + (tasksArchiveMode ? ' ' : ' ') + cleanTitle + '</span>' +
                amBadge +
                '<span dir="ltr" class="text-[11px] font-mono ' + (isSel ? 'bg-white/25 text-white' : (tasksArchiveMode ? 'bg-amber-200 text-amber-950' : 'bg-purple-200 text-purple-950')) + ' px-2 py-0.5 rounded-lg font-bold">' + pInfo.completed + ' / ' + pInfo.total + '</span>' +
            '</button>';

        if (!tasksArchiveMode) {
            // Archive Button on active pill
            html += '<button type="button" onclick="event.stopPropagation(); archivePlanAction(\'' + escapedPlan + '\')" title="أرشفة هذه الخطة (نقلها للأرشيف)" class="px-2.5 py-2 text-xs font-bold opacity-70 hover:opacity-100 hover:bg-amber-600 hover:text-white transition flex items-center justify-center ' + (isSel ? 'text-white border-r border-white/20' : 'text-amber-700 border-r border-purple-200') + '">' +
                ICONS.archive +
            '</button>';
        } else {
            // Restore Button on archived pill
            html += '<button type="button" onclick="event.stopPropagation(); unarchivePlanAction(\'' + escapedPlan + '\')" title="استعادة هذه الخطة للوحة النشطة" class="px-2.5 py-2 text-xs font-bold opacity-70 hover:opacity-100 hover:bg-emerald-600 hover:text-white transition flex items-center justify-center ' + (isSel ? 'text-white border-r border-white/20' : 'text-emerald-700 border-r border-amber-200') + '">' +
                ICONS.restore +
            '</button>';
        }

        // Delete Button
        html += '<button type="button" onclick="event.stopPropagation(); deletePlanAction(\'' + escapedPlan + '\')" title="حذف هذه الخطة بالكامل" class="px-2.5 py-2 text-xs font-bold opacity-60 hover:opacity-100 hover:bg-red-600 hover:text-white transition flex items-center justify-center ' + (isSel ? 'text-white border-r border-white/20' : 'text-purple-700 border-r border-purple-200') + '">' +
            ICONS.trash +
        '</button>' +
        '</div>';
    });
    html += '</div>';

    html += '<div class="flex items-center gap-2 mr-auto shrink-0">';
    if (selectedPlanFilter) {
        var cleanSelTitle = esc(selectedPlanFilter).replace(/\.(docx|doc|pdf|txt)$/i, '');
        var escapedSel = esc(selectedPlanFilter).replace(/'/g, "\\'");
        
        var matchingPlanTasks = (tasksList || []).filter(function(t){ return (t.plan_name || t.file_name) === selectedPlanFilter; });
        var planDriveLink = (matchingPlanTasks.find(function(t){ return t.plan_drive_link || t.drive_plan_url; }) || {}).plan_drive_link || (matchingPlanTasks.find(function(t){ return t.plan_drive_link || t.drive_plan_url; }) || {}).drive_plan_url;
        if (planDriveLink) {
            html += '<a href="' + esc(planDriveLink) + '" target="_blank" class="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-violet-50 text-violet-800 hover:bg-violet-600 hover:text-white border border-violet-200 shadow-sm transition flex items-center gap-1.5" title="فتح ملف الخطة على Google Drive">' +
                '<span>📂 ملف الخطة على Drive ↗</span>' +
            '</a>';
        }

        if (!tasksArchiveMode) {
            html += '<button type="button" onclick="archivePlanAction(\'' + escapedSel + '\')" class="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200 shadow-sm transition flex items-center gap-1.5" title="أرشفة الخطة المحددة">' +
                ICONS.archive +
                '<span>أرشفة الخطة</span>' +
            '</button>';
        } else {
            html += '<button type="button" onclick="unarchivePlanAction(\'' + escapedSel + '\')" class="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 shadow-sm transition flex items-center gap-1.5" title="استعادة الخطة للوحة النشطة">' +
                ICONS.restore +
                '<span>استعادة الخطة للوحة النشطة</span>' +
            '</button>';
        }

        html += '<button type="button" onclick="deletePlanAction(\'' + escapedSel + '\')" class="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 shadow-sm transition flex items-center gap-1.5" title="حذف الخطة المحددة">' +
            ICONS.trash +
            '<span>حذف «' + cleanSelTitle + '»</span>' +
        '</button>';
    }
    
    if (!tasksArchiveMode) {
        html += '<button type="button" onclick="openPlanBuilderModal()" class="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95 shadow-sm transition flex items-center gap-1.5">' +
            ICONS.plus +
            '<span>كتابة خطة جديدة بالقالب</span>' +
        '</button>';
    } else {
        html += '<button type="button" onclick="toggleTasksArchiveMode()" class="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 shadow-sm transition flex items-center gap-1.5">' +
            ICONS.restore +
            '<span>العودة للخطط النشطة</span>' +
        '</button>';
    }
    html += '</div>';
    html += '</div>'; // End Row 2
    html += '</div>'; // End Container

    box.innerHTML = html;
}

function _optimisticallyRemovePlanTasks(planName, cleanTitle) {
    var targetNorm = (cleanTitle || planName).replace(/\.(docx|doc|pdf|txt)$/i, '').trim().toLowerCase();
    tasksList = (tasksList || []).filter(function(t){
        var p = (t.plan_name || t.file_name || '').trim();
        var pNorm = p.replace(/\.(docx|doc|pdf|txt)$/i, '').trim().toLowerCase();
        return p !== planName && pNorm !== targetNorm;
    });
    if (selectedPlanFilter === planName || (selectedPlanFilter && selectedPlanFilter.replace(/\.(docx|doc|pdf|txt)$/i, '').trim() === (cleanTitle || planName))) {
        selectedPlanFilter = null;
    }
}

async function archivePlanAction(planName) {
    if (!planName) return;
    var cleanTitle = planName.replace(/\.(docx|doc|pdf|txt)$/i, '').trim();
    if (!confirm(" هل أنت متأكد من أرشفة خطة «" + cleanTitle + "» ونقلها إلى الأرشيف؟\n\nستختفي من اللوحة اليومية لتتمكن من العمل على خطط الشهر الجديد، وتبقى محفوظة بكافة ملفاتها وسجلاتها في الأرشيف للرجوع إليها بأي وقت.")) {
        return;
    }
    
    // Optimistic removal from active list
    _optimisticallyRemovePlanTasks(planName, cleanTitle);
    tasksArchivedCount++;
    renderClientTabs();
    renderTasksBoard();
    if (typeof showToast === 'function') showToast("جاري نقل الخطة للأرشيف... ", "info");

    try {
        var res = await safeFetchJson('/api/plans/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_name: planName })
        });
        if (res && (res.success || res.ok)) {
            if (typeof showToast === 'function') showToast(res.message || "تمت أرشفة الخطة بنجاح ", "success");
        } else {
            if (typeof showToast === 'function') showToast((res && res.error) || "تعذّر تأكيد الأرشفة", "error");
        }
        await loadTasksEngine();
    } catch(err) {
        console.error("Archive plan error:", err);
        await loadTasksEngine();
    }
}

async function unarchivePlanAction(planName) {
    if (!planName) return;
    var cleanTitle = planName.replace(/\.(docx|doc|pdf|txt)$/i, '').trim();
    if (!confirm("️ هل ترغب في استعادة خطة «" + cleanTitle + "» من الأرشيف وإعادتها للوحة المهام النشطة؟")) {
        return;
    }

    if (typeof showToast === 'function') showToast("جاري استعادة الخطة للوحة النشطة... ️", "info");

    try {
        var res = await safeFetchJson('/api/plans/unarchive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_name: planName })
        });
        if (res && (res.success || res.ok)) {
            if (typeof showToast === 'function') showToast(res.message || "تمت استعادة الخطة بنجاح ️", "success");
        } else {
            if (typeof showToast === 'function') showToast((res && res.error) || "تعذّر استعادة الخطة", "error");
        }
        await loadTasksEngine();
    } catch(err) {
        console.error("Unarchive plan error:", err);
        await loadTasksEngine();
    }
}

async function deletePlanAction(planName) {
    if (!planName) return;
    var cleanTitle = planName.replace(/\.(docx|doc|pdf|txt)$/i, '').trim();
    if (!confirm("️ هل أنت متأكد من حذف الخطة بالكامل: «" + cleanTitle + "» ؟\n\nسيتم حذف جميع المهام التابعة لهذه الخطة نهائياً من قاعدة البيانات وجوجل شيت.")) {
        return;
    }
    
    // 1. Optimistic removal from local state for instant responsiveness
    _optimisticallyRemovePlanTasks(planName, cleanTitle);
    renderClientTabs();
    renderTasksBoard();
    if (typeof showToast === 'function') showToast("تم حذف الخطة محلياً وجاري المزامنة مع السيرفر ️", "info");

    // 2. Sync with Backend
    try {
        var res = await safeFetchJson('/api/plans/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_name: planName, clean_name: cleanTitle })
        });
        if (res && (res.success || res.ok)) {
            if (typeof showToast === 'function') showToast(res.message || "تم حذف الخطة نهائياً من السيرفر بنجاح ️", "success");
        } else {
            if (typeof showToast === 'function') showToast((res && res.error) || "تعذّر تأكيد الحذف من السيرفر", "error");
        }
        await loadTasksEngine();
    } catch(err) {
        console.error("Delete plan error:", err);
        if (typeof showToast === 'function') showToast("حدث خطأ أثناء الاتصال بالسيرفر", "error");
        await loadTasksEngine();
    }
}

function filterTasksByPlan(planName) {
    selectedPlanFilter = planName;
    renderClientTabs();
    renderTasksBoard();
}

async function switchToClient(id) {
    window.activeClientId = id;
    currentClient = id;
    var cSel = document.getElementById('tasks-ingest-client-select');
    if (cSel) {
        cSel.value = id;
        if (typeof onTasksIngestClientSelectChange === 'function') {
            onTasksIngestClientSelectChange(id);
        }
    }
    try { await fetch('/api/settings/active-client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: id }) }); } catch(e){}
    loadTasksEngine();
}

async function loadTasksEngine() {
    renderClientTabs();
    if (typeof loadTasksIngestFields === 'function') loadTasksIngestFields();
    
    var applyTasksData = function(dataTasks, isCached) {
        if (!dataTasks) return;
        tasksList = (dataTasks && dataTasks.tasks) ? dataTasks.tasks : (Array.isArray(dataTasks) ? dataTasks : []);
        tasksArchivedCount = (dataTasks && typeof dataTasks.archived_count !== 'undefined') ? dataTasks.archived_count : (tasksArchivedCount || 0);
        tasksActiveCount = (dataTasks && typeof dataTasks.active_count !== 'undefined') ? dataTasks.active_count : (tasksActiveCount || 0);

        if (selectedPlanFilter && !tasksList.some(function(t){
            var p = (t.plan_name || t.file_name || '').trim();
            return p === selectedPlanFilter;
        })) {
            selectedPlanFilter = null;
        }

        renderClientTabs();
        renderTasksBoard();
        renderEmployeesStatus();
        if (!isCached) {
            setTimeout(function(){ loadTaskMonthlyReport(); }, 50);
        }
    };

    var applyEmpsData = function(dataEmps) {
        if (!dataEmps) return;
        employeesList = (dataEmps && dataEmps.employees) ? dataEmps.employees : (Array.isArray(dataEmps) ? dataEmps : []);
        window.allTeamEmployees = employeesList;
        renderEmployeesStatus();
    };

    try {
        var tasksUrl = '/api/tasks?archived=' + (tasksArchiveMode ? 'true' : 'false');
        var cacheKey = 'tasks_board_' + (tasksArchiveMode ? 'arch' : 'act');
        
        swrFetchJson(tasksUrl, null, cacheKey, function(d, isCached) {
            applyTasksData(d, isCached);
        });
        
        swrFetchJson('/api/tasks/employees', null, 'tasks_employees', function(d, isCached) {
            applyEmpsData(d);
        });
    } catch(e) {
        console.error("Tasks Load Error:", e);
    }
}

async function loadAMWorkspace() {
    try {
        var res = await fetch('/api/am/workspace');
        var data = await res.json();
        if (data.success && data.columns) {
            renderAMWorkspaceColumns(data.columns);
        }
    } catch(e) {
        console.error("AM Workspace Error:", e);
    }
}

function renderAMWorkspaceColumns(columns) {
    var container = document.getElementById('am-workspace-columns');
    if (!container) return;

    if (!columns || columns.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded-2xl w-full">لا توجد عملاء أو مشاريع مسندة لحسابك حالياً. تواصل مع الأدمن لإسناد العملاء </div>';
        return;
    }

    container.innerHTML = columns.map(function(col) {
        var teamHtml = col.team_members && col.team_members.length ?
            col.team_members.map(function(m) { 
                return '<span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100"> ' + esc(m.name) + ' (' + esc(m.role) + ')</span>'; 
            }).join(' ') :
            '<span class="text-[10px] text-slate-400">لم يتم تحديد فريق</span>';

        var stratTitle = (col.strategy && col.strategy.title) ? col.strategy.title : 'إضافة ملف استراتيجية العميل';

        var tasksHtml = col.tasks && col.tasks.length ? col.tasks.map(function(t) {
            var statusClass = t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              t.status === 'Awaiting AM Review' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800';

            var isTimerRunning = t.timer_state && t.timer_state.is_running;
            var timerBtnText = isTimerRunning ? '️ إيقاف وتثبيت الوقت' : ' بدء التوقيت الحي';
            var timerBtnClass = isTimerRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200';

            var driveBtn = t.drive_link ?
                '<a href="' + esc(t.drive_link) + '" target="_blank" class="block text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] py-1 px-2 rounded-lg border border-emerald-200 transition"> فتح الملف في Google Drive (أعلى جودة )</a>' :
                '<button onclick="promptLinkDrive(\'' + esc(t.task_id) + '\')" class="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-1 px-2 rounded-lg border border-slate-200 transition">+ ربط ملف Google Drive عالي الجودة</button>';

            return '<div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2 text-xs">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">' + esc(t.task_id) + '</span>' +
                    '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' + statusClass + '">' + esc(t.status || 'Pending') + '</span>' +
                '</div>' +
                '<h5 class="font-bold text-slate-900 leading-snug">' + esc(t.title) + '</h5>' +
                '<p class="text-[11px] text-slate-600 line-clamp-2">' + esc(t.description || '') + '</p>' +
                '<div class="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] space-y-1">' +
                    '<div class="flex justify-between text-amber-700 font-bold"><span> موعد التسليم:</span><span>' + esc(t.delivery_deadline || t.publish_date || t.scheduled_start_date || 'غير محدد') + '</span></div>' +
                '</div>' +
                '<div class="flex gap-1">' +
                    '<button onclick="toggleTaskTimerAction(\'' + esc(t.task_id) + '\')" class="flex-1 font-bold text-[10px] py-1 px-2 rounded-lg transition ' + timerBtnClass + '">' + timerBtnText + '</button>' +
                '</div>' +
                driveBtn +
            '</div>';
        }).join('') : '<div class="p-4 text-center text-slate-400 text-[11px]">لا توجد مهام لهذا العميل بعد</div>';

        return '<div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3 w-80 shrink-0 shadow-sm">' +
            '<div class="border-b border-slate-200 pb-3 space-y-2">' +
                '<div class="flex items-center justify-between">' +
                    '<h4 class="font-bold text-sm text-slate-900 flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> ' + esc(col.client_name) + '</h4>' +
                    '<div class="flex gap-1">' +
                        '<span class="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">️ ' + (col.total_hours_spent || 0) + 'h</span>' +
                        '<span class="bg-blue-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">' + col.completed_tasks + '/' + col.total_tasks + '</span>' +
                    '</div>' +
                '</div>' +
                '<div><button onclick="promptUploadStrategy(\'' + esc(col.client_id) + '\')" class="w-full text-center bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] py-1 px-2 rounded-lg border border-purple-200 transition"> ' + esc(stratTitle) + '</button></div>' +
                '<div class="flex flex-wrap gap-1">' + teamHtml + '</div>' +
            '</div>' +
            '<div class="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-1">' + tasksHtml + '</div>' +
        '</div>';
    }).join('');
}
async function promptUploadStrategy(clientId) {
    var stratText = prompt("\u0623\u062f\u062e\u0644 \u0646\u0635 \u0627\u0644\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 \u0627\u0644\u062a\u0633\u0648\u064a\u0642\u064a\u0629 \u0627\u0644\u062e\u0627\u0635\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064a\u0644 (\u0633\u064a\u062a\u0645 \u062d\u0641\u0638\u0647\u0627 \u0648\u062a\u063a\u0630\u064a\u0629 \u0627\u0644\u0640 AI RAG \u0628\u0647\u0627 \u0641\u0648\u0631\u0627\u064b):");
    if (!stratText) return;

    var folderUrl = prompt("\u0623\u062f\u062e\u0644 \u0631\u0627\u0628\u0637 \u0645\u062c\u0644\u062f Google Drive \u0627\u0644\u062e\u0627\u0635 \u0628\u0627\u0644\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a):", "");

    try {
        var res = await fetch('/api/clients/' + clientId + '/strategy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'استراتيجية المحتوى والتسويق',
                content: stratText,
                drive_folder: folderUrl || ''
            })
        });
        var data = await res.json();
        if (data.success) {
            showToast('تم حفظ وتفعيل استراتيجية العميل في الـ AI RAG بنجاح ');
            loadAMWorkspace();
        } else {
            showToast(data.error || 'خطأ في حفظ الاستراتيجية', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

async function toggleTaskTimerAction(taskId) {
    try {
        var res = await fetch('/api/tasks/' + taskId + '/timer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle' })
        });
        var data = await res.json();
        if (data.success) {
            showToast(data.timer_state.is_running ? '️ تم بدء تسجيل وقت المهمة!' : '️ تم إيقاف وتثبيت الوقت بنجاح');
            loadTasksEngine();
        } else {
            showToast(data.error || 'خطأ في تشغيل المؤشر', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال', 'error');
    }
}


async function promptLinkDrive(taskId) {
    var driveUrl = prompt("أدخل رابط مجلد أو ملف Google Drive (High-Res Assets):");
    if (!driveUrl) return;
    try {
        var res = await fetch('/api/drive/asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, drive_link: driveUrl })
        });
        var data = await res.json();
        if (data.success) {
            showToast('تم ربط ملف Google Drive بنجاح ');
            loadTasksEngine();
        } else {
            showToast(data.error || 'خطأ في ربط الملف', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

// show a date only if it's a real YYYY-MM-DD, otherwise a clean placeholder
function fmtDate(d) {
    d = (d || '').toString().trim();
    return /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : '—';
}
// Google Drive direct links don't render in <img>; convert to the thumbnail endpoint
function driveThumb(u) {
    u = (u || '').toString();
    if (!/drive\.google\.com|googleusercontent\.com/.test(u)) return u;
    var m = u.match(/\/file\/d\/([^/]+)/) || u.match(/[?&]id=([^&]+)/) || u.match(/thumbnail\?id=([^&]+)/);
    return m ? ('https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w600') : u;
}
// value for <input type=date> — only a valid YYYY-MM-DD, else empty
function isoDate(d) {
    d = (d || '').toString().trim();
    return /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : '';
}

function fmtCairoTime(isoStr) {
    if (!isoStr) return '';
    try {
        var d = new Date(isoStr);
        if (isNaN(d.getTime())) return String(isoStr).slice(0, 19).replace('T', ' ');
        return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
               d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch(e) {
        return String(isoStr).slice(0, 19).replace('T', ' ');
    }
}

function toggleTaskTimeline(boxId) {
    var box = document.getElementById(boxId);
    var arrow = document.getElementById('arrow-' + boxId);
    if (!box) return;
    if (box.classList.contains('hidden')) {
        box.classList.remove('hidden');
        if (arrow) arrow.textContent = '▲';
    } else {
        box.classList.add('hidden');
        if (arrow) arrow.textContent = '▼';
    }
}

function copyTaskDriveLink(link) {
    if (!link) {
        if (typeof showToast === 'function') showToast('لا يوجد رابط درايف مسجل لهذه المهمة');
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(function() {
            if (typeof showToast === 'function') showToast('تم نسخ رابط Google Drive بنجاح ');
        }).catch(function() {
            fallbackCopyText(link);
        });
    } else {
        fallbackCopyText(link);
    }
}

function fallbackCopyText(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        if (typeof showToast === 'function') showToast('تم نسخ رابط Google Drive بنجاح ');
    } catch(e) {}
    document.body.removeChild(ta);
}
// AM sets start / publish / deadline for a task
async function saveTaskDates(taskId) {
    var g = function(id){ var e = document.getElementById(id); return e ? e.value : ''; };
    var dDead = g('d-dead-' + taskId);
    var body = {
        delivery_deadline: dDead,
        scheduled_start_date: dDead,
        publish_date: dDead,
        publish_time: '10:00'
    };
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/dates', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        var data = await res.json();
        if (res.ok && data.ok) { showToast('تم حفظ موعد التسليم بنجاح '); loadTasksEngine(); }
        else showToast(data.error || 'تعذّر الحفظ', 'error');
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

function copyTaskCaption(taskId, btn) {
    var t = (tasksList || []).find(function(x){ return String(x.task_id || x.id) === String(taskId); }) ||
            (window._myPortalTasksList || []).find(function(x){ return String(x.task_id || x.id) === String(taskId); });
    if (!t) return;
    var rawCaption = (t.caption || (t.content_data && t.content_data.caption) || t.description || '').trim();
    var cleanCaption = rawCaption.replace(/^(كابشن|الكابشن|نص المنشور|نص البوست|الكابشن النهائي|Caption)\s*[:：\-–—]\s*/i, '').trim();
    if (!cleanCaption) {
        showToast('لا يوجد كابشن لنسخه', 'error');
        return;
    }
    var triggerBtnFeedback = function() {
        if (btn && btn.tagName === 'BUTTON') {
            var oldText = btn.innerHTML;
            btn.innerHTML = '✓ تم النسخ!';
            btn.classList.add('bg-emerald-100', 'text-emerald-800', 'border-emerald-300');
            setTimeout(function() {
                btn.innerHTML = oldText;
                btn.classList.remove('bg-emerald-100', 'text-emerald-800', 'border-emerald-300');
            }, 1800);
        }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cleanCaption).then(function() {
            showToast('تم نسخ الكابشن النهائي إلى الحافظة 📋');
            triggerBtnFeedback();
        }).catch(function() {
            prompt('انسخ الكابشن:', cleanCaption);
        });
    } else {
        prompt('انسخ الكابشن:', cleanCaption);
    }
}
window.copyTaskCaption = copyTaskCaption;
function empOptionsHtml(selectedId) {
    var team = (window.allTeamEmployees && window.allTeamEmployees.length) ? window.allTeamEmployees : (employeesList || []);
    return team.map(function(e) {
        var sel = (String(e.employee_id) === String(selectedId)) ? ' selected' : '';
        return '<option value="' + esc(e.employee_id) + '"' + sel + '>' + esc(e.name) + (e.role ? ' — ' + esc(e.role) : '') + '</option>';
    }).join('');
}

var selectedAMFilter = null;
var selectedAMName = '';

function toggleAMFilter(amId, amName) {
    if (selectedAMFilter === amId) {
        selectedAMFilter = null;
        selectedAMName = '';
    } else {
        selectedAMFilter = amId;
        selectedAMName = amName;
    }
    renderTasksBoard();
}

function clearAMFilter() {
    selectedAMFilter = null;
    selectedAMName = '';
    renderTasksBoard();
}

var currentTaskSort = 'sequence'; // 'sequence' | 'pub_date' | 'deadline' | 'status' | 'task_id' | 'created_at'
var currentTaskSortDir = 'asc'; // 'asc' | 'desc'
var currentTaskStatusFilter = 'all'; // 'all' | 'in_progress' | 'review' | 'pending' | 'completed'
var taskSearchQuery = '';

function setTaskSort(sortKey) {
    if (currentTaskSort === sortKey) {
        currentTaskSortDir = (currentTaskSortDir === 'asc') ? 'desc' : 'asc';
    } else {
        currentTaskSort = sortKey;
        currentTaskSortDir = (sortKey === 'created_at') ? 'desc' : 'asc';
    }
    renderTasksBoard();
}

function matchTaskStatus(taskStatus, filterKey) {
    if (!filterKey || filterKey === 'all') return true;
    var st = String(taskStatus || '').trim().toLowerCase();
    if (filterKey === 'in_progress') {
        return st === 'in progress' || st === 'assigned' || st.indexOf('progress') !== -1 || st.indexOf('جاري') !== -1 || st.indexOf('مسند') !== -1;
    }
    if (filterKey === 'review') {
        return st === 'awaiting am review' || st === 'submitted / in review' || st === 'submitted' || st === 'in review' || st === 'review' || st.indexOf('review') !== -1 || st.indexOf('مراجعة') !== -1;
    }
    if (filterKey === 'pending') {
        return !st || st === 'pending am approval' || st === 'pending' || st === 'unassigned' || st.indexOf('إسناد') !== -1 || st.indexOf('بانتظار') !== -1;
    }
    if (filterKey === 'completed') {
        return st === 'completed' || st.indexOf('approved') !== -1 || st.indexOf('مكتمل') !== -1 || st.indexOf('معتمد') !== -1;
    }
    return true;
}

function setTaskStatusFilter(statusKey) {
    currentTaskStatusFilter = statusKey;
    renderTasksBoard();
}

function onTaskSearchInput(query) {
    taskSearchQuery = (query || '').trim().toLowerCase();
    renderTasksBoard();
}

window.matchTaskStatus = matchTaskStatus;
window.setTaskStatusFilter = setTaskStatusFilter;
window.setTaskSort = setTaskSort;
window.onTaskSearchInput = onTaskSearchInput;

function getTaskSequenceNum(t) {
    if (!t) return 999999;
    if (t.post_number !== undefined && t.post_number !== null && !isNaN(parseInt(t.post_number, 10)) && parseInt(t.post_number, 10) > 0) {
        return parseInt(t.post_number, 10);
    }
    var title = String(t.title || '');
    var caption = String(t.caption || '');
    var task_id = String(t.task_id || '');
    
    // 1. Match Post / بوست / منشور followed by digits
    var m = title.match(/(?:بوست|منشور|post|item|تاسك|مهمة|#)\s*(\d+)/i) || 
            caption.match(/(?:بوست|منشور|post|item|تاسك|مهمة|#)\s*(\d+)/i) ||
            title.match(/^(\d+)[\.\-\:\s]/);
    if (m && m[1]) return parseInt(m[1], 10);
    
    // 2. Arabic textual numbers
    var ordMap = {
        'الاول': 1, 'الاولى': 1, 'الأول': 1, 'الأولى': 1,
        'الثاني': 2, 'الثانية': 2, 'الثالث': 3, 'الثالثة': 3,
        'الرابع': 4, 'الرابعة': 4, 'الخامس': 5, 'الخامسة': 5,
        'السادس': 6, 'السادسة': 6, 'السابع': 7, 'السابعة': 7,
        'الثامن': 8, 'الثامنة': 8, 'التاسع': 9, 'التاسعة': 9,
        'العاشر': 10, 'العاشرة': 10,
        'الحادي عشر': 11, 'الحادية عشر': 11, 'الثاني عشر': 12, 'الثانية عشر': 12
    };
    for (var word in ordMap) {
        if (title.indexOf(word) !== -1) return ordMap[word];
    }
    
    // 3. Fallback to numeric value in TASK-xxxx
    var mTid = task_id.match(/TASK-(\d+)/i) || task_id.match(/\d+/);
    if (mTid && mTid[1]) return parseInt(mTid[1], 10);
    
    return 1;
}

function renderTaskCard(t, indexInPlan) {
    var st = t.status || 'Pending AM Approval';
    var isSubmitted = (st === 'Awaiting AM Review' || st === 'Submitted / In Review' || st === 'Submitted' || st === 'Review Required');
    var isCompleted = (st === 'Completed' || st === 'Approved / Scheduled' || st === 'Done');
    var statusBadgeClass = isCompleted ? 'bg-emerald-100 text-emerald-800' :
                           st === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                           isSubmitted ? 'bg-purple-100 text-purple-800 font-bold animate-pulse' :
                           st === 'Assigned' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800';
    var stLabel = isCompleted ? 'مكتملة ومعتمدة ' : st === 'In Progress' ? 'جاري العمل ' :
                  isSubmitted ? 'تم التسليم / بانتظار مراجعتك ' : st === 'Assigned' ? 'مُسندة ' : 'بانتظار الإسناد ';

    var cleanAM = (t.am_name || '').trim();
    if (!cleanAM || cleanAM === 'EMP-001' || cleanAM === 'EMP-001-AM' || t.am_id === 'EMP-001' || t.am_id === 'EMP-001-AM') {
        cleanAM = 'محمود خالد';
    }
    var amTag = '<div class="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">' +
        '<span> AM:</span> <span class="text-indigo-900">' + esc(cleanAM) + '</span>' +
    '</div>';

    var clientTag = (t.client_name && t.client_name !== 'None' && t.client_name !== 'null' && t.client_name !== 'عميل عام') ?
        '<div class="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">' +
            '<span>🏢 ' + esc(t.client_name) + '</span>' +
        '</div>' : '';

    // 1) Reference images (strictly from docx / plan brief)
    var refs = (t.content_data && t.content_data.reference_images && t.content_data.reference_images.length) ? t.content_data.reference_images :
               (t.graphic_data && t.graphic_data.reference_images && t.graphic_data.reference_images.length) ? t.graphic_data.reference_images :
               (t.media_urls && t.media_urls.length) ? t.media_urls : [];
    var refsHtml = refs.length ? '<div class="bg-blue-50/60 border border-blue-200/70 rounded-xl p-2.5 space-y-1.5 shadow-2xs">' +
        '<div class="text-[10px] font-bold text-blue-900 flex items-center gap-1">🖼️ صور ومراجع البوست (من الخطة / الريفرانس):</div>' +
        '<div class="flex gap-1.5 flex-wrap pt-0.5">' + refs.slice(0, 6).map(function(u, rIdx) {
            var isData = u.startsWith('data:image/');
            var thumbSrc = isData ? u : driveThumb(u);
            return '<a href="' + esc(u) + '" target="_blank" class="block w-14 h-14 rounded-xl border border-blue-200 overflow-hidden bg-white shadow-2xs hover:scale-105 transition" title="مرجع ' + (rIdx + 1) + '"><img src="' + esc(thumbSrc) + '" class="w-full h-full object-cover" loading="lazy" onerror="this.parentNode.innerHTML=\'🖼️\'"></a>';
        }).join('') + (refs.length > 6 ? '<span class="text-[10px] text-blue-500 self-center font-bold">+' + (refs.length - 6) + '</span>' : '') + '</div></div>' : '';

    // 2) Reference links (Pinterest, Behance, YouTube, Facebook, Instagram, TikTok, Drive)
    var refLinks = (t.reference_links && t.reference_links.length) ? t.reference_links :
                   (t.content_data && t.content_data.reference_links && t.content_data.reference_links.length) ? t.content_data.reference_links :
                   (t.graphic_data && t.graphic_data.reference_links && t.graphic_data.reference_links.length) ? t.graphic_data.reference_links :
                   (t.video_data && t.video_data.reference_links && t.video_data.reference_links.length) ? t.video_data.reference_links :
                   (t.media_urls && t.media_urls.length) ? t.media_urls.filter(function(u){ return String(u).startsWith('http') && !/\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(u); }) : [];
                   
    var links = refLinks.length ?
        '<div class="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">' +
        refLinks.slice(0, 6).map(function(u, idx) {
            var uLow = String(u).toLowerCase();
            var label = uLow.includes('drive.google') ? ('📁 ملف Drive ' + (idx + 1)) :
                        uLow.includes('pinterest') || uLow.includes('pin.it') ? '📌 Pinterest' :
                        uLow.includes('facebook.com') || uLow.includes('fb.watch') ? '📹 فيديو Facebook' :
                        uLow.includes('instagram.com') ? '📸 Instagram Reels' :
                        uLow.includes('tiktok.com') ? '🎵 TikTok' :
                        uLow.includes('youtube') || uLow.includes('youtu.be') ? '🎬 YouTube' :
                        uLow.includes('behance') ? '🎨 Behance' : ('🔗 ريفرنس ' + (idx + 1));
            return '<a href="' + esc(u) + '" target="_blank" class="inline-flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-violet-200 transition shadow-2xs hover:border-violet-300">' + esc(label) + ' ↗</a>';
        }).join('') + (refLinks.length > 6 ? '<span class="text-[10px] text-violet-500 font-bold">+' + (refLinks.length - 6) + '</span>' : '') + '</div>' : '';

    // 3) Creative Brief & Visual Idea (فكرة وتوجيهات التصميم / الإسكربت)
    var visIdea = (t.visual_idea || (t.content_data && t.content_data.visual_idea) || (t.graphic_data && t.graphic_data.idea) || (t.video_data && t.video_data.idea) || t.design_brief || '').trim();
    visIdea = visIdea.replace(/^[>›»\s*#\-–—:]+/i, '').replace(/^(brief|creative brief|فكرة البوست|توجيه التصميم)\s*[:：\-–—]\s*/i, '').trim();
    var isVisDup = !visIdea || visIdea === t.title || visIdea === cleanCaption || cleanCaption.includes(visIdea) || visIdea.includes(cleanCaption);
    var visHtml = (!isVisDup) ?
        '<div class="bg-purple-50/80 border border-purple-200/80 rounded-xl p-2.5 text-xs text-purple-950 space-y-1 shadow-2xs">' +
            '<div class="font-bold text-[11px] text-purple-900 flex items-center gap-1">' +
                '<span>💡 فكرة وتوجيهات التصميم</span>' +
                '<span dir="ltr" class="text-[10px] text-purple-600 font-mono font-normal">(Creative Brief)</span>' +
            '</div>' +
            '<div dir="rtl" class="leading-relaxed text-[11px] whitespace-pre-wrap font-medium text-right">' + esc(visIdea) + '</div>' +
        '</div>' : '';

    // 4) Modification Requests & Notes (طلبات التعديل والملاحظات)
    var modNotes = (t.review_note || t.modification_request || t.changes_requested_note || t.task_notes || '').trim();
    var modHtml = modNotes ?
        '<div class="bg-rose-50/90 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-950 space-y-1 shadow-2xs">' +
            '<div class="font-bold text-[11px] text-rose-800 flex items-center justify-between">' +
                '<span class="flex items-center gap-1">✍️ طلبات التعديل والملاحظات:</span>' +
                '<button type="button" onclick="openTaskNotesEditorModal(\'' + escJs(t.task_id) + '\')" class="text-[10px] text-rose-700 hover:text-rose-900 underline font-bold cursor-pointer">تعديل</button>' +
            '</div>' +
            '<div class="leading-relaxed text-[11px] whitespace-pre-wrap font-semibold">' + esc(modNotes) + '</div>' +
        '</div>' : '';

    // 5) Employee Deliverables (ZERO bleed from references! Carousel & Multi-File Aware)
    var rawNotes = (t.delivery_notes || t.deliverables_notes || (t.status === 'Submitted / In Review' ? t.notes : '') || '').trim();
    var driveLink = (t.drive_link || t.google_drive_url || t.submission_link || '').trim();
    var delivList = Array.isArray(t.deliverables) ? t.deliverables : [];

    var isTimerRunning = !!(t.timer_state && t.timer_state.is_running);
    var elapsedSecs = t.timer_state ? (t.timer_state.elapsed_seconds || 0) : 0;
    var elapsedMins = Math.round(elapsedSecs / 60);
    var isSubmitted = (t.status === 'Submitted / In Review' || t.status === 'Awaiting AM Review' || t.status === 'Completed' || t.status === 'Approved / Scheduled');

    var deliverablesBox = '';
    if (delivList.length > 0 || driveLink || rawNotes || isTimerRunning || (elapsedMins > 0 && isSubmitted) || (t.submitted_at && isSubmitted)) {
        var timerTag = isTimerRunning ?
            '<span class="bg-amber-500 text-white animate-pulse px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">⏱️ جاري العمل الآن</span>' :
            (elapsedMins > 0 ? '<span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">⏱️ ' + elapsedMins + ' دقيقة</span>' : '');

        deliverablesBox = '<div class="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200 rounded-xl p-2.5 text-xs space-y-2 shadow-xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-emerald-950 border-b border-emerald-100 pb-1">' +
                '<span class="flex items-center gap-1">📦 تسليمات وإنجاز الموظف:</span>' +
                timerTag +
            '</div>';

        // Multi-file Carousel Deliverables Gallery
        if (delivList.length > 0) {
            deliverablesBox += '<div class="space-y-1.5">' +
                '<div class="text-[10px] font-bold text-emerald-900 flex items-center justify-between">' +
                    '<span>📁 ملفات وسلايدات التسليم (' + delivList.length + ' ملف):</span>' +
                    '<span class="bg-emerald-200 text-emerald-950 px-1.5 py-0.2 rounded-full font-bold text-[9px]">جاهز للمعاينة ↗</span>' +
                '</div>' +
                '<div class="grid grid-cols-2 gap-1.5">';
            delivList.forEach(function(df, dfIdx) {
                var dUrl = df.url || df.drive_link || df;
                var dName = df.filename || ('سلايد #' + (dfIdx + 1));
                var isVid = (df.mime && df.mime.startsWith('video')) || /\.(mp4|mov|webm)(\?|$)/i.test(dName);
                deliverablesBox += '<a href="' + esc(dUrl) + '" target="_blank" class="bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded-lg p-1.5 text-right transition flex items-center gap-1.5 shadow-2xs group">' +
                    '<span class="text-sm shrink-0">' + (isVid ? '🎬' : '🖼️') + '</span>' +
                    '<div class="min-w-0 flex-1">' +
                        '<div class="font-bold text-[10px] text-slate-800 truncate group-hover:text-emerald-900">' + esc(dName) + '</div>' +
                        '<div class="text-[9px] text-emerald-700 font-mono">فتح على Drive ↗</div>' +
                    '</div>' +
                '</a>';
            });
            deliverablesBox += '</div></div>';
        }

        if (driveLink && !delivList.some(function(d){ return (d.url || d) === driveLink; })) {
            var viewUrl = formatGoogleDriveViewLink(driveLink);
            var isVid = (t.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(driveLink) || viewUrl.includes('/file/d/'));
            deliverablesBox += '<div class="bg-white/90 border border-emerald-200 rounded-xl p-2 space-y-1.5 shadow-2xs">' +
                '<div class="flex items-center justify-between gap-1 flex-wrap">' +
                    '<span class="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">' + (isVid ? '🎬 فيديو المخرجات على Drive:' : '📁 رابط مجلد/ملف التسليم:') + '</span>' +
                    '<span class="bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">جاهز للمعاينة ↗</span>' +
                '</div>' +
                '<div class="flex items-center gap-1.5">' +
                    '<a href="' + esc(viewUrl) + '" target="_blank" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs">' +
                        '<span>' + (isVid ? '▶️ تشغيل الفيديو على Google Drive ↗️' : '↗️ فتح ملف/مجلد التسليم ↗️') + '</span>' +
                    '</a>' +
                    '<button type="button" onclick="copyTaskDriveLink(\'' + esc(viewUrl) + '\')" class="bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] py-1.5 px-3 rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-xs">' +
                        '<span>📋 نسخ</span>' +
                    '</button>' +
                '</div>' +
                '<div class="text-[10px] font-mono text-slate-500 truncate bg-white/80 p-1.5 rounded-md border border-emerald-100 select-all" title="' + esc(viewUrl) + '">' + esc(viewUrl) + '</div>' +
            '</div>';
        }

        if (rawNotes) {
            deliverablesBox += '<div class="bg-white/90 p-2 rounded-lg border border-emerald-100 text-[11px] text-slate-800 space-y-0.5">' +
                '<div class="font-bold text-[10px] text-emerald-800">📝 ملاحظات الموظف عند التسليم:</div>' +
                '<div class="whitespace-pre-wrap leading-relaxed font-medium">' + esc(rawNotes) + '</div>' +
            '</div>';
        }

        deliverablesBox += '</div>';
    }

    var postSeq = (indexInPlan !== undefined && indexInPlan !== null) ? indexInPlan : (t.post_number_in_plan || t.post_number || 1);
    var postBadge = '<span class="bg-blue-600 hover:bg-blue-700 text-white font-bold font-mono text-xs px-2.5 py-0.5 rounded-lg shadow-xs inline-flex items-center gap-0.5 border border-blue-500/50" title="ترتيب البوست في الخطة (بوست #' + postSeq + ')"><span>#</span><span>' + postSeq + '</span></span>';

    var displayTitle = (t.title || t.tagline || t.tag_line || '').trim();
    if (!displayTitle || displayTitle === 'منشور جديد' || /^منشور\s*#?\s*\d*$/i.test(displayTitle) || /^بوست\s*#?\s*\d*$/i.test(displayTitle)) {
        if (t.tagline && t.tagline !== displayTitle && !/^منشور/i.test(t.tagline)) {
            displayTitle = t.tagline;
        } else if (t.caption) {
            var firstLine = t.caption.split('\n')[0].trim();
            if (firstLine) displayTitle = firstLine.slice(0, 100);
        } else if (t.visual_idea) {
            displayTitle = t.visual_idea.slice(0, 100);
        }
    }
    // Clean and extract pure final caption
    var rawCaption = (t.caption || (t.content_data && t.content_data.caption) || t.description || '').trim();
    var cleanCaption = rawCaption.replace(/^(كابشن|الكابشن|نص المنشور|نص البوست|الكابشن النهائي|Caption)\s*[:：\-–—]\s*/i, '').trim();

    var captionHtml = '';
    if (cleanCaption) {
        captionHtml = '<div class="bg-blue-50/50 border border-blue-200/90 rounded-2xl p-3 text-xs space-y-2 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-blue-950 border-b border-blue-200/60 pb-1.5">' +
                '<span class="flex items-center gap-1.5 text-blue-900 font-bold">' +
                    '<span class="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0"></span>' +
                    '<span>📝 الكابشن النهائي</span>' +
                    '<span dir="ltr" class="text-[10px] text-blue-600 font-mono font-normal">(Final Caption)</span>' +
                '</span>' +
                '<button type="button" onclick="copyTaskCaption(\'' + escJs(t.task_id) + '\')" class="bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold py-1 px-2 rounded-lg border border-blue-200 shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0" title="نسخ الكابشن النهائي">' +
                    '<span>📋 نسخ</span>' +
                '</button>' +
            '</div>' +
            '<div dir="rtl" class="text-xs text-slate-900 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed font-sans select-all bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs text-right">' +
                esc(cleanCaption) +
            '</div>' +
        '</div>';
    }

    var html = '<div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3">' +
        '<div class="flex items-center justify-between gap-1 flex-wrap">' +
            '<div class="flex items-center gap-1.5 flex-wrap">' +
                postBadge +
                '<span class="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-lg">' + esc(t.task_id) + '</span>' +
                '<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ' + statusBadgeClass + '">' + stLabel + '</span>' +
                clientTag +
            '</div>' +
            '<div class="flex items-center gap-1.5">' +
                amTag +
                '<button onclick="deleteTaskAction(\'' + escJs(t.task_id) + '\')" title="حذف المهمة" class="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer flex items-center justify-center">' + ICONS.trash + '</button>' +
            '</div>' +
        '</div>' +
        '<h4 class="font-bold text-sm text-slate-900 leading-snug">' + esc(displayTitle) + '</h4>' +
        captionHtml +
        visHtml +
        modHtml +
        refsHtml + links +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">' +
            '<button type="button" onclick="openTaskContentEditorModal(\'' + escJs(t.task_id) + '\')" class="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-amber-200 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer">' +
                ICONS.edit +
                '<span>تعديل نصوص وكابشن البوست</span>' +
            '</button>' +
            '<button type="button" onclick="openTaskNotesEditorModal(\'' + escJs(t.task_id) + '\')" class="w-full bg-rose-50 hover:bg-rose-100 text-rose-900 text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-rose-200 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer">' +
                '<span>✍️ إضافة ملاحظة / طلب تعديل</span>' +
            '</button>' +
        '</div>';

    // Delivery Deadline Date with Smart Visual Urgency
    var dDead = (t.delivery_deadline || t.publish_date || t.scheduled_start_date || '').trim();
    var deadlineBoxClass = 'bg-slate-50 border-slate-200';
    var deadlineBadgeHtml = '';

    if (dDead) {
        var todayStr = new Date().toISOString().slice(0, 10);
        var tomDate = new Date();
        tomDate.setDate(tomDate.getDate() + 1);
        var tomorrowStr = tomDate.toISOString().slice(0, 10);

        if (t.status === 'Completed') {
            deadlineBoxClass = 'bg-emerald-50/40 border-emerald-200';
            deadlineBadgeHtml = '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">✅ مكتمل</span>';
        } else if (dDead < todayStr) {
            deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
            deadlineBadgeHtml = '<span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">🚨 متأخر عن الموعد!</span>';
        } else if (dDead === todayStr) {
            deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
            deadlineBadgeHtml = '<span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">⏰ تسليم اليوم!</span>';
        } else if (dDead === tomorrowStr) {
            deadlineBoxClass = 'bg-amber-50/60 border-amber-300';
            deadlineBadgeHtml = '<span class="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">⏳ تسليم غداً</span>';
        } else {
            deadlineBadgeHtml = '<span class="text-[10px] text-slate-500 font-mono font-normal">(' + esc(dDead) + ')</span>';
        }
    }

    html += '<div class="' + deadlineBoxClass + ' p-2.5 rounded-2xl border text-xs space-y-1.5 shadow-2xs transition">' +
        '<div class="flex items-center justify-between gap-1 mb-1">' +
            '<span class="text-[11px] text-amber-950 font-bold flex items-center gap-1.5">' +
                ICONS.calendar + ' <span>موعد التسليم:</span>' +
            '</span>' +
            deadlineBadgeHtml +
        '</div>' +
        '<div class="flex items-center gap-1.5">' +
            '<input type="date" id="d-dead-' + esc(t.task_id) + '" value="' + esc(dDead) + '" onchange="saveTaskDates(\'' + escJs(t.task_id) + '\')" class="flex-1 min-w-0 text-xs font-bold font-mono px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white text-slate-950 focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer" style="color-scheme: light;">' +
            '<button onclick="saveTaskDates(\'' + escJs(t.task_id) + '\')" class="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap shadow-xs cursor-pointer transition flex items-center gap-1 shrink-0" title="حفظ موعد التسليم">' +
                ICONS.save +
                '<span>حفظ</span>' +
            '</button>' +
        '</div>' +
    '</div>';

    // Deliverables section
    if (deliverablesBox) {
        html += deliverablesBox;
    }

    // Upload & Reference from device & link
    html += '<div class="space-y-1.5 pt-1">' +
        '<div class="grid grid-cols-2 gap-1.5">' +
            '<button type="button" onclick="openDeliverableModal(\'' + escJs(t.task_id) + '\', \'' + escJs(driveLink||'') + '\')" class="text-center bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-sky-200 shadow-xs flex items-center justify-center gap-1 transition cursor-pointer">' +
                ICONS.upload +
                '<span>تسليم العمل / Drive</span>' +
            '</button>' +
            '<label class="text-center cursor-pointer bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-violet-200 shadow-xs flex items-center justify-center gap-1 transition">' +
                ICONS.plus +
                '<span>ريفرانس من الجهاز</span>' +
                '<input type="file" accept="image/*,video/*,.pdf,.doc,.docx" class="hidden" onchange="uploadTaskReferenceFile(\'' + escJs(t.task_id) + '\', this)">' +
            '</label>' +
        '</div>' +
        '<div class="text-center">' +
            '<button type="button" onclick="promptAddLinkReference(\'' + escJs(t.task_id) + '\')" class="text-[10px] text-violet-600 hover:text-violet-800 hover:underline font-bold transition cursor-pointer inline-flex items-center gap-1">' +
                ICONS.link +
                '<span>إضافة رابط مرجعي خارجي (URL Reference)</span>' +
            '</button>' +
        '</div>' +
    '</div>';

    if (t.review_note) {
        html += '<div class="bg-purple-50 p-2 rounded-xl text-[11px] text-purple-700 border border-purple-100"> ملاحظة المراجعة السابقة: ' + esc(t.review_note) + '</div>';
    }

    // Activity Log & Timeline (سجل النشاط وحساب الـ KPIs)
    var logEntries = (t.activity_log && t.activity_log.length) ? t.activity_log : ((t.stage_history && t.stage_history.length) ? t.stage_history : []);
    
    // Construct synthetic log entries if legacy task doesn't have activity_log yet
    if (!logEntries.length) {
        logEntries = [];
        if (t.created_at) {
            logEntries.push({
                action: 'created',
                time_cairo: fmtCairoTime(t.created_at),
                actor_name: t.am_name || 'مدير الحساب',
                note: 'إنشاء المهمة'
            });
        }
        if (t.assigned_at && t.assignee_name) {
            logEntries.push({
                action: 'assigned',
                time_cairo: fmtCairoTime(t.assigned_at),
                actor_name: t.am_name || 'مدير الحساب',
                target_employee_name: t.assignee_name,
                note: 'إسناد المهمة إلى ' + t.assignee_name
            });
        }
        if (t.started_at) {
            logEntries.push({
                action: 'started',
                time_cairo: fmtCairoTime(t.started_at),
                actor_name: t.assignee_name || 'الموظف',
                note: 'بدء العمل وتشغيل التايمر'
            });
        }
        if (t.submitted_at) {
            logEntries.push({
                action: 'submitted',
                time_cairo: fmtCairoTime(t.submitted_at),
                actor_name: t.assignee_name || 'الموظف',
                note: t.notes || 'تسليم المهمة لمدير الحساب',
                details: { drive_link: t.drive_link }
            });
        }
        if (t.completed_at) {
            logEntries.push({
                action: 'reviewed_approved',
                time_cairo: fmtCairoTime(t.completed_at),
                actor_name: t.am_name || 'مدير الحساب',
                note: 'اعتماد نهائي وجدولة النشر'
            });
        }
    }

    var kpisHtml = '';
    var kpis = t.kpis || {};
    var hasKpis = (t.assigned_at && (t.submitted_at || t.status === 'Completed' || t.status === 'Awaiting AM Review')) || (kpis && kpis.turnaround_hours !== undefined);
    
    if (hasKpis) {
        var turnaroundText = '';
        if (kpis && kpis.turnaround_hours !== undefined) {
            var th = kpis.turnaround_hours;
            turnaroundText = th < 1 ? (Math.round(th * 60) + ' دقيقة') : (th + ' ساعة');
        } else if (t.assigned_at && t.submitted_at) {
            var diffMs = new Date(t.submitted_at) - new Date(t.assigned_at);
            if (diffMs > 0) {
                var diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
                turnaroundText = diffHrs < 1 ? (Math.round(diffMs / 60000) + ' دقيقة') : (diffHrs + ' ساعة');
            }
        }
        
        var isOnTime = kpis ? kpis.is_on_time : undefined;
        if (isOnTime === undefined && t.delivery_deadline && t.submitted_at) {
            var dl = String(t.delivery_deadline).slice(0, 10);
            var sub = String(t.submitted_at).slice(0, 10);
            isOnTime = sub <= dl;
        }

        var kpiBadge = isOnTime === true ?
            '<span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0"> تم التسليم في الموعد</span>' :
            (isOnTime === false ?
                '<span class="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0">️ تأخير عن موعد التسليم</span>' : '');

        kpisHtml = '<div class="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5 text-xs space-y-1.5 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-indigo-900 border-b border-indigo-100 pb-1">' +
                '<span class="flex items-center gap-1"> تقرير الـ KPIs والسرعة:</span>' +
                kpiBadge +
            '</div>' +
            '<div class="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 pt-0.5">' +
                '<div> المسلم: <b class="text-indigo-950">' + esc(t.am_name || 'مدير الحساب') + '</b></div>' +
                '<div> المستلم: <b class="text-indigo-950">' + esc(t.assignee_name || 'غير محدد') + '</b></div>' +
                (t.assigned_at ? '<div> تاريخ الإسناد: <span class="font-mono text-[10px] block text-slate-600">' + esc(fmtCairoTime(t.assigned_at)) + '</span></div>' : '') +
                (t.submitted_at ? '<div> تاريخ التسليم: <span class="font-mono text-[10px] block text-slate-600">' + esc(fmtCairoTime(t.submitted_at)) + '</span></div>' : '') +
                (turnaroundText ? '<div class="col-span-2 text-indigo-900 font-bold bg-white/80 px-2 py-1 rounded-lg border border-indigo-100 flex items-center justify-between mt-1"><span>️ مدة إنجاز الموظف:</span><span class="font-mono text-xs text-indigo-700">' + turnaroundText + '</span></div>' : '') +
            '</div>' +
        '</div>';
    }

    var timelineLogHtml = '';
    if (logEntries.length > 0) {
        var logId = 'log-box-' + esc(t.task_id);
        timelineLogHtml = '<div class="pt-0.5">' +
            '<button type="button" onclick="toggleTaskTimeline(\'' + esc(logId) + '\')" class="w-full text-right bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition">' +
                '<span class="flex items-center gap-1.5"> سجل كل العمليات والمواعيد <span class="bg-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">' + logEntries.length + '</span></span>' +
                '<span id="arrow-' + esc(logId) + '" class="text-slate-400 text-xs transition">▼</span>' +
            '</button>' +
            '<div id="' + esc(logId) + '" class="hidden mt-1.5 space-y-2 bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 max-h-56 overflow-y-auto text-xs">';
            
        logEntries.slice().reverse().forEach(function(l) {
            var icon = l.action === 'created' ? '' :
                       l.action === 'assigned' ? '' :
                       l.action === 'started' ? '️' :
                       l.action === 'submitted' ? '' :
                       l.action === 'reviewed_reject' ? '↩️' :
                       l.action === 'reviewed_forward' ? '️' :
                       l.action === 'reviewed_approved' ? '' :
                       l.action === 'recalled' ? '️' :
                       l.action === 'dates_updated' ? '' :
                       l.action === 'reference_added' ? '' :
                       l.action === 'asset_uploaded' ? '' : '';
            
            var actionTitle = l.action === 'created' ? 'إنشاء المهمة' :
                              l.action === 'assigned' ? ('إسناد إلى ' + (l.target_employee_name || 'موظف')) :
                              l.action === 'started' ? 'بدء العمل' :
                              l.action === 'submitted' ? 'تسليم المخرجات' :
                              l.action === 'reviewed_reject' ? 'طلب تعديل' :
                              l.action === 'reviewed_forward' ? ('تمرير إلى ' + (l.target_employee_name || 'موظف آخر')) :
                              l.action === 'reviewed_approved' ? 'اعتماد نهائي وجدولة' :
                              l.action === 'recalled' ? 'سحب المهمة' :
                              l.action === 'dates_updated' ? 'تعديل المواعيد' :
                              l.action === 'reference_added' ? 'إضافة ريفرنس' :
                              l.action === 'asset_uploaded' ? 'رفع ملف على Drive' : (l.note || l.action);

            timelineLogHtml += '<div class="flex items-start gap-2 text-[11px] border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">' +
                '<span class="text-sm shrink-0">' + icon + '</span>' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center justify-between gap-1 flex-wrap">' +
                        '<span class="font-bold text-slate-900">' + esc(actionTitle) + '</span>' +
                        '<span class="text-[10px] text-slate-400 font-mono">' + esc(l.time_cairo || l.timestamp || '') + '</span>' +
                    '</div>' +
                    '<div class="text-[10px] text-slate-500 mt-0.5">' +
                        'بواسطة: <b class="text-slate-700">' + esc(l.actor_name || l.actor_type || '—') + '</b>' +
                        (l.note && l.note !== actionTitle ? (' · ' + esc(l.note)) : '') +
                    '</div>' +
                '</div>' +
            '</div>';
        });

        timelineLogHtml += '</div></div>';
    }

    // Submissions History & Deliverables Archive (سجل وأرشيف كل التسليمات السابقة للرجوع إليها)
    var subHistory = (t.submissions_history && t.submissions_history.length) ? t.submissions_history : [];
    if (!subHistory.length && (t.submitted_at || t.drive_link || rawNotes)) {
        subHistory = [{
            submitted_at: t.submitted_at || t.completed_at || t.created_at,
            submitted_by: t.assignee_name || 'الموظف',
            notes: rawNotes,
            drive_link: driveLink,
            media_urls: (t.deliverables ? t.deliverables.map(function(d){ return d.url || d; }) : (driveLink ? [driveLink] : []))
        }];
    }

    var historyArchiveHtml = '';
    if (subHistory.length > 0) {
        var subBoxId = 'sub-box-' + esc(t.task_id);
        historyArchiveHtml = '<div class="pt-0.5">' +
            '<button type="button" onclick="toggleTaskTimeline(\'' + esc(subBoxId) + '\')" class="w-full text-right bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-900 text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-emerald-200 flex items-center justify-between transition shadow-2xs">' +
                '<span class="flex items-center gap-1.5"> أرشيف وسجل التسليمات السابقة <span class="bg-emerald-200 text-emerald-900 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">' + subHistory.length + '</span></span>' +
                '<span id="arrow-' + esc(subBoxId) + '" class="text-emerald-700 text-xs transition">▼</span>' +
            '</button>' +
            '<div id="' + esc(subBoxId) + '" class="hidden mt-1.5 space-y-2 bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-2.5 max-h-56 overflow-y-auto text-xs">';

        subHistory.slice().reverse().forEach(function(s, idx) {
            var subNum = subHistory.length - idx;
            var subDrive = (s.drive_link || '').trim();
            var subNotes = (s.notes || '').trim();
            var subTime = s.submitted_at ? fmtCairoTime(s.submitted_at) : '—';
            var subBy = s.submitted_by || 'الموظف';

            historyArchiveHtml += '<div class="bg-white border border-emerald-100 rounded-lg p-2 space-y-1.5 shadow-2xs">' +
                '<div class="flex items-center justify-between text-[10px] border-b border-slate-100 pb-1">' +
                    '<span class="font-bold text-emerald-950">تسليم #' + subNum + ' — ' + esc(subBy) + '</span>' +
                    '<span class="text-slate-500 font-mono">' + esc(subTime) + '</span>' +
                '</div>';

            if (subNotes && subNotes !== '—') {
                historyArchiveHtml += '<div class="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100 whitespace-pre-wrap leading-relaxed">' + esc(subNotes) + '</div>';
            }

            if (subDrive) {
                historyArchiveHtml += '<div class="flex items-center gap-1.5 pt-0.5">' +
                    '<a href="' + esc(subDrive) + '" target="_blank" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2 rounded transition flex items-center justify-center gap-1">' +
                        '<span>↗️ فتح في Google Drive</span>' +
                    '</a>' +
                    '<button type="button" onclick="copyTaskDriveLink(\'' + esc(subDrive) + '\')" class="bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[10px] py-1 px-2 rounded border border-emerald-200 transition flex items-center gap-1">' +
                        '<span> نسخ الرابط</span>' +
                    '</button>' +
                '</div>';
            }

            historyArchiveHtml += '</div>';
        });

        historyArchiveHtml += '</div></div>';
    }

    if (historyArchiveHtml) {
        html += historyArchiveHtml;
    }

    if (kpisHtml) {
        html += kpisHtml;
    }
    if (timelineLogHtml) {
        html += timelineLogHtml;
    }

    // AM controls
    html += '<div class="flex flex-col gap-1.5 pt-1 border-t border-slate-100">';
    if (st === 'Pending AM Approval') {
        html += '<div class="flex gap-1"><select id="emp-select-' + esc(t.task_id) + '" class="text-xs px-2 py-1.5 border border-slate-200 rounded-lg flex-1">' + empOptionsHtml(t.assigned_employee_id) + '</select>' +
            '<button onclick="assignTaskFromBoard(\'' + esc(t.task_id) + '\')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">إسناد </button></div>';
    }
    if (st === 'Assigned' || st === 'In Progress') {
        html += '<div class="grid grid-cols-2 gap-1.5 pt-1">' +
            '<button onclick="recallTaskAction(\'' + esc(t.task_id) + '\')" class="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-2 rounded-lg shadow-sm flex items-center justify-center gap-1 transition">↩️ سحب المهمة</button>' +
            '<button onclick="resendTaskCard(\'' + esc(t.task_id) + '\')" class="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1"> إرسال للتليجرام</button>' +
            '</div>' +
            '<div class="flex gap-1 pt-1"><select id="reassign-select-' + esc(t.task_id) + '" class="text-xs px-2 py-1.5 border border-slate-200 rounded-lg flex-1"><option value="">تحويل لموظف آخر...</option>' + empOptionsHtml(t.assigned_employee_id) + '</select>' +
            '<button onclick="reassignTaskFromBoard(\'' + esc(t.task_id) + '\')" class="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap">تحويل </button></div>';
    }
    if (isSubmitted) {
        html += '<div class="grid grid-cols-2 gap-1 pt-1">' +
            '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'reject\')" class="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs py-2 rounded-lg transition shadow-xs flex items-center justify-center gap-1">↩️ طلب تعديل</button>' +
            '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'finalize\')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition shadow-xs flex items-center justify-center gap-1"> اعتماد واكتمال</button>' +
            '</div>' +
            '<div class="flex gap-1 pt-1"><select id="fwd-select-' + esc(t.task_id) + '" class="text-xs px-2 py-1.5 border border-slate-200 rounded-lg flex-1"><option value="">مرّرها للي بعده...</option>' + empOptionsHtml('') + '</select>' +
            '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'forward\')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">مرّر ️</button></div>' +
            '<button onclick="recallTaskAction(\'' + esc(t.task_id) + '\')" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1.5 rounded-lg shadow-sm mt-1">↩️ سحب المهمة من الموظف</button>';
    }
    if (isCompleted) {
        html += '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1"> مكتملة ومعتمدة بنجاح </div>';
    }
    html += '</div></div>';
    return html;
}

function sortTaskList(tasksArr, sortKey, sortDir) {
    var multiplier = (sortDir === 'desc') ? -1 : 1;
    return tasksArr.slice().sort(function(a, b) {
        if (sortKey === 'pub_date') {
            var dA = (a.publish_date || '9999-99-99') + ' ' + (a.publish_time || '00:00');
            var dB = (b.publish_date || '9999-99-99') + ' ' + (b.publish_time || '00:00');
            if (dA !== dB) return (dA < dB ? -1 : 1) * multiplier;
            return (getTaskSequenceNum(a) - getTaskSequenceNum(b)) * multiplier;
        }
        if (sortKey === 'deadline') {
            var dlA = a.delivery_deadline || '9999-99-99';
            var dlB = b.delivery_deadline || '9999-99-99';
            if (dlA !== dlB) return (dlA < dlB ? -1 : 1) * multiplier;
            return (getTaskSequenceNum(a) - getTaskSequenceNum(b)) * multiplier;
        }
        if (sortKey === 'status') {
            var orderMap = { 'In Progress': 1, 'Awaiting AM Review': 2, 'Assigned': 3, 'Pending AM Approval': 4, 'Completed': 5 };
            var sA = orderMap[a.status] || 9;
            var sB = orderMap[b.status] || 9;
            if (sA !== sB) return (sA - sB) * multiplier;
            return (getTaskSequenceNum(a) - getTaskSequenceNum(b)) * multiplier;
        }
        if (sortKey === 'task_id') {
            var idA = parseInt((String(a.task_id || '').match(/\d+/) || [999999])[0], 10);
            var idB = parseInt((String(b.task_id || '').match(/\d+/) || [999999])[0], 10);
            return (idA - idB) * multiplier;
        }
        if (sortKey === 'created_at') {
            var tA = a.created_at || '';
            var tB = b.created_at || '';
            if (tA !== tB) return (tA < tB ? -1 : 1) * multiplier;
            return (getTaskSequenceNum(a) - getTaskSequenceNum(b)) * multiplier;
        }
        // Default: Natural Post Sequence Number (بوست 1 -> بوست 2 -> بوست 3 -> بوست 10)
        var seqA = getTaskSequenceNum(a);
        var seqB = getTaskSequenceNum(b);
        if (seqA !== seqB) return (seqA - seqB) * multiplier;
        var numA = parseInt((String(a.task_id || '').match(/\d+/) || [999999])[0], 10);
        var numB = parseInt((String(b.task_id || '').match(/\d+/) || [999999])[0], 10);
        return (numA - numB) * multiplier;
    });
}

function renderTasksBoard() {
    try {
        renderClientTabs();
        var board = document.getElementById('tasks-board-grid');
        if (!board) return;
        var badge = document.getElementById('tasks-count-badge');
        var allTasks = tasksList || [];

        // 0. Month Filter (both in active mode and archive mode)
        if (selectedMonthFilter && selectedMonthFilter !== 'all') {
            allTasks = allTasks.filter(function(t) {
                return getTaskMonthKey(t) === selectedMonthFilter;
            });
        }
        var displayTasks = allTasks.slice();

        // 0. Plan/Employee/AM Filters (Task board displays all plans with interactive plan tabs)

        // 1. Employee or AM Filter
        if (selectedEmployeeFilter) {
            var empAllTasks = (employeesWorkloadData && (employeesWorkloadData[selectedEmployeeFilter] || (selectedEmployeeName && employeesWorkloadData[selectedEmployeeName]))) || [];
            if (empAllTasks.length > 0) {
                displayTasks = empAllTasks.slice();
            } else {
                displayTasks = displayTasks.filter(function(t) {
                    var eid = String(t.assigned_employee_id || '').trim();
                    var aname = String(t.assignee_name || '').trim();
                    return eid === String(selectedEmployeeFilter).trim() ||
                           (selectedEmployeeName && aname === String(selectedEmployeeName).trim()) ||
                           (selectedEmployeeName && (aname.indexOf(selectedEmployeeName) !== -1 || selectedEmployeeName.indexOf(aname) !== -1));
                });
            }
        } else if (selectedAMFilter) {
            displayTasks = displayTasks.filter(function(t) {
                return String(t.am_id || '').trim() === String(selectedAMFilter).trim() ||
                       String(t.am_name || '').trim() === String(selectedAMName).trim();
            });
        }

        // 1.5 Plan Filter
        if (selectedPlanFilter) {
            displayTasks = displayTasks.filter(function(t) {
                var p = (t.plan_name || t.file_name || 'خطة عامة').trim();
                var f = (t.file_name || '').trim();
                return p === selectedPlanFilter || f === selectedPlanFilter;
            });
        }

        // 2. Status Filter
        if (currentTaskStatusFilter && currentTaskStatusFilter !== 'all') {
            displayTasks = displayTasks.filter(function(t) {
                return matchTaskStatus(t.status, currentTaskStatusFilter);
            });
        }

        // 3. Search Filter
        if (taskSearchQuery) {
            displayTasks = displayTasks.filter(function(t) {
                var hay = (String(t.task_id || '') + ' ' +
                           String(t.title || '') + ' ' +
                           String(t.caption || '') + ' ' +
                           String(t.description || '') + ' ' +
                           String(t.assignee_name || '') + ' ' +
                           String(t.am_name || '') + ' ' +
                           String(t.file_name || '')).toLowerCase();
                return hay.indexOf(taskSearchQuery) !== -1;
            });
        }

        // 4. Sort display tasks
        displayTasks = sortTaskList(displayTasks, currentTaskSort, currentTaskSortDir);

        if (badge) {
            var done = displayTasks.filter(function(t){ return matchTaskStatus(t.status, 'completed'); }).length;
            var monthBadge = (selectedMonthFilter && selectedMonthFilter !== 'all') ? (' [' + formatMonthLabel(selectedMonthFilter) + ']') : '';
            badge.textContent = displayTasks.length + ' مهمة مرتبة · ' + done + ' مكتملة' + monthBadge +
                (selectedAMFilter ? ' (AM: ' + esc(selectedAMName) + ')' : '') +
                (selectedEmployeeFilter ? ' (' + esc(selectedEmployeeName) + ')' : '');
        }

        // Build distinct AM list for Manager overview
        var amMap = {};
        allTasks.forEach(function(t) {
            var amId = (t.am_id || '').trim();
            var amName = (t.am_name || '').trim();
            if (!amId || amId === 'EMP-001' || amId === 'EMP-001-AM' || amId === 'AM-001' || amId === 'system' || amId === 'unassigned') {
                amId = 'AM-2072-9827';
                amName = 'محمود خالد';
                t.am_id = amId;
                t.am_name = amName;
            }
            if (!amMap[amId]) amMap[amId] = { id: amId, name: amName, count: 0 };
            amMap[amId].count++;
        });
        var amList = Object.values(amMap);

        var amBarHtml = '';
        var isUserAdmin = window._me && (window._me.is_admin || window._me.role === 'admin');
        if (isUserAdmin && amList.length > 1 && !selectedEmployeeFilter) {
            amBarHtml = '<div class="col-span-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2 shadow-xs mb-1">' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                    '<span class="text-xs font-bold text-slate-800 flex items-center gap-1.5"> فلترة حسب مدير الحساب (AM):</span>' +
                    '<button type="button" onclick="clearAMFilter()" class="text-xs px-3 py-1 rounded-xl font-bold transition ' +
                        (!selectedAMFilter ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        'الكل (' + allTasks.length + ')' +
                    '</button>' +
                    amList.map(function(am) {
                        var isSel = selectedAMFilter === am.id;
                        return '<button type="button" onclick="toggleAMFilter(\'' + esc(am.id) + '\', \'' + esc(am.name) + '\')" class="text-xs px-3 py-1 rounded-xl font-bold transition ' +
                            (isSel ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                            ' ' + esc(am.name) + ' <span class="text-[10px] opacity-80 font-mono">(' + am.count + ')</span>' +
                        '</button>';
                    }).join('') +
                '</div>' +
                (selectedAMFilter ? '<button type="button" onclick="clearAMFilter()" class="text-[11px] text-indigo-700 font-bold hover:underline">إلغاء فلترة AM </button>' : '') +
            '</div>';
        }

        var filterBannerHtml = '';
        if (selectedEmployeeFilter) {
            var currentCid = (window._me && window._me.active_client_id) || '';
            var otherClientsCount = displayTasks.filter(function(ot){ return ot.client_id !== currentCid; }).length;

            filterBannerHtml = '<div class="col-span-full bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-sm">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm"></div>' +
                    '<div>' +
                        '<div class="font-bold text-sm text-blue-900 flex items-center gap-2">' +
                            '<span>كل مهام الموظف: <b>' + esc(selectedEmployeeName) + '</b> عبر جميع العملاء والمشاريع</span>' +
                            '<span class="bg-blue-200 text-blue-800 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">' + displayTasks.length + ' مهمة إجمالاً</span>' +
                        '</div>' +
                        '<p class="text-xs text-blue-700 mt-0.5">' + (displayTasks.length ? 'يتم الآن عرض جميع المهام المسندة لهذا الموظف عبر كل حسابات وعملاء الشركة.' : 'لا توجد مهام مسندة لهذا الموظف حالياً.') + 
                        (otherClientsCount > 0 ? ' <span class="font-bold">(' + otherClientsCount + ' منها في عملاء آخرين)</span>' : '') + '</p>' +
                    '</div>' +
                '</div>' +
                '<button type="button" onclick="clearEmployeeFilter()" class="text-xs bg-white hover:bg-blue-100 text-blue-800 font-bold border border-blue-300 px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5">' +
                    '<span>عرض كل مهام الفريق </span>' +
                '</button>' +
            '</div>';
        }

        var countAll = allTasks.length;
        var countInProgress = allTasks.filter(function(t){ return matchTaskStatus(t.status, 'in_progress'); }).length;
        var countReview = allTasks.filter(function(t){ return matchTaskStatus(t.status, 'review'); }).length;
        var countPending = allTasks.filter(function(t){ return matchTaskStatus(t.status, 'pending'); }).length;
        var countCompleted = allTasks.filter(function(t){ return matchTaskStatus(t.status, 'completed'); }).length;

        var empMap = {};
        allTasks.forEach(function(t) {
            var eid = (t.assigned_employee_id || '').trim();
            var ename = (t.assignee_name || '').trim();
            if (eid || ename) {
                var k = eid || ename;
                if (!empMap[k]) empMap[k] = { id: eid, name: ename || eid, count: 0 };
                empMap[k].count++;
            }
        });
        var activeEmpsWithTasks = Object.values(empMap);

        var empBarHtml = '';
        if (activeEmpsWithTasks.length > 0) {
            empBarHtml = '<div class="flex items-center gap-1.5 flex-wrap border-t border-slate-200/60 pt-2">' +
                '<span class="text-[11px] font-bold text-slate-500 flex items-center gap-1">👤 فلترة الموظف:</span>' +
                '<button type="button" onclick="clearEmployeeFilter()" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (!selectedEmployeeFilter ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100') + '">الجميع (' + countAll + ')</button>' +
                activeEmpsWithTasks.map(function(emp) {
                    var isSel = (selectedEmployeeFilter === emp.id || (selectedEmployeeName && (selectedEmployeeName === emp.name || selectedEmployeeName === emp.id)));
                    return '<button type="button" onclick="toggleEmployeeFilter(\'' + esc(emp.id) + '\', \'' + esc(emp.name) + '\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (isSel ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50') + '">' +
                        '👤 ' + esc(emp.name) + ' (' + emp.count + ')' +
                    '</button>';
                }).join('') +
            '</div>';
        }

        var sortToolbarHtml = '<div class="col-span-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2.5 mb-1">' +
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                '<div class="flex items-center gap-1.5 flex-wrap">' +
                    '<button type="button" onclick="triggerGlobalLiveRefresh(this)" class="text-xs px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs" title="تحديث فوري لحظي">' +
                        '<span class="w-2 h-2 rounded-full bg-white animate-ping"></span>' +
                        '<span>🔄 تحديث فوري</span>' +
                    '</button>' +
                    '<div class="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 shadow-2xs">' +
                        '<span>🗓️ الشهر المعروض:</span>' +
                        '<span class="bg-white px-2 py-0.5 rounded-lg border border-amber-300 font-mono text-amber-950 font-bold">' + esc(formatMonthLabel(selectedMonthFilter)) + '</span>' +
                        (selectedMonthFilter !== 'all' ? '<button type="button" onclick="setTaskMonthFilter(\'all\')" class="text-[10px] text-amber-700 hover:text-amber-950 underline mr-1 cursor-pointer">عرض جميع الشهور</button>' : '') +
                    '</div>' +
                    '<span class="text-xs font-bold text-slate-800 flex items-center gap-1">| ترتيب:</span>' +
                    '<button type="button" onclick="setTaskSort(\'sequence\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'sequence' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span> رقم البوست</span>' + (currentTaskSort === 'sequence' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'deadline\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'deadline' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span> موعد التسليم</span>' + (currentTaskSort === 'deadline' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'status\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'status' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span> الحالة</span>' + (currentTaskSort === 'status' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'task_id\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'task_id' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span>️ الكود</span>' + (currentTaskSort === 'task_id' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'created_at\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'created_at' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span>️ الأحدث</span>' + (currentTaskSort === 'created_at' ? (currentTaskSortDir === 'desc' ? ' ↓' : ' ↑') : '') +
                    '</button>' +
                '</div>' +
                '<div class="flex items-center gap-2 w-full sm:w-auto">' +
                    '<div class="relative w-full">' +
                        '<input type="text" value="' + esc(taskSearchQuery) + '" oninput="onTaskSearchInput(this.value)" placeholder="🔍 بحث في عنوان أو كابشن أو كود المهمة..." class="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-blue-500 shadow-2xs">' +
                        (taskSearchQuery ? '<button type="button" onclick="onTaskSearchInput(\'\')" class="absolute left-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700">✕</button>' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 flex-wrap border-t border-slate-200/60 pt-2">' +
                '<span class="text-[11px] font-bold text-slate-500">تصفية الحالة:</span>' +
                '<button type="button" onclick="setTaskStatusFilter(\'all\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100') + '">الكل (' + countAll + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'in_progress\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'in_progress' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50') + '">⏱️ جاري العمل (' + countInProgress + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'review\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'review' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50') + '">🔍 بانتظار المراجعة (' + countReview + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'pending\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50') + '">⏳ بانتظار الإسناد (' + countPending + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'completed\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50') + '">✅ مكتملة (' + countCompleted + ')</button>' +
            '</div>' +
            empBarHtml +
        '</div>';

        var topBanners = amBarHtml + filterBannerHtml + sortToolbarHtml;

        if (!displayTasks || displayTasks.length === 0) {
            var emptyMsg = '';
            if (currentTaskStatusFilter && currentTaskStatusFilter !== 'all') {
                var stNames = { in_progress: 'جاري العمل', review: 'بانتظار المراجعة', pending: 'بانتظار الإسناد', completed: 'مكتملة' };
                emptyMsg = '<div class="space-y-2"><div class="font-bold text-sm text-slate-800">لا توجد مهام بحالة «<b>' + (stNames[currentTaskStatusFilter] || currentTaskStatusFilter) + '</b>» حالياً.</div>' +
                           '<p class="text-slate-500 text-[11px]">اضغط على «الكل» لعرض كافة مهام الخطط النشطة.</p>' +
                           '<button type="button" onclick="setTaskStatusFilter(\'all\')" class="mt-2 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-xs">عرض كافة المهام (الكل)</button></div>';
            } else if (selectedMonthFilter && selectedMonthFilter !== 'all') {
                emptyMsg = '<div class="space-y-2"><div class="font-bold text-sm text-slate-800">لا توجد مهام مسجلة لشهر «<b>' + formatMonthLabel(selectedMonthFilter) + '</b>»' + (tasksArchiveMode ? ' في الأرشيف.' : '.') + '</div>' +
                           '<p class="text-slate-500 text-[11px]">يمكنك اختيار شهر آخر من شريط الشهور بالأعلى أو الضغط على «عرض جميع الشهور» لعرض كل الخطط.</p>' +
                           '<button type="button" onclick="setTaskMonthFilter(\'all\')" class="mt-2 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-xs">عرض جميع الشهور</button></div>';
            } else if (taskSearchQuery) {
                emptyMsg = 'لا توجد نتائج تطابق بحثك: <b>' + esc(taskSearchQuery) + '</b><br><button type="button" onclick="onTaskSearchInput(\'\')" class="mt-2 text-xs text-blue-600 font-bold hover:underline cursor-pointer">مسح البحث</button>';
            } else if (selectedEmployeeFilter) {
                emptyMsg = 'لا توجد مهام مسندة للموظف <b>' + esc(selectedEmployeeName) + '</b> حالياً';
            } else if (selectedAMFilter) {
                emptyMsg = 'لا توجد مهام مسندة لمدير الحساب <b>' + esc(selectedAMName) + '</b>';
            } else {
                emptyMsg = 'لا توجد مهام مسجلة حالياً. ارفع الخطة الشهرية أو أضف مهمة جديدة 📑';
            }
            board.innerHTML = topBanners + '<div class="col-span-full p-8 text-center text-slate-600 text-xs bg-slate-50 border border-slate-200 rounded-2xl">' + emptyMsg + '</div>';
            return;
        }

        var clientNameEl = document.getElementById('tasks-client-name');
        var activeClientName = (clientNameEl ? clientNameEl.textContent.replace(/^—\s*/, '').trim() : '') || 'العميل';

        // Group tasks by file_name / plan_name / client_name
        var fileGroups = {};
        displayTasks.forEach(function(t) {
            var colKey = '';
            var cName = (t.client_name && t.client_name !== 'None' && t.client_name !== 'null' && t.client_name !== 'عميل عام') ? t.client_name :
                        ((typeof _clientNameMap === 'function' ? _clientNameMap(t.client_id) : '') || 
                        ((t.client_id && t.client_id !== 'cli_general') ? t.client_id.replace(/^cli_/, '').replace(/_\d+$/, '').replace(/_/g, ' ') : activeClientName));
            var fName = (t.plan_name || t.file_name || ('خطة ' + cName)).trim();
            if (selectedEmployeeFilter) {
                colKey = cName + (fName ? (' — ' + fName) : '');
            } else {
                colKey = fName;
                if (!colKey || colKey === 'خطة محتوى' || colKey === 'ملف الخطة') {
                    colKey = 'خطة ' + cName;
                }
            }
            if (!fileGroups[colKey]) {
                fileGroups[colKey] = {
                    title: colKey,
                    clientName: cName,
                    fileName: fName || colKey,
                    tasks: []
                };
            }
            fileGroups[colKey].tasks.push(t);
        });

        var groupKeys = Object.keys(fileGroups);

        var columnsHtml = '';
        if (selectedPlanFilter || groupKeys.length === 1) {
            var singleKey = groupKeys[0];
            var grp = fileGroups[singleKey];
            var fTasks = sortTaskList(grp.tasks, currentTaskSort, currentTaskSortDir);
            fTasks.forEach(function(t, idx) {
                t.post_number_in_plan = idx + 1;
                t.post_number = idx + 1;
            });
            var completedCount = fTasks.filter(function(t){ return t.status === 'Completed'; }).length;

            columnsHtml = '<div class="col-span-full space-y-4">' +
                '<div class="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">' +
                    '<div class="flex items-center gap-3">' +
                        '<div class="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center font-bold text-xl shadow-inner shrink-0">' + ICONS.folder + '</div>' +
                        '<div>' +
                            '<div class="flex items-center gap-2 flex-wrap">' +
                                '<h3 class="font-bold text-base sm:text-lg text-white">خطة: ' + esc(grp.fileName) + '</h3>' +
                                '<span class="bg-purple-500/30 text-purple-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">' + fTasks.length + ' بوست بالخطة</span>' +
                            '</div>' +
                            '<div class="flex items-center gap-2 text-xs text-purple-200 mt-1 flex-wrap">' +
                                '<span class="font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1.5">' + ICONS.building + ' ' + esc(grp.clientName) + '</span>' +
                                '<span>·</span>' +
                                '<span class="bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-lg font-bold">🗓️ ' + esc(formatMonthLabel(getTaskMonthKey(fTasks[0]))) + '</span>' +
                                '<span>·</span>' +
                                '<span dir="ltr" class="font-mono bg-white/20 px-2 py-0.5 rounded-md text-white font-bold">' + completedCount + ' / ' + fTasks.length + ' منجز</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex items-center gap-2 flex-wrap">' +
                        '<button type="button" onclick="openBulkAssignModal(\'' + escJs(grp.fileName) + '\')" class="text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer" title="إسناد مهام هذه الخطة لموظف محدد دفعة واحدة">' +
                            '<span>👥 إسناد جماعي</span>' +
                        '</button>' +
                        '<button type="button" onclick="sharePlanWithClient(\'' + escJs(grp.clientName) + '\', \'' + escJs(grp.fileName) + '\')" class="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer">' +
                            ICONS.share +
                            '<span>مشاركة الخطة مع العميل</span>' +
                        '</button>' +
                        '<button type="button" onclick="deleteWholePlanAction(\'' + escJs(grp.fileName) + '\')" class="text-xs font-bold px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-400/30 transition flex items-center gap-1.5 cursor-pointer" title="حذف الخطة ومهامها بالكامل">' +
                            ICONS.trash +
                            '<span>حذف الخطة</span>' +
                        '</button>' +
                        (selectedPlanFilter ? ('<button type="button" onclick="filterTasksByPlan(null)" class="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition flex items-center gap-1.5 cursor-pointer">' +
                            '<span>عرض جميع الخطط الأخرى</span>' +
                        '</button>') : '') +
                    '</div>' +
                '</div>' +
                '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">' +
                    fTasks.map(function(t, idx) { return renderTaskCard(t, idx + 1); }).join('') +
                '</div>' +
            '</div>';
        } else {
            columnsHtml = '<div class="col-span-full flex gap-6 overflow-x-auto pb-6 items-start w-full pt-1">';
            groupKeys.forEach(function(k) {
                var grp = fileGroups[k];
                var fTasks = sortTaskList(grp.tasks, currentTaskSort, currentTaskSortDir);
                fTasks.forEach(function(t, idx) {
                    t.post_number_in_plan = idx + 1;
                    t.post_number = idx + 1;
                });
                var completedCount = fTasks.filter(function(t){ return t.status === 'Completed'; }).length;

                columnsHtml += '<div class="w-88 sm:w-[420px] shrink-0 bg-slate-100/90 border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3.5 flex flex-col">' +
                    '<div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/90 pb-3 bg-white -m-4 mb-0 p-4 rounded-t-3xl shadow-xs">' +
                        '<div class="flex items-center gap-2.5 min-w-0">' +
                            '<div class="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0"></div>' +
                            '<div class="min-w-0">' +
                                '<h4 class="font-bold text-sm text-slate-900 truncate" title="' + esc(grp.fileName) + '">ملف: ' + esc(grp.fileName) + '</h4>' +
                                '<div class="flex items-center gap-1.5 text-xs mt-0.5 flex-wrap">' +
                                    '<span class="text-blue-700 font-bold truncate"> ' + esc(grp.clientName) + '</span>' +
                                    '<span class="text-slate-300">·</span>' +
                                    '<span class="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-md">🗓️ ' + esc(formatMonthLabel(getTaskMonthKey(fTasks[0]))) + '</span>' +
                                    '<span class="text-slate-300">·</span>' +
                                    '<span dir="ltr" class="text-slate-500 font-mono text-[11px] whitespace-nowrap font-bold">' + completedCount + ' / ' + fTasks.length + '</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5">' +
                            '<button type="button" onclick="openBulkAssignModal(\'' + escJs(grp.fileName) + '\')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs" title="إسناد جماعي لمهام الخطة">' +
                                '<span>👥 إسناد</span>' +
                            '</button>' +
                            '<button type="button" onclick="sharePlanWithClient(\'' + esc(grp.clientName) + '\', \'' + esc(grp.fileName) + '\')" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs" title="نسخ رابط مشاركة الخطة للعميل">' +
                                '<span> مشاركة</span>' +
                            '</button>' +
                            '<button type="button" onclick="deleteWholePlanAction(\'' + esc(grp.fileName) + '\')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer" title="حذف الخطة">' +
                                ICONS.trash +
                            '</button>' +
                            '<span class="bg-blue-600 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-full shadow-xs shrink-0">' + fTasks.length + ' مهام</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="space-y-3.5 pt-1 max-h-[850px] overflow-y-auto pr-1">' +
                        fTasks.map(function(t, idx) { return renderTaskCard(t, idx + 1); }).join('') +
                    '</div>' +
                '</div>';
            });
            columnsHtml += '</div>';
        }

        board.innerHTML = topBanners + columnsHtml;
    } catch(err) {
        console.error("renderTasksBoard error:", err);
        var b = document.getElementById('tasks-board-grid');
        if (b) b.innerHTML = '<div class="col-span-full p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold">حدث خطأ أثناء عرض المهام: ' + esc(err.message || err) + '</div>';
    }
}

async function clearAllTasks() {
    if (!confirm('هيتمسح كل التاسكات الحالية نهائياً (الديمو والحقيقي). متأكد؟')) return;
    if (!confirm('تأكيد أخير: مسح الكل؟')) return;
    try {
        var res = await fetch('/api/tasks/clear', { method: 'POST' });
        var data = await res.json();
        if (res.ok && data.success) {
            showToast('تم مسح ' + (data.removed || 0) + ' مهمة ️ — ابدأ برفع الخطة');
            loadTasksEngine();
        } else { showToast(data.error || 'تعذّر المسح', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}



async function deleteTaskAction(taskId) {
    if (!confirm('حذف المهمة ' + taskId + ' نهائياً؟')) return;
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId), { method: 'DELETE' });
        var data = await res.json();
        if (res.ok && (data.success !== false)) {
            showToast('تم حذف المهمة ️');
            loadTasksEngine();
        } else { showToast(data.error || 'تعذّر الحذف', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function deleteWholePlanAction(planName) {
    if (!planName) return;
    if (!confirm('هل أنت متأكد من حذف الخطة «' + planName + '» وجميع مهامها بالكامل؟')) return;
    if (!confirm('تأكيد نهائي: سيتم مسح مهام هذه الخطة بالكامل ولن تتمكن من التراجع!')) return;
    try {
        var res = await fetch('/api/plans/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_name: planName })
        });
        var data = await res.json();
        if (res.ok && (data.success || data.ok)) {
            showToast(data.message || 'تم حذف الخطة بنجاح 🗑️', 'success');
            selectedPlanFilter = null;
            loadTasksEngine();
        } else {
            showToast(data.error || 'تعذّر حذف الخطة', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}
window.deleteWholePlanAction = deleteWholePlanAction;

async function reviewTaskDecision(taskId, action) {
    var body = { action: action };
    if (action === 'forward') {
        var sel = document.getElementById('fwd-select-' + taskId);
        var nid = sel ? sel.value : '';
        if (!nid) { showToast('اختر الموظف اللي هتمرّرله المهمة', 'error'); return; }
        body.next_employee_id = nid;
        body.action = 'forward';
    }
    if (action === 'reject') {
        var note = prompt('اكتب سبب الإرجاع / التعديل المطلوب:');
        if (note === null) return;
        body.note = note;
    }
    if (action === 'finalize') {
        var n2 = prompt('ملاحظة اعتماد واكتمال المهمة (اختياري):', '');
        if (n2 === null) return;
        body.note = n2 || '';
    }
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/review', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        var data = await res.json();
        if (res.ok && data.success !== false) {
            showToast(action === 'finalize' ? 'تم اعتماد واكتمال المهمة بنجاح ' : action === 'forward' ? 'تم تمرير المهمة للموظف التالي ️' : 'تم إرجاع المهمة للموظف ↩️');
            loadTasksEngine();
        } else { showToast(data.error || 'تعذّر تنفيذ المراجعة', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function assignTaskFromBoard(taskId) {
    var sel = document.getElementById('emp-select-' + taskId);
    var empId = sel ? sel.value : '';
    if (!empId) return;
    // Use the /assign endpoint — it sets the real assignee name AND sends the
    // interactive task card (start/submit buttons) to the employee on Telegram.
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/assign', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: empId })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast(data.telegram_sent ? 'اتسند واتبعت للموظف على التليجرام ' : 'اتسند (الموظف مالوش تليجرام أو معملش Start للبوت)');
            loadTasksEngine();
        } else { showToast(data.error || 'تعذّر الإسناد', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function recallTaskAction(taskId) {
    var reason = prompt('هل أنت متأكد من سحب المهمة من الموظف وإعادتها لحالة بانتظار الإسناد؟\nاكتب سبباً لسحب المهمة (اختياري):', '');
    if (reason === null) return; // User cancelled
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/recall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || '' })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast('تم سحب المهمة بنجاح وإلغاء إسنادها ↩️');
            loadTasksEngine();
        } else {
            showToast(data.error || 'تعذّر سحب المهمة', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

async function reassignTaskFromBoard(taskId) {
    var sel = document.getElementById('reassign-select-' + taskId);
    var empId = sel ? sel.value : '';
    if (!empId) { showToast('اختر الموظف الجديد للتحويل', 'error'); return; }
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: empId })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast(data.telegram_sent ? 'تم تحويل المهمة وإشعار الموظف على تليجرام ' : 'تم تحويل المهمة بنجاح ');
            loadTasksEngine();
        } else {
            showToast(data.error || 'تعذّر تحويل المهمة', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

async function uploadTaskAsset(taskId, input) {
    var file = (input && input.files && input.files[0]) ? input.files[0] : null;
    if (!file) return;
    showToast('جاري الرفع على Google Drive... ');
    try {
        await driveUploadFile(taskId, file); // shared: direct for large, server for small
        showToast('اترفع على Drive واتربط بالتاسك ');
        loadTasksEngine();
    } catch(e) { showToast('تعذّر الرفع: ' + (e.message || ''), 'error'); }
    if (input) input.value = '';
}

async function uploadTaskReferenceFile(taskId, input) {
    var file = (input && input.files && input.files[0]) ? input.files[0] : null;
    if (!file) return;
    showToast('جاري رفع الريفرانس من الجهاز... ');
    try {
        var fd = new FormData();
        fd.append('file', file);
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/references', {
            method: 'POST',
            body: fd
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast('تمت إضافة الريفرانس من الجهاز بنجاح ');
            loadTasksEngine();
        } else {
            showToast(data.error || 'تعذّرت إضافة الريفرانس', 'error');
        }
    } catch(e) {
        showToast('خطأ في رفع الملف: ' + (e.message || ''), 'error');
    }
    if (input) input.value = '';
}

async function promptAddLinkReference(taskId) {
    var url = prompt('الصق رابط الريفرانس (صورة / Google Drive / أي رابط):');
    if (!url) return;
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/references', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url.trim() })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast('تمت إضافة الرابط بنجاح ');
            loadTasksEngine();
        } else {
            showToast(data.error || 'تعذّرت إضافة الرابط', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال', 'error');
    }
}

async function addTaskReference(taskId) {
    promptAddLinkReference(taskId);
}

async function resendTaskCard(taskId) {
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/resend', { method: 'POST' });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast(data.telegram_sent ? 'اتبعت الكارت للموظف على التليجرام ' : 'الموظف مالوش تليجرام أو معملش Start لبوت المهام', data.telegram_sent ? 'success' : 'error');
        } else { showToast(data.error || 'تعذّر الإرسال', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function promptCompleteTask(taskId) {
    var notes = prompt("أدخل ملاحظات وملخص ما تم إنجازه بالمهمة:");
    if (notes === null) return;
    await updateTaskStatusAction(taskId, 'Awaiting AM Review', null, notes);
}

async function updateTaskStatusAction(taskId, newStatus, empId, notes) {
    try {
        var res = await fetch('/api/tasks/' + taskId + '/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, employee_id: empId || '', notes: notes || '' })
        });
        var data = await res.json();
        if (data.success) {
            showToast('تم تحديث حالة المهمة بنجاح ');
            loadTasksEngine();
        } else {
            showToast(data.error || 'حدث خطأ في التحديث', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

var _planQuill = null;
async function populateClientDatalists() {
    var clients = window._clientsList || window.clientsList || [];
    try {
        if (!clients.length) {
            var r = await safeFetchJson('/api/clients');
            clients = Array.isArray(r) ? r : ((r && r.clients) ? r.clients : []);
        }
        if (!clients.length) {
            var r2 = await safeFetchJson('/api/plan/clients');
            clients = Array.isArray(r2) ? r2 : ((r2 && r2.clients) ? r2.clients : []);
        }
    } catch(e){}
    
    if (clients.length) {
        window.clientsList = clients;
        window._clientsList = clients;
        window._planClientsCache = clients;
    }

    var optionsHtml = (clients || []).map(function(c) {
        var name = esc(c.name || c.company || c.id || '');
        var am = c.am_name ? ' [AM: ' + esc(c.am_name) + ']' : '';
        return '<option value="' + name + '">' + name + am + '</option>';
    }).join('');

    ['pb-modal-clients-list', 'pb-clients-list', 'tasks-ingest-clients-list'].forEach(function(id) {
        var dl = document.getElementById(id);
        if (dl) dl.innerHTML = optionsHtml;
    });

    return clients;
}

function onPlanBuilderTabClientChange(val) {
    if (!val) return;
    var cleanVal = String(val).trim().toLowerCase();
    var list = window._planClientsCache || window._clientsList || window.clientsList || [];
    var matched = list.find(function(c){
        return (c.name && c.name.toLowerCase() === cleanVal) ||
               (c.company && c.company.toLowerCase() === cleanVal) ||
               (c.id && c.id.toLowerCase() === cleanVal);
    });

    if (matched) {
        var amSel = document.getElementById('pb-am');
        if (amSel && (matched.am_employee_id || matched.am_name)) {
            var targetAMId = matched.am_employee_id;
            var targetAMName = matched.am_name;
            for (var i = 0; i < amSel.options.length; i++) {
                var opt = amSel.options[i];
                if ((targetAMId && opt.value === targetAMId) || (targetAMName && opt.text.includes(targetAMName))) {
                    amSel.selectedIndex = i;
                    break;
                }
            }
        }
        var pInp = document.getElementById('pb-plan-name');
        if (pInp && !pInp.value) {
            var d = new Date();
            var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            pInp.value = 'خطة ' + matched.name + ' — ' + months[d.getMonth()] + ' ' + d.getFullYear();
        }
    }
}

async function loadPlanBuilder() {
    var cInput = document.getElementById('pb-client');
    var dlist = document.getElementById('pb-clients-list');
    var mSel = document.getElementById('pb-am');
    if (!cInput || !mSel) return;
    // init the open-source rich-text (Word-like) editor once
    if (window.Quill && !_planQuill && document.getElementById('pb-editor')) {
        _planQuill = new Quill('#pb-editor', {
            theme: 'snow', placeholder: '1)\n- تاج لاين: عنوان البوست\n- التخيل: فكرة الجرافيك\nالكابشن هنا...\n\n2) ...',
            modules: { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], [{ header: [1, 2, false] }], ['link', 'clean']] }
        });
    }
    
    var clients = await populateClientDatalists();
    if (cInput.tagName === 'SELECT') {
        cInput.innerHTML = '<option value="">اختر أو اكتب اسم العميل...</option>' + clients.map(function(c){ return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join('');
    }
    
    try {
        var md = await safeFetchJson('/api/managers');
        var ms = (md && md.managers) ? md.managers : [];
        ms = ms.filter(function(m){ return (m.name || '').indexOf('روضة') === -1; });
        mSel.innerHTML = '<option value="">— بدون إسناد مباشر —</option>' + ms.map(function(m){ return '<option value="' + esc(m.employee_id) + '">' + esc(m.name) + '</option>'; }).join('');
    } catch(e){}
}

async function uploadPlanImage(input) {
    var files = input && input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    var clientInput = ((document.getElementById('pb-client') || {}).value || '').trim();
    showToast('جاري رفع الصورة على Drive... ');
    for (var i = 0; i < files.length; i++) {
        var fd = new FormData();
        fd.append('file', files[i]);
        if (clientInput) fd.append('client_id', clientInput);
        try {
            var res = await fetch('/api/plan/upload-image', { method: 'POST', body: fd });
            var data = await res.json();
            if (res.ok && data.ok && data.url) {
                // insert the link on its own line in the editor (parser picks it up as a reference)
                if (_planQuill) {
                    var len = _planQuill.getLength();
                    _planQuill.insertText(len - 1, '\n' + data.url + '\n');
                }
                showToast('اترفعت الصورة واتحطت في البلان ');
            } else { showToast(data.error || 'تعذّر رفع الصورة', 'error'); }
        } catch(e) { showToast('خطأ في رفع الصورة', 'error'); }
    }
    if (input) input.value = '';
}

window.promptInsertDriveLinkInQuill = function() {
    var val = prompt("أدخل رابط Google Drive أو Pinterest أو الفيديو المرجعي:");
    if (!val || !val.trim()) return;
    var link = val.trim();
    if (_planQuill) {
        var len = _planQuill.getLength();
        _planQuill.insertText(len - 1, '\nريفرنس: ' + link + '\n');
        showToast('تمت إضافة الرابط المرجعي للبلان 👍');
    }
};

async function createPlan() {
    var clientInput = ((document.getElementById('pb-client')||{}).value || '').trim();
    var planName = ((document.getElementById('pb-plan-name')||{}).value || '').trim();
    var am = (document.getElementById('pb-am')||{}).value || '';
    var txt = _planQuill ? _planQuill.getText().trim() : (((document.getElementById('pb-text')||{}).value) || '').trim();
    if (!clientInput) { showToast('اكتب أو اختر اسم العميل', 'error'); return; }
    if (!txt) { showToast('اكتب محتوى البلان', 'error'); return; }
    
    // Check if client matches an existing ID
    var matchedClient = (window._planClientsCache || []).find(function(c) {
        return c.name.toLowerCase() === clientInput.toLowerCase() || c.id === clientInput;
    });
    var clientId = matchedClient ? matchedClient.id : clientInput;
    
    showToast('جاري إنشاء البلان وإدراجه في دورة العمل... ');
    try {
        var res = await fetch('/api/plan/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_name: clientInput,
                plan_name: planName,
                am_employee_id: am,
                plan_text: txt
            })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            var box = document.getElementById('pb-result');
            if (box) {
                box.classList.remove('hidden');
                var amMsg = data.am_notified ? ('واتبعت للأكونت مانيجر <b>' + esc(data.am_name || '') + '</b> على التليجرام ')
                    : (data.am_has_telegram === false ? ('️ الأكونت مانيجر <b>' + esc(data.am_name || '') + '</b> مالوش تليجرام في الشيت')
                    : ('️ اتعمل البلان بس الرسالة موصلتش لـ <b>' + esc(data.am_name || '') + '</b> (لازم يعمل Start لبوت المهام)'));
                box.innerHTML = ' تم إنشاء البلان بنجاح: <b>' + data.created + '</b> بوست للعميل <b>' + esc(data.client_name || clientInput) + '</b>، ' + amMsg + '<br>' +
                    '<div class="mt-2 flex items-center gap-2 flex-wrap"><span class="text-slate-500 text-xs font-bold"> لينك المشاركة برا السيستم:</span>' +
                    '<input value="' + esc(data.share_url) + '" readonly class="flex-1 min-w-[200px] px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono" onclick="this.select()">' +
                    '<button onclick="navigator.clipboard.writeText(\'' + esc(data.share_url) + '\');showToast(\'تم نسخ الرابط \')" class="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition">نسخ الرابط</button></div>';
            }
            if (_planQuill) _planQuill.setText('');
            if (document.getElementById('pb-plan-name')) document.getElementById('pb-plan-name').value = '';
            showToast('تم إنشاء البلان وإدراج المهام بنجاح! ', 'success');
            if (typeof loadClientsList === 'function') loadClientsList();
            if (typeof loadPlanBuilder === 'function') loadPlanBuilder();
            if (typeof loadTasksEngine === 'function') loadTasksEngine();
        } else { showToast(data.error || 'تعذّر الإنشاء', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال بالسيرفر', 'error'); }
}

async function extractTextFromDocxClient(file) {
    try {
        if (typeof JSZip === 'undefined') return null;
        var zip = new JSZip();
        var contents = await zip.loadAsync(file);
        var xmlFile = contents.file("word/document.xml");
        if (!xmlFile) return null;
        var xmlStr = await xmlFile.async("text");
        
        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlStr, "application/xml");

        function hasImage(elem) {
            return (elem.getElementsByTagName("a:blip").length > 0 || elem.getElementsByTagName("v:imagedata").length > 0);
        }
        
        // 1. Check for tables (<w:tbl>)
        var tables = doc.getElementsByTagName("w:tbl");
        var extractedRows = [];
        
        if (tables && tables.length > 0) {
            for (var t = 0; t < tables.length; t++) {
                var rows = tables[t].getElementsByTagName("w:tr");
                for (var r = 0; r < rows.length; r++) {
                    var cells = rows[r].getElementsByTagName("w:tc");
                    var cellTexts = [];
                    for (var c = 0; c < cells.length; c++) {
                        var pars = cells[c].getElementsByTagName("w:p");
                        var cellParTexts = [];
                        for (var p = 0; p < pars.length; p++) {
                            var pText = (pars[p].textContent || '').trim();
                            if (pText) cellParTexts.push(pText);
                        }
                        cellTexts.push(cellParTexts.join(" "));
                    }
                    if (hasImage(rows[r])) {
                        cellTexts.push("[صورة مرفقة]");
                    }
                    var rowLine = cellTexts.filter(function(x){ return x.length > 0; }).join("\t").trim();
                    if (rowLine) extractedRows.push(rowLine);
                }
            }
        }
        
        if (extractedRows.length >= 2) {
            return extractedRows.join("\n\n---\n\n");
        }
        
        // 2. Otherwise extract all paragraphs
        var paras = doc.getElementsByTagName("w:p");
        var paraTexts = [];
        for (var i = 0; i < paras.length; i++) {
            var txt = (paras[i].textContent || '').trim();
            if (txt) paraTexts.push(txt);
            if (hasImage(paras[i])) paraTexts.push("[صورة مرفقة]");
        }
        return paraTexts.join("\n");
    } catch(e) {
        console.warn("Client docx parse warning:", e);
        return null;
    }
}

function toggleTasksIngestCustomClient() {
    var sel = document.getElementById('tasks-ingest-client-select');
    var inp = document.getElementById('tasks-ingest-client');
    var btn = document.getElementById('btn-tasks-ingest-custom');
    if (!sel || !inp) return;
    if (inp.classList.contains('hidden')) {
        inp.classList.remove('hidden');
        sel.classList.add('hidden');
        if (btn) btn.textContent = '↩ اختيار من القائمة';
        inp.focus();
    } else {
        inp.classList.add('hidden');
        sel.classList.remove('hidden');
        if (btn) btn.textContent = '+ عميل جديد';
    }
}

function onTasksIngestClientSelectChange(val) {
    if (!val) return;
    var list = window._clientsList || window.clientsList || window._planClientsCache || [];
    var matched = list.find(function(c){
        return String(c.id).trim() === String(val).trim() ||
               (c.name && c.name.toLowerCase() === String(val).trim().toLowerCase()) ||
               (c.company && c.company.toLowerCase() === String(val).trim().toLowerCase());
    });

    if (matched) {
        var amSel = document.getElementById('tasks-ingest-am');
        if (amSel && (matched.am_employee_id || matched.am_name)) {
            var targetAMId = matched.am_employee_id;
            var targetAMName = matched.am_name;
            for (var i = 0; i < amSel.options.length; i++) {
                var opt = amSel.options[i];
                if ((targetAMId && opt.value === targetAMId) || (targetAMName && opt.text.includes(targetAMName))) {
                    amSel.selectedIndex = i;
                    break;
                }
            }
        }
        var pInp = document.getElementById('tasks-ingest-plan-name');
        if (pInp && !pInp.value) {
            var d = new Date();
            var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            pInp.value = 'خطة ' + matched.name + ' — ' + months[d.getMonth()] + ' ' + d.getFullYear();
        }
    }
}

function onTasksIngestClientChange(val) {
    if (!val) return;
    onTasksIngestClientSelectChange(val);
}

async function loadTasksIngestFields() {
    var cSel = document.getElementById('tasks-ingest-client-select');
    var cInput = document.getElementById('tasks-ingest-client');
    var amSel = document.getElementById('tasks-ingest-am');
    
    // 1. Clients
    try {
        var clients = await populateClientDatalists();
        if (cSel && clients && clients.length) {
            var opts = '<option value="">-- اختر العميل من القائمة --</option>' +
                clients.map(function(c) {
                    var amPart = c.am_name ? (' (AM: ' + c.am_name + ')') : '';
                    return '<option value="' + esc(c.id) + '" data-name="' + esc(c.name) + '">' + esc(c.name) + amPart + '</option>';
                }).join('');
            cSel.innerHTML = opts;
            
            var activeCid = window.activeClientId || (typeof currentClient !== 'undefined' ? currentClient : '');
            var activeMatch = clients.find(function(c){ return c.id === activeCid; });
            if (activeMatch) {
                cSel.value = activeMatch.id;
                onTasksIngestClientSelectChange(activeMatch.id);
            } else if (!cSel.value) {
                var defaultC = clients[0];
                if (defaultC) {
                    cSel.value = defaultC.id;
                    onTasksIngestClientSelectChange(defaultC.id);
                }
            }
        }
    } catch(e){}
    
    // 2. Managers
    var defaultAMs = [
        { employee_id: 'AM-2072-9827', name: 'محمود خالد', role: 'ACCOUNT MANAGER' },
        { employee_id: 'EMP-5887-5256', name: 'آيه أحمد مجاهد', role: 'ACCOUNT MANAGER' }
    ];
    if (amSel) {
        var myEmpId = (window.currentUserData && window.currentUserData.employee_id) || '';
        var optHtml = '';
        defaultAMs.forEach(function(m) {
            var isMe = myEmpId && String(m.employee_id) === String(myEmpId);
            optHtml += '<option value="' + esc(m.employee_id) + '"' + (isMe ? ' selected' : '') + '> ' + esc(m.name) + ' — ' + esc(m.role) + (isMe ? ' (أنا ‍️)' : '') + '</option>';
        });
        amSel.innerHTML = optHtml;
    }
    try {
        var md = await safeFetchJson('/api/managers');
        var ms = (md && md.managers && md.managers.length) ? md.managers : defaultAMs;
        ms = ms.filter(function(m){ return (m.name || '').indexOf('روضة') === -1; });
        window._managersCache = ms;
        if (amSel && ms.length) {
            var myEmpId = (window.currentUserData && window.currentUserData.employee_id) || '';
            var optHtml = '';
            ms.forEach(function(m) {
                var isMe = myEmpId && String(m.employee_id) === String(myEmpId);
                optHtml += '<option value="' + esc(m.employee_id) + '"' + (isMe ? ' selected' : '') + '> ' + esc(m.name) + ' — ' + esc(m.role || 'Account Manager') + (isMe ? ' (أنا ‍️)' : '') + '</option>';
            });
            amSel.innerHTML = optHtml;
        }
    } catch(e){}
}

function setTasksIngestSelfAM() {
    var amSel = document.getElementById('tasks-ingest-am');
    if (!amSel) return;
    var myEmpId = (window.currentUserData && window.currentUserData.employee_id) || '';
    var myName = (window.currentUserData && (window.currentUserData.name || window.currentUserData.username)) || '';
    
    var found = false;
    for (var i = 0; i < amSel.options.length; i++) {
        var opt = amSel.options[i];
        if ((myEmpId && opt.value === myEmpId) || (myName && opt.text.includes(myName))) {
            amSel.selectedIndex = i;
            found = true;
            break;
        }
    }
    if (!found && amSel.options.length > 1) {
        amSel.selectedIndex = 1;
    }
    showToast('تم تحديد حسابك كـ Account Manager ');
}

window.toggleTasksIngestCustomClient = toggleTasksIngestCustomClient;
window.onTasksIngestClientSelectChange = onTasksIngestClientSelectChange;
window.loadTasksIngestFields = loadTasksIngestFields;
window.setTasksIngestSelfAM = setTasksIngestSelfAM;

function toggleTasksIngestBox() {
    var b = document.getElementById('tasks-ingest-body');
    var icon = document.getElementById('toggle-ingest-icon');
    var text = document.getElementById('toggle-ingest-text');
    if (!b) return;
    var isHidden = b.classList.toggle('hidden');
    if (icon) icon.textContent = isHidden ? '▼' : '▲';
    if (text) text.textContent = isHidden ? 'فتح الصندوق' : 'طي الصندوق';
    try { localStorage.setItem('tasks_ingest_collapsed', isHidden ? 'true' : 'false'); } catch(e){}
}
window.toggleTasksIngestBox = toggleTasksIngestBox;

async function openBulkAssignModal(planName) {
    var emps = window.allTeamEmployees || employeesList || [];
    if (!emps || emps.length === 0) {
        showToast('جاري تحميل قائمة الموظفين...', 'info');
        try {
            var r = await fetch('/api/tasks/employees');
            var d = await r.json();
            emps = (d && d.employees) ? d.employees : [];
            window.allTeamEmployees = emps;
        } catch(e){}
    }
    if (!emps || emps.length === 0) {
        showToast('لا يوجد موظفون مسجلون في النظام حالياً', 'error');
        return;
    }

    var modal = document.getElementById('bulk-assign-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bulk-assign-modal';
        modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4';
        document.body.appendChild(modal);
    }

    var matchingTasks = (tasksList || []).filter(function(t){
        return (t.plan_name || t.file_name || '').trim() === planName.trim();
    });
    var pendingTasks = matchingTasks.filter(function(t){
        return !t.assigned_employee_id || t.assigned_employee_id === 'unassigned' || t.status === 'Pending';
    });

    var optionsHtml = emps.map(function(e){
        return '<option value="' + esc(e.id) + '" data-name="' + esc(e.name) + '">' + esc(e.name) + ' (' + esc(e.role || 'عضو فريق') + ')</option>';
    }).join('');

    modal.innerHTML = '<div class="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">' +
        '<div class="flex items-center justify-between border-b border-slate-100 pb-3">' +
            '<h3 class="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">' +
                '<span class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">👥</span>' +
                '<span>إسناد جماعي لمهام الخطة</span>' +
            '</h3>' +
            '<button type="button" onclick="closeBulkAssignModal()" class="text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer">✕</button>' +
        '</div>' +
        '<div class="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1">' +
            '<div>الخطة المستهدفة: <b class="text-slate-900">' + esc(planName) + '</b></div>' +
            '<div>إجمالي مهام الخطة: <b class="text-indigo-700 font-mono">' + matchingTasks.length + ' مهمة</b> (' + pendingTasks.length + ' غير مسندة)</div>' +
        '</div>' +
        '<div>' +
            '<label class="block text-xs font-bold text-slate-800 mb-1.5">اختر الموظف لإسناد المهام إليه:</label>' +
            '<select id="bulk-assign-emp-select" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:outline-blue-500 shadow-2xs cursor-pointer">' +
                optionsHtml +
            '</select>' +
        '</div>' +
        '<div class="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">' +
            '<label class="flex items-center gap-2 cursor-pointer font-bold text-slate-800">' +
                '<input type="radio" name="bulk_scope" value="pending" checked class="accent-indigo-600">' +
                '<span>إسناد المهام غير المسندة فقط (عدد: ' + pendingTasks.length + ')</span>' +
            '</label>' +
            '<label class="flex items-center gap-2 cursor-pointer text-slate-700">' +
                '<input type="radio" name="bulk_scope" value="all" class="accent-indigo-600">' +
                '<span>إسناد كافة مهام الخطة بالكامل (عدد: ' + matchingTasks.length + ')</span>' +
            '</label>' +
        '</div>' +
        '<div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">' +
            '<button type="button" onclick="closeBulkAssignModal()" class="text-xs px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer">إلغاء</button>' +
            '<button type="button" onclick="executeBulkAssignAction(\'' + escJs(planName) + '\')" id="btn-confirm-bulk-assign" class="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer">' +
                '<span>تطبيق الإسناد الآن 🚀</span>' +
            '</button>' +
        '</div>' +
    '</div>';
    modal.classList.remove('hidden');
}

function closeBulkAssignModal() {
    var modal = document.getElementById('bulk-assign-modal');
    if (modal) modal.classList.add('hidden');
}

async function executeBulkAssignAction(planName) {
    var sel = document.getElementById('bulk-assign-emp-select');
    if (!sel) return;
    var empId = sel.value;
    var opt = sel.options[sel.selectedIndex];
    var empName = opt ? (opt.getAttribute('data-name') || opt.textContent.split('(')[0].trim()) : empId;

    var scopeRadio = document.querySelector('input[name="bulk_scope"]:checked');
    var scope = scopeRadio ? scopeRadio.value : 'pending';

    var btn = document.getElementById('btn-confirm-bulk-assign');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري الإسناد...'; }

    var targetTasks = (tasksList || []).filter(function(t){
        if ((t.plan_name || t.file_name || '').trim() !== planName.trim()) return false;
        if (scope === 'pending') {
            return !t.assigned_employee_id || t.assigned_employee_id === 'unassigned' || t.status === 'Pending';
        }
        return true;
    });

    if (targetTasks.length === 0) {
        showToast('لا توجد مهام مطابقة للشروط المحددة', 'info');
        closeBulkAssignModal();
        return;
    }

    try {
        var count = 0;
        for (var i = 0; i < targetTasks.length; i++) {
            var t = targetTasks[i];
            t.assigned_employee_id = empId;
            t.assignee_name = empName;
            if (t.status === 'Pending' || !t.status) t.status = 'In Progress';
            t.assigned_at = new Date().toISOString();
            count++;
            fetch('/api/tasks/' + encodeURIComponent(t.task_id) + '/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: empId, employee_name: empName })
            }).catch(function(){});
        }
        showToast('تم إسناد ' + count + ' مهمة إلى ' + empName + ' بنجاح! 🚀');
        closeBulkAssignModal();
        renderTasksBoard();
        renderEmployeesStatus();
        renderClientTabs();
    } catch(err) {
        showToast('حدث خطأ أثناء الإسناد الجماعي', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'تطبيق الإسناد الآن 🚀'; }
    }
}
window.openBulkAssignModal = openBulkAssignModal;
window.closeBulkAssignModal = closeBulkAssignModal;
window.executeBulkAssignAction = executeBulkAssignAction;

async function ingestPlanAction(ev) {
    if (ev) ev.preventDefault();
    var el = document.getElementById('plan-ingest-input');
    var fileEl = document.getElementById('plan-ingest-file');
    var driveEl = document.getElementById('plan-ingest-drive');
    var clientSel = document.getElementById('tasks-ingest-client-select');
    var clientInp = document.getElementById('tasks-ingest-client');
    var amEl = document.getElementById('tasks-ingest-am');
    var planNameEl = document.getElementById('tasks-ingest-plan-name');

    var txt = el ? el.value.trim() : '';
    var file = (fileEl && fileEl.files && fileEl.files[0]) ? fileEl.files[0] : null;
    var drive = driveEl ? driveEl.value.trim() : '';
    
    var clientInput = '';
    var clientId = '';
    if (clientInp && !clientInp.classList.contains('hidden') && clientInp.value.trim()) {
        clientInput = clientInp.value.trim();
        clientId = clientInput;
    } else if (clientSel && clientSel.value) {
        var selOpt = clientSel.options[clientSel.selectedIndex];
        clientId = clientSel.value;
        clientInput = (selOpt ? selOpt.getAttribute('data-name') : '') || (selOpt ? selOpt.text.split(' (')[0].trim() : '') || clientSel.value;
    }

    var amId = amEl ? amEl.value.trim() : '';
    var planName = planNameEl ? planNameEl.value.trim() : '';

    if (!txt && !file && !drive) { showToast('ارفع ملف الخطة أو الصق نصها أو حط رابط Drive', 'error'); return; }

    var list = window._clientsList || window.clientsList || window._planClientsCache || [];
    var matchedClient = list.find(function(c) {
        return c.id === clientId || (c.name && c.name.toLowerCase() === clientInput.toLowerCase());
    });
    if (matchedClient) {
        clientId = matchedClient.id;
        clientInput = matchedClient.name;
    }
    if (!clientInput) {
        var activeCid = window.activeClientId || (typeof currentClient !== 'undefined' ? currentClient : '');
        var activeC = list.find(function(c){ return c.id === activeCid; }) || list[0];
        if (activeC) {
            clientInput = activeC.name;
            clientId = activeC.id;
        }
    }

    // Clean plan name
    var cleanFileBase = file ? file.name.replace(/\.(docx|doc|txt|pdf)$/i, '').trim() : '';
    var formattedPlanName = '';
    if (planName) {
        formattedPlanName = (planName.includes(clientInput) ? planName : ('خطة ' + clientInput + ' — ' + planName));
    } else if (cleanFileBase) {
        formattedPlanName = (cleanFileBase.includes(clientInput) ? cleanFileBase : ('خطة ' + clientInput + ' — ' + cleanFileBase));
    } else {
        formattedPlanName = 'خطة ' + clientInput;
    }

    var fileName = formattedPlanName;
    var opts;

    if (file) {
        showToast('جاري قراءة واستخراج نص الملف فورياً... ');
        var clientText = await extractTextFromDocxClient(file);
        if (clientText && clientText.length > 10) {
            // Strip base64-embedded images — they bloat payload beyond Vercel limits
            var cleanText = clientText.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+\/=]+/g, '[صورة مرفقة]');
            opts = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_text: cleanText,
                    drive_link: drive,
                    file_name: fileName,
                    plan_name: fileName,
                    client_id: clientId,
                    client_name: clientInput,
                    am_employee_id: amId
                })
            };
        } else if (file.size < 4 * 1024 * 1024) {
            var fd = new FormData();
            fd.append('file', file);
            fd.append('file_name', fileName);
            fd.append('plan_name', fileName);
            if (drive) fd.append('drive_link', drive);
            if (clientId) fd.append('client_id', clientId);
            if (clientInput) fd.append('client_name', clientInput);
            if (amId) fd.append('am_employee_id', amId);
            opts = { method: 'POST', body: fd };
        } else {
            showToast('حجم الملف كبير جداً (> 4.5MB). يرجى نسخه ولصقه في المربع أو استخدام رابط Google Drive', 'error');
            return;
        }
    } else if (drive) {
        opts = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                drive_link: drive,
                file_name: fileName,
                plan_name: fileName,
                client_id: clientId,
                client_name: clientInput,
                am_employee_id: amId
            })
        };
    } else {
        opts = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan_text: txt,
                file_name: fileName,
                plan_name: fileName,
                client_id: clientId,
                client_name: clientInput,
                am_employee_id: amId
            })
        };
    }

    showToast('جاري تفريغ الخطة وتقسيم المهام بالذكاء الاصطناعي... ');
    try {
        var res = await fetch('/api/tasks/ingest-plan', opts);
        var data;
        try {
            data = await res.json();
        } catch(je) {
            data = { error: 'تعذر قراءة رد الخادم (' + res.status + ')' };
        }
        if (res.ok && data.success) {
            var amNotice = data.am_notified ? ' وتم إرسال تنبيه للأكونت مانيجر على التليجرام ' : '';
            showToast('تم تفريغ وإنشاء ' + (data.ingested_count || 0) + ' مهمة للعميل ' + (data.client_name || '') + amNotice + ' ', 'success');
            if (el) el.value = '';
            if (fileEl) fileEl.value = '';
            if (driveEl) driveEl.value = '';
            if (planNameEl) planNameEl.value = '';
            if (data.client_id) {
                currentClient = data.client_id;
            }
            if (typeof loadClientsList === 'function') loadClientsList();
            loadTasksEngine();
        } else {
            showToast(data.error || 'خطأ في معالجة الخطة (' + res.status + ')', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالخادم: ' + (e.message || ''), 'error');
    }
}

async function loadTaskMonthlyReport() {
    try {
        var mInput = document.getElementById('monthly-report-month');
        var nowMonth = new Date().toISOString().slice(0, 7);
        if (mInput && !mInput.value) {
            mInput.value = nowMonth;
        }
        var selectedMonth = (mInput && mInput.value) ? mInput.value : nowMonth;
        var res = await fetch('/api/tasks/monthly-report?month=' + encodeURIComponent(selectedMonth));
        var data = await res.json();
        var tbody = document.getElementById('monthly-report-table-body');
        if (!tbody) return;

        var report = (data && data.report) ? data.report : [];
        window._lastMonthlyReportData = report;

        if (!report || report.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-slate-500">لا توجد سجلات أداء لشهر (' + esc(selectedMonth) + ') بعد</td></tr>';
            return;
        }

        tbody.innerHTML = report.map(function(r) {
            var onTimeBadge = r.on_time_rate !== '-' ?
                ('<span class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">' + esc(r.on_time_rate) +
                 ' <span class="text-[10px] text-slate-400 font-normal">(' + r.on_time_count + ' في الموعد)</span></span>') : '<span class="text-slate-400">—</span>';
            
            var notesHtml = '<span class="text-slate-400">—</span>';
            if (r.notes && r.notes.length) {
                notesHtml = '<div class="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">' +
                    r.notes.map(function(n) {
                        if (typeof n === 'object' && n && n.task_id) {
                            var stBadge = (n.status === 'Awaiting AM Review' || n.status === 'Submitted / In Review') ? 
                                '<span class="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold shrink-0">قيد المراجعة</span>' : 
                                ((n.status === 'Completed') ? '<span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold shrink-0">معتمد</span>' : '');
                            
                            var clientBadge = n.client_name ? ('<span class="text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold border border-slate-200 shrink-0">' + esc(n.client_name) + '</span>') : '';
                            
                            var driveBtn = n.drive_link ? 
                                ('<a href="' + esc(n.drive_link) + '" target="_blank" onclick="event.stopPropagation()" class="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 font-bold transition shrink-0 flex items-center gap-0.5" title="فتح ملف التسليم على Drive">📁 Drive</a>') : '';

                            return '<div onclick="openTaskDetailsModal(\'' + esc(n.task_id) + '\')" class="p-1 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-lg cursor-pointer transition shadow-2xs flex items-center justify-between gap-1 group" title="اضغط لعرض تفاصيل المهمة ومرفقاتها">' +
                                '<div class="flex items-center gap-1 min-w-0 overflow-hidden">' +
                                    '<span class="font-mono font-bold text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded group-hover:bg-blue-600 transition shrink-0">' + esc(n.task_id) + '</span>' +
                                    clientBadge +
                                    stBadge +
                                    '<span class="text-slate-700 text-[11px] font-semibold truncate max-w-[140px]">: ' + esc(n.note || n.title || 'مكتملة') + '</span>' +
                                '</div>' +
                                '<div class="flex items-center gap-1 shrink-0">' +
                                    driveBtn +
                                    '<span class="text-[9px] text-blue-600 font-bold bg-slate-50 px-1 py-0.5 rounded border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition">عرض</span>' +
                                '</div>' +
                            '</div>';
                        }
                        var s = String(n || '').replace(/<[^>]*>/g, '');
                        return '<div class="mb-0.5 leading-tight text-[11px]">' + esc(s) + '</div>';
                    }).join('') +
                '</div>';
            }

            var rateNum = parseInt(r.completion_rate, 10);
            var rateBadge = r.completion_rate !== '-' ?
                '<span class="font-mono font-bold px-2 py-0.5 rounded-md ' + (rateNum >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800') + '">' + esc(r.completion_rate) + '</span>' : '<span class="text-slate-400">—</span>';

            var inProg = (r.in_progress !== undefined) ? r.in_progress : 0;
            var deliv = (r.submitted !== undefined) ? r.submitted : r.completed;

            return '<tr class="hover:bg-slate-50/60 transition-colors">' +
                '<td class="p-3 font-bold text-slate-900 align-middle">' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">👤</span>' +
                        '<div>' + esc(r.employee) + ' <div class="text-[10px] font-normal text-slate-500">(' + esc(r.role) + ')</div></div>' +
                    '</div>' +
                '</td>' +
                '<td class="p-3 font-mono font-bold text-slate-800 text-center align-middle">' + r.assigned + '</td>' +
                '<td class="p-3 font-mono text-amber-600 font-bold text-center align-middle">' + inProg + '</td>' +
                '<td class="p-3 font-mono font-bold text-emerald-600 text-center align-middle">' + deliv + '</td>' +
                '<td class="p-3 text-center align-middle">' + rateBadge + '</td>' +
                '<td class="p-3 font-mono align-middle">' + onTimeBadge + '</td>' +
                '<td class="p-3 font-mono text-indigo-900 font-bold align-middle">' + esc(r.avg_turnaround || '-') + '</td>' +
                '<td class="p-3 font-mono text-slate-700 font-bold align-middle">' + esc(r.avg_duration || '-') + '</td>' +
                '<td class="p-3 text-xs text-slate-700 min-w-[240px] max-w-sm align-middle">' + notesHtml + '</td>' +
            '</tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

function exportMonthlyReportCsv() {
    var tbody = document.getElementById('monthly-report-table-body');
    if (!tbody || !window._lastMonthlyReportData || !window._lastMonthlyReportData.length) {
        showToast('لا توجد بيانات متاحة للتصدير حالياً', 'error');
        return;
    }
    var rows = [
        ["الموظف", "الدور / المسمى الوظيفي", "المسندة (Total)", "قيد العمل (In Progress)", "المسلمة والمنجزة (Delivered)", "المعتمدة (Completed)", "معدل الإنجاز (Rate)", "الالتزام بالموعد (On-Time KPI)", "متوسط مدة الإنجاز", "وقت التايمر"]
    ];
    window._lastMonthlyReportData.forEach(function(r) {
        rows.push([
            r.employee || '',
            r.role || '',
            r.assigned || 0,
            r.in_progress || 0,
            r.submitted || 0,
            r.completed || 0,
            r.completion_rate || '-',
            (r.on_time_rate || '-') + ' (' + (r.on_time_count || 0) + ' في الموعد)',
            r.avg_turnaround || '-',
            r.avg_duration || '-'
        ]);
    });
    var csvContent = "\uFEFF" + rows.map(function(e) {
        return e.map(function(cell) {
            return '"' + String(cell).replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\n");
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var mInput = document.getElementById('monthly-report-month');
    var m = (mInput && mInput.value) ? mInput.value : new Date().toISOString().slice(0, 7);
    a.download = 'Monthly_Performance_Report_' + m + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم تصدير التقرير الشهري بنجاح ');
}

async function sendMonthlyReportAction() {
    var targetEmail = prompt("أدخل البريد الإلكتروني لاستلام التقرير الشهري:", "agencydomya@gmail.com");
    if (!targetEmail) return;
    try {
        showToast("جاري تجهيز وإرسال التقرير للإيميل... ");
        var res = await fetch('/api/tasks/send-monthly-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail })
        });
        var data = await res.json();
        if (data.success) {
            showToast(data.message || 'تم إرسال التقرير بنجاح ');
        } else {
            showToast(data.error || 'خطأ في إرسال التقرير', 'error');
        }
    } catch(e) {
        showToast('خطأ في إرسال التقرير', 'error');
    }
}

async function triggerTasksRemindersAction() {
    if (!confirm('هل تريد إرسال تنبيهات المواعيد لمديري الحسابات والموظفين فورياً عبر تليجرام؟')) return;
    try {
        showToast("جاري فحص المواعيد وإرسال التنبيهات... 🔔");
        var res = await fetch('/api/tasks/reminders/trigger', { method: 'POST' });
        var data = await res.json();
        if (data.success) {
            showToast(data.message || 'تم إرسال التنبيهات بنجاح 🔔');
        } else {
            showToast(data.error || 'تعذّر إرسال التنبيهات', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالخدمة', 'error');
    }
}
window.triggerTasksRemindersAction = triggerTasksRemindersAction;

async function runSystemDiagnostics() {
    var box = document.getElementById('diagnostics-results-box');
    if (!box) return;
    box.innerHTML = '<div class="p-6 text-center text-xs text-slate-500 col-span-full animate-pulse"><i class="w-5 h-5 mx-auto mb-2 text-emerald-600 animate-spin" data-lucide="loader-2"></i>جاري فحص حالة الاتصال بكافة الخدمات السحابية والـ APIs...</div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    try {
        var res = await fetch('/api/system/diagnostics');
        var data = await res.json();
        if (!res.ok) {
            box.innerHTML = '<div class="p-4 bg-red-50 text-red-700 text-xs rounded-xl col-span-full border border-red-200">تعذّر تشغيل التشخيص: ' + esc(data.error || res.statusText) + '</div>';
            return;
        }

        var s = data.services || {};
        var env = data.environment || {};

        var items = [
            {
                title: '️ قاعدة بيانات Supabase',
                ok: s.supabase && s.supabase.ok,
                desc: s.supabase && s.supabase.ok ? 'متصل بنجاح (' + (s.supabase.latency_ms || 0) + 'ms)' : (s.supabase ? s.supabase.error : 'غير متصل'),
                fix: 'تأكد من صحة SUPABASE_KEY في Vercel'
            },
            {
                title: ' محرك الذكاء الاصطناعي (Groq LLaMA)',
                ok: s.groq_llm && s.groq_llm.ok,
                desc: s.groq_llm && s.groq_llm.ok ? 'متصل ونشط (Fast Inference)' : (s.groq_llm ? s.groq_llm.error : 'غير متصل'),
                fix: 'تأكد من ضبط GROQ_API_KEY في Vercel'
            },
            {
                title: ' بوت تيليجرام (Staff Bot)',
                ok: s.telegram && s.telegram.ok,
                desc: s.telegram && s.telegram.ok ? 'متصل: @' + esc(s.telegram.bot_username || '') : (s.telegram ? s.telegram.error : 'غير متصل'),
                fix: 'تأكد من TELEGRAM_BOT_TOKEN'
            },
            {
                title: ' Meta Graph API v21.0',
                ok: s.meta_graph && s.meta_graph.ok,
                desc: s.meta_graph && s.meta_graph.ok ? 'متصل: ' + esc(s.meta_graph.name || 'حساب مفعل') : (s.meta_graph ? s.meta_graph.error : 'غير متصل'),
                fix: 'أعد ربط الصفحة عبر OAuth أو جدد التوكن'
            },
            {
                title: ' مفاتيح الأمان في Vercel',
                ok: env.admin_pass_set && env.secret_key_set,
                desc: env.admin_pass_set && env.secret_key_set ? 'مثبتة بنجاح (Persistent Sessions)' : 'تحذير: بعض المفاتيح مفقودة في Environment Variables',
                fix: 'اضبط ADMIN_PASS و SECRET_KEY في Vercel Dashboard'
            }
        ];

        box.innerHTML = items.map(function(item) {
            var color = item.ok ? 'emerald' : 'amber';
            var bg = item.ok ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900';
            var badge = item.ok ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold"> متصل</span>' : '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">️ تنبيه</span>';
            return '<div class="p-4 rounded-xl border ' + bg + ' flex flex-col justify-between gap-2 shadow-sm">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="font-bold text-xs">' + item.title + '</span>' +
                    badge +
                '</div>' +
                '<p class="text-[11px] opacity-90">' + esc(item.desc) + '</p>' +
                (!item.ok ? '<span class="text-[10px] text-amber-800 font-semibold mt-1"> الحل: ' + esc(item.fix) + '</span>' : '') +
            '</div>';
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) {
        box.innerHTML = '<div class="p-4 bg-red-50 text-red-700 text-xs rounded-xl col-span-full border border-red-200">خطأ في الاتصال بالخادم أثناء الفحص</div>';
    }
}

async function promptSetDriveLink(taskId, currentLink) {
    var val = prompt("أدخل رابط Google Drive لمخرجات وتسليمات هذه المهمة:", currentLink || "");
    if (val === null) return;
    var trimmed = val.trim();
    if (!trimmed) {
        showToast("لم يتم إدخال رابط", "error");
        return;
    }
    try {
        showToast("جاري حفظ رابط الدرايف... ");
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/drive-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drive_link: trimmed })
        });
        var data = await res.json();
        if (res.ok && (data.ok || data.success)) {
            showToast("تم حفظ رابط جوجل درايف بنجاح ");
            loadTasksEngine();
        } else {
            showToast(data.error || "تعذر حفظ الرابط", "error");
        }
    } catch(e) {
        showToast("خطأ في الاتصال بالخادم", "error");
    }
}

async function promptSetTaskNotes(taskId, currentNotes) {
    var val = prompt("أدخل ملاحظات الموظف / تفاصيل المخرجات للمهمة:", currentNotes || "");
    if (val === null) return;
    try {
        showToast("جاري حفظ الملاحظات... ");
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Awaiting AM Review', notes: val.trim() })
        });
        var data = await res.json();
        if (res.ok && data.success) {
            showToast("تم حفظ الملاحظات بنجاح ");
            loadTasksEngine();
        } else {
            showToast(data.error || "تعذر حفظ الملاحظات", "error");
        }
    } catch(e) {
        showToast("خطأ في الاتصال بالخادم", "error");
    }
}

window.promptSetDriveLink = promptSetDriveLink;
window.promptSetTaskNotes = promptSetTaskNotes;
window.recallTaskAction = recallTaskAction;
window.reassignTaskFromBoard = reassignTaskFromBoard;
window.assignTaskFromBoard = assignTaskFromBoard;
window.runSystemDiagnostics = runSystemDiagnostics;

var _currentModalTaskId = null;
async function openTaskDetailsModal(taskId) {
    if (!taskId) return;
    _currentModalTaskId = taskId;
    var modal = document.getElementById('task-details-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    var tIdEl = document.getElementById('tdm-task-id');
    var postSeqEl = document.getElementById('tdm-post-seq');
    var stEl = document.getElementById('tdm-status');
    var clientEl = document.getElementById('tdm-client');
    var bodyEl = document.getElementById('tdm-body');
    
    if (tIdEl) tIdEl.textContent = taskId;
    if (postSeqEl) postSeqEl.textContent = '#...';
    if (stEl) stEl.innerHTML = '<span class="animate-pulse">جارِ التحميل...</span>';
    if (clientEl) clientEl.textContent = '...';
    if (bodyEl) bodyEl.innerHTML = '<div class="py-12 text-center text-slate-400"><div class="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div><div>جارِ تحميل تفاصيل المهمة ومرفقاتها...</div></div>';
    
    var t = (typeof tasksList !== 'undefined' && Array.isArray(tasksList)) ? tasksList.find(function(x){ return x && x.task_id === taskId; }) : null;
    var clientName = '';
    
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId));
        if (res.ok) {
            var d = await res.json();
            if (d.ok && d.task) {
                t = d.task;
                clientName = d.client_name || '';
            }
        }
    } catch(e) { console.error("fetch task error:", e); }
    
    if (!t) {
        if (bodyEl) bodyEl.innerHTML = '<div class="py-12 text-center text-red-500 font-bold">️ تعذّر العثور على بيانات المهمة (' + esc(taskId) + ')</div>';
        return;
    }
    
    var postSeq = t.post_number_in_plan || t.post_number || (typeof getTaskSequenceNum === 'function' ? getTaskSequenceNum(t) : 1);
    var st = t.status || 'Pending AM Approval';
    var stLabel = (st === 'Completed') ? 'معتمد ومكتمل ' :
                  (st === 'Awaiting AM Review') ? 'بانتظار مراجعة AM ' :
                  (st === 'In Progress') ? 'جاري العمل ' :
                  (st === 'Assigned') ? 'مسندة للموظف ' : 'بانتظار موافقة AM ';
    var stBadgeClass = (st === 'Completed') ? 'bg-emerald-100 text-emerald-800' :
                       (st === 'In Progress') ? 'bg-blue-100 text-blue-800' :
                       (st === 'Awaiting AM Review') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
    
    if (tIdEl) tIdEl.textContent = t.task_id;
    if (postSeqEl) postSeqEl.textContent = '#' + postSeq;
    if (stEl) {
        stEl.className = 'text-xs font-bold px-2.5 py-1 rounded-full ' + stBadgeClass;
        stEl.textContent = stLabel;
    }
    if (clientEl) {
        var cName = clientName || (typeof _clientNameMap === 'function' ? _clientNameMap(t.client_id) : (t.client_name || t.client_id || ''));
        clientEl.textContent = ' ' + cName;
    }
    
    var driveLink = (t.drive_link || t.google_drive_link || t.submission_link || t.drive_url || '').trim();
    var rawNotes = (t.delivery_notes || t.deliverables_notes || (t.status === 'Submitted / In Review' ? t.notes : '') || '').trim();
    var delivList = Array.isArray(t.deliverables) ? t.deliverables : [];
    
    var delivHtml = '';
    if (delivList.length > 0 || driveLink || rawNotes) {
        delivHtml = '<div class="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 space-y-3">' +
            '<div class="flex items-center justify-between"><span class="font-bold text-xs text-emerald-950 flex items-center gap-1.5">📦 تسليمات وإنجاز الموظف:</span><span class="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Google Drive</span></div>';
        
        if (delivList.length > 0) {
            delivHtml += '<div class="space-y-1.5">' +
                '<div class="text-[11px] font-bold text-emerald-900">📁 الملفات والسلايدات المرفوعة (' + delivList.length + ' ملف):</div>' +
                '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">';
            delivList.forEach(function(df, dfIdx) {
                var dUrl = df.url || df.drive_link || df;
                var dName = df.filename || ('سلايد #' + (dfIdx + 1));
                var isVid = (df.mime && df.mime.startsWith('video')) || /\.(mp4|mov|webm)(\?|$)/i.test(dName);
                delivHtml += '<a href="' + esc(dUrl) + '" target="_blank" class="bg-white hover:bg-emerald-100 border border-emerald-200 rounded-xl p-2 text-right transition flex items-center gap-2 shadow-2xs group">' +
                    '<span class="text-base">' + (isVid ? '🎬' : '🖼️') + '</span>' +
                    '<div class="min-w-0 flex-1">' +
                        '<div class="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-950">' + esc(dName) + '</div>' +
                        '<div class="text-[10px] text-emerald-700 font-mono">فتح على Drive ↗</div>' +
                    '</div>' +
                '</a>';
            });
            delivHtml += '</div></div>';
        }

        if (driveLink && !delivList.some(function(d){ return (d.url || d) === driveLink; })) {
            delivHtml += '<div class="flex items-center gap-2 flex-wrap">' +
                '<a href="' + esc(driveLink) + '" target="_blank" class="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition text-xs"><span>↗️ فتح مجلد / ملف التسليم على Drive ↗️</span></a>' +
                '<button onclick="navigator.clipboard.writeText(\'' + esc(driveLink) + '\');showToast(\'تم نسخ الرابط \')" class="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl font-bold transition text-xs"><span>📋 نسخ الرابط</span></button>' +
            '</div>';
        }
        if (rawNotes) {
            delivHtml += '<div class="bg-white/90 p-3 rounded-xl border border-emerald-100 text-slate-800 space-y-0.5"><div class="text-[10px] text-slate-500 font-bold">📝 ملاحظات الموظف عند التسليم:</div><div class="font-semibold whitespace-pre-line text-xs">' + esc(rawNotes) + '</div></div>';
        }
        delivHtml += '</div>';
    }
    
    var logsHtml = '';
    var logs = (t.activity_log || []);
    if (logs && logs.length) {
        logsHtml = '<div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">' +
            '<div class="font-bold text-xs text-slate-900 flex items-center justify-between">' +
                '<span> سجل كل العمليات والمواعيد وتاريخ المهمة:</span>' +
                '<span class="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">' + logs.length + ' عمليات</span>' +
            '</div>' +
            '<div class="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">';
        logs.slice().reverse().forEach(function(l) {
            var icon = l.action === 'created' ? '' :
                       l.action === 'assigned' ? '' :
                       l.action === 'started' ? '️' :
                       l.action === 'submitted' ? '' :
                       l.action === 'reviewed_reject' ? '↩️' :
                       l.action === 'reviewed_forward' ? '️' :
                       l.action === 'reviewed_approved' ? '' :
                       l.action === 'recalled' ? '️' :
                       l.action === 'dates_updated' ? '' :
                       l.action === 'reference_added' ? '' :
                       l.action === 'asset_uploaded' ? '' : '';

            var actionTitle = l.action === 'created' ? 'إنشاء وتفريغ المهمة' :
                              l.action === 'assigned' ? ('إسناد إلى ' + (l.target_employee_name || 'موظف')) :
                              l.action === 'started' ? 'بدء العمل وتشغيل المؤقت' :
                              l.action === 'submitted' ? 'تسليم مخرجات العمل' :
                              l.action === 'reviewed_reject' ? 'طلب تعديل من الموظف' :
                              l.action === 'reviewed_forward' ? ('تمرير إلى ' + (l.target_employee_name || 'موظف آخر')) :
                              l.action === 'reviewed_approved' ? 'اعتماد نهائي وجدولة' :
                              l.action === 'recalled' ? 'سحب المهمة من الموظف' :
                              l.action === 'dates_updated' ? 'تعديل وتحديد المواعيد' :
                              l.action === 'reference_added' ? 'إضافة ريفرنس ومراجع' :
                              l.action === 'asset_uploaded' ? 'رفع ملف على Drive' : (l.note || l.action || 'عملية');

            var timeStr = l.time_cairo || l.timestamp || l.at || l.time || '—';
            if (timeStr && timeStr.indexOf('T') !== -1) {
                timeStr = timeStr.replace('T', ' ').substring(0, 19);
            }
            var actorName = l.actor_name || l.by || l.actor_type || 'النظام';
            var noteText = (l.note || l.description || '').trim();

            var d = l.details || {};
            var detailBadges = [];
            if (d.delivery_deadline) detailBadges.push(' تسليم: ' + d.delivery_deadline);
            if (d.publish_date) detailBadges.push(' نزول: ' + d.publish_date);
            if (d.scheduled_start_date) detailBadges.push(' بدء: ' + d.scheduled_start_date);
            if (d.drive_link) detailBadges.push('<a href="' + esc(d.drive_link) + '" target="_blank" class="text-emerald-700 underline font-bold"> ملف Drive</a>');
            if (d.reason) detailBadges.push('️ سبب: ' + esc(d.reason));

            logsHtml += '<div class="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs space-y-1.5">' +
                '<div class="flex items-center justify-between gap-1.5 flex-wrap border-b border-slate-100 pb-1">' +
                    '<div class="flex items-center gap-1.5 font-bold text-slate-900">' +
                        '<span class="text-sm">' + icon + '</span>' +
                        '<span>' + esc(actionTitle) + '</span>' +
                    '</div>' +
                    '<span class="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">' + esc(timeStr) + '</span>' +
                '</div>' +
                '<div class="flex items-center justify-between gap-2 text-[11px] text-slate-600 flex-wrap">' +
                    '<div>بواسطة: <b class="text-slate-800">' + esc(actorName) + '</b></div>' +
                    (l.target_employee_name ? ('<div>الموظف المعني: <b class="text-indigo-700">' + esc(l.target_employee_name) + '</b></div>') : '') +
                '</div>' +
                (noteText && noteText !== actionTitle ? ('<div class="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-700 font-medium whitespace-pre-line"> ' + esc(noteText) + '</div>') : '') +
                (detailBadges.length ? ('<div class="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px] font-mono font-bold text-slate-600">' + detailBadges.map(function(b){ return '<span class="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">' + b + '</span>'; }).join('') + '</div>') : '') +
            '</div>';
        });
        logsHtml += '</div></div>';
    }
    
    // Reference images & external links
    var refHtml = '';
    var refImgs = (t.content_data && t.content_data.reference_images && t.content_data.reference_images.length) ? t.content_data.reference_images :
                  (t.graphic_data && t.graphic_data.reference_images && t.graphic_data.reference_images.length) ? t.graphic_data.reference_images :
                  (t.media_urls || []);
    if (refImgs && refImgs.length) {
        refHtml = '<div class="space-y-2 bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4">' +
            '<div class="font-bold text-xs text-blue-950 flex items-center gap-1.5">🖼️ صور ومراجع البوست (من الخطة):</div>' +
            '<div class="flex gap-2 flex-wrap">';
        refImgs.forEach(function(img) {
            var thumb = (typeof driveThumb === 'function') ? driveThumb(img) : img;
            refHtml += '<a href="' + esc(img) + '" target="_blank" class="block group relative">' +
                '<img src="' + esc(thumb) + '" class="w-16 h-16 rounded-xl object-cover border border-blue-200 shadow-2xs group-hover:scale-105 transition" onerror="this.style.display=\'none\'">' +
            '</a>';
        });
        refHtml += '</div></div>';
    }
    
    var visIdea = (t.visual_idea || (t.content_data && t.content_data.visual_idea) || (t.graphic_data && t.graphic_data.idea) || (t.video_data && t.video_data.idea) || t.design_brief || '').trim();
    var modNotes = (t.review_note || t.modification_request || t.changes_requested_note || t.task_notes || '').trim();

    bodyEl.innerHTML = '<div class="space-y-4">' +
        '<div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">' +
            '<div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">عنوان المنشور / البوست:</div>' +
            '<h3 class="font-bold text-base text-slate-900 leading-snug">' + esc(t.title || 'بدون عنوان') + '</h3>' +
            (t.plan_name ? ('<div class="text-xs text-blue-600 font-bold"> الخطة: ' + esc(t.plan_name) + '</div>') : '') +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
            '<div class="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">' +
                '<div class="text-[10px] text-slate-500 font-bold"> الموظف المسند إليه:</div>' +
                '<div class="font-bold text-xs text-slate-800">' + esc(t.assignee_name || 'غير مسند بعد') + '</div>' +
            '</div>' +
            '<div class="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">' +
                '<div class="text-[10px] text-slate-500 font-bold"> موعد التسليم:</div>' +
                '<div class="font-mono font-bold text-xs text-amber-800">' + esc(t.delivery_deadline || t.publish_date || 'غير محدد') + '</div>' +
            '</div>' +
        '</div>' +
        ((t.tagline || (t.content_data && t.content_data.tagline) || (t.content_data && t.content_data.tag_line)) ? ('<div class="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-1">' +
            '<div class="text-[10px] text-amber-900 font-bold flex items-center gap-1">️ التاج لاين / الهوك الجذاب (Tagline / Hook):</div>' +
            '<div class="text-xs font-bold text-amber-950 leading-relaxed">' + esc(t.tagline || t.content_data.tagline || t.content_data.tag_line) + '</div>' +
        '</div>') : '') +
        (t.caption ? ('<div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5">' +
            '<div class="text-[10px] text-slate-500 font-bold flex items-center gap-1">️ نص الكونتنت والكابشن الكامل (Caption):</div>' +
            '<div class="text-xs text-slate-800 whitespace-pre-line leading-relaxed">' + esc(t.caption) + '</div>' +
        '</div>') : '') +
        (visIdea ? ('<div class="bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5 space-y-1">' +
            '<div class="text-[10px] text-purple-900 font-bold flex items-center gap-1">💡 فكرة وتوجيهات التصميم / الإسكربت (Creative Brief):</div>' +
            '<div class="text-xs text-purple-950 whitespace-pre-line leading-relaxed font-medium">' + esc(visIdea) + '</div>' +
        '</div>') : '') +
        (modNotes ? ('<div class="bg-rose-50/90 border border-rose-200 rounded-2xl p-3.5 space-y-1">' +
            '<div class="text-[10px] text-rose-900 font-bold flex items-center gap-1">✍️ طلبات التعديل وملاحظات المهمة:</div>' +
            '<div class="text-xs text-rose-950 whitespace-pre-line leading-relaxed font-semibold">' + esc(modNotes) + '</div>' +
        '</div>') : '') +
        delivHtml +
        refHtml +
        logsHtml +
    '</div>';
}

function closeTaskDetailsModal() {
    var modal = document.getElementById('task-details-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function goToTaskOnBoard() {
    closeTaskDetailsModal();
    if (typeof go === 'function') {
        var btn = document.getElementById('nav-tasks');
        go('tasks', btn);
    }
    setTimeout(function() {
        if (typeof loadTasksEngine === 'function') loadTasksEngine();
    }, 150);
}

window.openTaskDetailsModal = openTaskDetailsModal;
window.closeTaskDetailsModal = closeTaskDetailsModal;
window.goToTaskOnBoard = goToTaskOnBoard;

// Google Drive Integration Manager in Settings
async function checkGoogleDriveStatus() {
    var badge = document.getElementById('gdrive-status-badge');
    if (!badge) return;
    try {
        var res = await fetch('/api/settings/google-drive');
        var d = await res.json();
        if (d.connected) {
            badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800';
            badge.textContent = ' متصل بـ Google Drive بنجاح';
        } else if (d.has_credentials) {
            badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800';
            badge.textContent = '️ البيانات مدخلة لكن يلزم تجديد الـ Token';
        } else {
            badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600';
            badge.textContent = ' غير متصل - أدخل بيانات Drive';
        }
        if (d.client_id) {
            var cidInput = document.getElementById('gdrive-client-id');
            if (cidInput && !cidInput.value) cidInput.value = d.client_id;
        }
    } catch(e) {
        badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800';
        badge.textContent = ' تعذّر فحص الاتصال';
    }
}

async function saveGoogleDriveSettings() {
    var cid = (document.getElementById('gdrive-client-id') || {}).value || '';
    var sec = (document.getElementById('gdrive-client-secret') || {}).value || '';
    var rt = (document.getElementById('gdrive-refresh-token') || {}).value || '';
    var resDiv = document.getElementById('gdrive-save-result');
    
    if (!cid.trim() || !sec.trim() || !rt.trim()) {
        showToast('يرجى ملء جميع حقول Google Drive', 'error');
        return;
    }
    
    showToast('جاري حفظ واختبار اتصال Google Drive... ');
    try {
        var res = await fetch('/api/settings/google-drive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: cid.trim(), client_secret: sec.trim(), refresh_token: rt.trim() })
        });
        var d = await res.json();
        if (res.ok && d.ok) {
            showToast('تم تفعيل وحفظ Google Drive بنجاح! ', 'success');
            if (resDiv) {
                resDiv.className = 'text-xs p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-bold block';
                resDiv.textContent = ' ' + (d.message || 'تم الاتصال بنجاح!');
            }
            checkGoogleDriveStatus();
        } else {
            showToast(d.error || 'تعذّر الاتصال بـ Google Drive', 'error');
            if (resDiv) {
                resDiv.className = 'text-xs p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 font-bold block';
                resDiv.textContent = ' ' + (d.error || 'فشل الاتصال');
            }
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

window.checkGoogleDriveStatus = checkGoogleDriveStatus;
window.saveGoogleDriveSettings = saveGoogleDriveSettings;

// Deliverable Modal Manager
window._activeDeliverableTaskId = null;

function openDeliverableModal(taskId, currentLink) {
    window._activeDeliverableTaskId = taskId;
    var modal = document.getElementById('task-deliverable-modal');
    if (!modal) return;
    var inp = document.getElementById('deliv-drive-input');
    if (inp) inp.value = currentLink || '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDeliverableModal() {
    var modal = document.getElementById('task-deliverable-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function submitDriveLinkDeliverable() {
    var taskId = window._activeDeliverableTaskId;
    if (!taskId) return;
    var inp = document.getElementById('deliv-drive-input');
    var link = (inp ? inp.value : '').trim();
    if (!link) {
        showToast('يرجى لصق رابط Google Drive أو الملف أولاً', 'error');
        return;
    }
    showToast('جاري حفظ وربط الرابط بالمهمة... ');
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/drive-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drive_link: link, link: link })
        });
        var d = await res.json();
        if (res.ok && d.ok) {
            closeDeliverableModal();
            showToast(' تم حفظ وربط رابط Google Drive بالتاسك بنجاح! ', 'success');
            if (typeof loadTasksEngine === 'function') loadTasksEngine();
            if (typeof loadMyPortal === 'function') loadMyPortal();
        } else {
            showToast(d.error || 'تعذّر حفظ الرابط', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

async function handleModalFileUpload(input) {
    var taskId = window._activeDeliverableTaskId;
    var files = (input && input.files && input.files.length) ? Array.from(input.files) : [];
    if (!taskId || !files.length) return;
    closeDeliverableModal();
    
    if (files.length === 1) {
        try {
            await driveUploadFile(taskId, files[0]);
            showToast(' تم رفع الملف بنجاح وربطه بالمهمة على Google Drive! ', 'success');
            if (typeof loadTasksEngine === 'function') loadTasksEngine();
            if (typeof loadMyPortal === 'function') loadMyPortal();
        } catch(e) {
            showToast('تعذّر الرفع: ' + (e.message || ''), 'error');
        }
    } else {
        showToast('جاري رفع ' + files.length + ' ملف/سلايدات كاروسيل إلى Google Drive... ⏳');
        var successCount = 0;
        for (var i = 0; i < files.length; i++) {
            try {
                await driveUploadFile(taskId, files[i]);
                successCount++;
            } catch(e) {
                console.error('Error uploading file ' + files[i].name, e);
            }
        }
        if (successCount > 0) {
            showToast(' تم رفع ' + successCount + ' من ' + files.length + ' ملف/سلايد كاروسيل بنجاح! ', 'success');
            if (typeof loadTasksEngine === 'function') loadTasksEngine();
            if (typeof loadMyPortal === 'function') loadMyPortal();
        } else {
            showToast('تعذّر رفع الملفات', 'error');
        }
    }
    if (input) input.value = '';
}

// Task Notes & Modification Requests Modal (تعديل وإضافة الملاحظات وطلبات التعديل)
window._activeNotesTaskId = null;
function openTaskNotesEditorModal(taskId) {
    window._activeNotesTaskId = taskId;
    var allTasks = (typeof _allTasksCache === 'object' && _allTasksCache) ? Object.values(_allTasksCache) : [];
    var t = allTasks.find(function(x){ return x && x.task_id === taskId; }) || {};
    
    var modal = document.getElementById('task-notes-modal');
    if (!modal) {
        // Create modal dynamically if not in DOM
        modal = document.createElement('div');
        modal.id = 'task-notes-modal';
        modal.className = 'fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4';
        modal.onclick = function(e){ if (e.target === modal) closeTaskNotesEditorModal(); };
        modal.innerHTML = '<div class="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">' +
            '<div class="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 bg-rose-50/50">' +
                '<div class="flex items-center gap-2">' +
                    '<span class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base">✍️</span>' +
                    '<h3 class="font-bold text-sm text-slate-900" id="tnm-title">ملاحظات وطلبات التعديل على المهمة</h3>' +
                '</div>' +
                '<button type="button" onclick="closeTaskNotesEditorModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 leading-none rounded-lg hover:bg-slate-200 transition">✕</button>' +
            '</div>' +
            '<div class="p-5 sm:p-6 space-y-4">' +
                '<div id="tnm-task-info" class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-bold"></div>' +
                '<div>' +
                    '<label class="block text-xs font-bold text-slate-800 mb-1.5">✍️ اكتب التعديل أو الملاحظة المطلوبة بدقة للموظف:</label>' +
                    '<textarea id="tnm-notes-input" rows="4" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-rose-500 focus:outline-none" placeholder="مثال: يرجى تعديل لون الخلفية للأزرق الداكن وإبراز اللوجو في أول سلايد..."></textarea>' +
                '</div>' +
                '<div>' +
                    '<label class="block text-xs font-bold text-slate-800 mb-1.5">💡 فكرة وتوجيهات التصميم / الإسكربت (Creative Brief):</label>' +
                    '<textarea id="tnm-brief-input" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="توجيهات الفكرة والتخيل..."></textarea>' +
                '</div>' +
                '<div class="flex items-center gap-2 pt-2">' +
                    '<button type="button" onclick="saveTaskNotesEditorAction()" class="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">' +
                        '<span>💾 حفظ الملاحظات والتعديل</span>' +
                    '</button>' +
                    '<button type="button" onclick="closeTaskNotesEditorModal()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer">' +
                        '<span>إلغاء</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
        document.body.appendChild(modal);
    }
    
    var infoEl = document.getElementById('tnm-task-info');
    if (infoEl) infoEl.textContent = 'المهمة: [' + taskId + '] ' + (t.title || '');
    var nInp = document.getElementById('tnm-notes-input');
    if (nInp) nInp.value = t.review_note || t.modification_request || t.notes || '';
    var bInp = document.getElementById('tnm-brief-input');
    if (bInp) bInp.value = t.visual_idea || t.design_brief || '';
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeTaskNotesEditorModal() {
    var modal = document.getElementById('task-notes-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function saveTaskNotesEditorAction() {
    var taskId = window._activeNotesTaskId;
    if (!taskId) return;
    var nInp = document.getElementById('tnm-notes-input');
    var bInp = document.getElementById('tnm-brief-input');
    var notesVal = (nInp ? nInp.value : '').trim();
    var briefVal = (bInp ? bInp.value : '').trim();
    
    showToast('جاري حفظ الملاحظات... ⏳');
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/update-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notes: notesVal,
                review_note: notesVal,
                modification_request: notesVal,
                visual_idea: briefVal,
                design_brief: briefVal
            })
        });
        var data = await res.json();
        if (res.ok && data.success) {
            closeTaskNotesEditorModal();
            showToast(' تم حفظ وتحديث الملاحظات والطلبات بنجاح! ', 'success');
            if (typeof loadTasksEngine === 'function') loadTasksEngine();
            if (typeof loadMyPortal === 'function') loadMyPortal();
        } else {
            showToast(data.error || 'تعذّر الحفظ', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

window.openTaskNotesEditorModal = openTaskNotesEditorModal;
window.closeTaskNotesEditorModal = closeTaskNotesEditorModal;
window.saveTaskNotesEditorAction = saveTaskNotesEditorAction;

async function submitTaskDirectlyNoFile() {
    var taskId = window._activeDeliverableTaskId;
    if (!taskId) return;
    closeDeliverableModal();
    showToast('جاري تسليم المهمة لمدير الحساب... ');
    try {
        var res = await fetch('/api/me/tasks/' + encodeURIComponent(taskId) + '/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: 'تم إنجاز المطلوب وتسليم المهمة للمراجعة والاعتماد.' })
        });
        var data = await res.json();
        if (res.ok) {
            showToast(' تم تسليم المهمة بنجاح للمراجعة والاعتماد! ', 'success');
            if (typeof loadTasksEngine === 'function') loadTasksEngine();
            if (typeof loadMyPortal === 'function') loadMyPortal();
        } else {
            showToast(data.error || 'تعذّر التسليم', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

window.openDeliverableModal = openDeliverableModal;
window.closeDeliverableModal = closeDeliverableModal;
window.submitDriveLinkDeliverable = submitDriveLinkDeliverable;
window.handleModalFileUpload = handleModalFileUpload;
window.submitTaskDirectlyNoFile = submitTaskDirectlyNoFile;

/* =========================================================================
   PLAN BUILDER TEMPLATE (منشئ وقالب كتابة الخطة التفاعلي)
   ========================================================================= */

function onPlanBuilderModalClientChange(val) {
    if (!val) return;
    var cleanVal = String(val).trim().toLowerCase();
    var list = window._clientsList || window.clientsList || window._planClientsCache || [];
    var matched = list.find(function(c){
        return (c.name && c.name.toLowerCase() === cleanVal) ||
               (c.company && c.company.toLowerCase() === cleanVal) ||
               (c.id && c.id.toLowerCase() === cleanVal);
    });

    if (matched) {
        var amSelect = document.getElementById('pb-am-select');
        if (amSelect && (matched.am_employee_id || matched.am_name)) {
            var targetAMId = matched.am_employee_id;
            var targetAMName = matched.am_name;
            for (var i = 0; i < amSelect.options.length; i++) {
                var opt = amSelect.options[i];
                if ((targetAMId && opt.value === targetAMId) || (targetAMName && opt.text.includes(targetAMName))) {
                    amSelect.selectedIndex = i;
                    break;
                }
            }
        }
        var planNameInput = document.getElementById('pb-plan-name');
        if (planNameInput) {
            var d = new Date();
            var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            planNameInput.value = 'خطة ' + matched.name + ' — ' + months[d.getMonth()] + ' ' + d.getFullYear();
        }
    }
}

function togglePbCustomClient(forceCustom) {
    var sel = document.getElementById('pb-client-select');
    var inp = document.getElementById('pb-client-name');
    var btn = document.getElementById('btn-pb-custom-toggle');
    if (!sel || !inp) return;
    
    var showCustom = (forceCustom === true) || inp.classList.contains('hidden');
    if (showCustom) {
        inp.classList.remove('hidden');
        sel.classList.add('hidden');
        if (btn) btn.textContent = '↩ اختيار من القائمة';
        inp.focus();
    } else {
        inp.classList.add('hidden');
        sel.classList.remove('hidden');
        if (btn) btn.textContent = '+ عميل جديد';
        if (sel.value && sel.value !== '__new__') {
            onPlanBuilderModalClientSelectChange(sel.value);
        }
    }
}

function onPlanBuilderModalClientSelectChange(val) {
    if (!val) return;
    if (val === '__new__') {
        togglePbCustomClient(true);
        return;
    }
    var cSel = document.getElementById('pb-client-select');
    var cInp = document.getElementById('pb-client-name');
    var selOpt = cSel ? cSel.options[cSel.selectedIndex] : null;
    var clientName = (selOpt ? selOpt.getAttribute('data-name') : '') || (selOpt ? selOpt.text.split(' (')[0].trim() : '') || val;
    if (cInp) cInp.value = clientName;

    onPlanBuilderModalClientChange(clientName);
}

function onPlanBuilderClientSelectChange(val) {
    onPlanBuilderModalClientSelectChange(val);
}

async function openPlanBuilderModal() {
    var modal = document.getElementById('plan-builder-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    try {
        if (!window.allTeamEmployees || !window.allTeamEmployees.length) {
            var empRes = await safeFetchJson('/api/tasks/employees');
            if (empRes && empRes.employees && empRes.employees.length) {
                window.allTeamEmployees = empRes.employees;
                employeesList = empRes.employees;
                if (typeof refreshPlanBuilderAssigneeOptions === 'function') {
                    refreshPlanBuilderAssigneeOptions();
                }
            }
        }
    } catch(e){}

    var container = document.getElementById('pb-posts-container');
    if (container && container.children.length === 0) {
        addPlanBuilderRow();
    } else if (typeof refreshPlanBuilderAssigneeOptions === 'function') {
        refreshPlanBuilderAssigneeOptions();
    }

    var clientInput = document.getElementById('pb-client-name');
    var clientSelect = document.getElementById('pb-client-select');
    var amSelect = document.getElementById('pb-am-select');
    var planNameInput = document.getElementById('pb-plan-name');
    var modalDatalist = document.getElementById('pb-modal-clients-list');

    var allClients = window._clientsList || window.clientsList || [];
    try {
        if (!allClients || !allClients.length) {
            var cRes = await fetch('/api/clients');
            var cData = await cRes.json();
            allClients = Array.isArray(cData) ? cData : (cData.clients || []);
            window._clientsList = allClients;
        }
    } catch(e){}

    if (modalDatalist && allClients && allClients.length) {
        modalDatalist.innerHTML = allClients.map(function(c){
            var cName = c.name || c.company || c.id || '';
            return '<option value="' + esc(cName) + '">' + (c.am_name ? ('[AM: ' + esc(c.am_name) + ']') : '') + '</option>';
        }).join('');
    }

    var activeCName = '';
    var activeCid = window.activeClientId || (typeof currentClient !== 'undefined' ? currentClient : '');
    var clientNameEl = document.getElementById('tasks-client-name');
    if (clientNameEl && clientNameEl.textContent) {
        activeCName = clientNameEl.textContent.replace(/^[—\-\s]+/, '').trim();
    }
    if (!activeCName || activeCName === 'العميل') {
        var matched = (allClients || []).find(function(c){ return c.id === activeCid || c.name === activeCid; });
        activeCName = matched ? (matched.name || matched.id) : (activeCid || (allClients[0] && allClients[0].name) || '');
    }

    // Populate pb-client-select with ALL clients
    if (clientSelect && allClients && allClients.length) {
        var opts = '<option value="">-- اختر العميل من القائمة --</option>' +
            allClients.map(function(c) {
                var amPart = c.am_name ? (' (AM: ' + c.am_name + ')') : '';
                var isSelected = (c.id === activeCid || c.name === activeCName || (c.company && c.company === activeCName));
                return '<option value="' + esc(c.id) + '" data-name="' + esc(c.name) + '"' + (isSelected ? ' selected' : '') + '>' + esc(c.name) + amPart + '</option>';
            }).join('') +
            '<option value="__new__">+ كتابة اسم عميل جديد...</option>';
        clientSelect.innerHTML = opts;

        var selectedC = allClients.find(function(c){ return c.id === activeCid || c.name === activeCName; }) || allClients[0];
        if (selectedC) {
            clientSelect.value = selectedC.id;
            activeCName = selectedC.name;
        }
    }

    if (clientInput && activeCName) {
        clientInput.value = activeCName;
    }

    if (planNameInput && !planNameInput.value) {
        var d = new Date();
        var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        var cDisplay = (clientInput && clientInput.value) || activeCName || 'العميل';
        planNameInput.value = 'خطة ' + cDisplay + ' — ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    // Load real AMs
    var realAMs = [
        { employee_id: 'AM-2072-9827', name: 'محمود خالد', role: 'ACCOUNT MANAGER' },
        { employee_id: 'EMP-5887-5256', name: 'آيه أحمد مجاهد', role: 'ACCOUNT MANAGER' }
    ];

    function fillAMSelect(list) {
        if (!amSelect) return;
        var myEmpId = (window.currentUserData && window.currentUserData.employee_id) || '';
        amSelect.innerHTML = '';
        list.forEach(function(a){
            var opt = document.createElement('option');
            opt.value = a.employee_id || a.id;
            var isMe = myEmpId && String(opt.value) === String(myEmpId);
            opt.textContent = '👤 ' + (a.name || a.employee_id) + ' — ' + (a.role || 'Account Manager') + (isMe ? ' (أنا 🙋‍♂️)' : '');
            if (isMe || opt.value === 'AM-2072-9827') opt.selected = true;
            amSelect.appendChild(opt);
        });
    }

    fillAMSelect(realAMs);

    try {
        var mgrData = await safeFetchJson('/api/managers');
        if (mgrData && mgrData.managers && mgrData.managers.length) {
            var filtered = mgrData.managers.filter(function(m){
                return (m.name || '').indexOf('روضة') === -1;
            });
            if (filtered.length) {
                realAMs = filtered;
                fillAMSelect(realAMs);
            }
        }
    } catch(e){}

    if (clientInput && clientInput.value) {
        onPlanBuilderModalClientChange(clientInput.value);
    }
}

function closePlanBuilderModal() {
    var modal = document.getElementById('plan-builder-modal');
    if (modal) modal.classList.add('hidden');
}

window.handlePlanRowFileUpload = async function(input, rowIdx) {
    var files = input && input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    var row = document.getElementById('pb-row-' + rowIdx);
    if (!row) return;
    var refInp = row.querySelector('.pb-ref-links');
    var thumbs = row.querySelector('.pb-row-thumbs');
    showToast('جاري رفع الصور كمرجع للبوست... ⏳');
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var fd = new FormData();
        fd.append('file', f);
        var cInput = ((document.getElementById('pb-client-name')||{}).value || '').trim();
        if (cInput) fd.append('client_id', cInput);
        try {
            var res = await fetch('/api/plan/upload-image', { method: 'POST', body: fd });
            var data = await res.json();
            var link = (data && data.url) ? data.url : '';
            if (res.ok && link) {
                if (refInp) {
                    var cur = refInp.value.trim();
                    refInp.value = cur ? (cur + ', ' + link) : link;
                }
                if (thumbs) {
                    var isImg = /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(link) || link.startsWith('data:image/');
                    var thumbHtml = '<a href="' + esc(link) + '" target="_blank" class="inline-flex items-center gap-1 bg-white border border-purple-200 rounded-lg p-1 text-[10px] font-bold text-purple-800 shadow-2xs hover:scale-105 transition" title="' + esc(f.name) + '">' +
                        (isImg ? ('<img src="' + esc(link) + '" class="w-6 h-6 object-cover rounded" />') : '📁') +
                        '<span class="max-w-[100px] truncate">' + esc(f.name) + '</span> ↗</a>';
                    thumbs.insertAdjacentHTML('beforeend', thumbHtml);
                }
                showToast('تم رفع المرجع بنجاح ✨');
            } else {
                showToast(data.error || 'تعذر رفع المرجع', 'error');
            }
        } catch(e) {
            showToast('خطأ أثناء الرفع', 'error');
        }
    }
    input.value = '';
};

window.promptAddPlanRowDriveLink = function(rowIdx) {
    var val = prompt("أدخل رابط Google Drive أو Pinterest أو رابط الفيديو المرجعي لهذا البوست:");
    if (!val || !val.trim()) return;
    var link = val.trim();
    var row = document.getElementById('pb-row-' + rowIdx);
    if (!row) return;
    var refInp = row.querySelector('.pb-ref-links');
    var thumbs = row.querySelector('.pb-row-thumbs');
    if (refInp) {
        var cur = refInp.value.trim();
        refInp.value = cur ? (cur + ', ' + link) : link;
    }
    if (thumbs) {
        var lbl = link.includes('drive.google') ? '📁 Drive' : (link.includes('pinterest') ? '📌 Pinterest' : (link.includes('facebook') ? '📹 Facebook' : (link.includes('instagram') ? '📸 Instagram' : (link.includes('youtube') ? '🎬 YouTube' : '🔗 مرجع'))));
        var thumbHtml = '<a href="' + esc(link) + '" target="_blank" class="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-800 shadow-2xs hover:scale-105 transition">' +
            '<span>' + esc(lbl) + '</span> ↗</a>';
        thumbs.insertAdjacentHTML('beforeend', thumbHtml);
    }
    showToast('تمت إضافة الرابط المرجعي للبوست 👍');
};

window.planBuilderRowCount = 0;

function updatePlanBuilderQuickNav() {
    var nav = document.getElementById('pb-quick-nav');
    var pills = document.getElementById('pb-quick-nav-pills');
    if (!nav || !pills) return;
    var rows = document.querySelectorAll('.pb-post-row');
    if (rows.length <= 1) {
        nav.classList.add('hidden');
        pills.innerHTML = '';
        return;
    }
    nav.classList.remove('hidden');
    var html = '';
    rows.forEach(function(r, idx){
        var n = idx + 1;
        var rId = r.id || ('pb-row-' + n);
        html += '<button type="button" onclick="var el=document.getElementById(\'' + rId + '\'); if(el) el.scrollIntoView({behavior:\'smooth\', block:\'center\'});" class="px-2 py-0.5 rounded-lg bg-white border border-purple-200 hover:bg-purple-600 hover:text-white text-[11px] font-mono font-bold text-purple-900 transition shadow-2xs cursor-pointer">#' + n + '</button>';
    });
    pills.innerHTML = html;
}

function refreshPlanBuilderAssigneeOptions() {
    var team = (window.allTeamEmployees && window.allTeamEmployees.length) ? window.allTeamEmployees :
               ((employeesList && employeesList.length) ? employeesList : []);
    if (!team.length) return;
    var rows = document.querySelectorAll('#pb-posts-container .pb-post-row');
    rows.forEach(function(r) {
        var sel = r.querySelector('.pb-assignee');
        if (!sel) return;
        var currentVal = sel.value;
        var opts = '<option value="">👤 إسناد لموظف (اختياري)...</option>';
        team.forEach(function(e) {
            var isSel = (String(currentVal) === String(e.employee_id) || String(currentVal) === String(e.name));
            opts += '<option value="' + esc(e.employee_id) + '"' + (isSel ? ' selected' : '') + '>' + esc(e.name) + ' (' + esc(e.role || 'عضو فريق') + ')</option>';
        });
        sel.innerHTML = opts;
    });
}
window.refreshPlanBuilderAssigneeOptions = refreshPlanBuilderAssigneeOptions;

window.addPlanBuilderRow = function(postData) {
    var container = document.getElementById('pb-posts-container');
    if (!container) return;
    window.planBuilderRowCount = (window.planBuilderRowCount || 0) + 1;
    var idx = window.planBuilderRowCount;
    var data = postData || {};

    var team = (window.allTeamEmployees && window.allTeamEmployees.length) ? window.allTeamEmployees :
               ((employeesList && employeesList.length) ? employeesList : [
                   { employee_id: 'EMP-8148', name: 'عمر احمد عبدالرحمن', role: 'فيديو ايديتور' },
                   { employee_id: 'EMP-8143', name: 'فرح ياسر ابراهيم', role: 'Video editor' },
                   { employee_id: 'EMP-8142', name: 'ندى أيمن كمال', role: 'جرافيك دزاينر' },
                   { employee_id: 'EMP-8986-4947', name: 'راما ممدوح سرج', role: 'جرافيك ديزاينر' },
                   { employee_id: 'EMP-7189-7780', name: 'عبدالرحمن محمد عربي', role: 'Content' },
                   { employee_id: 'EMP-8086-4520', name: 'محمد سعيد فوزي', role: 'Ai automation' },
                   { employee_id: 'AM-2072-9827', name: 'محمود خالد', role: 'ACCOUNT MANAGER' },
                   { employee_id: 'EMP-5887-5256', name: 'آيه أحمد مجاهد', role: 'ACCOUNT MANAGER' },
                   { employee_id: 'EMP-2945-2364', name: 'هدير انور عباس', role: 'Content creator' },
                   { employee_id: 'EMP-4481-0404', name: 'Sama Ayman', role: 'سيلز' },
                   { employee_id: 'EMP-5970-2611', name: 'روضة عبد الحميد', role: 'الاداره' },
                   { employee_id: 'EMP-3555-1067', name: 'Marwa Saeed', role: 'Wep Developer' },
                   { employee_id: 'EMP-3264-8790', name: 'ليالي احمد احمد محمد', role: 'كاتب' },
                   { employee_id: 'EMP-8069-7345', name: 'Walaa Ashraf Mohammed', role: 'Content Creator' },
                   { employee_id: 'EMP-7775-2303', name: 'Menna gamal', role: 'مصمم' }
               ]);

    var assigneeOptions = '<option value="">👤 إسناد لموظف (اختياري)...</option>';
    team.forEach(function(e){
        var isSel = (data.assigned_employee_id === e.employee_id || (data.assignee_name && data.assignee_name === e.name));
        assigneeOptions += '<option value="' + esc(e.employee_id) + '"' + (isSel ? ' selected' : '') + '>' + esc(e.name) + ' (' + esc(e.role || 'عضو فريق') + ')</option>';
    });

    var curPillar = data.content_pillar || data.pillar || 'education';
    var initialRefs = data.reference_links_str || (Array.isArray(data.reference_links) ? data.reference_links.join(', ') : (data.reference_links || ''));

    var row = document.createElement('div');
    row.className = 'pb-post-row bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 sm:p-5 shadow-xs transition space-y-3';
    row.id = 'pb-row-' + idx;

    row.innerHTML = 
        '<div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 flex-wrap">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
                '<span class="bg-purple-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-xl shadow-2xs">بوست #' + idx + '</span>' +
                '<select class="pb-post-type text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:outline-none focus:border-purple-500">' +
                    '<option value="reel"' + (data.post_type === 'reel' ? ' selected' : '') + '>🎬 ريلز / فيديو قصير (Reels)</option>' +
                    '<option value="post"' + (data.post_type === 'post' ? ' selected' : '') + '>🖼️ منشور صورة مفردة (Single Post)</option>' +
                    '<option value="carousel"' + (data.post_type === 'carousel' ? ' selected' : '') + '>📑 كاروسيل / سلايدات (Carousel)</option>' +
                    '<option value="story"' + (data.post_type === 'story' ? ' selected' : '') + '>📱 ستوري / قصة (Story)</option>' +
                    '<option value="motion"' + (data.post_type === 'motion' ? ' selected' : '') + '>✨ موشن جرافيك (Motion Graphic)</option>' +
                '</select>' +
                '<select class="pb-pillar text-xs font-bold bg-amber-50/90 border border-amber-200 rounded-xl px-2.5 py-1 text-amber-900 focus:outline-none focus:border-amber-500" title="الركيزة التسويقية للبوست">' +
                    '<option value="education"' + (curPillar === 'education' ? ' selected' : '') + '>💡 تثقيفي وتوعوي</option>' +
                    '<option value="authority"' + (curPillar === 'authority' ? ' selected' : '') + '>👑 سلطة وخبرة</option>' +
                    '<option value="social_proof"' + (curPillar === 'social_proof' ? ' selected' : '') + '>🌟 آراء وثقة</option>' +
                    '<option value="conversion"' + (curPillar === 'conversion' ? ' selected' : '') + '>🎯 عرض وبيعي</option>' +
                    '<option value="viral"' + (curPillar === 'viral' ? ' selected' : '') + '>🔥 تريند وتفاعل</option>' +
                '</select>' +
                '<select class="pb-assignee text-xs font-bold bg-purple-50/70 border border-purple-200 rounded-xl px-2.5 py-1 text-purple-900 focus:outline-none focus:border-purple-500">' +
                    assigneeOptions +
                '</select>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
                '<div class="flex items-center gap-1.5">' +
                    '<label class="text-[10px] font-bold text-slate-500 hidden sm:inline">📅 موعد التسليم (اختياري):</label>' +
                    '<input type="date" class="pb-publish-date text-xs px-2 py-1 border border-slate-200 rounded-xl bg-slate-50 font-bold" value="' + esc(data.publish_date || '') + '" title="اختياري - يمكنك تركه فارغاً" />' +
                '</div>' +
                '<button type="button" onclick="removePlanBuilderRow(this)" class="w-7 h-7 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center font-bold text-xs transition cursor-pointer" title="حذف هذا البوست">' +
                    '✕' +
                '</button>' +
            '</div>' +
        '</div>' +

        '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">' +
            '<div>' +
                '<label class="block text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">🏷️ التاج لاين / الهوك الجذاب (Tagline / Hook):</label>' +
                '<input type="text" class="pb-tagline w-full px-3 py-2 border border-amber-200 rounded-xl bg-amber-50/40 text-xs font-bold text-amber-950 focus:bg-white focus:border-amber-400 focus:outline-none" placeholder="مثال: 3 أخطاء بتضيع ميزانية إعلاناتك..." value="' + esc(data.tagline || data.title || '') + '" />' +
            '</div>' +
            '<div>' +
                '<label class="block text-[11px] font-bold text-purple-900 mb-1 flex items-center gap-1">💡 فكرة الفيجوال / اسكربت الفيديو (Visual Idea / Script):</label>' +
                '<input type="text" class="pb-visual w-full px-3 py-2 border border-purple-200 rounded-xl bg-purple-50/40 text-xs text-purple-950 focus:bg-white focus:border-purple-400 focus:outline-none" placeholder="مثال: تصوير الموديل مع ظهور عناوين موشن وتأثير صوتي..." value="' + esc(data.visual_idea || '') + '" />' +
            '</div>' +
        '</div>' +

        '<div>' +
            '<label class="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">📝 نص الكونتنت والكابشن الكامل (Full Copy / Caption / Script):</label>' +
            '<textarea rows="3" class="pb-caption w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:border-purple-500 focus:outline-none" placeholder="اكتب نص البوست الكامل هنا مع التفاصيل والـ CTA والهاشتاجات...">' + esc(data.caption || '') + '</textarea>' +
        '</div>' +

        '<!-- Reference Section -->' +
        '<div class="bg-purple-50/40 border border-purple-100 rounded-xl p-3 space-y-2">' +
            '<div class="flex items-center justify-between flex-wrap gap-2">' +
                '<span class="text-[11px] font-bold text-purple-950 flex items-center gap-1">🖼️ الريفرانس والمراجع (صور من الجهاز أو روابط Google Drive):</span>' +
                '<div class="flex items-center gap-1.5">' +
                    '<label class="cursor-pointer bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 shadow-2xs">' +
                        '<span>📁 رفع صورة من الجهاز</span>' +
                        '<input type="file" accept="image/*,video/*" multiple class="hidden" onchange="handlePlanRowFileUpload(this, ' + idx + ')">' +
                    '</label>' +
                    '<button type="button" onclick="promptAddPlanRowDriveLink(' + idx + ')" class="bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold py-1 px-2.5 rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer">' +
                        '<span>🔗 إضافة رابط Drive / مرجع</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<input type="text" class="pb-ref-links w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-mono text-slate-700 focus:border-purple-500 focus:outline-none" placeholder="الصق روابط Google Drive أو Pinterest أو فيديوهات مفصولة بفاصلة..." value="' + esc(initialRefs) + '" />' +
            '<div class="pb-row-thumbs flex items-center gap-1.5 flex-wrap pt-0.5"></div>' +
        '</div>';

    container.appendChild(row);
    updatePlanBuilderQuickNav();
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.removePlanBuilderRow = function(btn) {
    var row = btn && btn.closest ? btn.closest('.pb-post-row') : null;
    if (row) {
        row.remove();
        var rows = document.querySelectorAll('.pb-post-row');
        rows.forEach(function(r, idx){
            var badge = r.querySelector('.font-mono');
            if (badge) badge.textContent = 'بوست #' + (idx + 1);
        });
        updatePlanBuilderQuickNav();
    }
};

window.loadSamplePlanTemplate = function() {
    var container = document.getElementById('pb-posts-container');
    if (container) container.innerHTML = '';
    window.planBuilderRowCount = 0;

    var samples = [
        {
            post_type: 'reel',
            content_pillar: 'conversion',
            tagline: 'سر واحد هيضاعف مبيعاتك في 30 يوم 🚀',
            caption: 'أغلب البراندات بتركز على الإعلانات وبتنسى أهم خطوة: تجربة العميل بعد أول نقرة!\n\nفي الفيديو ده هنوضح 3 خطوات عملية تقدر تطبقهم النهاردة عشان ترفع نسبة التحويل.\n\n📲 ابعتلنا كلمة (مبيعات) في الرسائل وهنبعتلك الدليل المجاني فوراً!\n\n#تسويق_إلكتروني #مبيعات #ريلز #سوشيال_ميديا',
            visual_idea: 'فيديو ريلز عمودي 9:16 مع هوك في أول 3 ثواني وظهور التاج لاين بخط واضح ومؤثرات صوتية حماسية',
            publish_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        },
        {
            post_type: 'carousel',
            content_pillar: 'education',
            tagline: '5 أدوات مجانية لازم كل صانع محتوى يستخدمها 🛠️',
            caption: 'لو بتضيع وقت في التصميم والمونتاج، البوست ده هيوفر عليك ساعات كل أسبوع!\n\nسلايد 1: أداة التغذية البصرية\nسلايد 2: أداة تحسين جودة الصوت\nسلايد 3: أداة استخراج الهاشتاجات\n\n📌 احفظ البوست عشان ترجعله وقت ما تحتاجه!\n\n#صناع_المحتوى #تصميم #جرافيك',
            visual_idea: 'كاروسيل 5 سلايدات بتدرج ألوان البراند مع أيقونات بارزة لكل أداة وسهم تنقل سلس',
            publish_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
        },
        {
            post_type: 'post',
            content_pillar: 'authority',
            tagline: 'عرض خاص لنهاية الأسبوع — خصم 30% على كل التشكيلة 🔥',
            caption: 'العرض الأقوى وصل! استمتع بخصم 30% على كل المنتجات الجديدة لفترة محدودة.\n\n🚚 التوصيل مجاني للطلبات فوق 500 جنيه.\n\n🛒 اطلب الآن من خلال اللينك في البايو أو تواصل معنا عبر رسائل الصفحة.',
            visual_idea: 'تصميم جرافيك احترافي يبرز صورة المنتج الرئيسي مع بادج الخصم 30% بخط جريء',
            publish_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
        }
    ];

    samples.forEach(function(s){
        window.addPlanBuilderRow(s);
    });

    showToast('تمت تعبئة النموذج التجريبي بنجاح! يمكنك التعديل عليه كما تحب 🎉');
};

async function submitPlanBuilder() {
    var rows = document.querySelectorAll('.pb-post-row');
    if (!rows.length) {
        showToast('يرجى إضافة بوست واحد على الأقل للخطة', 'error');
        return;
    }

    var submitBtn = document.getElementById('pb-submit-btn');
    var origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>جاري إنشاء وتوزيع الخطة سحابياً... ⏳</span>';
    }

    var activeCid = window.activeClientId || (typeof currentClient !== 'undefined' ? currentClient : '');
    var clientNameEl = document.getElementById('tasks-client-name');
    var activeCName = (clientNameEl ? clientNameEl.textContent.replace(/^[—\-\s]+/, '').trim() : '');
    var allClients = window._clientsList || window.clientsList || [];
    if (!activeCName && activeCid) {
        var _c = allClients.find(function(c){ return String(c.id).trim() === String(activeCid).trim(); });
        if (_c) activeCName = _c.name;
    }
    activeCName = activeCName || 'العميل';
    var cSel = document.getElementById('pb-client-select');
    var cInp = document.getElementById('pb-client-name');
    var selectedCid = (cSel && cSel.value && cSel.value !== '__new__') ? cSel.value : '';
    var clientName = '';
    if (cInp && !cInp.classList.contains('hidden') && cInp.value.trim()) {
        clientName = cInp.value.trim();
    } else if (cSel && cSel.value && cSel.value !== '__new__') {
        var selOpt = cSel.options[cSel.selectedIndex];
        clientName = (selOpt ? selOpt.getAttribute('data-name') : '') || (selOpt ? selOpt.text.split(' (')[0].trim() : '') || cSel.value;
    } else if (cInp && cInp.value.trim()) {
        clientName = cInp.value.trim();
    } else {
        clientName = activeCName;
    }
    
    // Resolve exact client object
    var matchedClient = allClients.find(function(c){
        return (selectedCid && c.id === selectedCid) || c.id === activeCid || (c.name && c.name.toLowerCase() === clientName.toLowerCase()) || (c.company && c.company.toLowerCase() === clientName.toLowerCase());
    });
    var resolvedCid = selectedCid || (matchedClient ? matchedClient.id : (activeCid || ''));
    var resolvedCname = (matchedClient && matchedClient.name) || clientName;

    var planSubName = ((document.getElementById('pb-plan-name') || {}).value || '').trim();
    var planName = planSubName || ('خطة ' + resolvedCname);
    var amId = (document.getElementById('pb-am-select') || {}).value || '';

    var structuredPosts = [];
    var clientTextBlocks = [];

    rows.forEach(function(r, idx){
        var type = (r.querySelector('.pb-post-type') || {}).value || 'post';
        var pillar = (r.querySelector('.pb-pillar') || {}).value || 'education';
        var tagline = ((r.querySelector('.pb-tagline') || {}).value || '').trim();
        var visual = ((r.querySelector('.pb-visual') || {}).value || '').trim();
        var caption = ((r.querySelector('.pb-caption') || {}).value || '').trim();
        var pdate = ((r.querySelector('.pb-publish-date') || {}).value || '').trim();
        var refVal = ((r.querySelector('.pb-ref-links') || {}).value || '').trim();
        var refList = refVal ? refVal.split(/[,;\n]+/).map(function(u){ return u.trim(); }).filter(Boolean) : [];
        var empSelect = r.querySelector('.pb-assignee');
        var empId = empSelect ? empSelect.value : '';
        var empName = (empSelect && empSelect.selectedIndex > 0) ? empSelect.options[empSelect.selectedIndex].text.replace(/^[^\s]+\s*/, '') : '';

        var postObj = {
            post_number: idx + 1,
            title: tagline || ('بوست #' + (idx + 1)),
            tagline: tagline,
            tag_line: tagline,
            content_pillar: pillar,
            visual_idea: visual,
            caption: caption || tagline || 'محتوى البوست',
            post_type: type,
            publish_date: pdate,
            publish_time: '10:00',
            assigned_employee_id: empId,
            assignee_name: empName,
            reference_links: refList,
            media_urls: refList
        };
        structuredPosts.push(postObj);

        var block = '---' + '\n' +
            'بوست #' + (idx + 1) + ' | النوع: ' + type + ' | الهدف: ' + pillar + (pdate ? (' | تاريخ النشر: ' + pdate) : '') + (empId ? (' | المسند: ' + empName) : '') + '\n' +
            'التاج لاين: ' + (tagline || ('بوست #' + (idx + 1))) + '\n' +
            (visual ? ('فكرة الفيجوال: ' + visual + '\n') : '') +
            (refList.length ? ('الريفرانس: ' + refList.join(' , ') + '\n') : '') +
            'الكابشن والكونتنت:\n' + (caption || tagline || 'محتوى البوست');

        clientTextBlocks.push(block);
    });

    var fullPlanText = clientTextBlocks.join('\n\n');

    showToast('جاري إنشاء وحفظ مهام الخطة وتوزيعها سحابياً... ⏳');

    try {
        var res = await safeFetchJson('/api/tasks/ingest-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                posts: structuredPosts,
                plan_text: fullPlanText,
                plan_name: planName,
                file_name: planName,
                client_id: resolvedCid,
                client_name: resolvedCname,
                am_employee_id: amId,
                append: true
            })
        });

        if (res && (res.ok || res.success)) {
            closePlanBuilderModal();
            var cont = document.getElementById('pb-posts-container');
            if (cont) cont.innerHTML = '';
            window.planBuilderRowCount = 0;
            updatePlanBuilderQuickNav();
            showToast('🎉 تم إنشاء الخطة وتفريغ ' + (res.ingested_count || rows.length) + ' مهمة وتوزيعها على Drive بنجاح! 🚀', 'success');
            
            if (res.plan_name) {
                selectedPlanFilter = res.plan_name;
            }
            if (res.client_id) {
                await switchToClient(res.client_id);
            } else if (typeof loadTasksEngine === 'function') {
                loadTasksEngine();
            }
        } else {
            showToast((res && res.error) || 'تعذّر حفظ الخطة', 'error');
        }
    } catch(e) {
        showToast('خطأ في إرسال الخطة: ' + e.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnHtml;
        }
    }
}

window.openPlanBuilderModal = openPlanBuilderModal;
window.closePlanBuilderModal = closePlanBuilderModal;
window.addPlanBuilderRow = addPlanBuilderRow;
window.removePlanBuilderRow = removePlanBuilderRow;
window.loadSamplePlanTemplate = loadSamplePlanTemplate;
window.submitPlanBuilder = submitPlanBuilder;

function openTaskContentEditorModal(taskId) {
    if (!taskId) return;
    var task = (tasksList || []).find(function(x){ return String(x.task_id || x.id) === String(taskId); });
    if (!task) {
        for (var k in employeesWorkloadData) {
            var found = (employeesWorkloadData[k] || []).find(function(x){ return String(x.task_id || x.id) === String(taskId); });
            if (found) { task = found; break; }
        }
    }
    
    var m = document.getElementById('modal-edit-task-content');
    if (!m) return;
    
    var idEl = document.getElementById('etc-task-id');
    var titleEl = document.getElementById('etc-task-title');
    var captionEl = document.getElementById('etc-task-caption');
    var visEl = document.getElementById('etc-task-visual-idea');
    var ptypeEl = document.getElementById('etc-task-post-type');
    var refsEl = document.getElementById('etc-task-reference-links');
    var subEl = document.getElementById('etc-task-subtitle');

    if (idEl) idEl.value = taskId;
    if (titleEl) titleEl.value = (task && (task.title || task.tagline || '')) || '';
    if (captionEl) captionEl.value = (task && (task.caption || task.description || '')) || '';
    if (visEl) visEl.value = (task && (task.visual_idea || (task.content_data && task.content_data.visual_idea) || (task.graphic_data && task.graphic_data.idea) || '')) || '';
    
    var ptype = (task && task.content_data && task.content_data.post_type) || 'post';
    if (ptypeEl) ptypeEl.value = ptype;
    
    var refs = (task && (task.reference_links || (task.content_data && task.content_data.reference_links) || [])) || [];
    var refsStr = Array.isArray(refs) ? refs.join(', ') : String(refs || '');
    if (refsEl) refsEl.value = refsStr;
    
    if (subEl) {
        subEl.textContent = 'مهمة: ' + (taskId || '') + ((task && task.client_name) ? (' · ' + task.client_name) : '');
    }
    
    m.classList.remove('hidden');
}

function closeTaskContentEditorModal() {
    var m = document.getElementById('modal-edit-task-content');
    if (m) m.classList.add('hidden');
}

async function saveTaskContentEditorAction(e) {
    if (e && e.preventDefault) e.preventDefault();
    var idEl = document.getElementById('etc-task-id');
    var taskId = idEl ? (idEl.value || '').trim() : '';
    if (!taskId) return;
    
    var titleEl = document.getElementById('etc-task-title');
    var captionEl = document.getElementById('etc-task-caption');
    var visualEl = document.getElementById('etc-task-visual-idea');
    var typeEl = document.getElementById('etc-task-post-type');
    var refEl = document.getElementById('etc-task-reference-links');

    var title = titleEl ? (titleEl.value || '').trim() : '';
    var caption = captionEl ? (captionEl.value || '').trim() : '';
    var visualIdea = visualEl ? (visualEl.value || '').trim() : '';
    var postType = typeEl ? (typeEl.value || 'post').trim() : 'post';
    var refLinksStr = refEl ? (refEl.value || '').trim() : '';
    var refLinks = refLinksStr ? refLinksStr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    
    if (!title) {
        showToast('يرجى كتابة عنوان أو تاج لاين للبوست', 'error');
        return;
    }

    var btn = document.getElementById('btn-save-task-content');
    var origText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span> جاري الحفظ والمزامنة...</span>';
    }
    
    try {
        var res = await safeFetchJson('/api/tasks/' + encodeURIComponent(taskId) + '/content', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                tagline: title,
                caption: caption,
                description: caption,
                visual_idea: visualIdea,
                post_type: postType,
                reference_links: refLinks
            })
        });
        
        if (res && (res.success || res.ok)) {
            closeTaskContentEditorModal();
            showToast(' تم تحديث محتوى البوست ونصوصه بنجاح! ️', 'success');
            
            // Update local memory state
            if (tasksList) {
                var localTask = tasksList.find(function(x){ return String(x.task_id || x.id) === String(taskId); });
                if (localTask) {
                    localTask.title = title;
                    localTask.tagline = title;
                    localTask.caption = caption;
                    localTask.description = caption;
                    localTask.visual_idea = visualIdea;
                    localTask.content_data = localTask.content_data || {};
                    localTask.content_data.post_type = postType;
                    localTask.reference_links = refLinks;
                }
            }
            renderTasksBoard();
            if (typeof loadMyPortal === 'function') loadMyPortal();
        } else {
            showToast((res && res.error) || 'تعذّر حفظ محتوى البوست', 'error');
        }
    } catch(err) {
        showToast('خطأ أثناء حفظ التعديلات: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origText;
        }
    }
}

// Global Escape Key listener to dismiss editor modal
document.addEventListener('keydown', function(evt) {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
        var m = document.getElementById('modal-edit-task-content');
        if (m && !m.classList.contains('hidden')) {
            closeTaskContentEditorModal();
        }
    }
});

function highlightTaskCard(taskId) {
    if (!taskId) return;
    if (typeof go === 'function') go('tasks');
    setTimeout(function(){
        var card = document.getElementById('task-card-' + taskId) || document.querySelector('[data-task-id="' + taskId + '"]');
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('ring-4', 'ring-blue-500', 'animate-pulse');
            setTimeout(function(){ card.classList.remove('ring-4', 'ring-blue-500', 'animate-pulse'); }, 3000);
        } else {
            showToast('المهمة في عميل آخر أو خاضعة لفلتر حالي', 'info');
        }
    }, 200);
}

async function sharePlanWithClient(clientName, planName) {
    try {
        var cInput = clientName || (window._me && window._me.active_client_name) || (typeof selectedClientFilter !== 'undefined' ? selectedClientFilter : '') || '';
        var pInput = planName || '';
        showToast('جاري تجهيز رابط مشاركة الخطة للعميل... ');
        var res = await fetch('/api/plan/share-link?client=' + encodeURIComponent(cInput) + '&plan=' + encodeURIComponent(pInput));
        var data = await res.json();
        if (!res.ok || !data.ok || !data.share_url) {
            showToast(data.error || 'تعذّر إنشاء رابط المشاركة', 'error');
            return;
        }

        var shareUrl = data.share_url;
        var cName = data.client_name || cInput || 'العميل';
        var pName = data.plan_name || pInput || 'خطة المحتوى';
        var total = data.total_posts || 0;

        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch(e) {}

        var waText = 'مرحباً ' + cName + ' \nيسعدنا مشاركة خطة المحتوى والتسويق الخاصة بكم مع التفاصيل الكاملة للمنشورات ومواعيد النشر:\n' + shareUrl + '\n\nيمكنكم الاطلاع على الخطة واعتمادها مباشرة من الرابط ';
        var waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(waText);

        var modalId = 'modal-share-plan-dialog';
        var existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        var modalHtml = '<div id="' + modalId + '" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" onclick="if(event.target===this) this.remove()">' +
            '<div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-right" dir="rtl">' +
                '<div class="flex items-center justify-between border-b border-slate-100 pb-3">' +
                    '<div class="flex items-center gap-2.5">' +
                        '<span class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold shadow-2xs"></span>' +
                        '<div>' +
                            '<h3 class="font-bold text-base text-slate-900">مشاركة الخطة مع العميل</h3>' +
                            '<p class="text-xs text-slate-500"> ' + esc(cName) + ' · ' + esc(pName) + ' (' + total + ' بوست)</p>' +
                        '</div>' +
                    '</div>' +
                    '<button type="button" onclick="document.getElementById(\'' + modalId + '\').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer" title="إغلاق"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>' +
                '</div>' +

                '<div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center gap-2">' +
                    '<span class="text-lg shrink-0"></span>' +
                    '<span>تم نسخ رابط الخطة المخصص للعميل إلى الحافظة تلقائياً! يمكنك إرساله له الآن على واتساب أو تليجرام.</span>' +
                '</div>' +

                '<div class="space-y-1.5">' +
                    '<label class="text-xs font-bold text-slate-700 block">رابط المعاينة المباشر للعميل:</label>' +
                    '<div class="flex gap-2">' +
                        '<input id="share-plan-input-url" type="text" readonly value="' + esc(shareUrl) + '" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all font-bold">' +
                        '<button type="button" onclick="navigator.clipboard.writeText(\'' + esc(shareUrl) + '\'); showToast(\'تم نسخ الرابط بنجاح! \');" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs whitespace-nowrap cursor-pointer"> نسخ</button>' +
                    '</div>' +
                '</div>' +

                '<div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">' +
                    '<a href="' + waUrl + '" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 text-center cursor-pointer">' +
                        '<span> إرسال WhatsApp</span>' +
                    '</a>' +
                    '<a href="' + esc(shareUrl) + '" target="_blank" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 text-center cursor-pointer">' +
                        '<span>️ معاينة صفحة العميل ↗️</span>' +
                    '</a>' +
                '</div>' +
            '</div>' +
        '</div>';

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        showToast(' تم نسخ رابط الخطة المخصص للعميل! ', 'success');
    } catch(e) {
        showToast('خطأ في إعداد رابط المشاركة', 'error');
    }
}

window.highlightTaskCard = highlightTaskCard;
window.setEmployeesDeptFilter = setEmployeesDeptFilter;
window.openTaskContentEditorModal = openTaskContentEditorModal;
window.closeTaskContentEditorModal = closeTaskContentEditorModal;
window.saveTaskContentEditorAction = saveTaskContentEditorAction;
window.renderEmployeesStatus = renderEmployeesStatus;
window.loadTasksEngine = loadTasksEngine;
window.sharePlanWithClient = sharePlanWithClient;
window.populateClientDatalists = populateClientDatalists;
window.onPlanBuilderModalClientChange = onPlanBuilderModalClientChange;
window.onPlanBuilderTabClientChange = onPlanBuilderTabClientChange;
window.onTasksIngestClientChange = onTasksIngestClientChange;

// Auto-initialize Tasks & Team availability immediately when views.js loads
(function autoBootViewsEngine() {
    function tryBoot() {
        var isTasksActive = (window.location.hash || '').indexOf('tasks') !== -1 ||
                            localStorage.getItem('active_tab') === 'tasks' ||
                            (document.getElementById('v-tasks') && !document.getElementById('v-tasks').classList.contains('hidden'));
        if (isTasksActive) {
            if (typeof loadTasksEngine === 'function') loadTasksEngine();
        } else {
            if (typeof renderEmployeesStatus === 'function') renderEmployeesStatus();
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryBoot);
    } else {
        tryBoot();
    }
    window.addEventListener('load', tryBoot);
})();

async function refreshPlanBuilderClients() {
    try {
        var cRes = await fetch('/api/clients?t=' + Date.now());
        var cData = await cRes.json();
        var allClients = Array.isArray(cData) ? cData : (cData.clients || []);
        window._clientsList = allClients;
        var clientSelect = document.getElementById('pb-client-select');
        var activeCid = window.activeClientId || (typeof currentClient !== 'undefined' ? currentClient : '');
        if (clientSelect && allClients && allClients.length) {
            var curVal = clientSelect.value;
            var opts = '<option value="">-- اختر العميل من القائمة --</option>' +
                allClients.map(function(c) {
                    var amPart = c.am_name ? (' (AM: ' + c.am_name + ')') : '';
                    var isSelected = (c.id === (curVal || activeCid));
                    return '<option value="' + esc(c.id) + '" data-name="' + esc(c.name) + '"' + (isSelected ? ' selected' : '') + '>' + esc(c.name) + amPart + '</option>';
                }).join('') +
                '<option value="__new__">+ كتابة اسم عميل جديد...</option>';
            clientSelect.innerHTML = opts;
            if (curVal) clientSelect.value = curVal;
        }
        showToast('تم تحديث قائمة العملاء 🔄');
    } catch(e) {
        showToast('تعذّر تحديث قائمة العملاء', 'error');
    }
}

async function triggerGlobalLiveRefresh(btn) {
    var icon = btn ? btn.querySelector('[data-lucide="refresh-cw"], svg, i') : document.getElementById('header-refresh-icon');
    if (icon) icon.classList.add('animate-spin');

    try {
        // 1. Invalidate stale localStorage caches for instantaneous fresh pull
        ['tasks_board_act', 'tasks_board_arch', 'tasks_employees', 'myportal_tasks', 'clients_list'].forEach(function(k){
            try { localStorage.removeItem('swr_cache_' + k); } catch(e){}
        });

        // 2. Direct fast refresh from server bypassing cache
        if (typeof loadTasksEngine === 'function') {
            await loadTasksEngine();
        }
        if (typeof loadAMWorkspace === 'function') {
            loadAMWorkspace();
        }
        if (typeof populateClientDatalists === 'function') {
            populateClientDatalists();
        }
        if (typeof loadAccountsList === 'function' && document.getElementById('v-accounts') && !document.getElementById('v-accounts').classList.contains('hidden')) {
            await loadAccountsList(true);
        }
        if (typeof loadMyPortal === 'function' && document.getElementById('v-myportal') && !document.getElementById('v-myportal').classList.contains('hidden')) {
            await loadMyPortal();
        }
        if (typeof syncInbox === 'function' && document.getElementById('v-inbox') && !document.getElementById('v-inbox').classList.contains('hidden')) {
            syncInbox();
        }

        if (window.lucide) lucide.createIcons();
        showToast('⚡ تم التحديث اللحظي للبيانات والصفحات بنجاح!', 'success');
    } catch(err) {
        console.warn('Live refresh error:', err);
        showToast('تم التحديث اللحظي 🔄', 'info');
    } finally {
        setTimeout(function(){
            if (icon) icon.classList.remove('animate-spin');
        }, 500);
    }
}

window.refreshPlanBuilderClients = refreshPlanBuilderClients;
window.triggerGlobalLiveRefresh = triggerGlobalLiveRefresh;

// Background Auto-Poll for real-time live updates
(function initLiveAutoSync() {
    if (window._liveSyncTimer) return;
    window._liveSyncTimer = setInterval(function() {
        if (document.hidden) return; // Skip if tab is in background
        var vTasks = document.getElementById('v-tasks');
        var vPortal = document.getElementById('v-myportal');
        var isTasksActive = vTasks && !vTasks.classList.contains('hidden');
        var isPortalActive = vPortal && !vPortal.classList.contains('hidden');

        if (isTasksActive) {
            var tasksUrl = '/api/tasks?archived=' + (tasksArchiveMode ? 'true' : 'false') + '&t=' + Date.now();
            fetch(tasksUrl)
                .then(function(r){ return r.json(); })
                .then(function(d){
                    if (d && d.tasks && Array.isArray(d.tasks)) {
                        var newSig = d.tasks.map(function(t){ return t.task_id + ':' + t.status + ':' + (t.deliverables ? t.deliverables.length : 0); }).join('|');
                        if (window._lastTasksSig && window._lastTasksSig !== newSig) {
                            tasksList = d.tasks;
                            renderTasksBoard();
                            renderEmployeesStatus();
                        }
                        window._lastTasksSig = newSig;
                    }
                }).catch(function(){});
        } else if (isPortalActive && typeof loadMyPortal === 'function') {
            fetch('/api/my-tasks?t=' + Date.now())
                .then(function(r){ return r.json(); })
                .then(function(d){
                    if (d && d.tasks) {
                        var newSig = d.tasks.map(function(t){ return t.task_id + ':' + t.status; }).join('|');
                        if (window._lastPortalSig && window._lastPortalSig !== newSig) {
                            loadMyPortal();
                        }
                        window._lastPortalSig = newSig;
                    }
                }).catch(function(){});
        }
    }, 12000);
})();


