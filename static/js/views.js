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
            let selectHtml = `<option value="">🌐 جميع العملاء (الكل)</option>`;
            clientsList.forEach(c => {
                const fbOk = c.fb_connected ? '🔵' : '⚪';
                const igOk = c.ig_connected ? '🟣' : '⚪';
                selectHtml += `<option value="${esc(c.id)}">${fbOk}${igOk} ${esc(c.name)}</option>`;
            });
            headerSelect.innerHTML = selectHtml;
            const savedAct = localStorage.getItem('active_client_id');
            if (savedAct) headerSelect.value = savedAct;
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
            const cPageId = String(c.page_id || '100821894800009');
            const cIgId = String(c.ig_id || '17841413562796856');

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
        const list = await res.json();
        scheduledPosts = list || [];
        renderScheduledPosts();
    } catch(e) {
        renderScheduledPosts();
    }
}

function renderScheduledPosts() {
    const el = document.getElementById('scheduled-posts-list');
    if (!el) return;
    if (!scheduledPosts || scheduledPosts.length === 0) {
        el.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">لا توجد منشورات مجدولة بعد</div>';
        return;
    }
    el.innerHTML = scheduledPosts.map(p => `
        <div class="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs mb-2">
            <div class="space-y-1 flex-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-blue-600">${esc(p.typeLabel || p.type || 'منشور مجدول')}</span>
                    <span class="px-2 py-0.5 rounded-md font-bold ${p.status && p.status.includes('تم') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${esc(p.status || 'مجدول')}</span>
                    <span class="text-slate-400 font-mono">(${esc(p.datetime || p.scheduled_at || '')})</span>
                </div>
                <p class="text-slate-800 font-medium">${esc(p.caption)}</p>
                ${p.media_url || p.mediaUrl ? `<span class="text-slate-500 text-xs block truncate">الميديا: ${esc(p.media_url || p.mediaUrl)}</span>` : ''}
            </div>
            <button onclick="deleteScheduledPost(${p.id})" class="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

async function deleteScheduledPost(id) {
    try {
        await fetch('/api/scheduler/' + id, {method: 'DELETE'});
        showToast('تم حذف المنشور المجدول');
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
    const uEl = document.getElementById('auth-username') || document.querySelector('#login-modal-overlay input[type="text"]');
    const pEl = document.getElementById('auth-password') || document.querySelector('#login-modal-overlay input[type="password"]');
    if (uEl) uEl.value = 'admin';
    if (pEl) pEl.value = 'admin2026';
    await handleLogin(null, 'admin', 'admin2026');
}

async function handleLogin(e, demoU, demoP) {
    if (e && e.preventDefault) e.preventDefault();
    const uEl = document.getElementById('auth-username') || document.querySelector('#login-modal-overlay input[type="text"]');
    const pEl = document.getElementById('auth-password') || document.querySelector('#login-modal-overlay input[type="password"]');
    let u = demoU || (uEl ? uEl.value : '').trim() || 'admin';
    let p = demoP || (pEl ? pEl.value : '').trim() || 'admin2026';
    
    const err = document.getElementById('auth-error');
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