/* Domya AI Moderator - Views Module (Part 1) */

/* Domya AI Moderator - Views Module */

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
                ? (mode === 'auto' ? 'الكومنتات: رد تلقائي ✅' : 'الكومنتات: مراجعة يدوية 👨‍💼')
                : (mode === 'auto' ? 'الرسائل: رد تلقائي ✅' : 'الرسائل: مراجعة يدوية 👨‍💼'));
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
                const fbOk = c.fb_connected ? '🔵' : '⚪';
                const igOk = c.ig_connected ? '🟣' : '⚪';
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
                            <span class="text-base">${a.platform === 'facebook' ? '🔵' : '🟣'}</span>
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
                            <span class="text-xs font-bold ${fbAcc ? 'text-blue-700' : 'text-slate-400'}">🔵 فيسبوك Page</span>
                            ${fbAcc ? '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✅ متصل</span>' : '<span class="text-[10px] font-bold text-slate-400">غير مرتبط</span>'}
                        </div>
                        ${fbAcc ? `<p class="text-[11px] text-slate-700 font-bold">${esc(fbAcc.name)}</p><p class="text-[10px] text-slate-500 font-mono">ID: ${esc(fbAcc.id)}</p>` : '<p class="text-[11px] text-slate-400">لم يتم ربط صفحة فيسبوك بعد</p>'}
                    </div>
                    <div class="p-3 rounded-xl border ${igAcc ? 'border-purple-200 bg-purple-50/50' : 'border-dashed border-slate-300 bg-slate-50/30'}">
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="text-xs font-bold ${igAcc ? 'text-purple-700' : 'text-slate-400'}">🟣 إنستجرام Business</span>
                            ${igAcc ? '<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✅ متصل</span>' : '<span class="text-[10px] font-bold text-slate-400">غير مرتبط</span>'}
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
                const icon = a.platform === 'facebook' ? '🔵' : '🟣';
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
    await fetch('/api/accounts/' + id, {method: 'DELETE'});
    showToast('تم حذف الحساب');
    loadAccounts();
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
            el.innerHTML = '<div class="empty-state" class="p-2 text-xs">لا توجد كابشنات محفوظة بعد</div>';
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
        el.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">لا توجد منشورات مجدولة بعد 📅</div>';
        return;
    }
    el.innerHTML = scheduledPosts.map(p => {
        var media = p.media_url || (p.media_urls && p.media_urls[0]) || p.drive_link || '';
        var isVideo = (p.media_type === 'video') || /\.(mp4|mov|webm)(\?|$)/i.test(media);
        var preview = media
          ? (isVideo
              ? '<a href="' + esc(media) + '" target="_blank" class="flex items-center justify-center w-24 h-24 rounded-lg bg-slate-900 text-white text-2xl shrink-0">▶️</a>'
              : '<a href="' + esc(media) + '" target="_blank"><img src="' + esc(driveThumb(media)) + '" class="w-24 h-24 rounded-lg object-cover border border-slate-200 shrink-0" loading="lazy" onerror="this.outerHTML=\'<div class=&quot;w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs&quot;>🖼️</div>\'"></a>')
          : '<div class="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs shrink-0">لا ميديا</div>';
        var done = p.status && (String(p.status).includes('تم') || p.status === 'published');
        return `
        <div class="p-3 border border-slate-200 rounded-xl bg-white flex gap-3 text-xs mb-2">
            ${preview}
            <div class="space-y-2 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-blue-600">${esc(p.typeLabel || p.target || 'منشور')}</span>
                    <span class="px-2 py-0.5 rounded-md font-bold ${done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${esc(done ? 'منشور ✓' : 'مجدول')}</span>
                    ${p.from_task ? '<span class="text-[10px] text-slate-400 font-mono">' + esc(p.from_task) + '</span>' : ''}
                </div>
                <p class="text-slate-800 font-medium line-clamp-2">${esc(p.caption)}</p>
                <div class="flex items-center gap-1 flex-wrap">
                    <input type="date" id="sp-date-${esc(p.id)}" value="${esc(p.date || '')}" class="text-[11px] px-1.5 py-0.5 border border-slate-200 rounded-md">
                    <input type="time" id="sp-time-${esc(p.id)}" value="${esc(p.time || '10:00')}" class="text-[11px] px-1.5 py-0.5 border border-slate-200 rounded-md">
                    <button onclick="reschedulePost('${esc(p.id)}')" class="text-[11px] bg-blue-600 text-white font-bold px-2 py-1 rounded-md">💾 حفظ الموعد</button>
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
        if (res.ok && data.ok) { showToast('اتحفظ موعد النشر ✅'); loadScheduledPosts(); }
        else showToast(data.error || 'تعذّر الحفظ', 'error');
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function deleteScheduledPost(id) {
    try {
        await fetch('/api/scheduler/' + id, {method: 'DELETE'});
        showToast('تم حذف المنشور المجدول بنجاح');
        loadScheduledPosts();
    } catch(e) {}
}

function switchAccTab(tab){
    if(tab==='token'){
        document.getElementById('acc-sec-token').style.display = 'block';
        document.getElementById('acc-sec-insta').style.display = 'none';
    } else {
        document.getElementById('acc-sec-token').style.display = 'none';
        document.getElementById('acc-sec-insta').style.display = 'block';
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
        console.log('[checkAuth]', e);
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
            showToast('تم حذف العميل وجميع حساباته بنجاح 🗑️');
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
            showToast(`تم تسجيل العميل: ${name} بنجاح! 🚀`);
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
                        <td class="p-3 text-slate-600">${r.post_url ? `<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-[11px] block truncate max-w-[150px]" title="${esc(r.post_url)}">🔗 ${esc(r.post_url)}</span>` : '<span class="text-slate-400">🌐 جميع المنشورات</span>'}</td>
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
                            ${r.post_url ? `<p class="text-blue-600 font-mono text-[11px]">🔗 البوست المستهدف: ${esc(r.post_url)}</p>` : ''}
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
        showToast('تم حفظ وتفعيل القاعدة بنجاح 🎯');
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
                    <h4 class="font-bold text-slate-900">❓ ${esc(item.question)}</h4>
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

async function renderEmployeesStatus() {
    var box = document.getElementById('employees-status-list');
    if (!box) return;
    var emps = employeesList || [];
    if (!emps.length) { box.innerHTML = '<div class="pt-2 text-slate-400 text-center">لا يوجد موظفون</div>'; return; }
    // real workload across ALL clients (active tasks per employee)
    var load = {}, inprog = {}, tasksByEmp = {};
    try {
        var d = await (await fetch('/api/employees/workload')).json();
        load = d.workload || {};
        inprog = d.in_progress || {};
        tasksByEmp = d.tasks_by_employee || {};
        employeesWorkloadData = tasksByEmp;
    } catch(e){}

    var html = emps.map(function(e){
        var n = load[e.employee_id] || 0;
        var working = (inprog[e.employee_id] || 0) > 0;
        var isSelected = selectedEmployeeFilter === e.employee_id;
        var dot = n === 0 ? 'bg-emerald-500' : (working ? 'bg-amber-500 animate-pulse' : 'bg-blue-500');
        var label = n === 0 ? 'متاح' : (n + ' مهمة' + (working ? ' · شغّال 🚀' : ''));
        var bgClass = isSelected ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm' : 'hover:bg-slate-50 border-transparent';
        
        return '<button type="button" onclick="toggleEmployeeFilter(\'' + esc(e.employee_id) + '\', \'' + esc(e.name || e.employee_id) + '\')" ' +
            'title="اضغط لعرض مهام الموظف" class="w-full text-right p-2 rounded-xl transition border flex items-center justify-between text-slate-700 ' + bgClass + '">' +
            '<span class="flex items-center gap-2 min-w-0">' +
                '<span class="w-2.5 h-2.5 rounded-full flex-shrink-0 ' + dot + '"></span>' +
                '<span class="font-bold text-xs truncate">' + esc(e.name || e.employee_id) + '</span>' +
                '<span class="text-[10px] text-slate-400 truncate">(' + esc(e.role||'موظف') + ')</span>' +
            '</span>' +
            '<span class="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-mono flex-shrink-0 ' + (n===0?'text-emerald-700 font-bold':(working?'text-amber-700 font-bold':'text-blue-700')) + '">' + label + '</span>' +
        '</button>';
    }).join('');

    if (selectedEmployeeFilter) {
        html = '<div class="pb-2 flex items-center justify-between border-b border-blue-100 mb-1">' +
            '<span class="text-[11px] text-blue-700 font-bold flex items-center gap-1">🎯 فلترة: <b>' + esc(selectedEmployeeName) + '</b></span>' +
            '<button type="button" onclick="clearEmployeeFilter()" class="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md font-bold transition">إلغاء ✕</button>' +
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

async function renderClientTabs() {
    var box = document.getElementById('client-tabs');
    if (!box) return;
    var clients = [], activeId = '';
    try { var cd = await (await fetch('/api/clients')).json(); clients = Array.isArray(cd) ? cd : (cd.clients || []); } catch(e){}
    try { var me = await (await fetch('/api/me')).json(); activeId = me.active_client_id || ''; window._me = me; } catch(e){}
    if (!clients.length) { box.innerHTML = '<span class="text-[11px] text-slate-400">لا يوجد عملاء</span>'; return; }
    box.innerHTML = clients.map(function(c){
        var on = c.id === activeId;
        return '<button onclick="switchToClient(\'' + esc(c.id) + '\')" class="whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-lg transition ' +
            (on ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '">' + esc(c.name) + '</button>';
    }).join('');
    var nameEl = document.getElementById('tasks-client-name');
    if (nameEl) { var c = clients.find(function(x){ return x.id === activeId; }); nameEl.textContent = c ? ('— ' + c.name) : ''; }
}

async function switchToClient(id) {
    try { await fetch('/api/settings/active-client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: id }) }); } catch(e){}
    loadTasksEngine();
}

async function loadTasksEngine() {
    renderClientTabs();
    try {
        var rTasks = await fetch('/api/tasks');
        var rEmps = await fetch('/api/tasks/employees');
        var dataTasks = await rTasks.json();
        var dataEmps = await rEmps.json();

        tasksList = (dataTasks && dataTasks.tasks) ? dataTasks.tasks : [];
        employeesList = (dataEmps && dataEmps.employees) ? dataEmps.employees : [];

        renderTasksBoard();
        renderEmployeesStatus();
        loadTaskMonthlyReport();
        // old multi-client columns board replaced by client tabs — no longer loaded
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
        container.innerHTML = '<div class="p-8 text-center text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded-2xl w-full">لا توجد عملاء أو مشاريع مسندة لحسابك حالياً. تواصل مع الأدمن لإسناد العملاء 🎯</div>';
        return;
    }

    container.innerHTML = columns.map(function(col) {
        var teamHtml = col.team_members && col.team_members.length ?
            col.team_members.map(function(m) { 
                return '<span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">👤 ' + esc(m.name) + ' (' + esc(m.role) + ')</span>'; 
            }).join(' ') :
            '<span class="text-[10px] text-slate-400">لم يتم تحديد فريق</span>';

        var stratTitle = (col.strategy && col.strategy.title) ? col.strategy.title : 'إضافة ملف استراتيجية العميل';

        var tasksHtml = col.tasks && col.tasks.length ? col.tasks.map(function(t) {
            var statusClass = t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              t.status === 'Awaiting AM Review' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800';

            var isTimerRunning = t.timer_state && t.timer_state.is_running;
            var timerBtnText = isTimerRunning ? '⏸️ إيقاف وتثبيت الوقت' : '🚀 بدء التوقيت الحي';
            var timerBtnClass = isTimerRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200';

            var driveBtn = t.drive_link ?
                '<a href="' + esc(t.drive_link) + '" target="_blank" class="block text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] py-1 px-2 rounded-lg border border-emerald-200 transition">📁 فتح الملف في Google Drive (أعلى جودة 🚀)</a>' :
                '<button onclick="promptLinkDrive(\'' + esc(t.task_id) + '\')" class="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-1 px-2 rounded-lg border border-slate-200 transition">+ ربط ملف Google Drive عالي الجودة</button>';

            return '<div class="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2 text-xs">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">' + esc(t.task_id) + '</span>' +
                    '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ' + statusClass + '">' + esc(t.status || 'Pending') + '</span>' +
                '</div>' +
                '<h5 class="font-bold text-slate-900 leading-snug">' + esc(t.title) + '</h5>' +
                '<p class="text-[11px] text-slate-600 line-clamp-2">' + esc(t.description || '') + '</p>' +
                '<div class="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] space-y-1">' +
                    '<div class="flex justify-between text-blue-700 font-bold"><span>📅 النزول عند الدكتور:</span><span>' + esc(t.publish_date || t.scheduled_start_date || 'غير محدد') + '</span></div>' +
                    '<div class="flex justify-between text-amber-700 font-bold"><span>⏰ التسليم الداخلي:</span><span>' + esc(t.delivery_deadline || t.scheduled_start_date || 'غير محدد') + '</span></div>' +
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
                        '<span class="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">⏱️ ' + (col.total_hours_spent || 0) + 'h</span>' +
                        '<span class="bg-blue-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">' + col.completed_tasks + '/' + col.total_tasks + '</span>' +
                    '</div>' +
                '</div>' +
                '<div><button onclick="promptUploadStrategy(\'' + esc(col.client_id) + '\')" class="w-full text-center bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] py-1 px-2 rounded-lg border border-purple-200 transition">📄 ' + esc(stratTitle) + '</button></div>' +
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
            showToast('تم حفظ وتفعيل استراتيجية العميل في الـ AI RAG بنجاح 🎉');
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
            showToast(data.timer_state.is_running ? '⏱️ تم بدء تسجيل وقت المهمة!' : '⏸️ تم إيقاف وتثبيت الوقت بنجاح');
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
            showToast('تم ربط ملف Google Drive بنجاح 🎉');
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
            if (typeof showToast === 'function') showToast('تم نسخ رابط Google Drive بنجاح 📋');
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
        if (typeof showToast === 'function') showToast('تم نسخ رابط Google Drive بنجاح 📋');
    } catch(e) {}
    document.body.removeChild(ta);
}
// AM sets start / publish / deadline for a task
async function saveTaskDates(taskId) {
    var g = function(id){ var e = document.getElementById(id); return e ? e.value : ''; };
    var body = {
        scheduled_start_date: g('d-start-' + taskId),
        publish_date: g('d-pub-' + taskId),
        publish_time: g('t-pub-' + taskId) || '10:00',
        delivery_deadline: g('d-dead-' + taskId)
    };
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/dates', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        var data = await res.json();
        if (res.ok && data.ok) { showToast('اتحفظت المواعيد ✅'); loadTasksEngine(); }
        else showToast(data.error || 'تعذّر الحفظ', 'error');
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}
function empOptionsHtml(selectedId) {
    return (employeesList || []).map(function(e) {
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

function setTaskStatusFilter(statusKey) {
    currentTaskStatusFilter = statusKey;
    renderTasksBoard();
}

function onTaskSearchInput(query) {
    taskSearchQuery = (query || '').trim().toLowerCase();
    renderTasksBoard();
}

function getTaskSequenceNum(t) {
    if (!t) return 999999;
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
    
    return 999999;
}

function renderTaskCard(t) {
    var st = t.status || 'Pending AM Approval';
    var statusBadgeClass = st === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                           st === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                           st === 'Awaiting AM Review' ? 'bg-purple-100 text-purple-800' :
                           st === 'Assigned' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800';
    var stLabel = st === 'Completed' ? 'مكتملة' : st === 'In Progress' ? 'جاري العمل' :
                  st === 'Awaiting AM Review' ? 'بانتظار مراجعتك' : st === 'Assigned' ? 'مُسندة' : 'بانتظار الإسناد';

    var amTag = '<div class="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">' +
        '<span>👔 AM:</span> <span class="text-indigo-900">' + esc(t.am_name || t.am_id || 'عام') + '</span>' +
    '</div>';

    var clientTag = (selectedEmployeeFilter && t.client_name) ?
        '<div class="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">' +
            '<span>🏢 ' + esc(t.client_name) + '</span>' +
        '</div>' : '';

    // reference images (from docx or uploaded)
    var refs = (t.media_urls && t.media_urls.length) ? t.media_urls : [];
    var refsHtml = refs.length ? '<div class="flex gap-1.5 flex-wrap pt-0.5">' + refs.slice(0, 4).map(function(u) {
        var isData = u.startsWith('data:image/');
        var thumbSrc = isData ? u : driveThumb(u);
        return '<a href="' + esc(u) + '" target="_blank" class="block w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs hover:opacity-90 transition"><img src="' + esc(thumbSrc) + '" class="w-full h-full object-cover" loading="lazy" onerror="this.parentNode.innerHTML=\'🖼️\'"></a>';
    }).join('') + (refs.length > 4 ? '<span class="text-[10px] text-slate-400 self-center font-bold">+' + (refs.length - 4) + '</span>' : '') + '</div>' : '';

    // reference links
    var refLinks = (t.reference_links && t.reference_links.length) ? t.reference_links : [];
    var links = refLinks.length ?
        '<div class="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">' +
        refLinks.slice(0, 3).map(function(u, idx) {
            var label = u.includes('drive.google') ? '📁 ملف Drive' :
                        u.includes('pinterest') ? '📌 Pinterest' :
                        u.includes('youtube') || u.includes('youtu.be') ? '🎥 فيديو' :
                        u.includes('behance') ? '🎨 Behance' : ('🔗 ريفرنس ' + (idx + 1));
            return '<a href="' + esc(u) + '" target="_blank" class="inline-flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-violet-200 transition">' + esc(label) + ' ↗</a>';
        }).join('') + '</div>' : '';

    // visual idea / written reference
    var visIdea = (t.visual_idea || (t.content_data && t.content_data.visual_idea) || (t.graphic_data && t.graphic_data.idea) || '').trim();
    var visHtml = (visIdea && visIdea !== t.title && visIdea !== t.caption) ?
        '<div class="bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-950 space-y-0.5 shadow-2xs">' +
            '<div class="font-bold text-[10px] text-amber-800 flex items-center gap-1">🎨 فكرة / ريفرنس التصميم:</div>' +
            '<div class="leading-relaxed text-[11px] whitespace-pre-wrap">' + esc(visIdea) + '</div>' +
        '</div>' : '';

    // Detailed Deliverables Box
    var rawNotes = (t.notes || t.note || t.delivery_notes || t.deliverables || '').trim();
    var driveLink = (t.drive_link || t.google_drive_url || t.attachment_url || t.submission_link || '').trim();
    if (!driveLink && t.media_urls && t.media_urls.length) {
        driveLink = (t.media_urls.find(function(u){ return u && (u.includes('drive.google.com') || u.includes('docs.google.com') || u.startsWith('http')); }) || '').trim();
    }
    if (!driveLink && rawNotes) {
        var urlMatch = rawNotes.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) {
            driveLink = urlMatch[0].replace(/[.,;:)\]]+$/, '');
        }
    }

    var isTimerRunning = !!(t.timer_state && t.timer_state.is_running);
    var elapsedSecs = t.timer_state ? (t.timer_state.elapsed_seconds || 0) : 0;
    var elapsedMins = Math.round(elapsedSecs / 60);

    var deliverablesBox = '';
    if (rawNotes || driveLink || isTimerRunning || elapsedMins > 0 || t.submitted_at || t.started_at || st === 'Awaiting AM Review') {
        var timerTag = isTimerRunning ?
            '<span class="bg-amber-500 text-white animate-pulse px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">⏱️ جاري العمل الآن</span>' :
            (elapsedMins > 0 ? '<span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">⏱️ ' + elapsedMins + ' دقيقة</span>' : '');

        deliverablesBox = '<div class="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-indigo-200/80 rounded-xl p-2.5 text-xs space-y-1.5 shadow-xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-indigo-900 border-b border-indigo-100 pb-1">' +
                '<span class="flex items-center gap-1">📦 تسليمات وإنجاز الموظف:</span>' +
                timerTag +
            '</div>';

        if (driveLink) {
            deliverablesBox += '<div class="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 space-y-2 shadow-2xs">' +
                '<div class="flex items-center justify-between gap-1 flex-wrap">' +
                    '<span class="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">📁 رابط تسليمات المهمة (Google Drive):</span>' +
                    '<span class="bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">جاهز للتحميل 🚀</span>' +
                '</div>' +
                '<div class="flex items-center gap-1.5">' +
                    '<a href="' + esc(driveLink) + '" target="_blank" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs">' +
                        '<span>↗️ فتح في Google Drive</span>' +
                    '</a>' +
                    '<button type="button" onclick="copyTaskDriveLink(\'' + esc(driveLink) + '\')" class="bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] py-1.5 px-3 rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-xs">' +
                        '<span>📋 نسخ الرابط</span>' +
                    '</button>' +
                '</div>' +
                '<div class="text-[10px] font-mono text-slate-500 truncate bg-white/80 p-1.5 rounded-md border border-emerald-100 select-all" title="' + esc(driveLink) + '">' + esc(driveLink) + '</div>' +
            '</div>';
        }

        if (rawNotes) {
            deliverablesBox += '<div class="bg-white/90 p-2 rounded-lg border border-indigo-100 text-[11px] text-slate-800 space-y-0.5">' +
                '<div class="font-bold text-[10px] text-indigo-700">ملاحظات ومخرجات الموظف:</div>' +
                '<div class="whitespace-pre-wrap leading-relaxed">' + esc(rawNotes) + '</div>' +
            '</div>';
        }

        deliverablesBox += '</div>';
    }

    var html = '<div class="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3">' +
        '<div class="flex items-center justify-between gap-1 flex-wrap">' +
            '<div class="flex items-center gap-1.5 flex-wrap">' +
                '<span class="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-lg">' + esc(t.task_id) + '</span>' +
                '<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ' + statusBadgeClass + '">' + stLabel + '</span>' +
                clientTag +
            '</div>' +
            '<div class="flex items-center gap-1.5">' +
                amTag +
                '<button onclick="deleteTaskAction(\'' + esc(t.task_id) + '\')" class="text-slate-300 hover:text-red-600 transition text-sm p-1">✕</button>' +
            '</div>' +
        '</div>' +
        '<h4 class="font-bold text-sm text-slate-900 leading-snug">' + esc(t.title) + '</h4>' +
        '<div class="text-xs text-slate-600 whitespace-pre-wrap max-h-36 overflow-y-auto bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 leading-relaxed">' + esc(t.caption || t.description || '') + '</div>' +
        visHtml +
        refsHtml + links;

    // Dates
    var dStart = t.scheduled_start_date || '';
    var dPub = t.publish_date || '';
    var tPub = t.publish_time || '10:00';
    var dDead = t.delivery_deadline || '';

    html += '<div class="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 text-xs space-y-2">' +
        '<div class="grid grid-cols-2 gap-2">' +
            '<div><label class="text-[10px] text-slate-500 font-bold block mb-0.5">🚀 البدء:</label><input type="date" id="d-start-' + esc(t.task_id) + '" value="' + esc(dStart) + '" class="w-full text-[11px] px-1.5 py-1 border border-slate-200 rounded-lg bg-white"></div>' +
            '<div><label class="text-[10px] text-blue-700 font-bold block mb-0.5">📅 النزول:</label><div class="flex gap-1"><input type="date" id="d-pub-' + esc(t.task_id) + '" value="' + esc(dPub) + '" class="w-full text-[11px] px-1.5 py-1 border border-blue-200 rounded-lg bg-white"><input type="time" id="t-pub-' + esc(t.task_id) + '" value="' + esc(tPub) + '" class="text-[11px] px-1 py-1 border border-blue-200 rounded-lg bg-white"></div></div>' +
        '</div>' +
        '<div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">' +
            '<div class="flex-1"><label class="text-[10px] text-amber-700 font-bold block mb-0.5">⏰ التسليم:</label><input type="date" id="d-dead-' + esc(t.task_id) + '" value="' + esc(dDead) + '" class="w-full text-[11px] px-1.5 py-1 border border-amber-200 rounded-lg bg-white"></div>' +
            '<button onclick="saveTaskDates(\'' + esc(t.task_id) + '\')" class="self-end bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap">💾 حفظ</button>' +
        '</div>' +
    '</div>';

    // Deliverables section
    if (deliverablesBox) {
        html += deliverablesBox;
    }

    // Upload & Reference from device & link
    html += '<div class="space-y-1.5 pt-1">' +
        '<div class="grid grid-cols-2 gap-1.5">' +
            '<label class="text-center cursor-pointer bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-sky-200 shadow-xs flex items-center justify-center gap-1 transition">' +
                '<span>📤 رفع للـ Drive</span>' +
                '<input type="file" accept="image/*,video/*" class="hidden" onchange="uploadTaskAsset(\'' + esc(t.task_id) + '\', this)">' +
            '</label>' +
            '<label class="text-center cursor-pointer bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-violet-200 shadow-xs flex items-center justify-center gap-1 transition">' +
                '<span>➕ ريفرانس من الجهاز</span>' +
                '<input type="file" accept="image/*,video/*,.pdf,.doc,.docx" class="hidden" onchange="uploadTaskReferenceFile(\'' + esc(t.task_id) + '\', this)">' +
            '</label>' +
        '</div>' +
        '<div class="text-center">' +
            '<button type="button" onclick="promptAddLinkReference(\'' + esc(t.task_id) + '\')" class="text-[10px] text-violet-600 hover:text-violet-800 hover:underline font-bold transition">' +
                '🔗 أو إضافة رابط ريفرانس خارجي' +
            '</button>' +
        '</div>' +
    '</div>';

    if (t.review_note) {
        html += '<div class="bg-purple-50 p-2 rounded-xl text-[11px] text-purple-700 border border-purple-100">📝 ملاحظة المراجعة السابقة: ' + esc(t.review_note) + '</div>';
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
            '<span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0">✅ تم التسليم في الموعد</span>' :
            (isOnTime === false ?
                '<span class="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0">⚠️ تأخير عن موعد التسليم</span>' : '');

        kpisHtml = '<div class="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5 text-xs space-y-1.5 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-indigo-900 border-b border-indigo-100 pb-1">' +
                '<span class="flex items-center gap-1">📊 تقرير الـ KPIs والسرعة:</span>' +
                kpiBadge +
            '</div>' +
            '<div class="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 pt-0.5">' +
                '<div>👔 المسلم: <b class="text-indigo-950">' + esc(t.am_name || 'مدير الحساب') + '</b></div>' +
                '<div>👤 المستلم: <b class="text-indigo-950">' + esc(t.assignee_name || 'غير محدد') + '</b></div>' +
                (t.assigned_at ? '<div>📅 تاريخ الإسناد: <span class="font-mono text-[10px] block text-slate-600">' + esc(fmtCairoTime(t.assigned_at)) + '</span></div>' : '') +
                (t.submitted_at ? '<div>📦 تاريخ التسليم: <span class="font-mono text-[10px] block text-slate-600">' + esc(fmtCairoTime(t.submitted_at)) + '</span></div>' : '') +
                (turnaroundText ? '<div class="col-span-2 text-indigo-900 font-bold bg-white/80 px-2 py-1 rounded-lg border border-indigo-100 flex items-center justify-between mt-1"><span>⏱️ مدة إنجاز الموظف:</span><span class="font-mono text-xs text-indigo-700">' + turnaroundText + '</span></div>' : '') +
            '</div>' +
        '</div>';
    }

    var timelineLogHtml = '';
    if (logEntries.length > 0) {
        var logId = 'log-box-' + esc(t.task_id);
        timelineLogHtml = '<div class="pt-0.5">' +
            '<button type="button" onclick="toggleTaskTimeline(\'' + esc(logId) + '\')" class="w-full text-right bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-slate-200 flex items-center justify-between transition">' +
                '<span class="flex items-center gap-1.5">📜 سجل كل العمليات والمواعيد <span class="bg-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">' + logEntries.length + '</span></span>' +
                '<span id="arrow-' + esc(logId) + '" class="text-slate-400 text-xs transition">▼</span>' +
            '</button>' +
            '<div id="' + esc(logId) + '" class="hidden mt-1.5 space-y-1.5 bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 max-h-48 overflow-y-auto text-xs">';
            
        logEntries.slice().reverse().forEach(function(l) {
            var icon = l.action === 'created' ? '🟢' :
                       l.action === 'assigned' ? '🎯' :
                       l.action === 'started' ? '⏱️' :
                       l.action === 'submitted' ? '📦' :
                       l.action === 'reviewed_reject' ? '↩️' :
                       l.action === 'reviewed_forward' ? '➡️' :
                       l.action === 'reviewed_approved' ? '✅' :
                       l.action === 'recalled' ? '⚠️' :
                       l.action === 'dates_updated' ? '📅' :
                       l.action === 'reference_added' ? '🔗' :
                       l.action === 'asset_uploaded' ? '📤' : '📝';
            
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
            media_urls: t.media_urls || []
        }];
    }

    var historyArchiveHtml = '';
    if (subHistory.length > 0) {
        var subBoxId = 'sub-box-' + esc(t.task_id);
        historyArchiveHtml = '<div class="pt-0.5">' +
            '<button type="button" onclick="toggleTaskTimeline(\'' + esc(subBoxId) + '\')" class="w-full text-right bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-900 text-[11px] font-bold py-1.5 px-2.5 rounded-xl border border-emerald-200 flex items-center justify-between transition shadow-2xs">' +
                '<span class="flex items-center gap-1.5">📦 أرشيف وسجل التسليمات السابقة <span class="bg-emerald-200 text-emerald-900 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">' + subHistory.length + '</span></span>' +
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
                        '<span>📋 نسخ الرابط</span>' +
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
            '<button onclick="assignTaskFromBoard(\'' + esc(t.task_id) + '\')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">إسناد 🎯</button></div>';
    }
    if (st === 'Assigned' || st === 'In Progress') {
        html += '<div class="grid grid-cols-2 gap-1.5 pt-1">' +
            '<button onclick="recallTaskAction(\'' + esc(t.task_id) + '\')" class="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-2 rounded-lg shadow-sm flex items-center justify-center gap-1 transition">↩️ سحب المهمة</button>' +
            '<button onclick="resendTaskCard(\'' + esc(t.task_id) + '\')" class="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1">📤 إرسال للتليجرام</button>' +
            '</div>' +
            '<div class="flex gap-1 pt-1"><select id="reassign-select-' + esc(t.task_id) + '" class="text-xs px-2 py-1.5 border border-slate-200 rounded-lg flex-1"><option value="">تحويل لموظف آخر...</option>' + empOptionsHtml(t.assigned_employee_id) + '</select>' +
            '<button onclick="reassignTaskFromBoard(\'' + esc(t.task_id) + '\')" class="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap">تحويل 🔄</button></div>';
    }
    if (st === 'Awaiting AM Review') {
        html += '<div class="grid grid-cols-2 gap-1 pt-1">' +
            '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'reject\')" class="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs py-1.5 rounded-lg">↩️ رجّع للتعديل</button>' +
            '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'finalize\')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 rounded-lg">✅ اعتماد واكتمال</button>' +
            '</div>' +
            '<div class="flex gap-1 pt-1"><select id="fwd-select-' + esc(t.task_id) + '" class="text-xs px-2 py-1.5 border border-slate-200 rounded-lg flex-1"><option value="">مرّرها للي بعده...</option>' + empOptionsHtml('') + '</select>' +
            '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'forward\')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">مرّر ➡️</button></div>' +
            '<button onclick="recallTaskAction(\'' + esc(t.task_id) + '\')" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 rounded-lg shadow-sm mt-1">↩️ سحب المهمة من الموظف</button>';
    }
    if (st === 'Completed') {
        html += '<span class="text-xs font-bold text-emerald-600 block text-center">✓ مكتملة ومعتمدة بنجاح ✅</span>';
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
        var board = document.getElementById('tasks-board-grid');
        if (!board) return;
        var badge = document.getElementById('tasks-count-badge');
        var allTasks = tasksList || [];
        var displayTasks = allTasks.slice();

        // 1. Employee or AM Filter
        if (selectedEmployeeFilter) {
            var empAllTasks = (employeesWorkloadData && employeesWorkloadData[selectedEmployeeFilter]) || [];
            if (empAllTasks.length > 0) {
                displayTasks = empAllTasks.slice();
            } else {
                displayTasks = displayTasks.filter(function(t) {
                    return String(t.assigned_employee_id || '').trim() === String(selectedEmployeeFilter).trim();
                });
            }
        } else if (selectedAMFilter) {
            displayTasks = displayTasks.filter(function(t) {
                return String(t.am_id || '').trim() === String(selectedAMFilter).trim() ||
                       String(t.am_name || '').trim() === String(selectedAMName).trim();
            });
        }

        // 2. Status Filter
        if (currentTaskStatusFilter && currentTaskStatusFilter !== 'all') {
            displayTasks = displayTasks.filter(function(t) {
                var st = t.status || 'Pending AM Approval';
                if (currentTaskStatusFilter === 'in_progress') return st === 'In Progress' || st === 'Assigned';
                if (currentTaskStatusFilter === 'review') return st === 'Awaiting AM Review';
                if (currentTaskStatusFilter === 'pending') return st === 'Pending AM Approval';
                if (currentTaskStatusFilter === 'completed') return st === 'Completed';
                return true;
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
            var done = displayTasks.filter(function(t){ return t.status === 'Completed'; }).length;
            badge.textContent = displayTasks.length + ' مهمة مرتبة · ' + done + ' مكتملة' + 
                (selectedAMFilter ? ' (AM: ' + esc(selectedAMName) + ')' : '') +
                (selectedEmployeeFilter ? ' (' + esc(selectedEmployeeName) + ')' : '');
        }

        // Build distinct AM list for Manager overview
        var amMap = {};
        allTasks.forEach(function(t) {
            var amId = (t.am_id || 'unassigned').trim();
            var amName = (t.am_name || (amId === 'EMP-001' ? 'أكونت مانيجر' : amId)).trim();
            if (!amMap[amId]) amMap[amId] = { id: amId, name: amName, count: 0 };
            amMap[amId].count++;
        });
        var amList = Object.values(amMap);

        var amBarHtml = '';
        var isUserAdmin = window._me && (window._me.is_admin || window._me.role === 'admin');
        if (isUserAdmin && amList.length > 1 && !selectedEmployeeFilter) {
            amBarHtml = '<div class="col-span-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2 shadow-xs mb-1">' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                    '<span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">👔 فلترة حسب مدير الحساب (AM):</span>' +
                    '<button type="button" onclick="clearAMFilter()" class="text-xs px-3 py-1 rounded-xl font-bold transition ' +
                        (!selectedAMFilter ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        'الكل (' + allTasks.length + ')' +
                    '</button>' +
                    amList.map(function(am) {
                        var isSel = selectedAMFilter === am.id;
                        return '<button type="button" onclick="toggleAMFilter(\'' + esc(am.id) + '\', \'' + esc(am.name) + '\')" class="text-xs px-3 py-1 rounded-xl font-bold transition ' +
                            (isSel ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                            '👔 ' + esc(am.name) + ' <span class="text-[10px] opacity-80 font-mono">(' + am.count + ')</span>' +
                        '</button>';
                    }).join('') +
                '</div>' +
                (selectedAMFilter ? '<button type="button" onclick="clearAMFilter()" class="text-[11px] text-indigo-700 font-bold hover:underline">إلغاء فلترة AM ✕</button>' : '') +
            '</div>';
        }

        var filterBannerHtml = '';
        if (selectedEmployeeFilter) {
            var currentCid = (window._me && window._me.active_client_id) || '';
            var otherClientsCount = displayTasks.filter(function(ot){ return ot.client_id !== currentCid; }).length;

            filterBannerHtml = '<div class="col-span-full bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-sm">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">👤</div>' +
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
                    '<span>عرض كل مهام الفريق ✕</span>' +
                '</button>' +
            '</div>';
        }

        var sortToolbarHtml = '<div class="col-span-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2.5 mb-1">' +
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                '<div class="flex items-center gap-1.5 flex-wrap">' +
                    '<span class="text-xs font-bold text-slate-800 flex items-center gap-1">📊 ترتيب حسب:</span>' +
                    '<button type="button" onclick="setTaskSort(\'sequence\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ' + (currentTaskSort === 'sequence' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        '<span>🔢 رقم البوست</span>' + (currentTaskSort === 'sequence' ? (currentTaskSortDir === 'asc' ? ' ▲' : ' ▼') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'pub_date\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ' + (currentTaskSort === 'pub_date' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        '<span>📅 تاريخ النشر</span>' + (currentTaskSort === 'pub_date' ? (currentTaskSortDir === 'asc' ? ' ▲' : ' ▼') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'deadline\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ' + (currentTaskSort === 'deadline' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        '<span>⏰ موعد التسليم</span>' + (currentTaskSort === 'deadline' ? (currentTaskSortDir === 'asc' ? ' ▲' : ' ▼') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'status\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ' + (currentTaskSort === 'status' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        '<span>📊 الحالة</span>' + (currentTaskSort === 'status' ? (currentTaskSortDir === 'asc' ? ' ▲' : ' ▼') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'task_id\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ' + (currentTaskSort === 'task_id' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        '<span>🆔 الكود</span>' + (currentTaskSort === 'task_id' ? (currentTaskSortDir === 'asc' ? ' ▲' : ' ▼') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'created_at\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ' + (currentTaskSort === 'created_at' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                        '<span>🆕 الأحدث</span>' + (currentTaskSort === 'created_at' ? (currentTaskSortDir === 'asc' ? ' ▲' : ' ▼') : '') +
                    '</button>' +
                '</div>' +
                '<div class="flex items-center gap-2 flex-1 sm:max-w-xs">' +
                    '<div class="relative w-full">' +
                        '<input type="text" value="' + esc(taskSearchQuery) + '" oninput="onTaskSearchInput(this.value)" placeholder="🔍 بحث في المهام..." class="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-blue-500 shadow-2xs">' +
                        (taskSearchQuery ? '<button type="button" onclick="onTaskSearchInput(\'\')" class="absolute left-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700">✕</button>' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 flex-wrap border-t border-slate-200/60 pt-2">' +
                '<span class="text-[11px] font-bold text-slate-500">تصفية الحالة:</span>' +
                '<button type="button" onclick="setTaskStatusFilter(\'all\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition ' + (currentTaskStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200') + '">الكل (' + allTasks.length + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'in_progress\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition ' + (currentTaskStatusFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-200') + '">⏱️ جاري العمل (' + allTasks.filter(function(t){ return t.status==='In Progress'||t.status==='Assigned'; }).length + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'review\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition ' + (currentTaskStatusFilter === 'review' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200') + '">📝 بانتظار المراجعة (' + allTasks.filter(function(t){ return t.status==='Awaiting AM Review'; }).length + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'pending\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition ' + (currentTaskStatusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200') + '">🎯 بانتظار الإسناد (' + allTasks.filter(function(t){ return !t.status || t.status==='Pending AM Approval'; }).length + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'completed\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition ' + (currentTaskStatusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200') + '">✅ مكتملة (' + allTasks.filter(function(t){ return t.status==='Completed'; }).length + ')</button>' +
            '</div>' +
        '</div>';

        var topBanners = amBarHtml + filterBannerHtml + sortToolbarHtml;

        if (!displayTasks || displayTasks.length === 0) {
            board.innerHTML = topBanners + '<div class="col-span-full p-8 text-center text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded-2xl">' +
                (taskSearchQuery ? 'لا توجد نتائج تطابق بحثك: <b>' + esc(taskSearchQuery) + '</b>' :
                 selectedEmployeeFilter ? 'لا توجد مهام مسندة للموظف <b>' + esc(selectedEmployeeName) + '</b> حالياً 🎯' : 
                 selectedAMFilter ? 'لا توجد مهام مسندة لمدير الحساب <b>' + esc(selectedAMName) + '</b> في هذا العميل 🎯' :
                 'لا توجد مهام مسجلة حالياً. ارفع الخطة الشهرية أو أضف مهمة جديدة 🚀') +
                '</div>';
            return;
        }

        var clientNameEl = document.getElementById('tasks-client-name');
        var activeClientName = (clientNameEl ? clientNameEl.textContent.replace(/^—\s*/, '').trim() : '') || 'العميل';

        // Group tasks by file_name / plan_name / client_name
        var fileGroups = {};
        displayTasks.forEach(function(t) {
            var colKey = '';
            var cName = t.client_name || activeClientName;
            var fName = (t.file_name || t.plan_name || '').trim();
            if (selectedEmployeeFilter) {
                colKey = cName + (fName ? (' — ' + fName) : '');
            } else {
                colKey = fName;
                if (!colKey || colKey === 'خطة محتوى' || colKey === 'ملف الخطة') {
                    colKey = activeClientName;
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

        var columnsHtml = '<div class="col-span-full flex gap-6 overflow-x-auto pb-6 items-start w-full pt-1">';
        groupKeys.forEach(function(k) {
            var grp = fileGroups[k];
            var fTasks = sortTaskList(grp.tasks, currentTaskSort, currentTaskSortDir);
            var completedCount = fTasks.filter(function(t){ return t.status === 'Completed'; }).length;

            columnsHtml += '<div class="w-88 sm:w-[420px] shrink-0 bg-slate-100/90 border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3.5 flex flex-col">' +
                '<div class="flex items-center justify-between border-b border-slate-200/90 pb-3 bg-white -m-4 mb-0 p-4 rounded-t-3xl shadow-xs">' +
                    '<div class="flex items-center gap-2.5 min-w-0">' +
                        '<div class="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">📄</div>' +
                        '<div class="min-w-0">' +
                            '<h4 class="font-bold text-sm text-slate-900 truncate" title="' + esc(grp.fileName) + '">ملف: ' + esc(grp.fileName) + '</h4>' +
                            '<div class="flex items-center gap-1.5 text-xs mt-0.5">' +
                                '<span class="text-blue-700 font-bold truncate">🏢 ' + esc(grp.clientName) + '</span>' +
                                '<span class="text-slate-300">·</span>' +
                                '<span class="text-slate-500 font-mono text-[11px] whitespace-nowrap">' + completedCount + '/' + fTasks.length + ' منجز</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<span class="bg-blue-600 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-full shadow-xs shrink-0">' + fTasks.length + ' مهام</span>' +
                '</div>' +
                '<div class="space-y-3.5 pt-1 max-h-[850px] overflow-y-auto pr-1">' +
                    fTasks.map(renderTaskCard).join('') +
                '</div>' +
            '</div>';
        });
        columnsHtml += '</div>';

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
            showToast('تم مسح ' + (data.removed || 0) + ' مهمة 🗑️ — ابدأ برفع الخطة');
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
            showToast('تم حذف المهمة 🗑️');
            loadTasksEngine();
        } else { showToast(data.error || 'تعذّر الحذف', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

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
            showToast(action === 'finalize' ? 'تم اعتماد واكتمال المهمة بنجاح ✅' : action === 'forward' ? 'تم تمرير المهمة للموظف التالي ➡️' : 'تم إرجاع المهمة للموظف ↩️');
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
            showToast(data.telegram_sent ? 'اتسند واتبعت للموظف على التليجرام ✅' : 'اتسند ✅ (الموظف مالوش تليجرام أو معملش Start للبوت)');
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
            showToast(data.telegram_sent ? 'تم تحويل المهمة وإشعار الموظف على تليجرام 🎯' : 'تم تحويل المهمة بنجاح ✅');
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
    showToast('جاري الرفع على Google Drive... ⏳');
    try {
        await driveUploadFile(taskId, file);  // shared: direct for large, server for small
        showToast('اترفع على Drive واتربط بالتاسك ✅');
        loadTasksEngine();
    } catch(e) { showToast('تعذّر الرفع: ' + (e.message || ''), 'error'); }
    if (input) input.value = '';
}

async function uploadTaskReferenceFile(taskId, input) {
    var file = (input && input.files && input.files[0]) ? input.files[0] : null;
    if (!file) return;
    showToast('جاري رفع الريفرانس من الجهاز... ⏳');
    try {
        var fd = new FormData();
        fd.append('file', file);
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/references', {
            method: 'POST',
            body: fd
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast('تمت إضافة الريفرانس من الجهاز بنجاح ✅');
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
            showToast('تمت إضافة الرابط بنجاح ✅');
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
            showToast(data.telegram_sent ? 'اتبعت الكارت للموظف على التليجرام ✅' : 'الموظف مالوش تليجرام أو معملش Start لبوت المهام', data.telegram_sent ? 'success' : 'error');
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
            showToast('تم تحديث حالة المهمة بنجاح ✅');
            loadTasksEngine();
        } else {
            showToast(data.error || 'حدث خطأ في التحديث', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالخادم', 'error');
    }
}

var _planQuill = null;
async function loadPlanBuilder() {
    var cSel = document.getElementById('pb-client');
    var mSel = document.getElementById('pb-am');
    if (!cSel || !mSel) return;
    // init the open-source rich-text (Word-like) editor once
    if (window.Quill && !_planQuill && document.getElementById('pb-editor')) {
        _planQuill = new Quill('#pb-editor', {
            theme: 'snow', placeholder: '1)\n- تاج لاين: عنوان البوست\n- التخيل: فكرة الجرافيك\nالكابشن هنا...\n\n2) ...',
            modules: { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], [{ header: [1, 2, false] }], ['link', 'clean']] }
        });
    }
    try {
        // dedicated endpoint returns ALL clients for plan-builders (content team isn't
        // assigned to clients, so /api/clients would return empty for them)
        var cd = await (await fetch('/api/plan/clients')).json();
        var clients = Array.isArray(cd) ? cd : (cd.clients || []);
        cSel.innerHTML = clients.map(function(c){ return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join('') || '<option value="">لا يوجد عملاء</option>';
    } catch(e){}
    try {
        var md = await (await fetch('/api/managers')).json();
        var ms = md.managers || [];
        mSel.innerHTML = '<option value="">— بدون —</option>' + ms.map(function(m){ return '<option value="' + esc(m.employee_id) + '">' + esc(m.name) + '</option>'; }).join('');
    } catch(e){}
}

async function uploadPlanImage(input) {
    var files = input && input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    var client_id = (document.getElementById('pb-client') || {}).value || '';
    showToast('جاري رفع الصورة على Drive... ⏳');
    for (var i = 0; i < files.length; i++) {
        var fd = new FormData();
        fd.append('file', files[i]);
        if (client_id) fd.append('client_id', client_id);
        try {
            var res = await fetch('/api/plan/upload-image', { method: 'POST', body: fd });
            var data = await res.json();
            if (res.ok && data.ok && data.url) {
                // insert the link on its own line in the editor (parser picks it up as a reference)
                if (_planQuill) {
                    var len = _planQuill.getLength();
                    _planQuill.insertText(len - 1, '\n' + data.url + '\n');
                }
                showToast('اترفعت الصورة واتحطت في البلان ✅');
            } else { showToast(data.error || 'تعذّر رفع الصورة', 'error'); }
        } catch(e) { showToast('خطأ في رفع الصورة', 'error'); }
    }
    if (input) input.value = '';
}

async function createPlan() {
    var client_id = (document.getElementById('pb-client')||{}).value || '';
    var am = (document.getElementById('pb-am')||{}).value || '';
    var txt = _planQuill ? _planQuill.getText().trim() : (((document.getElementById('pb-text')||{}).value) || '').trim();
    if (!client_id) { showToast('اختر العميل', 'error'); return; }
    if (!txt) { showToast('اكتب البلان', 'error'); return; }
    showToast('جاري إنشاء البلان... ⏳');
    try {
        var res = await fetch('/api/plan/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: client_id, am_employee_id: am, plan_text: txt })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            var box = document.getElementById('pb-result');
            if (box) {
                box.classList.remove('hidden');
                var amMsg = data.am_notified ? ('واتبعت للأكونت مانيجر <b>' + esc(data.am_name || '') + '</b> على التليجرام ✅')
                    : (data.am_has_telegram === false ? ('⚠️ الأكونت مانيجر <b>' + esc(data.am_name || '') + '</b> مالوش تليجرام في الشيت')
                    : ('⚠️ اتعمل البلان بس الرسالة موصلتش لـ <b>' + esc(data.am_name || '') + '</b> (لازم يعمل Start لبوت المهام)'));
                box.innerHTML = 'تم إنشاء <b>' + data.created + '</b> بوست، ' + amMsg + '<br>' +
                    '<div class="mt-2 flex items-center gap-2"><span class="text-slate-500">لينك المشاركة برا السيستم:</span>' +
                    '<input value="' + esc(data.share_url) + '" readonly class="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-[11px]" onclick="this.select()">' +
                    '<button onclick="navigator.clipboard.writeText(\'' + esc(data.share_url) + '\');showToast(\'اتنسخ ✅\')" class="text-[11px] px-2 py-1 rounded-lg bg-blue-600 text-white font-bold">نسخ</button></div>';
            }
            if (_planQuill) _planQuill.setText('');
            loadTasksEngine();
        } else { showToast(data.error || 'تعذّر الإنشاء', 'error'); }
    } catch(e) { showToast('خطأ في الاتصال', 'error'); }
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

        // Map relationships (rId -> media/imageX.png)
        var relsMap = {};
        var relsFile = contents.file("word/_rels/document.xml.rels");
        if (relsFile) {
            try {
                var relsXmlStr = await relsFile.async("text");
                var relsDoc = parser.parseFromString(relsXmlStr, "application/xml");
                var relEls = relsDoc.getElementsByTagName("Relationship");
                for (var ri = 0; ri < relEls.length; ri++) {
                    var rId = relEls[ri].getAttribute("Id");
                    var target = relEls[ri].getAttribute("Target");
                    if (rId && target) {
                        relsMap[rId] = target.replace(/^word\//, '').replace(/^\//, '');
                    }
                }
            } catch(re) { console.warn("Rels parse warning:", re); }
        }

        // Cache base64 data URIs for all images in the docx
        var imgDataCache = {};
        for (var rid in relsMap) {
            var mediaPath = relsMap[rid];
            var zf = contents.file("word/" + mediaPath) || contents.file(mediaPath);
            if (zf) {
                try {
                    var b64 = await zf.async("base64");
                    var ext = mediaPath.split('.').pop().toLowerCase();
                    var mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                    imgDataCache[rid] = "data:" + mime + ";base64," + b64;
                } catch(ie) {}
            }
        }

        // Helper to extract embedded images in an XML node
        function getImagesInElement(elem) {
            var imgUrls = [];
            var blips = elem.getElementsByTagName("a:blip");
            for (var bi = 0; bi < blips.length; bi++) {
                var embedId = blips[bi].getAttribute("r:embed") || blips[bi].getAttribute("embed");
                if (embedId && imgDataCache[embedId] && !imgUrls.includes(imgDataCache[embedId])) {
                    imgUrls.push(imgDataCache[embedId]);
                }
            }
            var vImages = elem.getElementsByTagName("v:imagedata");
            for (var vi = 0; vi < vImages.length; vi++) {
                var vId = vImages[vi].getAttribute("r:id") || vImages[vi].getAttribute("id");
                if (vId && imgDataCache[vId] && !imgUrls.includes(imgDataCache[vId])) {
                    imgUrls.push(imgDataCache[vId]);
                }
            }
            return imgUrls;
        }
        
        // 1. Check for tables (<w:tbl>)
        var tables = doc.getElementsByTagName("w:tbl");
        var extractedRows = [];
        
        if (tables && tables.length > 0) {
            for (var t = 0; t < tables.length; t++) {
                var rows = tables[t].getElementsByTagName("w:tr");
                for (var r = 0; r < rows.length; r++) {
                    var rowImages = getImagesInElement(rows[r]);
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
                    if (rowImages.length > 0) {
                        cellTexts.push(rowImages.join("\t"));
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
            var pImgs = getImagesInElement(paras[i]);
            var txt = (paras[i].textContent || '').trim();
            if (txt) paraTexts.push(txt);
            if (pImgs.length > 0) paraTexts.push(pImgs.join("\n"));
        }
        return paraTexts.join("\n");
    } catch(e) {
        console.warn("Client docx parse warning:", e);
        return null;
    }
}

async function ingestPlanAction(ev) {
    if (ev) ev.preventDefault();
    var el = document.getElementById('plan-ingest-input');
    var fileEl = document.getElementById('plan-ingest-file');
    var driveEl = document.getElementById('plan-ingest-drive');
    var txt = el ? el.value.trim() : '';
    var file = (fileEl && fileEl.files && fileEl.files[0]) ? fileEl.files[0] : null;
    var drive = driveEl ? driveEl.value.trim() : '';
    if (!txt && !file && !drive) { showToast('ارفع ملف الخطة أو الصق نصها أو حط رابط Drive', 'error'); return; }

    var opts;
    var fileName = file ? file.name : (drive ? 'ملف Google Drive' : 'خطة محتوى مباشرة');
    if (file) {
        showToast('جاري قراءة واستخراج نص الملف فورياً... ⏳');
        var clientText = await extractTextFromDocxClient(file);
        if (clientText && clientText.length > 10) {
            // Send pure extracted text payload (< 100KB) - 100% bypasses any 413 file size limit!
            opts = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_text: clientText, drive_link: drive, file_name: fileName })
            };
        } else if (file.size < 4 * 1024 * 1024) {
            var fd = new FormData();
            fd.append('file', file);
            fd.append('file_name', fileName);
            if (drive) fd.append('drive_link', drive);
            opts = { method: 'POST', body: fd };
        } else {
            showToast('حجم الملف كبير جداً (> 4.5MB). يرجى نسخه ولصقه في المربع أو استخدام رابط Google Drive', 'error');
            return;
        }
    } else if (drive) {
        opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drive_link: drive, file_name: fileName }) };
    } else {
        opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_text: txt, file_name: fileName }) };
    }

    showToast('جاري تفريغ الخطة وتقسيم المهام بالذكاء الاصطناعي... ⏳');
    try {
        var res = await fetch('/api/tasks/ingest-plan', opts);
        var data;
        try {
            data = await res.json();
        } catch(je) {
            data = { error: 'تعذر قراءة رد الخادم (' + res.status + ')' };
        }
        if (res.ok && data.success) {
            showToast('تم تفريغ وإنشاء ' + (data.ingested_count || 0) + ' مهمة بنجاح 🎉');
            if (el) el.value = '';
            if (fileEl) fileEl.value = '';
            if (driveEl) driveEl.value = '';
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
        var res = await fetch('/api/tasks/monthly-report');
        var data = await res.json();
        var tbody = document.getElementById('monthly-report-table-body');
        if (!tbody) return;

        var report = (data && data.report) ? data.report : [];
        if (!report || report.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-slate-500">لا توجد سجلات أداء لهذا الشهر بعد</td></tr>';
            return;
        }

        tbody.innerHTML = report.map(function(r) {
            var onTimeBadge = r.on_time_rate !== '-' ?
                ('<span class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">' + esc(r.on_time_rate) +
                 ' <span class="text-[10px] text-slate-400 font-normal">(' + r.on_time_count + ' في الموعد)</span></span>') : '<span class="text-slate-400">—</span>';
            
            var notesHtml = '-';
            if (r.notes && r.notes.length) {
                notesHtml = r.notes.map(function(n) {
                    if (typeof n === 'object' && n && n.task_id) {
                        var stBadge = (n.status === 'Awaiting AM Review') ? ' <span class="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">بانتظار مراجعة AM</span>' : ((n.status === 'Completed') ? ' <span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">معتمد ✅</span>' : '');
                        return '<div class="mb-1 leading-tight"><span class="font-mono font-bold text-slate-800 bg-slate-100 px-1 rounded">' + esc(n.task_id) + '</span>' + stBadge + ': <span class="text-slate-700">' + esc(n.note) + '</span></div>';
                    }
                    var s = String(n || '').replace(/<[^>]*>/g, '');
                    return '<div class="mb-1 leading-tight">' + esc(s) + '</div>';
                }).join('');
            }

            var rateNum = parseInt(r.completion_rate, 10);
            var rateBadge = r.completion_rate !== '-' ?
                '<span class="font-mono font-bold px-2 py-0.5 rounded-md ' + (rateNum >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800') + '">' + esc(r.completion_rate) + '</span>' : '<span class="text-slate-400">—</span>';

            var inProg = (r.in_progress !== undefined) ? r.in_progress : 0;
            var deliv = (r.submitted !== undefined) ? r.submitted : r.completed;

            return '<tr>' +
                '<td class="p-3 font-bold text-slate-900">' + esc(r.employee) + ' <span class="text-xs font-normal text-slate-500">(' + esc(r.role) + ')</span></td>' +
                '<td class="p-3 font-mono font-bold text-slate-800">' + r.assigned + '</td>' +
                '<td class="p-3 font-mono text-amber-600 font-bold">' + inProg + '</td>' +
                '<td class="p-3 font-mono font-bold text-emerald-600">' + deliv + '</td>' +
                '<td class="p-3">' + rateBadge + '</td>' +
                '<td class="p-3 font-mono">' + onTimeBadge + '</td>' +
                '<td class="p-3 font-mono text-indigo-900 font-bold">' + esc(r.avg_turnaround || '-') + '</td>' +
                '<td class="p-3 font-mono text-slate-600">' + esc(r.avg_duration || '-') + '</td>' +
                '<td class="p-3 text-xs text-slate-700 max-w-xs">' + notesHtml + '</td>' +
            '</tr>';
        }).join('');
    } catch(e) { console.error(e); }
}

async function sendMonthlyReportAction() {
    var targetEmail = prompt("أدخل البريد الإلكتروني لاستلام التقرير الشهري:", "agencydomya@gmail.com");
    if (!targetEmail) return;
    try {
        showToast("جاري تجهيز وإرسال التقرير للإيميل... ⏳");
        var res = await fetch('/api/tasks/send-monthly-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail })
        });
        var data = await res.json();
        if (data.success) {
            showToast(data.message || 'تم إرسال التقرير بنجاح 📧');
        } else {
            showToast(data.error || 'خطأ في إرسال التقرير', 'error');
        }
    } catch(e) {
        showToast('خطأ في إرسال التقرير', 'error');
    }
}

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
                title: '🗄️ قاعدة بيانات Supabase',
                ok: s.supabase && s.supabase.ok,
                desc: s.supabase && s.supabase.ok ? 'متصل بنجاح (' + (s.supabase.latency_ms || 0) + 'ms)' : (s.supabase ? s.supabase.error : 'غير متصل'),
                fix: 'تأكد من صحة SUPABASE_KEY في Vercel'
            },
            {
                title: '🧠 محرك الذكاء الاصطناعي (Groq LLaMA)',
                ok: s.groq_llm && s.groq_llm.ok,
                desc: s.groq_llm && s.groq_llm.ok ? 'متصل ونشط (Fast Inference)' : (s.groq_llm ? s.groq_llm.error : 'غير متصل'),
                fix: 'تأكد من ضبط GROQ_API_KEY في Vercel'
            },
            {
                title: '🤖 بوت تيليجرام (Staff Bot)',
                ok: s.telegram && s.telegram.ok,
                desc: s.telegram && s.telegram.ok ? 'متصل: @' + esc(s.telegram.bot_username || '') : (s.telegram ? s.telegram.error : 'غير متصل'),
                fix: 'تأكد من TELEGRAM_BOT_TOKEN'
            },
            {
                title: '🔵 Meta Graph API v21.0',
                ok: s.meta_graph && s.meta_graph.ok,
                desc: s.meta_graph && s.meta_graph.ok ? 'متصل: ' + esc(s.meta_graph.name || 'حساب مفعل') : (s.meta_graph ? s.meta_graph.error : 'غير متصل'),
                fix: 'أعد ربط الصفحة عبر OAuth أو جدد التوكن'
            },
            {
                title: '🔐 مفاتيح الأمان في Vercel',
                ok: env.admin_pass_set && env.secret_key_set,
                desc: env.admin_pass_set && env.secret_key_set ? 'مثبتة بنجاح (Persistent Sessions)' : 'تحذير: بعض المفاتيح مفقودة في Environment Variables',
                fix: 'اضبط ADMIN_PASS و SECRET_KEY في Vercel Dashboard'
            }
        ];

        box.innerHTML = items.map(function(item) {
            var color = item.ok ? 'emerald' : 'amber';
            var bg = item.ok ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900';
            var badge = item.ok ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">🟢 متصل</span>' : '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">⚠️ تنبيه</span>';
            return '<div class="p-4 rounded-xl border ' + bg + ' flex flex-col justify-between gap-2 shadow-sm">' +
                '<div class="flex items-center justify-between">' +
                    '<span class="font-bold text-xs">' + item.title + '</span>' +
                    badge +
                '</div>' +
                '<p class="text-[11px] opacity-90">' + esc(item.desc) + '</p>' +
                (!item.ok ? '<span class="text-[10px] text-amber-800 font-semibold mt-1">💡 الحل: ' + esc(item.fix) + '</span>' : '') +
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
        showToast("جاري حفظ رابط الدرايف... ⏳");
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/drive-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drive_link: trimmed })
        });
        var data = await res.json();
        if (res.ok && (data.ok || data.success)) {
            showToast("تم حفظ رابط جوجل درايف بنجاح 🎉");
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
        showToast("جاري حفظ الملاحظات... ⏳");
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Awaiting AM Review', notes: val.trim() })
        });
        var data = await res.json();
        if (res.ok && data.success) {
            showToast("تم حفظ الملاحظات بنجاح 📝");
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
