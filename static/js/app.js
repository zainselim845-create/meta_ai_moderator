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
  if (!dtStr) return '';
  try {
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('ar-EG');
  } catch (e) {
    return dtStr;
  }
}

// Authentication Handlers
function checkAuth() {
  const overlay = document.getElementById('login-modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function quickDemoLogin() {
  localStorage.setItem('domya_auth', 'true');
  const overlay = document.getElementById('login-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  showToast('تم تسجيل الدخول بنجاح!');
}

function handleLogin(e) {
  if (e) e.preventDefault();
  localStorage.setItem('domya_auth', 'true');
  const overlay = document.getElementById('login-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  showToast('تم تسجيل الدخول بنجاح!');
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

// Account switching dropdown
function switchActiveClient(clientId) {
  window.activeClientId = clientId;
  const bar = document.getElementById('active-client-bar');
  const dd = document.getElementById('active-client-dropdown');
  if (dd) {
    const txt = dd.options[dd.selectedIndex]?.text || clientId;
    showToast('تم التبديل إلى: ' + txt);
  }
  fetch('/api/settings/active-client', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({client_id: clientId})}).catch(()=>{});
  if (typeof loadInbox === 'function') loadInbox();
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
function updatePostPreview() {
  const ta = document.getElementById('post-caption-input');
  const preview = document.getElementById('preview-caption-text');
  if (ta && preview) preview.textContent = ta.value || 'معاينة النص تظهر هنا...';
}
async function saveScheduledPost() {
  const cap = document.getElementById('post-caption-input')?.value;
  const dt = document.getElementById('post-date')?.value;
  const tm = document.getElementById('post-time')?.value;
  const drive = document.getElementById('post-drive-link')?.value || '';
  if (!cap) { showToast('يرجى كتابة المحتوى', 'error'); return; }

  try {
      const res = await fetch('/api/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption: cap, target: (typeof postTarget !== 'undefined' ? postTarget : 'fb'), drive_link: drive, date: dt, time: tm })
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
});
