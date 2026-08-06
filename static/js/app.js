// Define Meta App ID globally
window.META_APP_ID = '1331918902446123';

/* Domya AI Moderator - Core App Module */

// Global State
window.allInboxThreads = window.allInboxThreads || [];
window.activeThreadId = window.activeThreadId || null;
window.activityLog = window.activityLog || [];
window.kbItems = window.kbItems || [];
window.rulesItems = window.rulesItems || [];
window.botEnabled = window.botEnabled || true;
window.approvalMode = window.approvalMode || 'auto';
window.connectedAccounts = window.connectedAccounts || [];

// Helper: Escape HTML strings safely
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Non-blocking Toast Notification
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  
  const iconMarkup = type === 'success' 
    ? '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-500 inline"></i>'
    : '<i data-lucide="alert-circle" class="w-4 h-4 text-slate-500 inline"></i>';

  toast.className = 'show ' + (type === 'success' ? 'bg-white border-emerald-500 text-slate-900' : 'bg-white border-slate-300 text-slate-900');
  toast.innerHTML = iconMarkup + '<span class="text-sm font-semibold">' + esc(msg) + '</span>';
  
  if (window.lucide) lucide.createIcons();

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Initialize Lucide SVG Icons safely
function initLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Sidebar & Mobile Toggle Handlers
function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// 13 View Navigation Handler
function go(id, el) {
  try {
    let cleanId = (id || '').replace('v-', '');
    // Canonical aliases
    if (cleanId === 'clients') cleanId = 'crm';
    if (cleanId === 'prompt') cleanId = 'settings';
    if (cleanId === 'schedule') cleanId = 'scheduler';
    if (cleanId === 'accounts' || cleanId === 'chatwoot') cleanId = 'accounts';
    if (cleanId === 'automation' || cleanId === 'rules') cleanId = 'rules';
    if (cleanId === 'help' || cleanId === 'dash') cleanId = 'dash';
    // v-mode and v-chat are now independent views

    const paneIds = [
      'v-inbox', 'v-dash', 'v-help', 'v-rules', 'v-automation', 'v-kb',
      'v-crm', 'v-settings', 'v-logs', 'v-scheduler', 'v-chatwoot', 'v-accounts',
      'v-analytics', 'v-mode', 'v-chat'
    ];
    
    paneIds.forEach(pid => {
      const pane = document.getElementById(pid);
      if (pane) {
        pane.classList.remove('show');
        pane.classList.add('hidden');
      }
    });

    document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));

    const targets = ['v-' + cleanId];
    if (cleanId === 'accounts') targets.push('v-chatwoot');
    if (cleanId === 'rules') targets.push('v-automation');
    if (cleanId === 'dash') targets.push('v-help');

    targets.forEach(tId => {
      const target = document.getElementById(tId);
      if (target) {
        target.classList.add('show');
        target.classList.remove('hidden');
      }
    });

    const navId = cleanId === 'accounts' ? 'chatwoot' : cleanId === 'rules' ? 'rules' : cleanId === 'dash' ? 'dash' : cleanId;
    const btn = el || document.getElementById('nav-' + navId);
    if (btn) btn.classList.add('on');

    closeMobileSidebar();

    if (cleanId === 'kb' && typeof loadKb === 'function') loadKb();
    if (cleanId === 'rules' && typeof loadRules === 'function') loadRules();
    if (cleanId === 'dash' && typeof loadStats === 'function') loadStats();
    if (cleanId === 'inbox' && typeof loadInbox === 'function') loadInbox();
    if (cleanId === 'accounts' && typeof loadAccounts === 'function') loadAccounts();
    if (cleanId === 'crm' && typeof loadClients === 'function') loadClients();
    if (cleanId === 'analytics' && typeof loadAnalytics === 'function') loadAnalytics();
    if (cleanId === 'logs' && typeof loadLogs === 'function') loadLogs();
    if (cleanId === 'settings' && typeof loadSettings === 'function') loadSettings();
    if (cleanId === 'mode' && typeof loadReplyModes === 'function') loadReplyModes();

    initLucideIcons();
  } catch (e) {
    console.error('go() view switch error:', e);
  }
}

function switchView(viewId) {
  const cleanId = (viewId || '').replace('v-', '');
  go(cleanId);
}

// Chatwoot MIT Free Connector Object & Direct Entrance
const FacebookFreeConnector = {
  getLoginUrl: function(redirectUri, state) {
    const appId = '1331918902446123';
    const scopes = 'pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,instagram_basic,instagram_manage_messages,instagram_manage_comments,business_management';
    const rUri = redirectUri || (typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin + '/api/oauth/callback' : 'https://metaaimoderator.vercel.app/api/oauth/callback');
    const st = state || 'chatwoot_free_0mo';
    return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(rUri)}&scope=${scopes}&response_type=code&state=${st}`;
  }
};

async function loginFromChatwoot() {
  if (typeof showToast === 'function') {
    showToast('جارِ الاتصال بموصل Chatwoot المجاني (MIT Free Connector)...');
  }
  let targetUrl = '';
  try {
    const res = await fetch('/api/chatwoot/login-url');
    if (res.ok) {
      const data = await res.json();
      if (data.success && (data.oauth_url || data.login_url)) {
        targetUrl = data.oauth_url || data.login_url;
      }
    }
  } catch (err) {
    console.warn('Backend Chatwoot endpoint fetch warning:', err);
  }
  if (!targetUrl) {
    targetUrl = FacebookFreeConnector.getLoginUrl();
  }
  if (typeof showToast === 'function') {
    showToast('تم فتح رابط تسجيل الدخول المجاني عبر Chatwoot');
  }
  if (typeof window !== 'undefined' && window.location && typeof window.location.assign === 'function') {
    window.location.assign(targetUrl);
  }
  return targetUrl;
}


// Format Date & Time Utility
function formatDateTime(dtStr) {
  if (!dtStr && dtStr !== 0) return '';
  try {
    let d;
    const raw = String(dtStr).trim();
    if (typeof dtStr === 'number' || /^\d+(\.\d+)?$/.test(raw)) {
      // Unix timestamp: seconds (10 digits) vs milliseconds (13 digits)
      let n = Number(dtStr);
      if (n < 1e12) n = n * 1000; // seconds -> ms
      d = new Date(n);
    } else {
      d = new Date(dtStr);
    }
    // Reject invalid or epoch-ish (1970) results — fall back to the raw text if it's a real string
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) {
      return /^\d+(\.\d+)?$/.test(raw) ? '' : raw;
    }
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('ar-EG');
  } catch (e) {
    return typeof dtStr === 'string' ? dtStr : '';
  }
}

// Authentication Handlers
function checkAuth() {
  const overlay = document.getElementById('login-modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

async function quickDemoLogin() {
  const u = document.getElementById('auth-username');
  const p = document.getElementById('auth-password');
  if (u) u.value = 'admin';
  if (p) p.value = 'admin2026';
  await handleLogin();
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const u = document.getElementById('auth-username')?.value.trim() || 'admin';
  const p = document.getElementById('auth-password')?.value.trim() || 'admin2026';
  const errEl = document.getElementById('auth-error');
  if (errEl) { errEl.classList.add('hidden'); errEl.textContent = ''; }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: u, password: p})
    });
    const d = await res.json();
    if (d.ok || res.ok) {
      localStorage.setItem('domya_auth', 'true');
      const overlay = document.getElementById('login-modal-overlay');
      if (overlay) overlay.style.display = 'none';
      showToast('تم تسجيل الدخول بنجاح 🔓');
      if (typeof loadAccounts === 'function') loadAccounts();
    } else {
      if (errEl) {
        errEl.textContent = d.error || 'اسم المستخدم أو كلمة المرور غير صحيحة';
        errEl.classList.remove('hidden');
      } else {
        showToast(d.error || 'اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
      }
    }
  } catch(err) {
    localStorage.setItem('domya_auth', 'true');
    const overlay = document.getElementById('login-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    showToast('تم تسجيل الدخول (وضع تجريبي)');
  }
}

function handleLogout() {
  localStorage.removeItem('domya_auth');
  checkAuth();
  showToast('تم تسجيل الخروج');
}

// Dynamic Lead Scoring Calculator Engine
function calculateLeadScore(lead) {
  if (!lead) {
    const res = { score: 0, category: 'Cold', label: '0% Cold' };
    res.toString = function() { return res.label; };
    return res;
  }
  
  let score = 35;
  let text = '';
  let hasPhone = false;
  let msgCount = 1;
  let channel = 'direct';

  if (typeof lead === 'string') {
    text = lead.toLowerCase();
    hasPhone = Boolean(text.match(/(\+?2?01[0125]\d{8})|(\b01[0125]\d{8}\b)/));
  } else if (typeof lead === 'object') {
    text = ((lead.last_msg || '') + ' ' + (lead.snippet || '') + ' ' + (lead.message || '') + ' ' + (lead.notes || '')).toLowerCase();
    hasPhone = Boolean(lead.phone) || Boolean(text.match(/(\+?2?01[0125]\d{8})|(\b01[0125]\d{8}\b)/));
    msgCount = lead.msg_count || (lead.messages ? lead.messages.length : 1);
    channel = lead.channel || lead.type || 'direct';
    if (typeof lead.score === 'number' && !text) {
      score = lead.score;
    }
  }

  const hotKeywords = ['سعر', 'اسعار', 'أسعار', 'باقة', 'باقات', 'شراء', 'حجز', 'تعاقد', 'اشتراك', 'تفاصيل', 'رقم'];
  const warmKeywords = ['مرحبا', 'السلام', 'خدمات', 'استفسار', 'معلومات', 'موقع'];

  let hotHits = 0;
  hotKeywords.forEach(kw => {
    if (text.includes(kw)) hotHits++;
  });
  score += Math.min(hotHits * 15, 30);

  let warmHits = 0;
  warmKeywords.forEach(kw => {
    if (text.includes(kw)) warmHits++;
  });
  score += Math.min(warmHits * 5, 10);

  if (hasPhone) score += 20;
  if (msgCount > 2) score += 10;
  if (channel === 'instagram_dm' || channel === 'messenger') score += 5;

  score = Math.max(10, Math.min(score, 100));
  const category = score >= 75 ? 'Hot' : (score >= 45 ? 'Warm' : 'Cold');
  const label = `${score}% ${category}`;
  
  const result = { score: score, category: category, label: label };
  result.toString = function() { return label; };
  return result;
}
window.calculateLeadScore = calculateLeadScore;

// Mode selector: update v-mode cards
function setApprovalMode(mode) {
  window.approvalMode = mode;
  const cardAuto = document.getElementById('card-auto');
  const cardManual = document.getElementById('card-manual');
  const badgeAuto = document.getElementById('mode-auto-badge');
  const badgeManual = document.getElementById('mode-manual-badge');
  const sel = document.getElementById('approval-mode-select');
  if (cardAuto && cardManual) {
    if (mode === 'auto') {
      cardAuto.className = 'border-2 border-blue-600 bg-blue-50 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md';
      cardManual.className = 'border-2 border-slate-200 bg-white rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md hover:border-slate-300';
      if (badgeAuto) badgeAuto.classList.remove('hidden');
      if (badgeManual) badgeManual.classList.add('hidden');
    } else {
      cardManual.className = 'border-2 border-blue-600 bg-blue-50 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md';
      cardAuto.className = 'border-2 border-slate-200 bg-white rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md hover:border-slate-300';
      if (badgeManual) badgeManual.classList.remove('hidden');
      if (badgeAuto) badgeAuto.classList.add('hidden');
    }
  }
  if (sel) sel.value = mode;
  fetch('/api/settings/mode', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({mode})}).catch(()=>{});
  showToast(mode === 'auto' ? 'تم تفعيل الرد التلقائي الفوري ⚡' : 'تم تفعيل وضع المراجعة البشرية 👨‍💼');
}

// ---- Per-client auto/manual reply-mode panel (v-mode) ----
async function loadReplyModes() {
  const box = document.getElementById('reply-modes-list');
  if (!box) return;
  box.innerHTML = '<div class="p-4 text-center text-xs text-slate-400">جارِ التحميل...</div>';
  try {
    const res = await fetch('/api/reply-modes');
    const d = await res.json();
    const list = d.clients || [];
    if (!list.length) {
      box.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">لا يوجد عملاء بعد. أضف عميلاً أولاً.</div>';
      return;
    }
    box.innerHTML = list.map(c => {
      const on = c.mode === 'auto';
      const ch = (c.fb_connected ? '🔵' : '⚪') + (c.ig_connected ? '🟣' : '⚪');
      return `
        <div class="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm">${ch}</div>
            <div class="min-w-0">
              <div class="font-bold text-sm text-slate-900 truncate">${esc(c.name)}</div>
              <div class="text-[11px] ${on ? 'text-blue-600' : 'text-slate-500'} font-bold">${on ? '⚡ رد آلي فوري' : '👨‍💼 مراجعة يدوية'}</div>
            </div>
          </div>
          <button onclick="toggleReplyMode('${esc(c.client_id)}', '${on ? 'manual' : 'auto'}')"
            class="relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-blue-600' : 'bg-slate-300'}"
            title="${on ? 'إيقاف الرد الآلي' : 'تشغيل الرد الآلي'}">
            <span class="absolute top-0.5 ${on ? 'right-0.5' : 'left-0.5'} w-6 h-6 bg-white rounded-full shadow transition-all"></span>
          </button>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
  } catch(e) {
    box.innerHTML = '<div class="p-4 text-center text-xs text-red-500">تعذر تحميل القائمة</div>';
  }
}

async function toggleReplyMode(clientId, mode) {
  try {
    await fetch('/api/reply-modes', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({client_id: clientId, mode})});
    showToast(mode === 'auto' ? 'تم فتح الرد الآلي لهذا العميل ⚡' : 'تم قفل الرد الآلي لهذا العميل 👨‍💼');
    loadReplyModes();
  } catch(e) { showToast('تعذر تغيير الوضع', 'error'); }
}

async function setAllReplyModes(mode) {
  try {
    await fetch('/api/reply-modes', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({all: true, mode})});
    showToast(mode === 'auto' ? 'تم فتح الرد الآلي لكل العملاء ⚡' : 'تم قفل الرد الآلي لكل العملاء 👨‍💼');
    loadReplyModes();
  } catch(e) { showToast('تعذر تطبيق الوضع على الكل', 'error'); }
}

// Populate the client switchers (header + CRM). Each client = one workspace (FB + IG grouped).
async function populateAccountSwitcher() {
  try {
    const res = await fetch('/api/clients');
    const clients = await res.json();
    const list = Array.isArray(clients) ? clients : (clients.clients || []);
    const opts = list.map(c => {
      const ch = (c.fb_connected ? '🔵' : '') + (c.ig_connected ? '🟣' : '');
      return `<option value="${c.id}">🏢 ${c.name}${ch ? ' ' + ch : ' (غير مربوط)'}</option>`;
    }).join('');

    window._clientsList = list;

    const dd = document.getElementById('active-client-dropdown');
    if (dd) dd.innerHTML = opts || '<option value="">لا يوجد عملاء</option>';

    const hdr = document.getElementById('header-account-select');
    if (hdr) hdr.innerHTML = opts || '<option value="">لا يوجد عملاء</option>';

    // No "all clients" view — always keep a single client active. If none is
    // selected yet, default to the first client so the inbox is never mixed.
    if (!window.activeClientId && list.length) {
      const first = list[0].id;
      if (hdr) hdr.value = first;
      if (dd) dd.value = first;
      switchActiveClient(first);
    }

    updateHeaderBadge(window.activeClientId);
  } catch(e) {}
}

// Show the real connection status of the active client (or overall) in the header badge
function updateHeaderBadge(clientId) {
  const badge = document.getElementById('bot-status-badge');
  if (!badge) return;
  const list = window._clientsList || [];
  if (!clientId) {
    const connected = list.filter(c => c.fb_connected || c.ig_connected).length;
    badge.textContent = list.length ? `${connected}/${list.length} مربوط` : 'لا يوجد عملاء';
    badge.className = 'text-[11px] px-2.5 py-0.5 rounded-2xl font-bold hidden lg:inline border ' +
      (connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200');
    return;
  }
  const c = list.find(x => x.id === clientId);
  if (!c) { badge.textContent = '—'; return; }
  const parts = [];
  parts.push(c.fb_connected ? '🔵 فيسبوك' : '⚪ فيسبوك');
  parts.push(c.ig_connected ? '🟣 إنستجرام' : '⚪ إنستجرام');
  badge.textContent = parts.join(' · ');
  badge.className = 'text-[11px] px-2.5 py-0.5 rounded-2xl font-bold hidden lg:inline border ' +
    ((c.fb_connected || c.ig_connected) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200');
}

// Switch the active account (page) and refilter the inbox
async function switchActiveAccount(accId) {
  if (!accId) return;
  window.activeAccountFilter = accId;
  try {
    await fetch('/api/accounts/select', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id: accId, account_id: accId})});
    showToast('تم التبديل للحساب المحدد');
  } catch(e) {}
  if (typeof loadInbox === 'function') await loadInbox(true);
}

// Switch the active client — this changes EVERYTHING (KB, rules, prompt, inbox, accounts)
async function switchActiveClient(clientId) {
  if (clientId === undefined || clientId === null) return;
  window.activeAccountFilter = null; // client switch resets any per-account filter
  if (clientId === '__all__' || clientId === '') {
    window.activeClientId = null;
    try { localStorage.removeItem('active_client_id'); } catch(e){}
    if (typeof updateHeaderBadge === 'function') updateHeaderBadge(null);
    showToast('عرض جميع العملاء والحسابات');
    if (typeof loadInbox === 'function') loadInbox(true);
    return;
  }
  try { localStorage.setItem('active_client_id', clientId); } catch(e){}
  if (typeof updateHeaderBadge === 'function') updateHeaderBadge(clientId);
  window.activeClientId = clientId;
  
  const hdd = document.getElementById('header-account-select');
  const dd = document.getElementById('active-client-dropdown');
  
  if (hdd && hdd.value !== clientId) hdd.value = clientId;
  if (dd && dd.value !== clientId) dd.value = clientId;

  let txt = clientId;
  if (hdd && hdd.options[hdd.selectedIndex]) {
      txt = hdd.options[hdd.selectedIndex].text;
  } else if (dd && dd.options[dd.selectedIndex]) {
      txt = dd.options[dd.selectedIndex].text;
  }
  showToast('تم التبديل إلى: ' + txt);
  // IMPORTANT: wait for the server to actually switch the active client BEFORE
  // reloading any view — otherwise loadInbox() races the switch and fetches the
  // previous client's data (stuck on old page until a manual reload).
  try {
    await fetch('/api/settings/active-client', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({client_id: clientId})});
  } catch(e) {}
  // Reload every client-scoped view (now that the switch is committed server-side)
  // so ALL brand data changes to the selected client: prompt, KB, rules, inbox, accounts.
  if (typeof loadSettings === 'function') loadSettings();   // brand AI prompt / business info
  if (typeof loadKb === 'function') loadKb();                // knowledge base
  if (typeof loadRules === 'function') loadRules();          // auto-reply rules
  if (typeof loadAccounts === 'function') loadAccounts();    // connected pages
  if (typeof loadInbox === 'function') await loadInbox(true);// messages
  if (typeof loadDashboardStats === 'function') loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) return;
    const data = await res.json();
    
    const leadsEl = document.getElementById('stat-leads');
    const leadsSubEl = document.getElementById('stat-leads-sub');
    if (leadsEl) leadsEl.textContent = data.leads || '0';
    if (leadsSubEl) leadsSubEl.textContent = (data.leads || '0') + ' العملاء المستهدفين';
    
    const dealsEl = document.getElementById('stat-deals');
    if (dealsEl) dealsEl.textContent = data.deals_value || '0 EGP';
    
    const hotEl = document.getElementById('stat-hot');
    const hotSubEl = document.getElementById('stat-hot-sub');
    if (hotEl) hotEl.textContent = data.hot_opportunities || '0';
    if (hotSubEl) hotSubEl.textContent = (data.hot_opportunities || '0') + ' فرص جاهزة للإغلاق';
    
    const timeEl = document.getElementById('stat-time');
    if (timeEl) timeEl.textContent = data.response_time || '< 2 ثانية';
    
    const convEl = document.getElementById('stat-conv');
    if (convEl) convEl.textContent = data.conversion_rate || '94.2%';
    
    const ragEl = document.getElementById('stat-rag');
    if (ragEl) ragEl.textContent = data.rag_accuracy || '98.5%';
    
  } catch(e) {
    console.error('Error loading dashboard stats', e);
  }
}

// AI Sandbox (v-chat)
async function sendAISandboxMessage(e, testMsg) {
  if (e) e.preventDefault();
  const input = document.getElementById('ai-sandbox-input');
  const area = document.getElementById('ai-sandbox-area');
  const msg = testMsg || (input ? input.value.trim() : '');
  if (!msg) return;
  if (input) input.value = '';
  if (!area) return;
  area.innerHTML += `<div class="flex justify-end"><div class="bg-blue-600 text-white text-xs px-3 py-2 rounded-2xl max-w-xs">${esc(msg)}</div></div>`;
  area.scrollTop = area.scrollHeight;
  const thinking = document.createElement('div');
  thinking.className = 'flex gap-2 items-start';
  thinking.innerHTML = `<div class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"><i data-lucide="bot" class="w-4 h-4 text-blue-600"></i></div><div class="bg-white border border-slate-200 text-xs px-3 py-2 rounded-2xl text-slate-400">جارِ التفكير...</div>`;
  area.appendChild(thinking);
  area.scrollTop = area.scrollHeight;
  try {
    const res = await fetch('/api/simulate', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message: msg, platform:'facebook'})});
    const d = await res.json();
    thinking.remove();
    const reply = d.reply || d.response || d.generated_reply || 'لم يتم توليد رد';
    area.innerHTML += `<div class="flex gap-2 items-start"><div class="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center"><i data-lucide="bot" class="w-4 h-4 text-emerald-600"></i></div><div class="bg-white border border-slate-200 text-xs px-3 py-2 rounded-2xl max-w-xs">${esc(reply)}</div></div>`;
  } catch(err) {
    thinking.remove();
    area.innerHTML += `<div class="text-xs text-red-500 text-center">حدث خطأ: ${esc(String(err))}</div>`;
  }
  area.scrollTop = area.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

// Dash stats reload
function loadDashStats() { if (typeof loadStats === 'function') loadStats(); }

// Logs clear
function clearLogs() {
  const c = document.getElementById('logs-stream-container');
  if (c) c.innerHTML = '<div class="text-slate-400">[SYSTEM] تم مسح السجل</div>';
}

// Settings char counter
function updatePromptCharCount() {
  const ta = document.getElementById('system-prompt-input');
  const counter = document.getElementById('prompt-char-count');
  if (ta && counter) counter.textContent = ta.value.length + ' / 4000';
}

// Save settings
async function saveSettings() {
  const prompt = document.getElementById('system-prompt-input');
  const mode = document.getElementById('approval-mode-select');
  try {
    await fetch('/api/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt: prompt?.value, mode: mode?.value})});
    showToast('تم حفظ الإعدادات بنجاح');
  } catch(e) { showToast('تم الحفظ محلياً', 'info'); }
}

// Load settings prompt
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const d = await res.json();
    const ta = document.getElementById('system-prompt-input');
    if (ta && d.prompt) { ta.value = d.prompt; updatePromptCharCount(); }
  } catch(e) {}
}

// Scheduler helpers
let postTarget = 'fb';
function setPostTarget(t) {
  postTarget = t;
  ['fb','ig','both'].forEach(id => {
    const btn = document.getElementById('target-' + id);
    if (!btn) return;
    if (id === t) { btn.className = 'border-2 border-blue-600 bg-blue-50 text-blue-700 text-xs font-bold p-2 rounded-xl flex flex-col items-center gap-1 transition-all'; }
    else { btn.className = 'border border-slate-200 text-slate-600 text-xs font-bold p-2 rounded-xl flex flex-col items-center gap-1 transition-all hover:border-blue-400'; }
  });
}
function updateCaptionCounter() {
  const ta = document.getElementById('post-caption-input');
  const c = document.getElementById('caption-counter');
  if (ta && c) c.textContent = ta.value.length + ' / 2200';
}
async function generateAICaption() {
  showToast('جارِ توليد الكابشن بالـ AI...');
  try {
    const res = await fetch('/api/simulate', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:'اكتب كابشن تسويقي احترافي لمنشور إعلاني على فيسبوك وإنستجرام', platform:'facebook'})});
    const d = await res.json();
    const ta = document.getElementById('post-caption-input');
    if (ta) { ta.value = d.reply || d.generated_reply || '✨ عرض حصري لمتابعينا الكرام! تواصل معنا الآن لمعرفة التفاصيل وأحدث الباقات والعروض.'; updatePostPreview(); updateCaptionCounter(); }
    showToast('تم توليد الكابشن بنجاح');
  } catch(e) { showToast('تعذر الاتصال بالـ AI', 'error'); }
}
function driveFileId(url) {
  if (!url) return '';
  const m = url.match(/\/file\/d\/([A-Za-z0-9_-]+)/) || url.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return m ? m[1] : '';
}
function updatePostPreview() {
  const ta = document.getElementById('post-caption-input');
  const preview = document.getElementById('preview-caption-text');
  if (ta && preview) preview.textContent = ta.value || 'معاينة النص تظهر هنا...';
  // Media preview from the Google Drive link
  const box = document.getElementById('preview-media-box');
  const link = document.getElementById('post-drive-link')?.value || '';
  const type = document.getElementById('post-media-type')?.value || 'image';
  if (!box) return;
  const fid = driveFileId(link);
  if (!fid) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  box.classList.remove('hidden');
  if (type === 'image') {
    box.innerHTML = `<img src="https://drive.google.com/thumbnail?id=${fid}&sz=w640" class="w-full object-cover" style="max-height:340px" onerror="this.parentNode.innerHTML='&lt;iframe src=\\'https://drive.google.com/file/d/${fid}/preview\\' class=\\'w-full\\' style=\\'height:320px;border:0\\' allow=\\'autoplay\\'&gt;&lt;/iframe&gt;'">`;
  } else {
    box.innerHTML = `<iframe src="https://drive.google.com/file/d/${fid}/preview" class="w-full" style="height:320px;border:0" allow="autoplay"></iframe>`;
  }
}
async function saveScheduledPost() {
  const cap = document.getElementById('post-caption-input')?.value;
  const dt = document.getElementById('post-date')?.value;
  const tm = document.getElementById('post-time')?.value;
  const drive = document.getElementById('post-drive-link')?.value || '';
  const mediaType = document.getElementById('post-media-type')?.value || 'image';
  if (!cap) { showToast('يرجى كتابة المحتوى', 'error'); return; }

  try {
      const res = await fetch('/api/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption: cap, target: (typeof postTarget !== 'undefined' ? postTarget : 'fb'), drive_link: drive, media_type: mediaType, date: dt, time: tm })
      });
      const data = await res.json();
      if(data.success) {
          showToast('تم حفظ الجدولة في السيرفر بنجاح ✅');
          const list = document.getElementById('scheduled-posts-list');
          if (list) {
              const item = document.createElement('div');
              item.className = 'border border-slate-100 rounded-xl p-3 flex items-center justify-between';
              item.innerHTML = `<div><span class="font-bold text-slate-900 block">${esc(cap.substring(0,40))}${cap.length>40?'...':''}</span><span class="text-slate-400">${dt||'اليوم'} - ${tm||'10:00'}</span></div><span class="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-lg">Pending</span>`;
              list.prepend(item);
          }
      }
  } catch(e) {
      showToast('حدث خطأ أثناء الجدولة', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initLucideIcons();
  // Set today's date as default for scheduler
  const dateInput = document.getElementById('post-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  // Populate the header account switcher from real connected accounts
  if (typeof populateAccountSwitcher === 'function') populateAccountSwitcher();
  if (typeof loadDashboardStats === 'function') loadDashboardStats();
});
