/**
 * portal_view.js - Employee Portal & Attendance Module ("مهامي وحضوري")
 * Clean Architecture Modular Feature for Meta AI Moderator.
 * Encapsulates:
 *  - 2-Tier Ergonomic Cards (Compact vs Detailed)
 *  - Subtask & Revision Tracking with Visual Reason Banners
 *  - 1-Click Fast Submission & Return Workflows
 *  - Attendance Accordion, History & Work Reports
 */

let myPortalTasksRaw = [];
let myPortalStatusFilter = 'all';
let myPortalClientFilter = 'all';
let myPortalPlanFilter = 'all';
let myPortalDueFilter = 'all';
let myPortalSearchQuery = '';

function setMyPortalStatusFilter(st) {
  myPortalStatusFilter = st;
  renderMyPortalTasks();
}

function setMyPortalClientFilter(cid) {
  myPortalClientFilter = cid;
  // Dynamically cascade plan filter to show plans belonging to selected client
  const pFilter = document.getElementById('myportal-plan-filter');
  if (pFilter) {
    const tasks = myPortalTasksRaw || [];
    const pSet = new Set();
    tasks.forEach(t => {
      const cName = String(t.client_name || '').trim().toLowerCase();
      const cId = String(t.client_id || '').trim();
      if (cid === 'all' || !cid || cId === cid || cName === String(cid).trim().toLowerCase()) {
        const pn = (t.plan_name || t.file_name || '').trim();
        if (pn) pSet.add(pn);
      }
    });
    pFilter.innerHTML = '<option value="all">📑 جميع الخطط</option>' + Array.from(pSet).map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
    if (myPortalPlanFilter && myPortalPlanFilter !== 'all' && !pSet.has(myPortalPlanFilter)) {
      myPortalPlanFilter = 'all';
    }
    pFilter.value = myPortalPlanFilter || 'all';
  }
  renderMyPortalTasks();
}

function setMyPortalPlanFilter(plan) {
  myPortalPlanFilter = plan;
  renderMyPortalTasks();
}

function setMyPortalDueFilter(due) {
  myPortalDueFilter = due;
  renderMyPortalTasks();
}

let _myPortalSearchTimer = null;
function onMyPortalSearchInput(q) {
  clearTimeout(_myPortalSearchTimer);
  _myPortalSearchTimer = setTimeout(() => {
    myPortalSearchQuery = (q || '').trim().toLowerCase();
    renderMyPortalTasks();
  }, 120);
}

window.setMyPortalStatusFilter = setMyPortalStatusFilter;
window.setMyPortalClientFilter = setMyPortalClientFilter;
window.setMyPortalPlanFilter = setMyPortalPlanFilter;
window.setMyPortalDueFilter = setMyPortalDueFilter;
window.onMyPortalSearchInput = onMyPortalSearchInput;

let currentPortalCardViewMode = (function() {
  try { return localStorage.getItem('portal_card_view_mode') || 'compact'; } catch(e) { return 'compact'; }
})();

function setPortalCardViewMode(mode) {
  currentPortalCardViewMode = mode;
  try { localStorage.setItem('portal_card_view_mode', mode); } catch(e){}
  renderMyPortalTasks();
}

function togglePortalCardDetails(taskId) {
  const el = document.getElementById('portal-task-details-' + taskId);
  const btn = document.getElementById('btn-portal-details-' + taskId);
  if (!el) return;
  const isCollapsed = el.classList.contains('collapsed') || el.style.display === 'none';
  if (isCollapsed) {
    el.classList.remove('collapsed');
    el.classList.add('expanded');
    el.style.display = 'block';
    if (btn) btn.innerHTML = '<span>👁️ إخفاء التفاصيل والماتريال ▲</span>';
  } else {
    el.classList.remove('expanded');
    el.classList.add('collapsed');
    el.style.display = 'none';
    if (btn) btn.innerHTML = '<span>👁️ كامل التفاصيل والماتريال ▼</span>';
  }
}

window.setPortalCardViewMode = setPortalCardViewMode;
window.togglePortalCardDetails = togglePortalCardDetails;

function renderMyPortalTasks() {
  const box = document.getElementById('my-tasks-list');
  if (!box) return;

  const allTasks = myPortalTasksRaw || [];
  
  const dNow = new Date();
  const todayStr = dNow.toISOString().slice(0, 10);
  const dTom = new Date(dNow.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = dTom.toISOString().slice(0, 10);

  // Update Status Button Counters
  const countAssigned = allTasks.filter(t => (t.status||'') === 'Assigned' && !t.is_subtask).length;
  const countProgress = allTasks.filter(t => (t.status||'') === 'In Progress' && !t.is_subtask).length;
  const countRevisions = allTasks.filter(t => t.is_subtask || t.type === 'revision' || (t.subtasks && t.subtasks.some(st => (st.type === 'revision' || st.is_subtask) && !st.completed_at))).length;
  const countReview = allTasks.filter(t => /Awaiting|Submitted|Review/i.test(t.status||'')).length;
  const countCompleted = allTasks.filter(t => /Completed|مكتمل|Approved/i.test(t.status||'')).length;

  const btnAll = document.getElementById('mp-stat-all');
  const btnAssigned = document.getElementById('mp-stat-assigned');
  const btnProgress = document.getElementById('mp-stat-progress');
  const btnRevisions = document.getElementById('mp-stat-revisions');
  const btnReview = document.getElementById('mp-stat-review');
  const btnCompleted = document.getElementById('mp-stat-completed');

  if (btnAll) {
    btnAll.textContent = `الكل (${allTasks.length})`;
    btnAll.className = `text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${myPortalStatusFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`;
  }
  if (btnAssigned) {
    btnAssigned.textContent = `⏳ بانتظار البدء (${countAssigned})`;
    btnAssigned.className = `text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${myPortalStatusFilter === 'Assigned' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`;
  }
  if (btnProgress) {
    btnProgress.textContent = `⏱️ جاري العمل (${countProgress})`;
    btnProgress.className = `text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${myPortalStatusFilter === 'In Progress' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'}`;
  }
  if (btnRevisions) {
    btnRevisions.textContent = `🔄 مهام التعديل (${countRevisions})`;
    btnRevisions.className = `text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${myPortalStatusFilter === 'revisions' ? 'bg-amber-600 text-white shadow-2xs font-extrabold ring-2 ring-amber-300' : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'}`;
  }
  if (btnReview) {
    btnReview.textContent = `🔍 قيد المراجعة (${countReview})`;
    btnReview.className = `text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${myPortalStatusFilter === 'Awaiting AM Review' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'}`;
  }
  if (btnCompleted) {
    btnCompleted.textContent = `✅ مكتملة (${countCompleted})`;
    btnCompleted.className = `text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer ${myPortalStatusFilter === 'Completed' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'}`;
  }

  // Update Due Filter Buttons styling
  ['all', 'today', 'tomorrow', 'overdue'].forEach(dueK => {
    const b = document.getElementById(`mp-due-${dueK}`);
    if (b) {
      if (myPortalDueFilter === dueK) {
        b.className = `text-xs px-2.5 py-1 rounded-lg font-bold transition bg-slate-900 text-white shadow-2xs`;
      } else {
        b.className = `text-xs px-2.5 py-1 rounded-lg font-bold transition bg-white text-slate-700 border border-slate-200 hover:bg-slate-100`;
      }
    }
  });

  // Filter Tasks
  let filtered = allTasks.filter(t => {
    if (myPortalStatusFilter !== 'all') {
      if (myPortalStatusFilter === 'revisions') {
        const isRev = t.is_subtask || t.type === 'revision' || (t.subtasks && t.subtasks.some(st => (st.type === 'revision' || st.is_subtask) && !st.completed_at));
        if (!isRev) return false;
      } else if (myPortalStatusFilter === 'Awaiting AM Review') {
        if (!/Awaiting|Submitted|Review/i.test(t.status||'')) return false;
      } else if (myPortalStatusFilter === 'Completed') {
        if (!/Completed|مكتمل|Approved/i.test(t.status||'')) return false;
      } else if (myPortalStatusFilter === 'Assigned') {
        if ((t.status||'') !== 'Assigned' || t.is_subtask) return false;
      } else if (myPortalStatusFilter === 'In Progress') {
        if ((t.status||'') !== 'In Progress' || t.is_subtask) return false;
      }
    }
    if (myPortalClientFilter !== 'all') {
      const cName = String(t.client_name || '').trim().toLowerCase();
      const cid = String(t.client_id || '').trim();
      if (cid !== myPortalClientFilter && cName !== myPortalClientFilter.toLowerCase()) return false;
    }
    if (myPortalPlanFilter !== 'all') {
      const pName = String(t.plan_name || t.file_name || '').trim();
      if (pName !== myPortalPlanFilter) return false;
    }
    const isDoneOrSubmitted = /Completed|مكتمل|Approved|Awaiting|Submitted|Review|قيد مراجعة/i.test(t.status || '') || Boolean(t.submitted_at) || Boolean(t.drive_link) || (Array.isArray(t.deliverables) && t.deliverables.length > 0);
    const dVal = String(t.delivery_deadline || t.publish_date || t.scheduled_start_date || '').slice(0, 10);
    if (myPortalDueFilter === 'today' && (dVal !== todayStr || isDoneOrSubmitted)) return false;
    if (myPortalDueFilter === 'tomorrow' && (dVal !== tomorrowStr || isDoneOrSubmitted)) return false;
    if (myPortalDueFilter === 'overdue' && (!dVal || dVal >= todayStr || isDoneOrSubmitted)) return false;

    if (myPortalSearchQuery) {
      const hay = (
        String(t.title || '') + ' ' +
        String(t.task_id || '') + ' ' +
        String(t.caption || '') + ' ' +
        String(t.description || '') + ' ' +
        String(t.visual_idea || '') + ' ' +
        String(t.design_brief || '') + ' ' +
        String(t.client_name || '') + ' ' +
        String(t.plan_name || '') + ' ' +
        String(t.assignee_name || '') + ' ' +
        String(t.secondary_assignee_name || '') + ' ' +
        String(t.assigned_employee_id || '')
      ).toLowerCase();
      if (!hay.includes(myPortalSearchQuery)) return false;
    }

    return true;
  });

  const statusBadge = (t) => {
    if (t.is_subtask) {
      if (/Completed|مكتمل/i.test(t.status||'')) return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">✅ تم اعتماد التعديل</span>';
      if (/Awaiting|Submitted|Review/i.test(t.status||'')) return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold animate-pulse flex items-center gap-1">🔍 التعديل قيد مراجعة AM</span>';
      return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">🔄 مهمة تعديل قيد التنفيذ</span>';
    }
    const s = (t.status || 'Pending AM Approval').trim();
    if (/Completed|مكتمل|Approved/i.test(s)) return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">✅ معتمدة ومكتملة</span>';
    if (/In Progress/i.test(s)) return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">⏱️ جاري العمل</span>';
    if (/Awaiting|Submitted|Review/i.test(s)) return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold animate-pulse flex items-center gap-1">🔍 قيد مراجعة AM</span>';
    if (/Assigned/i.test(s)) return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">📌 مُسندة إليك</span>';
    if (/Changes Requested|تعديل/i.test(s)) return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center gap-1">✍️ مطلوب تعديل</span>';
    return '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">⏳ بانتظار الإسناد</span>';
  };

  const formatDeadline = (t) => {
    const dStr = (t.delivery_deadline || t.publish_date || '').trim();
    if (!dStr) return '<span class="text-slate-400 font-normal">غير محدد</span>';
    const isDone = /Completed|مكتمل|Approved/i.test(t.status || '');
    const isSubmitted = /Awaiting|Submitted|Review|قيد مراجعة/i.test(t.status || '') || Boolean(t.submitted_at) || Boolean(t.drive_link) || (Array.isArray(t.deliverables) && t.deliverables.length > 0);

    const modNotes = (t.review_note || t.modification_request || t.notes || '').trim();
    const hasActiveMod = (!isDone && Boolean(t.modification_requested_at || t.returned_to_employee_at || (modNotes && !isSubmitted)));
    if (hasActiveMod && t.modification_deadline) {
      const mStr = String(t.modification_deadline).slice(0, 10);
      try {
        const today = new Date();
        today.setHours(0,0,0,0);
        const parts = mStr.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          d.setHours(0,0,0,0);
          const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) return `<span class="bg-rose-600 text-white px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">⏰ تسليم التعديل اليوم! (${mStr})</span>`;
          if (diffDays === 1) return `<span class="bg-amber-500 text-white px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">⏳ تسليم التعديل غداً (${mStr})</span>`;
          if (diffDays < 0) return `<span class="bg-rose-600 text-white px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1 animate-pulse">🚨 متأخر عن موعد التعديل! (${mStr})</span>`;
          return `<span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold font-mono text-[11px]">✍️ تعديل (${mStr} - باقي ${diffDays} يوم)</span>`;
        }
      } catch(e){}
    }

    if (isDone || isSubmitted) {
      let isOnTime = (t.kpis && typeof t.kpis.is_on_time === 'boolean') ? t.kpis.is_on_time : null;
      if (isOnTime === null && t.submitted_at && dStr) {
        const subDate = String(t.submitted_at).slice(0, 10);
        const dlDate = String(dStr).slice(0, 10);
        isOnTime = subDate <= dlDate;
      }

      if (isOnTime === true) {
        return `<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">✅ تم التسليم في الموعد (${dStr})</span>`;
      }
      if (isOnTime === false) {
        return `<span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">⚠️ تم التسليم بعد الموعد (${dStr})</span>`;
      }
      if (isDone) {
        return `<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">✅ معتمدة ومكتملة (${dStr})</span>`;
      }
      return `<span class="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">📤 تم التسليم / قيد المراجعة (${dStr})</span>`;
    }
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setHours(0,0,0,0);
        const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return `<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">🚨 اليوم (${dStr})</span>`;
        if (diffDays === 1) return `<span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">⏰ غداً (${dStr})</span>`;
        if (diffDays < 0) return `<span class="bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md font-bold font-mono text-[11px] inline-flex items-center gap-1">⚠️ متأخرة عن الموعد (${dStr})</span>`;
        return `<span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold font-mono text-[11px]">${dStr} (باقي ${diffDays} يوم)</span>`;
      }
    } catch(e) {}
    return `<span class="font-bold font-mono text-xs">${esc(dStr)}</span>`;
  };


  const actionBtns = (t) => {
    const s = t.status || '';
    const hasActiveRev = (t.subtasks && t.subtasks.some(st => st && (st.type === 'revision' || st.is_subtask) && !st.submitted_at)) || Boolean(t.modification_requested_at && !t.submitted_at);
    if (/In Progress|Revision|Changes/i.test(s) || hasActiveRev) return `<button onclick="submitMyTask('${esc(t.task_id)}')" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer flex items-center gap-1"><span>✅ سلّمت وخلصت</span></button>`;
    if (/Assigned/i.test(s)) return `<button onclick="startMyTask('${esc(t.task_id)}')" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer flex items-center gap-1"><span>⏱️ بدأت العمل</span></button>`;
    if (/Awaiting|Submitted|Review/i.test(s)) return `<button onclick="requestReturnMyTask('${esc(t.task_id)}')" class="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs cursor-pointer flex items-center gap-1" title="استرجاع المهمة للتعديل"><span>↩️ استرجاع للتعديل</span></button>`;
    if (/Completed|مكتمل/i.test(s)) return `<button onclick="requestReturnMyTask('${esc(t.task_id)}')" class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition shadow-2xs cursor-pointer flex items-center gap-1" title="طلب إعادة فتح واسترجاع المهمة للتعديل"><span>↩️ طلب تعديل</span></button>`;
    return '';
  };
  const driveThumb = (u) => {
    u = (u || '').toString();
    if (!/drive\.google\.com|googleusercontent\.com/.test(u)) return u;
    const m = u.match(/\/file\/d\/([^/]+)/) || u.match(/[?&]id=([^&]+)/) || u.match(/thumbnail\?id=([^&]+)/);
    return m ? ('https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w600') : u;
  };

  const renderTaskMaterialsBox = (t) => {
    const allUrls = [];
    const addUrl = (u) => {
      if (!u || typeof u !== 'string') return;
      const clean = u.trim().replace(/[.,;:)\]]+$/, '');
      if (/^https?:\/\//i.test(clean) && !allUrls.includes(clean)) {
        allUrls.push(clean);
      }
    };

    if (Array.isArray(t.media_urls)) t.media_urls.forEach(addUrl);
    else if (typeof t.media_urls === 'string') addUrl(t.media_urls);
    if (Array.isArray(t.reference_links)) t.reference_links.forEach(addUrl);
    else if (typeof t.reference_links === 'string') addUrl(t.reference_links);

    addUrl(t.reference_link);
    addUrl(t.materials_url);
    addUrl(t.materials_link);
    addUrl(t.plan_drive_link);
    addUrl(t.drive_plan_url);
    if (!t.deliverables || !t.deliverables.length) {
      if (!/Submitted|Awaiting|Review|Completed/i.test(t.status || '')) {
        addUrl(t.drive_link);
      }
    }

    if (t.content_data) {
      if (Array.isArray(t.content_data.reference_links)) t.content_data.reference_links.forEach(addUrl);
      if (Array.isArray(t.content_data.reference_images)) t.content_data.reference_images.forEach(addUrl);
      addUrl(t.content_data.reference_link);
    }
    if (t.video_data) {
      if (Array.isArray(t.video_data.reference_links)) t.video_data.reference_links.forEach(addUrl);
      addUrl(t.video_data.reference_link);
      if (typeof t.video_data.script === 'string') {
        (t.video_data.script.match(/https?:\/\/[^\s"'<>]+/gi) || []).forEach(addUrl);
      }
    }
    if (t.graphic_data) {
      if (Array.isArray(t.graphic_data.reference_links)) t.graphic_data.reference_links.forEach(addUrl);
      if (Array.isArray(t.graphic_data.reference_images)) t.graphic_data.reference_images.forEach(addUrl);
      addUrl(t.graphic_data.reference_link);
    }

    const textBlob = [t.caption, t.description, t.visual_idea, t.design_brief, t.note].filter(Boolean).join(' ');
    const matchedUrls = textBlob.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    matchedUrls.forEach(addUrl);

    if (!allUrls.length) return '';

    const driveLinks = [];
    const otherLinks = [];
    const directImages = [];

    allUrls.forEach(u => {
      const uLow = u.toLowerCase();
      if (/drive\.google\.com|docs\.google\.com/i.test(uLow)) {
        driveLinks.push(u);
      } else if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(uLow) || u.startsWith('data:image/')) {
        directImages.push(u);
      } else {
        otherLinks.push(u);
      }
    });

    let html = '';

    // 1) PROMINENT GOOGLE DRIVE MATERIALS BANNER
    if (driveLinks.length > 0) {
      html += `
        <div class="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 space-y-3 shadow-xs">
          <div class="flex items-center justify-between font-bold text-xs text-emerald-950 flex-wrap gap-2 border-b border-emerald-200/80 pb-2">
            <span class="flex items-center gap-2">
              <span class="text-xl">📁</span>
              <span class="font-extrabold text-sm sm:text-base text-emerald-950">مجلد الماتريال والمحتوى المطلوب (Google Drive):</span>
            </span>
            <span class="bg-emerald-600 text-white text-[11px] px-3 py-0.5 rounded-full font-bold shadow-2xs">المواد الخام وملفات العمل ↗</span>
          </div>
          <div class="space-y-2">
            ${driveLinks.map((u, i) => `
              <div class="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-300 shadow-2xs flex-wrap">
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                  <span class="text-xl shrink-0">${u.includes('/folders/') ? '📂' : '📄'}</span>
                  <div class="min-w-0 flex-1">
                    <div class="font-extrabold text-xs text-emerald-950">${u.includes('/folders/') ? 'مجلد Google Drive للمواد الخام والتسجيلات' : 'ملف / مستند الماتريال على Google Drive'}</div>
                    <a href="${esc(u)}" target="_blank" dir="ltr" class="text-[11px] text-emerald-700 hover:text-emerald-900 font-mono hover:underline truncate block max-w-sm sm:max-w-lg mt-0.5">${esc(u)}</a>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <a href="${esc(u)}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer">
                    <span>📁 فتح على Google Drive ↗</span>
                  </a>
                  <button type="button" onclick="copyTaskDriveLink('${esc(u)}', this)" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs py-2 px-3 rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer">
                    <span>📋 نسخ الرابط</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 2) OTHER REFERENCE LINKS (Pinterest, YouTube, Behance, Social Media)
    if (otherLinks.length > 0) {
      html += `
        <div class="bg-violet-50/70 border border-violet-200 rounded-xl p-3 text-xs space-y-2 shadow-2xs">
          <div class="font-bold text-[11px] text-violet-900 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-violet-600 inline-block shrink-0"></span>
            <span>🔗 روابط ومراجع إضافية للبوست:</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            ${otherLinks.map((u, idx) => {
              const uLow = u.toLowerCase();
              const label = uLow.includes('pinterest') || uLow.includes('pin.it') ? '📌 Pinterest' :
                            uLow.includes('facebook.com') || uLow.includes('fb.watch') ? '📹 فيديو Facebook' :
                            uLow.includes('instagram.com') ? '📸 Instagram Reels' :
                            uLow.includes('tiktok.com') ? '🎵 TikTok' :
                            uLow.includes('youtube') || uLow.includes('youtu.be') ? '🎬 YouTube' :
                            uLow.includes('behance') ? '🎨 Behance' : (`🔗 مرجع خارجي #${idx + 1}`);
              return `
                <a href="${esc(u)}" target="_blank" class="inline-flex items-center gap-1.5 bg-white hover:bg-violet-100 text-violet-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-violet-300 transition shadow-2xs">
                  <span>${esc(label)} ↗</span>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // 3) DIRECT IMAGE THUMBNAILS (if any)
    if (directImages.length > 0) {
      html += `
        <div class="bg-blue-50/50 border border-blue-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
          <div class="font-bold text-[11px] text-blue-900 flex items-center gap-1.5">
            <span>🖼️ صور ومراجع مرفقة (${directImages.length}):</span>
          </div>
          <div class="flex gap-2 flex-wrap pt-1">
            ${directImages.slice(0, 6).map((u, idx) => `
              <a href="${esc(u)}" target="_blank" class="block w-16 h-16 rounded-xl border border-blue-200 overflow-hidden bg-white shadow-2xs hover:scale-105 transition" title="صورة ${idx + 1}">
                <img src="${esc(u)}" class="w-full h-full object-cover" loading="lazy" onerror="this.parentNode.style.display='none'">
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }

    return html;
  };
  const refThumbs = (t) => renderTaskMaterialsBox(t);
  const canWork = (t) => /Assigned|In Progress/i.test(t.status||'');

  // Sort tasks by priority: Active work (In Progress -> Assigned) first, then Submitted / In Review, then Completed
  filtered.sort((a, b) => {
    const stageRank = (t) => {
      const s = (t.status || '').toLowerCase();
      if (s === 'in progress') return 1;
      if (s === 'assigned') return 2;
      if (/awaiting|submitted|review|مراجعة/.test(s) || Boolean(t.submitted_at)) return 3;
      if (/completed|مكتمل|approved/.test(s)) return 4;
      return 2;
    };

    const aRank = stageRank(a);
    const bRank = stageRank(b);
    if (aRank !== bRank) return aRank - bRank;

    // 2. Compare delivery deadline (earliest dates first within same stage)
    const aDate = String(a.delivery_deadline || a.publish_date || a.scheduled_start_date || '').trim();
    const bDate = String(b.delivery_deadline || b.publish_date || b.scheduled_start_date || '').trim();

    if (aDate && bDate) {
      if (aDate !== bDate) return aDate.localeCompare(bDate);
    } else if (aDate && !bDate) {
      return -1;
    } else if (!aDate && bDate) {
      return 1;
    }

    // 3. Natural sequence within same deadline
    const aSeq = parseInt(a.post_number_in_plan || a.post_number || 0, 10) || 0;
    const bSeq = parseInt(b.post_number_in_plan || b.post_number || 0, 10) || 0;
    if (aSeq !== bSeq) return aSeq - bSeq;

    return String(a.task_id || '').localeCompare(String(b.task_id || ''));
  });

  if (!filtered.length) {
    if (!allTasks.length) {
      box.innerHTML = `<div class="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
        <div class="text-2xl">✨</div>
        <div class="font-bold text-slate-800 text-sm">لا توجد مهام مسندة إليك شخصياً حالياً</div>
        <p class="text-[11px] text-slate-500 max-w-md mx-auto">أنت غير مسند إليك مهام تصميم أو كتابة في الوقت الحالي. يمكنك استخدام القائمة المنسدلة بالأعلى لاستعراض مهام أي موظف في الفريق أو الانتقال للوحة إدارة المهام.</p>
      </div>`;
    } else {
      box.innerHTML = `<div class="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border-2 border-slate-200 space-y-1 shadow-xs">
        <div class="font-bold text-slate-800 text-sm">💾 لا توجد مهام تطابق الفلاتر المحددة حالياً</div>
        <p class="text-[11px] text-slate-500">كافة مهامك محفوظة بأمان. يمكنك الضغط على «الكل» لعرض كافة المهام المسندة إليك.</p>
        <button type="button" onclick="setMyPortalStatusFilter('all'); setMyPortalDueFilter('all');" class="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs">عرض كل المهام</button>
      </div>`;
    }
    return;
  }

  const getStatusBorderClass = (t) => {
    if (t.is_subtask) return 'border-r-[6px] border-r-amber-500 bg-amber-50/20 border-amber-300';
    const s = (t.status || '').trim();
    if (/Completed|مكتمل|Approved/i.test(s)) return 'border-r-[6px] border-r-emerald-500';
    if (/In Progress/i.test(s)) return 'border-r-[6px] border-r-blue-600';
    if (/Awaiting|Submitted|Review/i.test(s)) return 'border-r-[6px] border-r-purple-600';
    if (/Changes Requested|تعديل/i.test(s)) return 'border-r-[6px] border-r-rose-600';
    if (/Assigned/i.test(s)) return 'border-r-[6px] border-r-indigo-500';
    return 'border-r-[6px] border-r-amber-500';
  };

  box.innerHTML = filtered.map(t => {
    const isSub = Boolean(t.is_subtask);
    const rawCid = (t.client_id || '').trim();
    const rawCName = (t.client_name && t.client_name !== 'None' && t.client_name !== 'null' && t.client_name !== 'عميل عام') ? t.client_name :
                     ((rawCid && rawCid !== 'cli_general') ? rawCid.replace(/^cli_/, '').replace(/_\d+$/, '').replace(/_/g, ' ') : 'العميل');
    const cDisplay = (rawCid && rawCName && rawCid !== rawCName) ? (`[${esc(rawCid)}] ${esc(rawCName)}`) : esc(rawCName);
    const pName = esc(t.plan_name || t.file_name || ('خطة ' + rawCName));
    const rawAmId = (t.am_id || '').trim();
    const rawAmName = (t.am_name || 'حبيبه أحمد محمد').trim();
    const amDisplay = rawAmId ? (`[${esc(rawAmId)}] ${esc(rawAmName)}`) : esc(rawAmName);
    const rawCap = (t.caption || (t.content_data && t.content_data.caption) || t.description || '').trim();
    const cleanCap = rawCap.replace(/^(كابشن|الكابشن|نص المنشور|نص البوست|الكابشن النهائي|Caption)\s*[:：\-–—]\s*/i, '').trim();
    const visIdea = (t.visual_idea || (t.content_data && t.content_data.visual_idea) || (t.graphic_data && t.graphic_data.idea) || (t.video_data && t.video_data.idea) || t.design_brief || '').trim();

    const isTitleExactCap = Boolean(cleanCap) && (String(t.title||'').trim() === cleanCap.trim());
    const portalHeading = isSub ? (t.title || `تعديل فرعي #${t.revision_number || 1}`) :
      (isTitleExactCap ? ('منشور #' + (t.post_number_in_plan || t.post_number || 1) + (rawCName ? (' — ' + rawCName) : '')) : (t.title || 'منشور #' + (t.post_number_in_plan || t.post_number || 1)));

    const isDetailed = (currentPortalCardViewMode === 'detailed');

    const portalDriveLinks = [];
    const chkDrive = (u) => {
      if (typeof u === 'string' && /drive\.google\.com/i.test(u)) {
        const clean = u.trim().replace(/[.,;:)\]]+$/, '');
        if (!portalDriveLinks.includes(clean)) portalDriveLinks.push(clean);
      }
    };
    chkDrive(t.drive_link);
    if (Array.isArray(t.deliverables)) t.deliverables.forEach(d => chkDrive(d.url || d.drive_link || d));
    if (Array.isArray(t.media_urls)) t.media_urls.forEach(chkDrive);
    if (Array.isArray(t.reference_links)) t.reference_links.forEach(chkDrive);
    chkDrive(t.reference_link);

    const capSnippetHtml = cleanCap ? `
      <div class="text-[12px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 select-text" title="مقتطف من الكابشن">
        ${esc(cleanCap.slice(0, 160))}${cleanCap.length > 160 ? '...' : ''}
      </div>
    ` : (visIdea ? `
      <div class="text-[12px] text-purple-900 line-clamp-2 leading-relaxed bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/60 select-text" title="فكرة التصميم">
        💡 ${esc(visIdea.slice(0, 160))}${visIdea.length > 160 ? '...' : ''}
      </div>
    ` : '');

    const quickChipsHtml = `
      <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
        ${portalDriveLinks.length ? `
          <a href="${esc(portalDriveLinks[0])}" target="_blank" class="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition shadow-2xs">
            <span>📁 Drive ↗</span>
          </a>
        ` : ''}
        ${cleanCap ? `
          <button type="button" onclick="copyTaskCaption('${esc(t.task_id)}', this)" class="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs transition cursor-pointer">
            <span>📋 نسخ الكابشن</span>
          </button>
        ` : ''}
        ${(Array.isArray(t.reference_links) && t.reference_links.length) ? `
          <span class="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">🔗 ${t.reference_links.length} مراجع</span>
        ` : ''}
      </div>
    `;

    const fastActionRowHtml = `
      <div class="grid grid-cols-2 gap-2 pt-1">
        ${canWork(t) ? `
          <button type="button" onclick="submitMyTask('${esc(t.task_id)}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span>✅ سلّمت وخلصت</span>
          </button>
        ` : (t.status === 'Assigned' ? `
          <button type="button" onclick="startMyTask('${esc(t.task_id)}')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span>⏱️ بدأت العمل</span>
          </button>
        ` : `
          <button type="button" onclick="requestReturnMyTask('${esc(t.task_id)}')" class="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer" title="استرجاع المهمة للتعديل">
            <span>↩️ طلب استرجاع</span>
          </button>
        `)}
        <button type="button" id="btn-portal-details-${esc(t.task_id)}" onclick="togglePortalCardDetails('${esc(t.task_id)}')" class="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
          <span>${isDetailed ? '👁️ إخفاء التفاصيل والماتريال ▲' : '👁️ كامل التفاصيل والماتريال ▼'}</span>
        </button>
      </div>
    `;

    return `
    <div class="portal-task-card border-2 ${isSub ? 'border-amber-400 bg-amber-50/10' : 'border-slate-300'} hover:border-blue-400 bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden mb-5 box-border ${getStatusBorderClass(t)}">
      <!-- Card Header Strip -->
      <div class="${isSub ? 'bg-amber-100/70 border-amber-200' : 'bg-slate-50/95 border-slate-200'} border-b px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-1.5 flex-wrap">
          ${isSub ? `
            <span class="bg-amber-600 text-white font-extrabold font-mono text-xs px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1"><span>🔄</span> <span>تعديل فرعي #${t.revision_number || 1}</span></span>
            <span class="font-mono font-bold text-xs bg-amber-950 text-amber-100 px-2.5 py-1 rounded-lg border border-amber-800">${esc(t.task_id||'')}</span>
            <span class="bg-white text-amber-950 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">🔗 تابعة للمهمة: [${esc(t.parent_task_id || '')}]</span>
          ` : `
            <span class="bg-blue-600 text-white font-bold font-mono text-xs px-2.5 py-1 rounded-lg shadow-2xs">#${esc(t.post_number_in_plan || t.post_number || 1)}</span>
            <span class="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg">${esc(t.task_id||'')}</span>
          `}
          <span class="bg-white text-slate-800 border border-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">🏢 ${cDisplay}</span>
          <span class="bg-white text-slate-800 border border-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">📑 ${pName}</span>
          <span class="bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-bold px-2.5 py-1 rounded-lg">👤 AM: ${amDisplay}</span>
          ${(t.secondary_assignee_name || t.secondary_employee_id) ? `
            <span class="bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs" title="هذه المهمة عمل مشترك بين شخصين">
              👥 عمل مشترك: ${t.assigned_employee_id ? `[${esc(t.assigned_employee_id)}] ` : ''}${esc(t.assignee_name || 'المنفذ الأول')} + ${t.secondary_employee_id ? `[${esc(t.secondary_employee_id)}] ` : ''}${esc(t.secondary_assignee_name || 'شريك العمل')}
            </span>
          ` : ''}
          ${t.submitted_by ? `
            <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-md" title="الشخص الذي قام بتسليم العمل">
              👤 سلمه: ${esc(t.submitted_by)}
            </span>
          ` : ''}
          <span class="bg-amber-50 text-amber-950 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs" title="موعد تسليم العمل">
            <span>📅 التسليم:</span>
            ${formatDeadline(t)}
          </span>
        </div>
        <div class="flex items-center gap-2">
          ${statusBadge(t)}
          ${actionBtns(t)}
        </div>
      </div>

      <!-- Card Body Content -->
      <div class="p-4 sm:p-5 space-y-3.5 bg-white">
        ${isSub ? `
          <div class="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-400 rounded-2xl p-4 space-y-2.5 shadow-xs">
            <div class="flex items-center justify-between font-black text-xs text-rose-950 border-b border-rose-200/80 pb-2 flex-wrap gap-2">
              <span class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-ping"></span>
                <span class="text-sm font-black text-rose-950">⚠️ سبب وملاحظات التعديل المطلوب من مدير الحساب (AM):</span>
              </span>
              <span class="bg-rose-600 text-white text-[11px] px-3 py-1 rounded-xl font-mono font-bold shadow-2xs">
                📅 موعد تسليم التعديل: ${esc(t.delivery_deadline || t.modification_deadline || 'غداً')}
              </span>
            </div>
            <div class="text-xs sm:text-sm text-slate-950 font-bold bg-white p-3.5 rounded-xl border border-rose-200 whitespace-pre-wrap leading-relaxed shadow-2xs select-all">
              ${esc(t.revision_reason || t.review_note || t.notes || 'يرجى مراجعة التعديلات المطلوبة وتحديث المطلوب')}
            </div>
          </div>
        ` : (t.review_note || t.modification_request) && !/Completed|مكتمل|Approved/i.test(t.status||'') ? `
          <div class="bg-rose-50 border-2 border-rose-400 rounded-xl p-3.5 text-xs text-rose-950 space-y-2 shadow-xs">
            <div class="flex items-center justify-between font-bold text-xs text-rose-900 border-b border-rose-200 pb-1.5 flex-wrap gap-1">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-ping"></span>
                <span class="font-bold text-xs sm:text-sm">✍️ مطلوب تعديل من مدير الحسابات (AM):</span>
              </span>
              ${t.modification_deadline ? `<span class="text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded font-mono font-bold">موعد تسليم التعديل: ${esc(String(t.modification_deadline).slice(0, 10))}</span>` : ''}
            </div>
            <div class="text-xs text-rose-950 font-bold bg-white p-3 rounded-lg border border-rose-200 whitespace-pre-wrap leading-relaxed shadow-2xs select-all">
              ${esc(t.review_note || t.modification_request)}
            </div>
          </div>
        ` : ''}

        ${(!isSub && t.active_subtask_id && !/Completed|مكتمل|Approved/i.test(t.status||'')) ? `
          <div class="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 text-xs font-bold text-amber-950">
              <span class="text-base">🔄</span>
              <span>هذه المهمة قيد التعديل حالياً عبر المهمة الفرعية: <b class="font-mono bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">${esc(t.active_subtask_id)}</b></span>
            </div>
            <button type="button" onclick="setMyPortalStatusFilter('revisions')" class="text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg shadow-2xs transition cursor-pointer">عرض التعديل ↗</button>
          </div>
        ` : ''}

        <h4 class="font-bold text-sm sm:text-base text-slate-900 leading-snug">${esc(portalHeading)}</h4>

        ${capSnippetHtml}
        ${quickChipsHtml}
        ${fastActionRowHtml}

        <!-- Collapsible Details Accordion -->
        <div id="portal-task-details-${esc(t.task_id)}" class="card-details-panel ${isDetailed ? 'expanded' : 'collapsed'} space-y-3.5 pt-3 border-t border-slate-200/80" ${isDetailed ? '' : 'style="display:none;"'}>
          ${cleanCap ? `
            <div class="bg-blue-50/60 border border-blue-200/90 rounded-xl p-3 text-xs space-y-2 shadow-2xs">
              <div class="flex items-center justify-between font-bold text-[11px] text-blue-950 border-b border-blue-200/60 pb-1.5">
                <span class="flex items-center gap-1.5 text-blue-900 font-bold">
                  <span class="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0"></span>
                  <span>📝 الكابشن النهائي (Final Caption):</span>
                </span>
                <button type="button" onclick="copyTaskCaption('${esc(t.task_id)}', this)" class="bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold py-1 px-2.5 rounded border border-blue-200 shadow-2xs transition cursor-pointer">📋 نسخ الكابشن</button>
              </div>
              <div class="text-xs text-slate-900 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed bg-white p-2.5 rounded-lg border border-blue-100 select-all">${esc(cleanCap)}</div>
            </div>
          ` : ''}

          ${(visIdea && visIdea !== t.title && visIdea !== cleanCap) ? `
            <div class="bg-purple-50/70 border border-purple-200/90 rounded-xl p-3 text-xs text-purple-950 space-y-1.5 shadow-2xs">
              <div class="font-bold text-[11px] text-purple-900 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-purple-600 inline-block shrink-0"></span>
                <span>💡 فكرة وتوجيهات التصميم / الإسكربت (Creative Brief):</span>
              </div>
              <div class="leading-relaxed text-[11px] whitespace-pre-wrap font-medium text-slate-800">${esc(visIdea)}</div>
            </div>
          ` : ''}

          ${renderTaskMaterialsBox(t)}

          <div class="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 flex-wrap">
            <span class="flex items-center gap-1.5 font-bold text-slate-800">
              <span>📅 موعد التسليم:</span>
              ${formatDeadline(t)}
            </span>
            ${t.review_note ? `<span class="text-[11px] text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✍️ ملاحظة المراجعة: ${esc(t.review_note)}</span>` : ''}
          </div>

          ${(() => {
            const dList = Array.isArray(t.deliverables) ? t.deliverables : [];
            const dLink = (t.drive_link || '').trim();
            const dNotes = (t.delivery_notes || t.deliverables_notes || t.notes || '').trim();
            if (!dList.length && !dLink && !dNotes) return '';

            let dBox = '<div class="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border border-emerald-300 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">';
            dBox += '<div class="flex items-center justify-between font-bold text-xs text-emerald-950 border-b border-emerald-200/80 pb-1.5">';
            dBox += '<span class="flex items-center gap-1.5">📦 <span>مخرجات وتسليمات العمل (Google Drive):</span></span>';
            dBox += '<span class="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-2xs">جاهز للاستعراض ↗</span>';
            dBox += '</div>';

            if (dList.length > 0) {
              dBox += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">';
              dList.forEach((df, idx) => {
                const u = df.url || df.drive_link || df;
                const name = df.filename || `ملف تسليم #${idx+1}`;
                const isVid = (df.mime && df.mime.startsWith('video')) || /\.(mp4|mov|webm)(\?|$)/i.test(name);
                const isPdf = (df.mime && df.mime.includes('pdf')) || /\.pdf(\?|$)/i.test(name);
                dBox += `<a href="${esc(u)}" target="_blank" class="bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded-xl p-2 text-right transition flex items-center gap-2 shadow-2xs group">
                  <span class="text-base shrink-0">${isVid ? '🎬' : (isPdf ? '📄' : '🖼️')}</span>
                  <div class="min-w-0 flex-1">
                    <div class="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-900">${esc(name)}</div>
                    <div class="text-[10px] text-emerald-700 font-mono">${isVid ? '▶️ تشغيل الفيديو على Drive ↗' : (isPdf ? 'استعراض PDF على Drive ↗' : 'فتح على Drive ↗')}</div>
                  </div>
                </a>`;
              });
              dBox += '</div>';
            }

            if (dLink && !dList.some(d => (d.url || d) === dLink)) {
              const isVid = t.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(dLink);
              const isPdf = t.media_type === 'pdf' || /\.pdf(\?|$)/i.test(dLink);
              dBox += `<div class="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 flex-wrap shadow-2xs">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="text-base shrink-0">${isVid ? '🎬' : (isPdf ? '📄' : '📁')}</span>
                  <div class="min-w-0 flex-1">
                    <div class="font-bold text-xs text-slate-900">${isVid ? 'فيديو المخرجات المسلّم' : (isPdf ? 'ملف PDF المسلّم' : 'رابط التسليم المسجّل')}</div>
                    <div class="text-[10px] font-mono text-emerald-700 truncate">${esc(dLink)}</div>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <a href="${esc(dLink)}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xs transition flex items-center gap-1">
                    <span>${isVid ? '▶️ تشغيل ↗' : 'فتح على Drive ↗'}</span>
                  </a>
                  <button type="button" onclick="copyTaskDriveLink('${esc(dLink)}')" class="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-1.5 px-2.5 rounded-lg shadow-2xs transition">
                    <span>📋</span>
                  </button>
                </div>
              </div>`;
            }

            if (dNotes) {
              dBox += `<div class="bg-white/90 p-2.5 rounded-xl border border-emerald-100 text-slate-800 text-xs space-y-0.5">
                <div class="font-bold text-[10px] text-emerald-900">📝 ملاحظات التسليم:</div>
                <div class="whitespace-pre-wrap leading-relaxed">${esc(dNotes)}</div>
              </div>`;
            }

            dBox += '</div>';
            return dBox;
          })()}

          ${(() => {
            const revs = (t.subtasks || []).filter(st => st && (st.type === 'revision' || st.is_subtask));
            if (!revs.length) return '';
            return `<div class="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-2 mt-2">
              <div class="flex items-center justify-between text-xs font-bold text-amber-900">
                <span class="flex items-center gap-1.5"><span>🔄</span> مهام التعديل الفرعية (${revs.length})</span>
                <span class="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-mono border border-amber-300">ديدلاين التعديل: ${esc(t.modification_deadline || revs[revs.length-1].delivery_deadline || 'غداً')}</span>
              </div>
              <div class="space-y-1.5">
                ${revs.map((st, idx) => `
                  <div class="bg-white/95 p-2 rounded-xl border border-amber-100 text-xs flex items-center justify-between gap-2">
                    <div class="space-y-0.5 min-w-0">
                      <div class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                        <span class="bg-amber-100 text-amber-900 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold">${esc(st.subtask_id || `تعديل #${idx+1}`)}</span>
                        <span class="truncate">${esc(st.title || st.notes || 'طلب تعديل')}</span>
                      </div>
                      ${st.delivery_deadline ? `<div class="text-[10px] text-slate-500 font-mono">📅 موعد التسليم: ${esc(st.delivery_deadline)}</div>` : ''}
                    </div>
                    <div class="shrink-0 text-[10px] font-bold">
                      ${st.status === 'Completed' ? '<span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">✅ مكتمل</span>' :
                        st.submitted_at ? '<span class="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">📤 تم تسليمه</span>' :
                        '<span class="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">⏱️ قيد التعديل</span>'}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>`;
          })()}

          <!-- Secondary Actions and Accordion Collapse -->
          <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" onclick="openTaskContentEditorModal('${esc(t.task_id)}')" class="bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold py-2 px-3.5 rounded-xl border border-amber-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <span>✍️ تعديل نصوص وكابشن البوست</span>
              </button>
              <button type="button" onclick="requestReturnMyTask('${esc(t.task_id)}')" class="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer" title="استرجاع المهمة لقيد التنفيذ لإجراء تعديلات عليها">
                <span>↩️ طلب استرجاع للتعديل</span>
              </button>
            </div>
            <button type="button" onclick="togglePortalCardDetails('${esc(t.task_id)}')" class="text-xs font-bold text-slate-500 hover:text-slate-800 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer">
              ▲ طي وإخفاء التفاصيل
            </button>
          </div>
        </div>
      </div>

      <!-- Card Status Footer Strip -->
      <div class="bg-slate-50/80 border-t border-slate-200/80 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-[11px] font-bold text-slate-500">
        <span class="flex items-center gap-1.5">
          ${/Completed|مكتمل/i.test(t.status||'') ? '✅ تم إنجاز المهمة واعتمادها بنجاح' :
            /Awaiting|Submitted|Review/i.test(t.status||'') ? '📤 تم تسليم العمل — بانتظار مراجعة وقرار مدير الحسابات (AM)' :
            /In Progress/i.test(t.status||'') ? '⏱️ قيد العمل الحالي — سلّم العمل عند الانتهاء' :
            '📌 مهمة جديدة مسندة إليك'}
        </span>
        <button type="button" onclick="togglePortalCardDetails('${esc(t.task_id)}')" class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
          ${isDetailed ? 'إخفاء التفاصيل والماتريال ▲' : 'استعراض كامل التفاصيل والماتريال ▼'}
        </button>
      </div>
    </div>`;
  }).join('');
}

let myPortalTargetEid = 'me';

async function switchMyPortalEmployee(eid) {
  myPortalTargetEid = eid;
  loadMyPortal();
}
window.switchMyPortalEmployee = switchMyPortalEmployee;

function toggleMyAttendanceAccordion() {
  const body = document.getElementById('my-attendance-collapse-body');
  const arrow = document.getElementById('my-attendance-arrow');
  const badge = document.getElementById('my-attendance-badge');
  const header = document.getElementById('my-attendance-toggle-header');
  if (!body) return;

  const isClosed = body.classList.contains('hidden');
  if (isClosed) {
    body.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
    if (badge) {
      badge.innerHTML = '<span>مفتوح</span> ▴';
      badge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 inline-flex items-center gap-1 transition-all';
    }
    if (header) header.classList.add('bg-blue-50/40');
  } else {
    body.classList.add('hidden');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
    if (badge) {
      badge.innerHTML = '<span>مغلق</span> ▾';
      badge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1 transition-all';
    }
    if (header) header.classList.remove('bg-blue-50/40');
  }
}
window.toggleMyAttendanceAccordion = toggleMyAttendanceAccordion;

function updatePlanFileNameLabel(input) {
  const label = document.getElementById('plan-file-chosen-label');
  if (label && input && input.files && input.files.length > 0) {
    const file = input.files[0];
    const safeName = (typeof esc === 'function') ? esc(file.name) : file.name;
    label.innerHTML = '📄 <span class="text-blue-700 font-bold">' + safeName + '</span> (' + Math.round(file.size / 1024) + ' KB)';
  }
}
window.updatePlanFileNameLabel = updatePlanFileNameLabel;

async function loadMyPortal() {
  const nameEl = document.getElementById('myportal-name');
  let isAdm = false;
  try {
    const me = window._me || await safeFetchJson('/api/me');
    isAdm = me && (me.is_admin || me.role === 'admin');
    const dispName = (me.name || me.full_name || me.employee_name || me.username || '').trim();
    if (nameEl) nameEl.textContent = 'أهلاً ' + dispName;
  } catch(e) {}

  // Admin Switcher setup
  const empSwitcher = document.getElementById('myportal-emp-switcher-container');
  if (empSwitcher) {
    if (isAdm) {
      empSwitcher.classList.remove('hidden');
      const empSelect = document.getElementById('myportal-emp-switcher');
      if (empSelect && empSelect.options.length <= 2) {
        try {
          const empsRes = await safeFetchJson('/api/tasks/employees');
          const emps = (empsRes && empsRes.employees) ? empsRes.employees : [];
          empSelect.innerHTML = '<option value="me">👤 مهامي الشخصية فقط</option>' +
            '<option value="all">👥 جميع مهام الفريق (عرض الإدارة الكامل)</option>' +
            emps.map(e => `<option value="${esc(e.employee_id || e.name)}"${myPortalTargetEid === (e.employee_id || e.name) ? ' selected' : ''}>👤 [${esc(e.employee_id)}] ${esc(e.name)} (${esc(e.role || 'موظف')})</option>`).join('');
          empSelect.value = myPortalTargetEid || 'me';
        } catch(e) {}
      }
    } else {
      empSwitcher.classList.add('hidden');
    }
  }
  
  // My tasks
  try {
    const url = (isAdm && myPortalTargetEid && myPortalTargetEid !== 'me') ? 
      (myPortalTargetEid === 'all' ? '/api/me/tasks?employee_id=all' : ('/api/me/tasks?employee_id=' + encodeURIComponent(myPortalTargetEid))) 
      : '/api/me/tasks';
    
    const applyPortalTasks = (d) => {
      const tasks = (d && d.tasks) ? d.tasks : [];
      const planSeqMap = {};
      tasks.forEach(t => {
        const pkey = (t.plan_name || t.file_name || 'عام').trim();
        planSeqMap[pkey] = (planSeqMap[pkey] || 0) + 1;
        t.post_number_in_plan = planSeqMap[pkey];
      });

      myPortalTasksRaw = tasks;
      window._myPortalTasksList = tasks;

      // Populate Client & Plan dropdowns in My Portal
      const cFilter = document.getElementById('myportal-client-filter');
      const pFilter = document.getElementById('myportal-plan-filter');
      if (cFilter) {
        const cMap = {};
        tasks.forEach(t => {
          const cid = (t.client_id || '').trim();
          const cname = (t.client_name || '').trim();
          if (cid || cname) {
            const key = cid || cname;
            const text = (cid && cname && cid !== cname) ? `[${cid}] ${cname}` : (cname || cid);
            cMap[key] = { id: key, name: cname || key, text: text };
          }
        });
        cFilter.innerHTML = '<option value="all">🏢 جميع العملاء</option>' + Object.values(cMap).map(c => `<option value="${esc(c.id)}">🏢 ${esc(c.text)}</option>`).join('');
        if (myPortalClientFilter && cMap[myPortalClientFilter]) cFilter.value = myPortalClientFilter;
      }
      if (pFilter) {
        const pSet = new Set();
        tasks.forEach(t => { 
          const pn = (t.plan_name || t.file_name || '').trim();
          if (pn) pSet.add(pn); 
        });
        pFilter.innerHTML = '<option value="all">📑 جميع الخطط</option>' + Array.from(pSet).map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
        if (myPortalPlanFilter && pSet.has(myPortalPlanFilter)) pFilter.value = myPortalPlanFilter;
      }

      renderMyPortalTasks();
    };

    const d = await swrFetchJson(url, null, 'myportal_tasks_' + (myPortalTargetEid || 'me'), (cached) => {
      applyPortalTasks(cached);
    });
    if (d) applyPortalTasks(d);
  } catch(e) {
    console.error("loadMyPortal error:", e);
  }
  // My attendance
  try {
    const d = await safeFetchJson('/api/me/attendance');
    const rows = (d && d.attendance ? d.attendance : []).slice(0, 40);
    const body = document.getElementById('my-attendance-body');
    if (body) {
      body.innerHTML = rows.length ? rows.map((r, idx) => {
        const note = (r.notes || r.note || r['ملاحظات'] || '').trim();
        const dateStr = esc(r.date || '');
        const statusBadge = (r.status === 'حاضر') ? '<span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">حاضر</span>' :
                            (r.status === 'متأخر') ? '<span class="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">متأخر</span>' :
                            (r.status === 'غياب') ? '<span class="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full text-[10px]">غياب</span>' :
                            `<span class="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">${esc(r.status || '-')}</span>`;
        
        return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="p-2.5 font-mono text-slate-700 font-bold text-xs">${dateStr}</td>
          <td class="p-2.5 text-center font-mono text-slate-600 text-xs">${esc(r.checkin_time || '—')}</td>
          <td class="p-2.5 text-center font-mono text-slate-600 text-xs">${esc(r.checkout_time || '—')}</td>
          <td class="p-2.5 text-center font-mono font-bold text-slate-800 text-xs">${esc(r.hours || '0')}</td>
          <td class="p-2.5 text-center">${statusBadge}</td>
          <td class="p-2.5 text-xs text-slate-700 max-w-xs">
            <div id="att-note-display-${idx}" class="break-words ${note ? 'text-slate-800 font-medium' : 'text-slate-400 italic'}">
              ${note ? esc(note) : 'لا توجد ملاحظة'}
            </div>
          </td>
          <td class="p-2.5 text-center">
            <button type="button" onclick="editMyAttendanceNote('${escJs(r.date || '')}', ${idx})" class="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold py-1 px-2.5 rounded-lg border border-slate-200 hover:border-blue-300 transition cursor-pointer inline-flex items-center gap-1 shadow-2xs">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              <span>${note ? 'تعديل' : 'إضافة ملاحظة'}</span>
            </button>
          </td>
        </tr>`;
      }).join('') : '<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">لا توجد سجلات حضور مسجلة</td></tr>';
    }
  } catch(e) {
    console.error("Attendance load error:", e);
  }
  if (typeof initLucideIcons === 'function') initLucideIcons();
}

async function editMyAttendanceNote(dateStr, idx) {
  const currentTextEl = document.getElementById(`att-note-display-${idx}`);
  const currentText = currentTextEl && !currentTextEl.classList.contains('italic') ? currentTextEl.innerText.trim() : '';
  
  const note = prompt(`اكتب ملاحظتك أو تقرير عمل يوم (${dateStr}):`, currentText);
  if (note === null) return;
  
  try {
    showToast('جاري حفظ الملاحظة...');
    const res = await fetch('/api/me/attendance/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, note: note.trim() })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      showToast('تم حفظ الملاحظة بنجاح ', 'success');
      loadMyPortal();
    } else {
      showToast(data.error || 'تعذّر حفظ الملاحظة', 'error');
    }
  } catch(e) {
    showToast('خطأ في الاتصال بالسيرفر: ' + e.message, 'error');
  }
}
window.editMyAttendanceNote = editMyAttendanceNote;

async function startMyTask(id) {
  try {
    const r = await fetch(`/api/me/tasks/${encodeURIComponent(id)}/start`, {method:'POST'});
    if (!r.ok) { showToast('تعذّر البدء', 'error'); return; }
    showToast('بالتوفيق! ابدأ شغلك '); loadMyPortal();
  } catch(e) { showToast('خطأ', 'error'); }
}
async function submitMyTask(id) {
  showToast('جاري تسليم المهمة لمدير الحساب... ⏳');
  try {
    const r = await fetch(`/api/me/tasks/${encodeURIComponent(id)}/submit`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({notes: 'تم الإنجاز والتسليم'})
    });
    const d = await r.json();
    if (!r.ok) { showToast(d.error||'تعذّر التسليم', 'error'); return; }
    showToast('🎉 عاش! تم تسليم المهمة لمدير الحساب بنجاح ✅', 'success');
    if (typeof loadMyPortal === 'function') loadMyPortal();
    if (typeof loadTasksEngine === 'function') loadTasksEngine();
  } catch(e) { showToast('خطأ في الاتصال بالسيرفر', 'error'); }
}
window.submitMyTask = submitMyTask;

async function requestReturnMyTask(id) {
  const reason = prompt('اكتب سبب أو تفاصيل التعديل الذي ترغب في إجرائه (اختياري، اضغط موافق للاسترجاع):');
  if (reason === null) return;
  try {
    const r = await fetch(`/api/me/tasks/${encodeURIComponent(id)}/request-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: (reason || '').trim() })
    });
    const d = await r.json();
    if (!r.ok || !d.ok) {
      showToast(d.error || 'تعذّر استرجاع المهمة', 'error');
      return;
    }
    showToast(d.message || 'تم استرجاع المهمة لك بنجاح للبدء في التعديل ↩️');
    if (typeof loadMyPortal === 'function') loadMyPortal();
    if (typeof loadTasksEngine === 'function') loadTasksEngine();
  } catch(e) {
    showToast('خطأ في الاتصال بالسيرفر', 'error');
  }
}
window.requestReturnMyTask = requestReturnMyTask;

