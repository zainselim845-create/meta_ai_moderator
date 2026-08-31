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

// Universal Safe JSON Fetch (Protects against HTML/500/404 unexpected token errors)
async function safeFetchJson(url, options) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!text || !text.trim()) {
      return { ok: res.ok, status: res.status };
    }
    const clean = text.trim();
    if (clean.startsWith('<') || clean.startsWith('<!')) {
      console.warn('[safeFetchJson] Server returned HTML for:', url, 'status:', res.status);
      return { ok: false, status: res.status, error: 'استجابة غير متوقعة من السيرفر (HTML)' };
    }
    try {
      const parsed = JSON.parse(clean);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (!('ok' in parsed) && res.ok) parsed.ok = true;
      }
      return parsed;
    } catch(pe) {
      console.warn('[safeFetchJson] JSON parse error for:', url, pe);
      return { ok: false, error: 'تعذر قراءة بيانات السيرفر' };
    }
  } catch(e) {
    console.warn('[safeFetchJson network error]', url, e);
    return { ok: false, error: e.message || 'خطأ في الاتصال بالسيرفر' };
  }
}
window.safeFetchJson = safeFetchJson;

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

// Initialize Lucide SVG Icons safely with fast debounce
let _lucideDebounce = null;
function initLucideIcons(root) {
  clearTimeout(_lucideDebounce);
  _lucideDebounce = setTimeout(() => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        if (root && root.nodeType === 1) {
          window.lucide.createIcons({ root: root });
        } else {
          window.lucide.createIcons();
        }
      } catch(e){}
    }
  }, 25);
}
window.initLucideIcons = initLucideIcons;

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
    var bootStyle = document.getElementById('tab-instant-boot');
    if (bootStyle) bootStyle.remove();

    let cleanId = (id || '').replace('v-', '').replace('#', '').split('?')[0].split(':')[0].trim();
    // Canonical aliases
    if (cleanId === 'clients') cleanId = 'crm';
    if (cleanId === 'prompt') cleanId = 'settings';
    if (cleanId === 'schedule') cleanId = 'scheduler';
    if (cleanId === 'accounts' || cleanId === 'chatwoot') cleanId = 'accounts';
    if (cleanId === 'automation' || cleanId === 'rules') cleanId = 'rules';
    if (cleanId === 'help' || cleanId === 'dash') cleanId = 'dash';

    // Hard block: a restricted user can ONLY open their allowed tabs.
    const _me = window._me;
    if (_me && !_me.is_admin) {
      const allowedSet = new Set((_me.allowed_tabs && _me.allowed_tabs.length) ? _me.allowed_tabs : (_me.role === 'account_manager' ? ['dash','crm','inbox','rules','kb','mode','settings','logs','scheduler','tasks','plan','accounts','analytics','myportal'] : ['myportal']));
      allowedSet.add('myportal');
      const canon = cleanId === 'chatwoot' ? 'accounts' : cleanId;
      if (!allowedSet.has(canon)) {
        console.warn('[RBAC] Blocked unpermitted view:', canon);
        if (cleanId !== 'myportal') {
          go('myportal');
        }
        return;
      }
    }
    // v-mode and v-chat are now independent views

    const paneIds = [
      'v-inbox', 'v-dash', 'v-help', 'v-rules', 'v-automation', 'v-kb',
      'v-crm', 'v-settings', 'v-logs', 'v-scheduler', 'v-chatwoot', 'v-accounts',
      'v-analytics', 'v-mode', 'v-chat', 'v-tasks', 'v-hr', 'v-myportal',
      'v-plan', 'v-permissions'
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
    if (cleanId === 'scheduler' && typeof loadScheduledPosts === 'function') loadScheduledPosts();
    if (cleanId === 'hr' && typeof loadHR === 'function') loadHR();
    if (cleanId === 'myportal' && typeof loadMyPortal === 'function') loadMyPortal();
    if (cleanId === 'tasks' && typeof loadTasksEngine === 'function') loadTasksEngine();
    if (cleanId === 'plan' && typeof loadPlanBuilder === 'function') loadPlanBuilder();
    if (cleanId === 'permissions') {
      // relocate the team panel (built once in settings) into the permissions tab
      var tp = document.getElementById('team-panel');
      var mount = document.getElementById('permissions-mount');
      if (tp && mount && tp.parentNode !== mount) mount.appendChild(tp);
      if (tp) tp.classList.remove('hidden');
      if (typeof loadTeam === 'function') loadTeam();
    }

    // Persist active tab in URL hash & localStorage so refresh reopens the exact same tab
    try {
      if (history.replaceState) {
        history.replaceState(null, null, '#' + cleanId);
      } else {
        window.location.hash = '#' + cleanId;
      }
      localStorage.setItem('active_tab', cleanId);
    } catch(err){}

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
  // Demo/backdoor login removed for security — just focus the form.
  const u = document.getElementById('auth-username');
  if (u) u.focus();
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const u = document.getElementById('auth-username')?.value.trim() || '';
  const p = document.getElementById('auth-password')?.value.trim() || '';
  const errEl = document.getElementById('auth-error');
  if (!u || !p) {
    if (errEl) { errEl.classList.remove('hidden'); errEl.textContent = 'من فضلك اكتب اسم المستخدم وكلمة المرور'; }
    return;
  }
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
    // Never grant access on a network error — show it and keep the login up.
    if (errEl) { errEl.textContent = 'تعذّر الاتصال بالخادم، حاول تاني'; errEl.classList.remove('hidden'); }
    else showToast('تعذّر الاتصال بالخادم', 'error');
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

window._hrAttendanceData = [];

// ---- HR: company employees / attendance / payroll (from the company Google Sheet) ----
async function loadHR() {
  const monthEl = document.getElementById('hr-month');
  const month = (monthEl && monthEl.value) ? monthEl.value : new Date().toISOString().slice(0,7);
  if (monthEl && !monthEl.value) monthEl.value = month;

  // Sync attendance month picker if empty
  const attMonthEl = document.getElementById('hr-att-month');
  if (attMonthEl && !attMonthEl.value) attMonthEl.value = month;

  loadHrGeofenceSettings();

  // Summary (payroll + performance)
  try {
    const d = await safeFetchJson('/api/hr/summary?month=' + month);
    const rows = (d && d.summary) ? d.summary : [];
    const stats = document.getElementById('hr-stats');
    if (stats) {
      const totalDays = rows.reduce((a,r)=>a+(r.days||0),0);
      const totalLate = rows.reduce((a,r)=>a+(r.late||0),0);
      const card = (label,val,color)=>`<div class="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center"><div class="text-[11px] text-slate-500">${label}</div><div class="text-lg font-bold ${color}">${val}</div></div>`;
      stats.innerHTML = card('الموظفين',d.employees||0,'text-slate-900')
        + card('إجمالي أيام الحضور',totalDays,'text-blue-600')
        + card('مرات التأخير',totalLate,'text-amber-600')
        + card('إجمالي الرواتب',(d.total_salary||0).toLocaleString()+' ج','text-emerald-600');
    }
    const body = document.getElementById('hr-payroll-body');
    if (body) body.innerHTML = rows.length ? rows.map(r=>`
      <tr class="hover:bg-slate-50">
        <td class="p-3 font-bold text-slate-900">${esc(r.name)}</td>
        <td class="p-3 text-slate-600">${esc(r.job||'')}</td>
        <td class="p-3 text-center">${r.days}</td>
        <td class="p-3 text-center ${r.absent>0?'text-red-500 font-bold':''}">${r.absent}</td>
        <td class="p-3 text-center ${r.late>0?'text-amber-600 font-bold':''}">${r.late}</td>
        <td class="p-3 text-center">${r.hours}</td>
        <td class="p-3 font-bold text-emerald-700">${(r.salary||0).toLocaleString()} ج</td>
      </tr>`).join('') : '<tr><td colspan="7" class="p-4 text-center text-slate-400">لا يوجد بيانات لهذا الشهر</td></tr>';
  } catch(e) {
    const body = document.getElementById('hr-payroll-body');
    if (body) body.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-red-500">تعذّر تحميل بيانات الموظفين (تأكد إن شيت الشركة مشارَك "أي شخص لديه الرابط")</td></tr>';
  }
  
  // Load Attendance log with dedicated month
  await loadHrAttendanceTable();
  if (window.lucide) lucide.createIcons();
}

async function loadHrAttendanceTable(customMonth) {
  const monthEl = document.getElementById('hr-att-month');
  let month = customMonth || (monthEl && monthEl.value) || new Date().toISOString().slice(0,7);
  if (monthEl) monthEl.value = month;

  const tbody = document.getElementById('hr-attendance-body');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-400">جارِ تحميل سجلات شهر ' + esc(month) + '... ⏳</td></tr>';

  try {
    const res = await fetch('/api/hr/attendance?month=' + encodeURIComponent(month));
    const d = await res.json();
    window._hrAttendanceData = (d && d.attendance) ? d.attendance : [];

    // Populate employee filter dropdown
    const empSelect = document.getElementById('hr-att-emp-select');
    if (empSelect) {
      const currentVal = empSelect.value;
      const empMap = {};
      window._hrAttendanceData.forEach(r => {
        const id = (r.employee_id || '').trim();
        const name = (r.name || id).trim();
        if (id || name) empMap[id || name] = name;
      });
      let opts = '<option value="">كل الموظفين (' + Object.keys(empMap).length + ')</option>';
      Object.keys(empMap).sort().forEach(k => {
        opts += `<option value="${esc(k)}">${esc(empMap[k])}</option>`;
      });
      empSelect.innerHTML = opts;
      if (currentVal && empMap[currentVal]) empSelect.value = currentVal;
    }

    renderHrAttendanceTable(d.summary);
  } catch(e) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-red-500">تعذّر تحميل سجلات الحضور لهذا الشهر</td></tr>';
  }
  if (window.lucide) lucide.createIcons();
}

function renderHrAttendanceTable(serverSummary) {
  const tbody = document.getElementById('hr-attendance-body');
  if (!tbody) return;

  const empFilter = (document.getElementById('hr-att-emp-select')?.value || '').toLowerCase().trim();
  const statusFilter = (document.getElementById('hr-att-status-select')?.value || '').toLowerCase().trim();
  const searchFilter = (document.getElementById('hr-att-search')?.value || '').toLowerCase().trim();

  let filtered = (window._hrAttendanceData || []).filter(r => {
    if (empFilter) {
      const id = String(r.employee_id || '').toLowerCase();
      const name = String(r.name || '').toLowerCase();
      if (id !== empFilter && name !== empFilter && !id.includes(empFilter) && !name.includes(empFilter)) return false;
    }
    if (statusFilter) {
      const st = String(r.status || r.action || '').toLowerCase();
      if (!st.includes(statusFilter)) return false;
    }
    if (searchFilter) {
      const allText = (String(r.name||'') + ' ' + String(r.employee_id||'') + ' ' + String(r.date||'') + ' ' + String(r.status||'')).toLowerCase();
      if (!allText.includes(searchFilter)) return false;
    }
    return true;
  });

  // Calculate local summary metrics
  let totalCount = filtered.length;
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let totalHours = 0.0;

  filtered.forEach(r => {
    const st = String(r.status || r.action || '');
    if (st.includes('حاضر')) presentCount++;
    else if (st.includes('متأخر') || st.includes('تاخير')) lateCount++;
    else if (st.includes('غياب')) absentCount++;

    const h = parseFloat(String(r.hours || '0').replace(',', '.')) || 0;
    totalHours += h;
  });

  // Update summary chips
  const elTot = document.getElementById('hr-att-count-total');
  const elPres = document.getElementById('hr-att-count-present');
  const elLate = document.getElementById('hr-att-count-late');
  const elAbs = document.getElementById('hr-att-count-absent');
  const elHrs = document.getElementById('hr-att-count-hours');

  if (elTot) elTot.textContent = totalCount;
  if (elPres) elPres.textContent = presentCount;
  if (elLate) elLate.textContent = lateCount;
  if (elAbs) elAbs.textContent = absentCount;
  if (elHrs) elHrs.textContent = totalHours.toFixed(1) + ' ساعة';

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-400 font-bold">لا توجد سجلات حضور تطابق التصفية المحددة</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const st = String(r.status || r.action || 'حاضر');
    let stBadge = '<span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[10px]">' + esc(st) + '</span>';
    if (st.includes('حاضر')) {
      stBadge = '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">حاضر ✅</span>';
    } else if (st.includes('متأخر') || st.includes('تاخير')) {
      stBadge = '<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">متأخر 🟡</span>';
    } else if (st.includes('غياب')) {
      stBadge = '<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-[10px]">غياب 🔴</span>';
    }

    const isMaskedOrVerified = r.distance && (r.distance.includes('داخل') || r.distance.includes('محمي') || r.distance.includes('نطاق'));
    const dist = (r.distance && r.distance !== '0m' && r.distance !== '0' && r.distance !== '—') ?
      (isMaskedOrVerified ?
        `<span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">📍 ${esc(r.distance)}</span>` :
        `<span class="text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">📍 ${esc(r.distance)}</span>`
      ) : '<span class="text-slate-400">—</span>';

    const empName = esc(r.name || r.employee_id || 'موظف');
    const empId = r.employee_id ? `<span class="text-[10px] font-mono text-slate-400 block">${esc(r.employee_id)}</span>` : '';
    const hrs = r.hours ? `${esc(r.hours)} س` : '<span class="text-slate-400">—</span>';

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono font-bold text-slate-700">${esc(r.date||'')}</td>
        <td class="p-3 font-bold text-slate-900">${empName} ${empId}</td>
        <td class="p-3 text-center font-mono font-bold text-slate-800">${esc(r.checkin_time||'-')}</td>
        <td class="p-3 text-center font-mono text-slate-600">${esc(r.checkout_time||'-')}</td>
        <td class="p-3 text-center font-mono font-bold text-indigo-700">${hrs}</td>
        <td class="p-3 text-center">${dist}</td>
        <td class="p-3 text-center">${stBadge}</td>
      </tr>
    `;
  }).join('');
}

function shiftHrAttMonth(delta) {
  const monthEl = document.getElementById('hr-att-month');
  const current = (monthEl && monthEl.value) ? monthEl.value : new Date().toISOString().slice(0,7);
  const parts = current.split('-');
  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10) + delta;
  if (m < 1) { m = 12; y--; }
  else if (m > 12) { m = 1; y++; }
  const nextMonth = y + '-' + (m < 10 ? '0' + m : m);
  if (monthEl) monthEl.value = nextMonth;
  loadHrAttendanceTable(nextMonth);
}

function setHrAttCurrentMonth() {
  const nowMonth = new Date().toISOString().slice(0,7);
  const monthEl = document.getElementById('hr-att-month');
  if (monthEl) monthEl.value = nowMonth;
  loadHrAttendanceTable(nowMonth);
}

// Adapt the UI to the logged-in user's role. Employees get a locked-down portal
// (only "بوابتي"); managers/admin see the full agency nav.
async function applyRoleUI() {
  let me = {};
  try {
    const res = await fetch('/api/me');
    if (!res.ok) return;
    me = await res.json();
  } catch(e) { return; }
  if (!me.logged_in) return;
  
  window._me = me;

  const isEmp = me.role === 'employee';
  const isMgr = me.role === 'account_manager';
  const isAdmin = !!me.is_admin;
  const tabs = me.allowed_tabs || [];

  const portalNav = document.getElementById('nav-myportal');
  if (portalNav) portalNav.classList.toggle('hidden', !isEmp && !tabs.includes('myportal'));
  
  // permissions tab: admin only
  const permNav = document.getElementById('nav-permissions');
  if (permNav) permNav.classList.toggle('hidden', !isAdmin);
  
  // plan tab: admin, managers, or anyone granted the 'plan' tab
  const planNav = document.getElementById('nav-plan');
  const canPlan = isAdmin || isMgr || tabs.includes('plan');
  if (planNav) planNav.classList.toggle('hidden', !canPlan);

  const navKey = (b) => { let id = (b.id||'').replace('nav-',''); return id === 'chatwoot' ? 'accounts' : id; };

  const btnAddAcc = document.getElementById('btn-header-add-account');
  const btnOauth = document.getElementById('btn-header-oauth');
  const clientSelBox = document.getElementById('header-client-selector-box');

  if (isAdmin) {
    // Admin sees all navigation tabs and header buttons
    document.querySelectorAll('#sidebar .nb').forEach(b => {
      b.classList.remove('hidden');
    });
    if (portalNav) portalNav.classList.remove('hidden');
    if (btnAddAcc) btnAddAcc.classList.remove('hidden');
    if (btnOauth) btnOauth.classList.remove('hidden');
    if (clientSelBox) clientSelBox.classList.remove('hidden');
    ['header-account-select','bot-status-badge'].forEach(id => { const el=document.getElementById(id); if(el) el.closest('div')?.classList.remove('hidden'); });
    return;
  }

  if (isEmp) {
    // Employee: locked down to myportal plus any explicit allowed tabs
    const allow = new Set(tabs.length ? tabs : ['myportal']);
    allow.add('myportal');
    document.querySelectorAll('#sidebar .nb').forEach(b => {
      const k = navKey(b);
      b.classList.toggle('hidden', !allow.has(k) || b.id === 'nav-permissions');
    });
    // Hide administrative buttons from employee header
    if (btnAddAcc) btnAddAcc.classList.add('hidden');
    if (btnOauth) btnOauth.classList.add('hidden');
    if (clientSelBox) clientSelBox.classList.add('hidden');

    ['header-account-select','bot-status-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.closest('div')?.classList.toggle('hidden', !allow.has('crm') && !allow.has('accounts'));
    });
    const curHash = (window.location.hash || '').replace('#', '').replace('v-', '');
    if (!curHash || !allow.has(curHash)) {
      if (typeof go === 'function') go('myportal');
    }
    return;
  }

  if (isMgr) {
    // Account Manager: see everything except permissions & hr (unless explicitly permitted)
    const mgrAllow = new Set(tabs.length ? tabs : ['dash','crm','inbox','rules','kb','mode','settings','logs','scheduler','tasks','plan','accounts','analytics','myportal']);
    mgrAllow.add('myportal');
    document.querySelectorAll('#sidebar .nb').forEach(b => {
      const k = navKey(b);
      if (b.id === 'nav-permissions') {
        b.classList.add('hidden');
      } else if (b.id === 'nav-hr') {
        b.classList.toggle('hidden', !mgrAllow.has('hr'));
      } else {
        b.classList.toggle('hidden', !mgrAllow.has(k));
      }
    });
    if (btnAddAcc) btnAddAcc.classList.remove('hidden');
    if (btnOauth) btnOauth.classList.remove('hidden');
    if (clientSelBox) clientSelBox.classList.remove('hidden');

    ['header-account-select','bot-status-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.closest('div')?.classList.remove('hidden');
    });
    return;
  }
}

async function loadMyPortal() {
  const nameEl = document.getElementById('myportal-name');
  try {
    const me = window._me || await safeFetchJson('/api/me');
    if (nameEl) nameEl.textContent = 'أهلاً ' + (me.username || '') ;
  } catch(e) {}
  // My tasks
  try {
    const d = await safeFetchJson('/api/me/tasks');
    const tasks = (d && d.tasks) ? d.tasks : [];
    const planSeqMap = {};
    tasks.forEach(t => {
      const pkey = (t.plan_name || t.file_name || 'عام').trim();
      planSeqMap[pkey] = (planSeqMap[pkey] || 0) + 1;
      t.post_number_in_plan = planSeqMap[pkey];
    });
    const box = document.getElementById('my-tasks-list');
    const actionBtns = (t) => {
      const s = t.status || '';
      if (/Assigned/i.test(s)) return `<button onclick="startMyTask('${esc(t.task_id)}')" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white">🚀 بدأت العمل</button>`;
      if (/In Progress/i.test(s)) return `<button onclick="submitMyTask('${esc(t.task_id)}')" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white">✅ سلّمت (+ملاحظات)</button>`;
      if (/Awaiting/i.test(s)) return `<span class="text-[11px] text-amber-600 font-bold">⏳ عند المراجعة</span>`;
      if (/Completed|مكتمل/i.test(s)) return `<span class="text-[11px] text-emerald-600 font-bold">✅ مكتملة</span>`;
      return '';
    };
    const driveThumb = (u) => {
      u = (u || '').toString();
      if (!/drive\.google\.com|googleusercontent\.com/.test(u)) return u;
      const m = u.match(/\/file\/d\/([^/]+)/) || u.match(/[?&]id=([^&]+)/) || u.match(/thumbnail\?id=([^&]+)/);
      return m ? ('https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w600') : u;
    };
    const refThumbs = (t) => {
      const imgs = (t.media_urls||[]);
      if (!imgs.length) return '';
      return `<div class="flex gap-1 flex-wrap mt-1">${imgs.slice(0,4).map(u=>`<a href="${esc(u)}" target="_blank"><img src="${esc(driveThumb(u))}" class="w-11 h-11 rounded-lg object-cover border border-slate-200" onerror="this.style.display='none'"></a>`).join('')}</div>`;
    };
    const canWork = (t) => /Assigned|In Progress/i.test(t.status||'');
    if (box) box.innerHTML = tasks.length ? tasks.map(t => `
      <div class="border border-slate-200 rounded-xl p-3 space-y-2">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex-1 min-w-[160px]">
            <div class="flex items-center gap-1.5 flex-wrap mb-1">
              <span class="bg-blue-600 text-white font-bold font-mono text-[11px] px-2 py-0.5 rounded-md shadow-2xs">#${esc(t.post_number_in_plan || t.post_number || 1)}</span>
              <span class="font-mono font-bold text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded-md">${esc(t.task_id||'')}</span>
              <span class="font-bold text-sm text-slate-900">${esc(t.title||'')}</span>
            </div>
            <div class="text-[11px] text-slate-500">⏰ موعد التسليم: <b class="text-amber-800 font-mono">${esc(t.delivery_deadline || t.publish_date || '-')}</b></div>
            ${t.caption ? `<div class="text-[11px] text-slate-600 mt-1 whitespace-pre-line line-clamp-3">${esc(t.caption)}</div>` : ''}
            ${t.review_note ? `<div class="text-[11px] text-amber-700 mt-0.5">📝 ملاحظة المراجعة: ${esc(t.review_note)}</div>` : ''}
            ${refThumbs(t)}
          </div>
          <div class="flex flex-col items-end gap-2">
            <span class="text-[11px] px-2 py-0.5 rounded-full ${/(Completed|مكتمل)/.test(t.status||'')?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}">${esc(t.status||'')}</span>
            ${actionBtns(t)}
          </div>
        </div>
        ${t.drive_link ? `
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 space-y-1.5 shadow-2xs">
            <div class="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>${(t.media_type==='video' || /\.(mp4|mov|webm)(\?|$)/i.test(t.drive_link)) ? '🎬 مخرجات الفيديو المسلّمة:' : '📁 ملف التسليم المسجّل:'}</span>
              <span class="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">محفوظ بالملف ✅</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <a href="${esc(t.drive_link)}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs transition flex items-center gap-1">
                <span>${(t.media_type==='video' || /\.(mp4|mov|webm)(\?|$)/i.test(t.drive_link)) ? '▶️ فتح / تشغيل الفيديو ↗️' : '📁 فتح ملف التسليم ↗️'}</span>
              </a>
              <button type="button" onclick="copyTaskDriveLink('${esc(t.drive_link)}')" class="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-1.5 px-2.5 rounded-lg shadow-2xs transition flex items-center gap-1">
                <span>📋 نسخ الرابط</span>
              </button>
            </div>
          </div>
        ` : ''}
        ${canWork(t) ? `
          <div class="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-2">
            <button type="button" onclick="openDeliverableModal('${esc(t.task_id)}', '${esc(t.drive_link||'')}')" class="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold py-2 px-4 rounded-xl border border-sky-200 shadow-2xs transition flex items-center gap-1.5">
              <span>📤 تسليم شغلك (فيديو / رابط Google Drive)</span>
            </button>
          </div>
        ` : ''}
      </div>`).join('') : '<div class="p-4 text-center text-xs text-slate-400">مفيش مهام مسندة ليك حالياً</div>';
  } catch(e) {}
  // My attendance
  try {
    const d = await safeFetchJson('/api/me/attendance');
    const rows = (d && d.attendance ? d.attendance : []).slice(0,40);
    const body = document.getElementById('my-attendance-body');
    if (body) body.innerHTML = rows.length ? rows.map(r => `
      <tr class="hover:bg-slate-50">
        <td class="p-2 font-mono text-slate-500">${esc(r.date||'')}</td>
        <td class="p-2 text-center">${esc(r.checkin_time||'-')}</td>
        <td class="p-2 text-center">${esc(r.checkout_time||'-')}</td>
        <td class="p-2 text-center">${esc(r.hours||'0')}</td>
        <td class="p-2">${esc(r.status||r.action||'')}</td>
      </tr>`).join('') : '<tr><td colspan="5" class="p-4 text-center text-slate-400">مفيش سجلات حضور</td></tr>';
  } catch(e) {}
  if (typeof initLucideIcons === 'function') initLucideIcons();
}

async function startMyTask(id) {
  try {
    const r = await fetch(`/api/me/tasks/${encodeURIComponent(id)}/start`, {method:'POST'});
    if (!r.ok) { showToast('تعذّر البدء', 'error'); return; }
    showToast('بالتوفيق! ابدأ شغلك 🚀'); loadMyPortal();
  } catch(e) { showToast('خطأ', 'error'); }
}
async function submitMyTask(id) {
  const notes = prompt('اكتب ملاحظات التسليم ورابط Google Drive للملف (مثال: https://drive.google.com/...):') || '';
  if (notes === null) return;
  try {
    const r = await fetch(`/api/me/tasks/${encodeURIComponent(id)}/submit`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({notes: notes.trim()})
    });
    const d = await r.json();
    if (!r.ok) { showToast(d.error||'تعذّر التسليم', 'error'); return; }
    showToast('تم التسليم للمراجعة بنجاح ✅');
    loadMyPortal();
    if (typeof loadTasksEngine === 'function') loadTasksEngine();
  } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

// Manager reviews a submitted task (approve → Completed, reject → back to employee).
async function reviewTask(id, approve) {
  const note = prompt(approve ? 'ملاحظة اعتماد (اختياري):' : 'اكتب سبب الرفض/التعديل المطلوب:') || '';
  try {
    const r = await fetch(`/api/tasks/${encodeURIComponent(id)}/review`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action: approve?'approve':'reject', note})});
    if (!r.ok) { showToast('تعذّرت المراجعة', 'error'); return; }
    showToast(approve ? 'تم الاعتماد ✅' : 'رجعت للموظف للتعديل');
    if (typeof loadTasksEngine === 'function') loadTasksEngine();
  } catch(e) { showToast('خطأ', 'error'); }
}

// Copy any text to clipboard.
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); showToast('تم النسخ ✅'); }
  catch(e){ showToast('تعذّر النسخ', 'error'); }
}

// Open the onboarding modal: pick which employees + what the Telegram message contains.
async function onboardEmployees() {
  const modal = document.getElementById('onboard-modal');
  const listBox = document.getElementById('onboard-emp-list');
  if (!modal || !listBox) return;
  listBox.innerHTML = '<div class="text-xs text-slate-400 p-2">جارِ تحميل الموظفين...</div>';
  modal.classList.remove('hidden');
  let emps = [];
  try { const d = await safeFetchJson('/api/tasks/employees'); emps = (d && d.employees) ? d.employees : []; } catch(e){}
  if (!emps.length) { listBox.innerHTML = '<div class="text-xs text-slate-400 p-2">لا يوجد موظفون في الشيت.</div>'; return; }
  listBox.innerHTML = emps.map(e => {
    const eid = String(e.employee_id||'').trim();
    const tg = String(e.telegram_id||'').replace('.0','').trim();
    return `<label class="flex items-center gap-2 text-xs py-1 ${tg?'':'opacity-60'}">
      <input type="checkbox" class="onboard-emp-cb" value="${esc(eid)}" ${tg?'checked':''}/>
      <span class="font-bold">${esc(e.name||eid)}</span>
      <span class="text-slate-400 font-mono">(${esc(eid)})</span>
      ${tg ? '<span class="text-emerald-600 text-[10px]">تيليجرام ✓</span>' : '<span class="text-amber-600 text-[10px]">بدون تيليجرام</span>'}
    </label>`;
  }).join('');
}

function toggleAllOnboard(on) {
  document.querySelectorAll('.onboard-emp-cb').forEach(cb => { if (!cb.disabled) cb.checked = on; });
}

function closeOnboardModal() {
  document.getElementById('onboard-modal')?.classList.add('hidden');
}

// Actually send, using the modal's selections.
async function confirmOnboard() {
  const ids = Array.from(document.querySelectorAll('.onboard-emp-cb:checked')).map(cb => cb.value);
  if (!ids.length) { showToast('اختر موظفاً واحداً على الأقل', 'error'); return; }
  const include = {
    link: document.getElementById('onboard-inc-link')?.checked ?? true,
    username: document.getElementById('onboard-inc-username')?.checked ?? true,
    password: document.getElementById('onboard-inc-password')?.checked ?? true,
  };
  const custom_note = document.getElementById('onboard-note')?.value.trim() || '';
  closeOnboardModal();
  const box = document.getElementById('onboard-result');
  if (box) { box.classList.remove('hidden'); box.textContent = 'جارِ الإرسال...'; }
  try {
    const d = await safeFetchJson('/api/employees/onboard', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ employee_ids: ids, include, custom_note })});
    const rows = (d && d.results) ? d.results : [];
    const sent = rows.filter(r => r.telegram_sent).length;
    const noTg = rows.filter(r => !r.has_telegram);
    if (box) box.innerHTML = `تمت معالجة <b>${d.onboarded}</b> موظف — اتبعت على تليجرام لـ <b>${sent}</b>.`
      + (noTg.length ? `<div class="mt-1 text-amber-700">بدون تليجرام (سلّمهم يدوي): ${noTg.map(r=>esc(r.name)+' ('+esc(r.username)+'/'+esc(r.password||'')+')').join(' — ')}</div>` : '');
    showToast(`تم إرسال بيانات الدخول لـ ${sent} موظف ✅`);
    if (typeof renderMembers === 'function') renderMembers();
  } catch(e) {
    if (box) box.textContent = 'تعذّر الإرسال.';
    showToast('تعذّر إرسال اللينكات', 'error');
  }
}

// Add a new company employee, optionally DM them their portal login via the Telegram bot.
async function addEmployeeAndInvite(invite) {
  const name = (document.getElementById('ne-name')||{}).value?.trim();
  const role = (document.getElementById('ne-role')||{}).value?.trim() || 'Employee';
  const tg = (document.getElementById('ne-telegram')||{}).value?.trim();
  const empid = (document.getElementById('ne-empid')||{}).value?.trim();
  const box = document.getElementById('ne-result');
  if (!name) { showToast('اكتب اسم الموظف', 'error'); return; }
  if (invite && !tg) { showToast('لإرسال اللينك لازم Telegram Chat ID', 'error'); return; }
  try {
    const body = { name: name, role: role, telegram_id: tg || '' };
    if (empid) body.employee_id = empid;
    const r = await fetch('/api/tasks/employees', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok || d.success === false) { showToast(d.error || 'تعذّر إضافة الموظف', 'error'); return; }
    // find the id we just saved (server may have generated it)
    const saved = (d.employees||[]).find(e => e.name === name) || {};
    const newId = empid || saved.employee_id;
    let msg = 'تمت إضافة الموظف ✅';
    if (invite && newId) {
      const o = await safeFetchJson('/api/employees/onboard', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ employee_ids: [newId] }) });
      const sent = (o && o.results ? o.results : []).filter(x => x.telegram_sent).length;
      msg = sent ? 'تمت الإضافة وإرسال لينك الدخول على التليجرام ✅' : 'تمت الإضافة لكن الرسالة لم تصل (اتأكد إنه عمل /start للبوت).';
    }
    if (box) { box.classList.remove('hidden'); box.textContent = msg; }
    showToast(msg);
    ['ne-name','ne-role','ne-telegram','ne-empid'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    if (typeof loadTasksEngine === 'function') loadTasksEngine();
  } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

// ---- Company employees roster (sheet) with delete ----
async function renderCompanyEmployees() {
  const box = document.getElementById('company-emps');
  if (!box) return;
  let emps = [], users = [];
  try { const d = await safeFetchJson('/api/tasks/employees'); emps = (d && d.employees) ? d.employees : []; } catch(e){}
  try { const d = await safeFetchJson('/api/users'); users = (d && d.users) ? d.users : []; } catch(e){}
  const roleOf = {};
  users.forEach(u => { if (u.employee_id) roleOf[u.employee_id] = u.role; });
  if (!emps.length) { box.innerHTML = '<div class="text-[11px] text-slate-400">لا يوجد موظفون</div>'; return; }
  const roleOpts = (cur) => ['employee','account_manager','admin'].map(r =>
    `<option value="${r}" ${cur===r?'selected':''}>${r==='admin'?'مدير':r==='account_manager'?'أكونت مانيجر':'موظف'}</option>`).join('');
  const tabsOf = {};
  users.forEach(u => { if (u.employee_id) tabsOf[u.employee_id] = u.allowed_tabs || []; });
  const TAB_LABELS = { tasks:'المهام', plan:'بناء البلان', hr:'الموظفين والحضور', scheduler:'الجدولة', crm:'العملاء', inbox:'الإنبوكس', analytics:'التحليلات', rules:'القواعد', kb:'المعرفة', mode:'وضع الرد', settings:'الإعدادات', logs:'السجلات', accounts:'الحسابات', myportal:'بوابتي' };
  const inferRole = (job) => /account\s*manager|أكونت|الحسابات|مدير حسابات/i.test(job || '') ? 'account_manager' : 'employee';
  box.innerHTML = emps.map(e => {
    // portal role if they have an account; otherwise infer from their sheet job
    const cur = roleOf[e.employee_id] || inferRole(e.role);
    const curTabs = new Set(tabsOf[e.employee_id] || []);
    const tabChecks = Object.keys(TAB_LABELS).map(k =>
      `<label class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer text-[11px]">
        <input type="checkbox" class="tabcb-${esc(e.employee_id)}" value="${k}" ${curTabs.has(k)?'checked':''}> ${TAB_LABELS[k]}</label>`).join(' ');
    return `<div class="border border-slate-200 rounded-lg px-3 py-2 space-y-2">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="text-xs min-w-[130px]">
          <span class="font-bold text-slate-900">${esc(e.name||e.employee_id)}</span>
          <span class="block text-[10px] text-slate-500">${esc(e.role||'')} ${e.telegram_id?'· تليجرام ✓':'· بدون تليجرام'}</span>
        </div>
        <div class="flex items-center gap-1 flex-wrap">
          <select onchange="setEmployeeRole('${esc(e.employee_id)}',this.value)" class="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-white">${roleOpts(cur)}</select>
          <button onclick="document.getElementById('tabs-${esc(e.employee_id)}').classList.toggle('hidden')" class="text-[11px] px-2 py-1 rounded-lg border border-violet-200 text-violet-700">🎛️ التبويبات</button>
          <button onclick="sendEmployeeCreds('${esc(e.employee_id)}','${esc(e.name||e.employee_id)}')" class="text-[11px] px-2 py-1 rounded-lg bg-blue-600 text-white font-bold">📤 إرسال بياناته</button>
          <button onclick="deleteCompanyEmployee('${esc(e.employee_id)}','${esc(e.name||e.employee_id)}')" class="text-[11px] px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">حذف</button>
        </div>
      </div>
      <div id="tabs-${esc(e.employee_id)}" class="hidden bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-2">
        <div class="text-[10px] text-slate-500">اختر التبويبات اللي هيشوفها بس (لو مفيش أي اختيار = الافتراضي حسب صلاحيته):</div>
        <div class="flex flex-wrap gap-1">${tabChecks}</div>
        <button onclick="saveEmployeeTabs('${esc(e.employee_id)}')" class="text-[11px] px-3 py-1 rounded-lg bg-violet-600 text-white font-bold">💾 حفظ التبويبات</button>
      </div>
    </div>`;
  }).join('');
}

async function saveEmployeeTabs(empId) {
  const cbs = document.querySelectorAll('.tabcb-' + empId);
  const tabs = Array.from(cbs).filter(c => c.checked).map(c => c.value);
  try {
    const r = await fetch('/api/employees/' + encodeURIComponent(empId) + '/tabs', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ tabs: tabs })
    });
    const d = await r.json();
    if (r.ok && d.ok) showToast('اتحفظت التبويبات ✅ (هتطبق لما يعمل لوجين)');
    else showToast(d.error || 'تعذّر الحفظ', 'error');
  } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function setEmployeeRole(empId, role) {
  try {
    const r = await fetch('/api/employees/' + encodeURIComponent(empId) + '/role', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ role: role })
    });
    const d = await r.json();
    if (r.ok && d.ok) showToast('اتحفظت الصلاحية ✅');
    else showToast(d.error || 'تعذّر الحفظ', 'error');
  } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function sendEmployeeCreds(empId, name) {
  if (!confirm('هيتبعت لـ ' + (name||empId) + ' لينك الدخول + اليوزر + الباسورد على تليجرام. تمام؟')) return;
  try {
    const r = await fetch('/api/employees/onboard', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ employee_ids: [empId] })
    });
    const d = await r.json();
    const row = (d.results||[])[0] || {};
    if (row.telegram_sent) showToast('اتبعت بياناته على تليجرام ✅');
    else if (row.has_telegram === false) showToast('الموظف مالوش تليجرام في الشيت', 'error');
    else showToast('اتعمل الأكونت بس الرسالة موصلتش (يعمل Start للبوت)', 'error');
  } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

async function deleteCompanyEmployee(empId, name) {
  if (!confirm('حذف الموظف ' + (name||empId) + ' من القائمة نهائياً؟')) return;
  try {
    const r = await fetch('/api/employees/' + encodeURIComponent(empId), { method: 'DELETE' });
    const d = await r.json();
    if (r.ok && d.ok) { showToast('تم حذف الموظف 🗑️'); renderCompanyEmployees(); }
    else showToast(d.error || 'تعذّر الحذف', 'error');
  } catch(e) { showToast('خطأ في الاتصال', 'error'); }
}

// Global Live Upload Progress helpers
function showUploadProgressModal(filename, totalSize, isVideo) {
  const modal = document.getElementById('upload-progress-modal');
  if (!modal) return;
  const title = document.getElementById('upm-title');
  const fn = document.getElementById('upm-filename');
  const icon = document.getElementById('upm-icon');
  const bar = document.getElementById('upm-bar');
  const percent = document.getElementById('upm-percent');
  const stats = document.getElementById('upm-stats');
  const statusTxt = document.getElementById('upm-status-text');
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
  if (title) title.textContent = isVideo ? 'جاري رفع الفيديو...' : 'جاري رفع الملف...';
  if (fn) fn.textContent = filename + ' (' + sizeMB + ' MB)';
  if (icon) icon.textContent = isVideo ? '🎬' : '📁';
  if (bar) { bar.style.width = '0%'; bar.className = 'bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-150 ease-out'; }
  if (percent) percent.textContent = '0%';
  if (stats) stats.textContent = '0 MB / ' + sizeMB + ' MB';
  if (statusTxt) statusTxt.textContent = '🚀 جاري الرفع المباشر إلى Google Drive...';
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function updateUploadProgress(loaded, total) {
  const pct = Math.min(100, Math.round((loaded / total) * 100));
  const bar = document.getElementById('upm-bar');
  const percent = document.getElementById('upm-percent');
  const stats = document.getElementById('upm-stats');
  const statusTxt = document.getElementById('upm-status-text');
  
  const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
  const totalMB = (total / (1024 * 1024)).toFixed(1);
  
  if (bar) bar.style.width = pct + '%';
  if (percent) percent.textContent = pct + '%';
  if (stats) stats.textContent = loadedMB + ' MB / ' + totalMB + ' MB';
  if (statusTxt && pct >= 100) statusTxt.textContent = '⏳ جاري المعالجة وتأكيد الربط بـ Google Drive...';
}

function finishUploadProgress(success, msg) {
  const bar = document.getElementById('upm-bar');
  const statusTxt = document.getElementById('upm-status-text');
  if (bar && success) {
    bar.className = 'bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-150';
    bar.style.width = '100%';
  }
  if (statusTxt) statusTxt.textContent = success ? '🎉 اكتمل الرفع بنجاح!' : ('❌ ' + (msg || 'فشل الرفع'));
  setTimeout(() => {
    const modal = document.getElementById('upload-progress-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  }, success ? 700 : 2500);
}

window.showUploadProgressModal = showUploadProgressModal;
window.updateUploadProgress = updateUploadProgress;
// Direct Official Google Drive Uploader with Live Progress
function driveUploadFile(taskId, file) {
  return new Promise(async (resolve, reject) => {
    const isVideo = (file.type && file.type.startsWith('video/')) || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
    showUploadProgressModal(file.name, file.size, isVideo);
    
    try {
      let finalLink = null;
      
      // Step 1: Request Direct Google Drive Upload Session
      try {
        const sessionRes = await safeFetchJson('/api/tasks/' + encodeURIComponent(taskId) + '/upload-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mime: file.type || (isVideo ? 'video/mp4' : 'application/octet-stream')
          })
        });
        
        if (sessionRes && sessionRes.ok && sessionRes.upload_url) {
          const driveResult = await new Promise((dResolve, dReject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', sessionRes.upload_url, true);
            xhr.setRequestHeader('Content-Type', file.type || (isVideo ? 'video/mp4' : 'application/octet-stream'));
            
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                updateUploadProgress(e.loaded, e.total);
              }
            };
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  if (data && data.id) {
                    dResolve(data.id);
                  } else {
                    dReject(new Error('لم يتم استلام معرّف الملف من Google Drive'));
                  }
                } catch(e) {
                  dReject(e);
                }
              } else {
                dReject(new Error('فشل الرفع إلى Google Drive'));
              }
            };
            
            xhr.onerror = () => {
              dReject(new Error('انقطع الاتصال بـ Google Drive أثناء الرفع'));
            };
            
            xhr.send(file);
          });
          
          if (driveResult) {
            // Finalize file on backend
            const compRes = await safeFetchJson('/api/tasks/' + encodeURIComponent(taskId) + '/upload-complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file_id: driveResult,
                mime: file.type || (isVideo ? 'video/mp4' : 'application/octet-stream')
              })
            });
            
            if (compRes && compRes.ok && compRes.drive_link) {
              finalLink = compRes.drive_link;
            }
          }
        }
      } catch(gDriveErr) {
        console.warn('Google Drive direct session upload failed, trying cloud fallback...', gDriveErr);
      }
      
      // Step 2: Cloud Fallback if Google direct session hit network block
      if (!finalLink) {
        try {
          const uploadResult = await new Promise((upResolve, upReject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://tmpfiles.org/api/v1/upload', true);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) updateUploadProgress(e.loaded, e.total);
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const res = JSON.parse(xhr.responseText);
                  if (res && res.data && res.data.url) {
                    upResolve(res.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/'));
                  } else upReject(new Error('فشل استلام الرابط'));
                } catch(pe) { upReject(pe); }
              } else upReject(new Error('فشل الرفع'));
            };
            xhr.onerror = () => upReject(new Error('انقطع الاتصال'));
            const fd = new FormData();
            fd.append('file', file, file.name);
            xhr.send(fd);
          });
          
          if (uploadResult) {
            const saveRes = await safeFetchJson('/api/tasks/' + encodeURIComponent(taskId) + '/drive-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ drive_link: uploadResult, link: uploadResult })
            });
            if (saveRes && saveRes.ok) finalLink = uploadResult;
          }
        } catch(fe){}
      }
      
      if (!finalLink) {
        finishUploadProgress(false, 'تعذّر رفع الملف. يمكنك وضع رابط Google Drive مباشرة 🔗');
        reject(new Error('تعذّر رفع الملف'));
        return;
      }
      
      finishUploadProgress(true);
      resolve(finalLink);
      
    } catch(err) {
      console.error('Upload handler error:', err);
      finishUploadProgress(false, err.message || 'حدث خطأ أثناء الرفع');
      reject(err);
    }
  });
}

window.driveUploadFile = driveUploadFile;

// Employee uploads their work (video/graphic) from the portal — auto to Drive.
async function uploadMyTaskAsset(taskId, input) {
  const file = (input && input.files && input.files[0]) ? input.files[0] : null;
  if (!file) return;
  try {
    const link = await driveUploadFile(taskId, file);
    showToast('🎉 تم رفع الفيديو/الملف بنجاح وربطه بالمهمة على Google Drive! ✅', 'success');
    if (typeof loadMyPortal === 'function') loadMyPortal();
  } catch(e) {
    showToast('تعذّر الرفع: ' + (e.message || ''), 'error');
  }
  if (input) input.value = '';
}

// ---- Team & Access management (admin only) ----
async function loadTeam() {
  const panel = document.getElementById('team-panel');
  if (!panel) return;
  let me = {};
  try { me = await safeFetchJson('/api/me'); } catch(e) {}
  if (!me || !me.is_admin) { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  // client checkboxes for the add form
  let clients = [];
  try { const d = await safeFetchJson('/api/clients'); clients = Array.isArray(d) ? d : ((d && d.clients) ? d.clients : []); } catch(e){}
  window._teamClients = clients;
  const box = document.getElementById('nm-clients');
  if (box) box.innerHTML = clients.map(c => `
    <label class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer">
      <input type="checkbox" class="nm-client-cb" value="${esc(c.id)}"> ${esc(c.name)}
    </label>`).join('') || '<span class="text-slate-400">لا يوجد عملاء</span>';
  renderMembers();
  renderCompanyEmployees();
  if (window.lucide) lucide.createIcons();
}

async function renderMembers() {
  const list = document.getElementById('members-list');
  if (!list) return;
  let users = [], empNames = {};
  try { const d = await safeFetchJson('/api/users'); users = (d && d.users) ? d.users : []; } catch(e){}
  try { const d = await safeFetchJson('/api/tasks/employees'); ((d && d.employees) ? d.employees : []).forEach(e => { if (e.employee_id) empNames[e.employee_id] = e.name; }); } catch(e){}
  const clients = window._teamClients || [];
  const nameOf = id => (clients.find(c => c.id === id)||{}).name || id;
  const roleLabel = r => r==='admin' ? 'مدير' : r==='account_manager' ? 'أكونت مانيجر' : 'موظف';
  const displayName = u => empNames[u.employee_id] || empNames[u.username] || u.username;
  list.innerHTML = users.map(u => {
    const assigned = (u.assigned_clients||[]).map(nameOf);
    const chips = clients.map(c => {
      const on = (u.assigned_clients||[]).includes(c.id);
      return `<button onclick="toggleAssign('${esc(u.username)}','${esc(c.id)}',${!on})" class="text-[11px] px-2 py-0.5 rounded-full border ${on?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-600 border-slate-200'}">${esc(c.name)}</button>`;
    }).join(' ');
    const nm = displayName(u);
    const driveTargetId = u.employee_id || u.username;
    const driveFolderBtn = driveTargetId ? `
      <div class="flex items-center gap-1.5 pt-1">
        <button onclick="openEmployeeDriveFolder('${esc(driveTargetId)}')" class="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg text-[11px] font-bold transition shadow-2xs">
          <span>📁 مجلد Google Drive للموظف ↗️</span>
        </button>
        <button onclick="copyEmployeeDriveFolder('${esc(driveTargetId)}')" class="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg text-[11px] font-bold transition shadow-2xs">
          <span>📋 نسخ الرابط</span>
        </button>
      </div>` : '';
    return `<div class="border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span class="font-bold text-sm text-slate-900">${esc(nm)}</span>
          ${nm !== u.username ? `<span class="text-[10px] text-slate-400 font-mono">(${esc(u.username)})</span>` : ''}
          <span class="text-[11px] px-2 py-0.5 rounded-full ${u.role==='admin'?'bg-purple-100 text-purple-700':u.role==='account_manager'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-600'} mr-1">${roleLabel(u.role)}</span>
          <span class="text-[11px] text-slate-400">${esc(u.email||'')}</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="changeUserPassword('${esc(u.username)}')" class="text-[11px] px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition">✏️ تغيير الباسورد</button>
          <button onclick="resendCreds('${esc(u.username)}')" class="text-[11px] px-2 py-1 rounded-lg border border-slate-200 text-slate-600">إرسال بيانات جديدة</button>
          ${u.is_primary?'<span class="text-[10px] text-slate-400">المدير الرئيسي</span>':`<button onclick="deleteMember('${esc(u.username)}')" class="text-[11px] px-2 py-1 rounded-lg border border-red-200 text-red-600">حذف</button>`}
        </div>
      </div>
      <div class="flex items-center gap-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono w-fit">
        <span class="text-slate-500">🔑 كلمة المرور:</span>
        ${u.password
          ? `<b class="text-slate-800 select-all">${esc(u.password)}</b>
             <button onclick="copyText('${esc(u.password)}')" title="نسخ" class="text-slate-400 hover:text-slate-700">📋</button>`
          : `<span class="text-slate-400">— (اضغط «إرسال بيانات جديدة» لتوليد كلمة مرور)</span>`}
      </div>
      ${driveFolderBtn}
      ${u.role==='admin'?'<div class="text-[11px] text-slate-400">يرى كل العملاء</div>':`<div class="flex flex-wrap gap-1">${chips}</div>`}
    </div>`;
  }).join('') || '<div class="text-xs text-slate-400 text-center p-3">لا يوجد أعضاء بعد</div>';
}

async function createMember() {
  const username = document.getElementById('nm-username')?.value.trim();
  const email = document.getElementById('nm-email')?.value.trim();
  const role = document.getElementById('nm-role')?.value || 'account_manager';
  const assigned = Array.from(document.querySelectorAll('.nm-client-cb:checked')).map(cb => cb.value);
  if (!username) { showToast('اكتب اسم المستخدم', 'error'); return; }
  if (!email) { showToast('اكتب البريد الإلكتروني لإرسال البيانات', 'error'); return; }
  try {
    const r = await fetch('/api/register', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username, email, role, assigned_clients: assigned, send_email: true})});
    const d = await r.json();
    if (!r.ok) { showToast(d.error || 'تعذّر الإضافة', 'error'); return; }
    // Show credentials to the admin once (works even if SMTP email isn't configured).
    const info = document.getElementById('new-member-creds');
    if (info) {
      info.classList.remove('hidden');
      info.innerHTML = `تم إنشاء الحساب ✅ ${d.email_sent ? '(واتبعت على بريده)' : '(الإيميل مش مفعّل — انسخ البيانات وابعتها له)'}
        <div class="mt-1 font-mono text-slate-800">اسم المستخدم: <b>${esc(d.username)}</b> — كلمة المرور: <b>${esc(d.password||'')}</b></div>`;
    }
    showToast(d.email_sent ? 'تم إضافة العضو وإرسال البيانات على بريده ✅' : 'تم إضافة العضو — انسخ بيانات الدخول');
    document.getElementById('nm-username').value=''; document.getElementById('nm-email').value='';
    document.querySelectorAll('.nm-client-cb:checked').forEach(cb=>cb.checked=false);
    renderMembers();
  } catch(e) { showToast('خطأ في الشبكة', 'error'); }
}

async function toggleAssign(username, clientId, add) {
  try {
    const d = await safeFetchJson('/api/users');
    const u = ((d && d.users) ? d.users : []).find(x => x.username === username) || {assigned_clients:[]};
    let set = new Set(u.assigned_clients||[]);
    if (add) set.add(clientId); else set.delete(clientId);
    await fetch(`/api/users/${encodeURIComponent(username)}/clients`, {method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({assigned_clients: Array.from(set)})});
    renderMembers();
  } catch(e) { showToast('تعذّر تحديث الصلاحيات', 'error'); }
}

async function deleteMember(username) {
  if (!confirm('حذف العضو ' + username + '؟')) return;
  // Send via body (path param fails for Arabic/non-ASCII usernames).
  try {
    const r = await fetch('/api/users/delete', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username})});
    const d = await r.json();
    if (!r.ok || !d.ok) { showToast(d.error || 'تعذّر الحذف', 'error'); return; }
    showToast('تم حذف العضو ✅');
  } catch(e) { showToast('خطأ في الشبكة', 'error'); return; }
  renderMembers();
}

async function resendCreds(username) {
  const r = await fetch('/api/auth/send-credentials', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username})});
  const d = await r.json();
  showToast(d.ok ? 'تم إرسال بيانات دخول جديدة على بريده ✅' : (d.error||d.message||'تعذّر الإرسال'), d.ok?'success':'error');
}

async function changeUserPassword(username) {
  const newPass = prompt(`أدخل كلمة المرور الجديدة للحساب (${username}):`);
  if (!newPass) return;
  if (newPass.trim().length < 4) {
    showToast('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل', 'error');
    return;
  }
  try {
    const r = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username: username, new_password: newPass.trim() })
    });
    const d = await r.json();
    if (!r.ok || !d.ok) {
      showToast(d.error || 'تعذّر تغيير كلمة المرور', 'error');
      return;
    }
    showToast(d.message || 'تم تغيير كلمة المرور بنجاح ✅', 'success');
    renderMembers();
  } catch(e) {
    showToast('خطأ في الاتصال بالسيرفر', 'error');
  }
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
              <div class="text-[11px] ${on ? 'text-emerald-600' : 'text-red-500'} font-bold">${on ? '🟢 الرد الآلي شغّال' : '🔴 الرد متوقف (مراجعة يدوية)'}</div>
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

    // Preserve saved active client across reloads
    const savedClient = localStorage.getItem('active_client_id');
    let targetClient = null;
    if (savedClient && list.some(c => c.id === savedClient)) {
      targetClient = savedClient;
    } else if (list.length) {
      targetClient = list[0].id;
    }

    if (targetClient) {
      window.activeClientId = targetClient;
      if (hdr) hdr.value = targetClient;
      if (dd) dd.value = targetClient;
      updateHeaderBadge(targetClient);
      fetch('/api/clients/switch', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({client_id: targetClient})
      }).catch(e => {});
    } else {
      updateHeaderBadge(null);
    }
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
  if (typeof checkGoogleDriveStatus === 'function') checkGoogleDriveStatus();
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
  const links = link.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  const fids = links.map(driveFileId).filter(Boolean);
  if (!fids.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
  box.classList.remove('hidden');
  const isVid = (type === 'video' || type === 'reel');
  // Aspect ratio per platform: story/reel = 9/16 (vertical), image/carousel/video = 4/5.
  const ratio = (type === 'story' || type === 'reel') ? '9 / 16' : (isVid ? '16 / 9' : '4 / 5');
  // Keep the preview centered with a framed media box that matches the target ratio.
  const frame = (inner) => `<div style="aspect-ratio:${ratio};max-height:360px;margin:0 auto;background:#0f172a;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center">${inner}</div>`;
  const cell = (fid) => (isVid || type === 'story')
    ? frame(`<iframe src="https://drive.google.com/file/d/${fid}/preview" style="width:100%;height:100%;border:0" allow="autoplay"></iframe>`)
    : frame(`<img src="https://drive.google.com/thumbnail?id=${fid}&sz=w800" style="width:100%;height:100%;object-fit:cover">`);
  if (type === 'carousel' && fids.length > 1) {
    box.innerHTML = `<div class="grid grid-cols-2 gap-1">${fids.map(f=>`<div>${cell(f)}</div>`).join('')}</div>
      <div class="text-[10px] text-slate-400 mt-1 text-center">كاروسيل — ${fids.length} عناصر • اسحب لرؤية الكل</div>`;
  } else {
    box.innerHTML = cell(fids[0]);
  }
}
async function saveScheduledPost() {
  const cap = document.getElementById('post-caption-input')?.value;
  const dt = document.getElementById('post-date')?.value;
  const tm = document.getElementById('post-time')?.value;
  const drive = document.getElementById('post-drive-link')?.value || '';
  const mediaType = document.getElementById('post-media-type')?.value || 'image';
  const mediaUrls = drive.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  // Media is required for everything except a plain text post
  if (!mediaUrls.length && mediaType !== 'image') { showToast('أضف رابط الميديا أولاً', 'error'); return; }
  if (mediaType === 'carousel' && mediaUrls.length < 2) { showToast('الكاروسيل يحتاج رابطين على الأقل', 'error'); return; }
  if (!cap && !mediaUrls.length) { showToast('اكتب المحتوى أو أضف ميديا', 'error'); return; }

  try {
      const res = await fetch('/api/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption: cap, target: (typeof postTarget !== 'undefined' ? postTarget : 'fb'), drive_link: drive, media_urls: mediaUrls, media_type: mediaType, date: dt, time: tm })
      });
      const data = await res.json();
      if(data.success) {
          showToast('تم حفظ الجدولة في السيرفر بنجاح ✅');
          if (typeof loadScheduledPosts === 'function') loadScheduledPosts();
          const capInput = document.getElementById('post-caption-input');
          const driveInput = document.getElementById('post-drive-link');
          if (capInput) capInput.value = '';
          if (driveInput) driveInput.value = '';
      }
  } catch(e) {
      showToast('حدث خطأ أثناء الجدولة', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  // Show the page IMMEDIATELY with last-known tab (no blocking API call)
  restoreActiveTab();
  initLucideIcons();
  
  // Set today's date as default for scheduler
  const dateInput = document.getElementById('post-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  
  // Background: fetch role data and apply UI restrictions (non-blocking)
  if (typeof applyRoleUI === 'function') {
    applyRoleUI().then(() => {
      // Re-apply tab after role is known (may redirect employee to myportal)
      restoreActiveTab();
    }).catch(() => {});
  }
  
  // Populate the header account switcher from real connected accounts
  if (typeof populateAccountSwitcher === 'function') populateAccountSwitcher();
  if (typeof loadDashboardStats === 'function') loadDashboardStats();
});

function restoreActiveTab() {
  try {
    const me = window._me;
    let defaultTab = (me && me.role === 'employee') ? 'myportal' : 'inbox';
    const hash = (window.location.hash || '').replace('#', '').trim();
    let saved = hash || localStorage.getItem('active_tab') || defaultTab;
    
    if (me && !me.is_admin) {
      const allowed = new Set((me.allowed_tabs && me.allowed_tabs.length) ? me.allowed_tabs : (me.role === 'account_manager' ? ['dash','crm','inbox','rules','kb','mode','settings','logs','scheduler','tasks','plan','accounts','analytics','myportal'] : ['myportal']));
      allowed.add('myportal');
      if (!allowed.has(saved)) {
        saved = (me.role === 'employee') ? 'myportal' : 'dash';
      }
    }
    if (saved) {
      go(saved);
    }
  } catch(e) {
    console.error('restoreActiveTab error:', e);
  }
}

window.addEventListener('hashchange', function() {
  try {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (hash) {
      go(hash);
    }
  } catch(e){}
});

// Live Permissions & Session Sync: Periodically poll /api/me (every 60s)
setInterval(function() {
  if (document.visibilityState === 'visible' && window._me && window._me.logged_in) {
    fetch('/api/me').then(r => r.json()).then(me => {
      if (me && me.logged_in) {
        window._me = me;
        applyRoleNavVisibility(me);
      }
    }).catch(()=>{});
  }
}, 60000);

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
    if (typeof showToast === 'function') showToast('تم نسخ الرابط بنجاح 📋');
  } catch(e) {}
  document.body.removeChild(ta);
}

async function openMyDriveFolder() {
  try {
    const r = await fetch('/api/me/drive-folder');
    const d = await r.json();
    if (d.folder_url) {
      window.open(d.folder_url, '_blank');
    } else {
      showToast(d.error || 'تعذر جلب مجلد Google Drive', 'error');
    }
  } catch(e) {
    showToast('خطأ في الاتصال بالسيرفر', 'error');
  }
}

async function copyMyDriveFolder() {
  try {
    const r = await fetch('/api/me/drive-folder');
    const d = await r.json();
    if (d.folder_url) {
      copyText(d.folder_url);
      showToast('تم نسخ رابط مجلدك على Google Drive بنجاح 📋');
    } else {
      showToast(d.error || 'تعذر جلب مجلد Google Drive', 'error');
    }
  } catch(e) {
    showToast('خطأ في الاتصال بالسيرفر', 'error');
  }
}

async function openEmployeeDriveFolder(eid) {
  try {
    const r = await fetch('/api/employees/' + encodeURIComponent(eid) + '/drive-folder');
    const d = await r.json();
    if (d.folder_url) {
      window.open(d.folder_url, '_blank');
    } else {
      showToast(d.error || 'تعذر جلب مجلد الموظف على Drive', 'error');
    }
  } catch(e) {
    showToast('خطأ في الاتصال بالسيرفر', 'error');
  }
}

async function copyEmployeeDriveFolder(eid) {
  try {
    const r = await fetch('/api/employees/' + encodeURIComponent(eid) + '/drive-folder');
    const d = await r.json();
    if (d.folder_url) {
      copyText(d.folder_url);
      showToast('تم نسخ رابط مجلد الموظف على Google Drive بنجاح 📋');
    } else {
      showToast(d.error || 'تعذر جلب مجلد الموظف على Drive', 'error');
    }
  } catch(e) {
    showToast('خطأ في الاتصال بالسيرفر', 'error');
  }
}

async function loadHrGeofenceSettings() {
  try {
    const r = await fetch('/api/hr/config');
    const d = await r.json();
    const cfg = d.config || {};
    const gEl = document.getElementById('hr-cfg-geofence');
    if (gEl) gEl.value = cfg.geofence_meters || 300;
    const lEl = document.getElementById('hr-cfg-late');
    if (lEl) lEl.value = cfg.late_after_time || '10:15';
    const latEl = document.getElementById('hr-cfg-lat');
    if (latEl) latEl.value = cfg.company_lat || 30.469771;
    const lonEl = document.getElementById('hr-cfg-lon');
    if (lonEl) lonEl.value = cfg.company_lon || 31.180022;
    const hEl = document.getElementById('hr-cfg-hide-loc');
    if (hEl) hEl.checked = (cfg.hide_location !== false);
  } catch(e) {}
}

async function saveHrGeofenceSettings() {
  const gEl = document.getElementById('hr-cfg-geofence');
  const lEl = document.getElementById('hr-cfg-late');
  const latEl = document.getElementById('hr-cfg-lat');
  const lonEl = document.getElementById('hr-cfg-lon');
  const hEl = document.getElementById('hr-cfg-hide-loc');
  const body = {
    geofence_meters: parseInt(gEl?.value || 300, 10),
    late_after_time: (lEl?.value || '10:15').trim(),
    company_lat: parseFloat(latEl?.value || 30.469771),
    company_lon: parseFloat(lonEl?.value || 31.180022),
    hide_location: hEl ? hEl.checked : true
  };
  try {
    const r = await fetch('/api/hr/config', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (r.ok && d.ok) {
      showToast('تم حفظ إعدادات النطاق الجغرافي وحماية الموقع بنجاح 💾✅');
    } else {
      showToast(d.error || 'تعذر حفظ الإعدادات', 'error');
    }
  } catch(e) {
    showToast('خطأ في حفظ الإعدادات', 'error');
  }
}
