/**
 * tasks_board.js - Kanban Tasks Board & Subtasks Engine
 * Clean Architecture Modular Feature for Meta AI Moderator.
 * Encapsulates:
 *  - Kanban Columns & 2-Tier View Mode (Compact vs Detailed)
 *  - Interactive Subtasks with Revision Reason Banners
 *  - Real-time Stage Progression & Natural Sorting
 *  - AM Review Decisions (Approve, Reject to Revision Subtask, Forward)
 *  - Bulk Actions & Board Task Assignments
 */

var currentBoardCardViewMode = (function() {
    try { return localStorage.getItem('board_card_view_mode') || 'compact'; } catch(e) { return 'compact'; }
})();

function setBoardCardViewMode(mode) {
    currentBoardCardViewMode = mode;
    try { localStorage.setItem('board_card_view_mode', mode); } catch(e){}
    renderTasksBoard();
}

window._expandedTaskCardIds = window._expandedTaskCardIds || new Set();

function toggleTaskCardDetails(taskId) {
    var sId = String(taskId);
    var el = document.getElementById('task-details-' + sId);
    var btn = document.getElementById('btn-toggle-details-' + sId);
    if (!el) return;
    var isCollapsed = el.classList.contains('collapsed') || el.style.display === 'none';
    if (isCollapsed) {
        if (el.getAttribute('data-rendered') !== 'true') {
            var allTasks = (window.tasksList && Array.isArray(window.tasksList)) ? window.tasksList : (typeof tasksList !== 'undefined' && Array.isArray(tasksList) ? tasksList : []);
            var task = allTasks.find(function(item) {
                return String(item.task_id) === sId;
            });
            if (task && typeof renderTaskCardDetailsContent === 'function') {
                el.innerHTML = renderTaskCardDetailsContent(task);
                el.setAttribute('data-rendered', 'true');
                if (window.initLucideIcons) {
                    try { initLucideIcons(el); } catch(e){}
                }
            }
        }
        el.classList.remove('collapsed');
        el.classList.add('expanded');
        el.style.display = 'block';
        if (window._expandedTaskCardIds) window._expandedTaskCardIds.add(sId);
        if (btn) btn.innerHTML = '<span>👁️ إخفاء التفاصيل والماتريال ▲</span>';
    } else {
        el.classList.remove('expanded');
        el.classList.add('collapsed');
        el.style.display = 'none';
        if (window._expandedTaskCardIds) window._expandedTaskCardIds.delete(sId);
        if (btn) btn.innerHTML = '<span>👁️ كامل التفاصيل والماتريال ▼</span>';
    }
}

window.matchTaskStatus = matchTaskStatus;
window.setTaskStatusFilter = setTaskStatusFilter;
window.setTaskSort = setTaskSort;
window.onTaskSearchInput = onTaskSearchInput;
window.setBoardCardViewMode = setBoardCardViewMode;
window.toggleTaskCardDetails = toggleTaskCardDetails;

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


function renderTaskCardDetailsContent(t) {
    if (!t) return '';
    var isSub = Boolean(t.is_subtask);
    var st = t.status || 'Pending AM Approval';
    var isSubmitted = (st === 'Awaiting AM Review' || st === 'Submitted / In Review' || st === 'Submitted' || st === 'Review Required');
    var isCompleted = (st === 'Completed' || st === 'Approved / Scheduled' || st === 'Done');

    // 1) Reference images (strictly actual images from docx / plan brief - NOT drive folders)
    var rawImgs = (t.content_data && t.content_data.reference_images && t.content_data.reference_images.length) ? t.content_data.reference_images :
                  (t.graphic_data && t.graphic_data.reference_images && t.graphic_data.reference_images.length) ? t.graphic_data.reference_images :
                  (t.media_urls && t.media_urls.length) ? t.media_urls : [];
    var refs = rawImgs.filter(function(u){
        var s = String(u || '').trim();
        return s.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(s) || (s.includes('/file/d/') && !s.includes('/folders/'));
    });
    var refsHtml = refs.length ? '<div class="bg-blue-50/60 border border-blue-200/70 rounded-xl p-2.5 space-y-1.5 shadow-2xs">' +
        '<div class="text-[11px] font-bold text-blue-900 flex items-center justify-between">' +
            '<span>🖼️ صور ومراجع البوست (' + refs.length + ' صور كاملة):</span>' +
        '</div>' +
        '<div class="flex gap-2 flex-wrap pt-0.5">' + refs.map(function(u, rIdx) {
            var isData = u.startsWith('data:image/');
            var thumbSrc = isData ? u : driveThumb(u);
            return '<a href="' + esc(u) + '" target="_blank" class="block w-16 h-16 rounded-xl border border-blue-200 overflow-hidden bg-white shadow-2xs hover:scale-105 transition" title="مرجع ' + (rIdx + 1) + '"><img src="' + esc(thumbSrc) + '" class="w-full h-full object-cover" loading="lazy" onerror="this.parentNode.innerHTML=\'🖼️\'"></a>';
        }).join('') + '</div></div>' : '';

    // 2) Reference links & Drive folders (Pinterest, Behance, YouTube, Facebook, Instagram, TikTok, Drive)
    var allRefCandidates = [];
    var addRefCandidate = function(u) {
        if (!u || typeof u !== 'string') return;
        var cl = u.trim().replace(/[.,;:)\]]+$/, '');
        if (/^https?:\/\//i.test(cl) && allRefCandidates.indexOf(cl) === -1) allRefCandidates.push(cl);
    };
    if (Array.isArray(t.reference_links)) t.reference_links.forEach(addRefCandidate);
    else if (typeof t.reference_links === 'string') addRefCandidate(t.reference_links);
    if (Array.isArray(t.media_urls)) t.media_urls.forEach(addRefCandidate);
    else if (typeof t.media_urls === 'string') addRefCandidate(t.media_urls);

    addRefCandidate(t.reference_link);
    addRefCandidate(t.materials_url);
    addRefCandidate(t.materials_link);
    addRefCandidate(t.plan_drive_link);
    addRefCandidate(t.drive_plan_url);
    addRefCandidate(t.drive_link);

    if (t.content_data) {
        if (Array.isArray(t.content_data.reference_links)) t.content_data.reference_links.forEach(addRefCandidate);
        if (Array.isArray(t.content_data.reference_images)) t.content_data.reference_images.forEach(addRefCandidate);
        addRefCandidate(t.content_data.reference_link);
    }
    if (t.video_data) {
        if (Array.isArray(t.video_data.reference_links)) t.video_data.reference_links.forEach(addRefCandidate);
        addRefCandidate(t.video_data.reference_link);
        if (typeof t.video_data.script === 'string') {
            (t.video_data.script.match(/https?:\/\/[^\s"'<>]+/gi) || []).forEach(addRefCandidate);
        }
    }
    if (t.graphic_data) {
        if (Array.isArray(t.graphic_data.reference_links)) t.graphic_data.reference_links.forEach(addRefCandidate);
        if (Array.isArray(t.graphic_data.reference_images)) t.graphic_data.reference_images.forEach(addRefCandidate);
        addRefCandidate(t.graphic_data.reference_link);
    }
    var capDescText = [t.caption, t.description, t.visual_idea, t.design_brief, t.note].filter(Boolean).join(' ');
    var matchedInText = capDescText.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    matchedInText.forEach(addRefCandidate);

    var driveMaterialLinks = [];
    var otherRefLinks = [];

    allRefCandidates.forEach(function(u) {
        var uLow = u.toLowerCase();
        if (/drive\.google\.com|docs\.google\.com/i.test(uLow)) {
            driveMaterialLinks.push(u);
        } else if (!refs.includes(u)) {
            otherRefLinks.push(u);
        }
    });

    var driveMaterialsHtml = driveMaterialLinks.length ? (
        '<div class="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 rounded-xl p-3 space-y-2 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-xs text-emerald-950 flex-wrap gap-1 border-b border-emerald-200/70 pb-1.5">' +
                '<span class="flex items-center gap-1.5">' +
                    '<span class="text-base">📁</span>' +
                    '<span class="font-extrabold text-xs text-emerald-950">مجلد الماتريال والمحتوى المطلوب (Google Drive):</span>' +
                '</span>' +
                '<span class="bg-emerald-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">المواد الخام ↗</span>' +
            '</div>' +
            '<div class="space-y-1.5">' +
                driveMaterialLinks.map(function(u) {
                    return '<div class="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs flex-wrap">' +
                        '<div class="flex items-center gap-2 min-w-0 flex-1">' +
                            '<span class="text-base shrink-0">' + (u.includes('/folders/') ? '📂' : '📄') + '</span>' +
                            '<a href="' + esc(u) + '" target="_blank" dir="ltr" class="text-[11px] text-emerald-700 hover:text-emerald-900 font-mono hover:underline truncate block max-w-xs sm:max-w-md">' + esc(u) + '</a>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5 shrink-0">' +
                            '<a href="' + esc(u) + '" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-xs transition inline-flex items-center gap-1 cursor-pointer"><span>📁 فتح على Drive ↗</span></a>' +
                            '<button type="button" onclick="copyTaskDriveLink(\'' + escJs(u) + '\', this)" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px] py-1.5 px-2.5 rounded-lg shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"><span>📋 نسخ</span></button>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>'
    ) : '';

    var links = otherRefLinks.length ?
        '<div class="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">' +
        otherRefLinks.map(function(u, idx) {
            var uLow = String(u).toLowerCase();
            var label = uLow.includes('pinterest') || uLow.includes('pin.it') ? '📌 Pinterest' :
                        uLow.includes('facebook.com') || uLow.includes('fb.watch') ? '📹 فيديو Facebook' :
                        uLow.includes('instagram.com') ? '📸 Instagram Reels' :
                        uLow.includes('tiktok.com') ? '🎵 TikTok' :
                        uLow.includes('youtube') || uLow.includes('youtu.be') ? '🎬 YouTube' :
                        uLow.includes('behance') ? '🎨 Behance' : ('🔗 ريفرنس ' + (idx + 1));
            return '<a href="' + esc(u) + '" target="_blank" class="inline-flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-violet-200 transition shadow-2xs hover:border-violet-300">' + esc(label) + ' ↗</a>';
        }).join('') + '</div>' : '';

    // Clean and extract pure final caption first
    var rawCaption = (t.caption || (t.content_data && t.content_data.caption) || t.description || '').trim();
    var cleanCaption = rawCaption.replace(/^(كابشن|الكابشن|نص المنشور|نص البوست|الكابشن النهائي|Caption)\s*[:：\-–—]\s*/i, '').trim();

    // 3) Creative Brief & Visual Idea (فكرة وتوجيهات التصميم / الإسكربت)
    var visIdea = (t.visual_idea || (t.content_data && t.content_data.visual_idea) || (t.graphic_data && t.graphic_data.idea) || (t.video_data && t.video_data.idea) || t.design_brief || '').trim();
    visIdea = visIdea.replace(/^[>›»\s*#\-–—:]+/i, '').replace(/^(brief|creative brief|فكرة البوست|توجيه التصميم)\s*[:：\-–—]\s*/i, '').trim();
    var isVisDup = !visIdea || visIdea === t.title || (Boolean(cleanCaption) && (visIdea === cleanCaption || cleanCaption.indexOf(visIdea) !== -1 || visIdea.indexOf(cleanCaption) !== -1));
    var visHtml = (!isVisDup) ?
        '<div class="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3 text-xs text-purple-950 space-y-1.5 shadow-2xs">' +
            '<div class="font-bold text-[11px] text-purple-900 flex items-center justify-between border-b border-purple-200/50 pb-1">' +
                '<span class="flex items-center gap-1.5">' +
                    '<span class="w-2 h-2 rounded-full bg-purple-600 inline-block shrink-0"></span>' +
                    '<span>💡 فكرة وتوجيهات التصميم</span>' +
                    '<span dir="ltr" class="text-[10px] text-purple-600 font-mono font-normal">(Creative Brief)</span>' +
                '</span>' +
                '<button type="button" onclick="copyTextToClipboard(\'' + escJs(visIdea) + '\', \'فكرة وتوجيهات التصميم\', this)" class="bg-white hover:bg-purple-100 text-purple-800 text-[10px] font-bold py-0.5 px-2 rounded-lg border border-purple-200 shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0" title="نسخ فكرة وتوجيهات التصميم">' +
                    '<span>📋 نسخ الفكرة</span>' +
                '</button>' +
            '</div>' +
            '<div dir="rtl" class="leading-relaxed text-[12px] whitespace-pre-wrap font-medium text-slate-800 text-right bg-white/80 p-2.5 rounded-xl border border-purple-100/80 shadow-2xs select-all">' + esc(visIdea) + '</div>' +
        '</div>' : '';

    // 4) Modification Requests & Notes (طلبات التعديل والملاحظات)
    var modNotes = (t.review_note || t.modification_request || t.changes_requested_note || t.task_notes || '').trim();
    var modHtml = modNotes ?
        '<div class="bg-rose-50/90 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-950 space-y-1 shadow-2xs">' +
            '<div class="font-bold text-[11px] text-rose-800 flex items-center justify-between">' +
                '<span class="flex items-center gap-1">✍️ طلبات التعديل والملاحظات:</span>' +
                '<div class="flex items-center gap-1.5">' +
                    '<button type="button" onclick="copyTextToClipboard(\'' + escJs(modNotes) + '\', \'ملاحظات التعديل\', this)" class="bg-white hover:bg-rose-100 text-rose-800 text-[10px] font-bold py-0.5 px-2 rounded-md border border-rose-200 transition flex items-center gap-1 cursor-pointer">📋 نسخ</button>' +
                    '<button type="button" onclick="openTaskNotesEditorModal(\'' + escJs(t.task_id) + '\')" class="text-[10px] text-rose-700 hover:text-rose-900 underline font-bold cursor-pointer">تعديل</button>' +
                '</div>' +
            '</div>' +
            '<div class="leading-relaxed text-[11px] whitespace-pre-wrap font-semibold select-all">' + esc(modNotes) + '</div>' +
        '</div>' : '';

    // 5) Employee Deliverables
    var rawNotes = (t.delivery_notes || t.deliverables_notes || (t.status === 'Submitted / In Review' ? t.notes : '') || '').trim();
    var driveLink = (t.drive_link || t.google_drive_url || t.submission_link || '').trim();
    var delivList = Array.isArray(t.deliverables) ? t.deliverables : [];

    var isDelivSubmitted = (t.status === 'Submitted / In Review' || t.status === 'Awaiting AM Review' || t.status === 'Completed' || t.status === 'Approved / Scheduled' || !!driveLink || delivList.length > 0);
    var isTimerRunning = !isDelivSubmitted && !!(t.timer_state && t.timer_state.is_running);
    var elapsedSecs = t.timer_state ? (t.timer_state.elapsed_seconds || 0) : 0;
    var elapsedMins = Math.round(elapsedSecs / 60);

    var deliverablesBox = '';
    if (delivList.length > 0 || driveLink || rawNotes || isTimerRunning || elapsedMins > 0 || t.submitted_at) {
        var timerTag = '';
        if (t.status === 'Completed' || t.status === 'Approved / Scheduled') {
            timerTag = '<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">✅ تم الاعتماد والاكتمال</span>';
        } else if (t.status === 'Submitted / In Review' || t.status === 'Awaiting AM Review' || driveLink || delivList.length > 0) {
            timerTag = '<span class="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">📤 تم التسليم / بانتظار الاعتماد</span>';
        } else if (isTimerRunning) {
            timerTag = '<span class="bg-amber-500 text-white animate-pulse px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">⏱️ جاري العمل الآن</span>';
        } else if (elapsedMins > 0) {
            timerTag = '<span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">⏱️ ' + elapsedMins + ' دقيقة</span>';
        }

        deliverablesBox = '<div class="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200 rounded-xl p-2.5 text-xs space-y-2 shadow-xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-emerald-950 border-b border-emerald-100 pb-1">' +
                '<span class="flex items-center gap-1">📦 تسليمات وإنجاز الموظف:</span>' +
                timerTag +
            '</div>';

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
                var isPdf = (df.mime && (df.mime === 'application/pdf' || df.mime.includes('pdf'))) || /\.pdf(\?|$)/i.test(dName);
                deliverablesBox += '<a href="' + esc(dUrl) + '" target="_blank" class="bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded-lg p-1.5 text-right transition flex items-center gap-1.5 shadow-2xs group">' +
                    '<span class="text-sm shrink-0">' + (isVid ? '🎬' : (isPdf ? '📄' : '🖼️')) + '</span>' +
                    '<div class="min-w-0 flex-1">' +
                        '<div class="font-bold text-[10px] text-slate-800 truncate group-hover:text-emerald-900">' + esc(dName) + '</div>' +
                        '<div class="text-[9px] text-emerald-700 font-mono">' + (isPdf ? 'استعراض PDF على Drive ↗' : 'فتح على Drive ↗') + '</div>' +
                    '</div>' +
                '</a>';
            });
            deliverablesBox += '</div></div>';
        }

        if (driveLink && !delivList.some(function(d){ return (d.url || d) === driveLink; })) {
            var viewUrl = (typeof formatGoogleDriveViewLink === 'function') ? formatGoogleDriveViewLink(driveLink) : driveLink;
            var isVid = (t.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(driveLink));
            var isPdf = (t.media_type === 'pdf' || /\.pdf(\?|$)/i.test(driveLink));
            var label = isVid ? '🎬 فيديو المخرجات على Drive:' : (isPdf ? '📄 ملف PDF المسلّم على Drive:' : '📁 رابط مجلد/ملف التسليم:');
            var btnText = isVid ? '▶️ تشغيل الفيديو على Google Drive ↗️' : (isPdf ? '📄 فتح واستعراض ملف PDF على Drive ↗️' : '↗️ فتح ملف/مجلد التسليم ↗️');
            deliverablesBox += '<div class="bg-white/90 border border-emerald-200 rounded-xl p-2 space-y-1.5 shadow-2xs">' +
                '<div class="flex items-center justify-between gap-1 flex-wrap">' +
                    '<span class="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">' + label + '</span>' +
                    '<span class="bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">جاهز للمعاينة ↗</span>' +
                '</div>' +
                '<div class="flex items-center gap-1.5">' +
                    '<a href="' + esc(viewUrl) + '" target="_blank" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs">' +
                        '<span>' + btnText + '</span>' +
                    '</a>' +
                    '<button type="button" onclick="copyTaskDriveLink(\'' + esc(viewUrl) + '\', this)" class="bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] py-1.5 px-3 rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-xs cursor-pointer">' +
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

    // Caption HTML
    var captionHtml = '';
    if (cleanCaption) {
        var captionParts = (typeof splitCaptionIntoParts === 'function') ? splitCaptionIntoParts(cleanCaption) : [{ label: 'الكابشن', text: cleanCaption }];
        var hasMultipleParts = captionParts.length > 1;

        var partsPillsHtml = '';
        var partsCardsHtml = '';

        if (hasMultipleParts) {
            partsPillsHtml = '<div class="flex items-center gap-1.5 flex-wrap pt-1 pb-1 border-b border-blue-100/80">' +
                '<span class="text-[10px] font-bold text-blue-900 flex items-center gap-1">📋 نسخ مفرد:</span>' +
                captionParts.map(function(part, pIdx) {
                    return '<button type="button" onclick="copyTextToClipboard(\'' + escJs(part.text) + '\', \'' + escJs(part.label) + '\', this)" class="bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold py-0.5 px-2 rounded-md border border-blue-200 transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0" title="نسخ ' + esc(part.label) + '">' +
                        '<span>' + esc(part.label) + '</span>' +
                    '</button>';
                }).join('') +
            '</div>';

            partsCardsHtml = '<div class="space-y-1.5 pt-1.5 max-h-72 overflow-y-auto pr-0.5">' +
                captionParts.map(function(part, pIdx) {
                    return '<div class="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs space-y-1 hover:border-blue-300 transition group">' +
                        '<div class="flex items-center justify-between text-[10px] font-bold text-blue-700 border-b border-slate-100 pb-1">' +
                            '<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span> ' + esc(part.label) + '</span>' +
                            '<button type="button" onclick="copyTextToClipboard(\'' + escJs(part.text) + '\', \'' + escJs(part.label) + '\', this)" class="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 transition text-[9px] font-bold flex items-center gap-1 cursor-pointer">' +
                                '<span>📋 نسخ</span>' +
                            '</button>' +
                        '</div>' +
                        '<div dir="rtl" class="text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed font-sans text-right select-all">' + esc(part.text) + '</div>' +
                    '</div>';
                }).join('') +
            '</div>';
        }

        captionHtml = '<div class="bg-blue-50/50 border border-blue-200/90 rounded-2xl p-3 text-xs space-y-2 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-blue-950 border-b border-blue-200/60 pb-1.5">' +
                '<span class="flex items-center gap-1.5 text-blue-900 font-bold">' +
                    '<span class="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0"></span>' +
                    '<span>📝 الكابشن والاسكريبت</span>' +
                    (hasMultipleParts ? ('<span class="bg-blue-200/70 text-blue-900 font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold">' + captionParts.length + ' أجزاء</span>') : '') +
                '</span>' +
                '<button type="button" onclick="copyTaskCaption(\'' + escJs(t.task_id) + '\', this)" class="bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-blue-200 shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0" title="نسخ الكابشن كاملاً">' +
                    '<span>📋 نسخ الكابشن كاملاً</span>' +
                '</button>' +
            '</div>' +
            partsPillsHtml +
            (hasMultipleParts ? partsCardsHtml :
                '<div dir="rtl" class="text-[13px] text-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed font-sans select-all bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs text-right font-normal">' +
                    esc(cleanCaption) +
                '</div>'
            ) +
        '</div>';
    }

    // Delivery Deadline Date & Urgency
    var dDead = (t.delivery_deadline || t.publish_date || t.scheduled_start_date || '').trim();
    var deadlineBoxClass = 'bg-slate-50 border-slate-200';
    var deadlineBadgeHtml = '';

    var hasActiveMod = (t.status !== 'Completed' && Boolean(t.modification_requested_at || t.returned_to_employee_at || (modNotes && t.status !== 'Submitted / In Review')));
    var effectiveDeadline = dDead;

    if (hasActiveMod) {
        if (t.modification_deadline) {
            effectiveDeadline = String(t.modification_deadline).slice(0, 10);
        } else if (dDead) {
            effectiveDeadline = dDead;
        } else if (t.modification_requested_at) {
            try {
                var mDt = new Date(t.modification_requested_at);
                mDt.setDate(mDt.getDate() + 1);
                effectiveDeadline = mDt.toISOString().slice(0, 10);
            } catch(e){}
        }
    }

    if (effectiveDeadline) {
        var todayStr = new Date().toISOString().slice(0, 10);
        var tomDate = new Date();
        tomDate.setDate(tomDate.getDate() + 1);
        var tomorrowStr = tomDate.toISOString().slice(0, 10);

        var isDeliveredOrReview = (t.status === 'Submitted / In Review' || t.status === 'Awaiting AM Review' || !!t.drive_link || (Array.isArray(t.deliverables) && t.deliverables.length > 0));

        if (t.status === 'Completed' || t.status === 'Approved / Scheduled') {
            deadlineBoxClass = 'bg-emerald-50/40 border-emerald-200';
            deadlineBadgeHtml = '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">✅ مكتمل ومعتمد</span>';
        } else if (isDeliveredOrReview) {
            deadlineBoxClass = 'bg-purple-50/40 border-purple-200';
            var kpis = t.kpis || {};
            var isOnTime = (typeof kpis.is_on_time === 'boolean') ? kpis.is_on_time : (t.submitted_at && dDead ? String(t.submitted_at).slice(0, 10) <= String(dDead).slice(0, 10) : undefined);
            if (isOnTime === true) {
                deadlineBadgeHtml = '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">✅ تم التسليم في الموعد</span>';
            } else if (isOnTime === false) {
                deadlineBadgeHtml = '<span class="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">⚠️ تم التسليم بعد الموعد</span>';
            } else {
                deadlineBadgeHtml = '<span class="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">📤 تم التسليم / بانتظار الاعتماد</span>';
            }
        } else if (hasActiveMod) {
            if (effectiveDeadline < todayStr) {
                deadlineBoxClass = 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300';
                deadlineBadgeHtml = '<span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">🚨 متأخر عن موعد التعديل!</span>';
            } else if (effectiveDeadline === todayStr) {
                deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
                deadlineBadgeHtml = '<span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">⏰ تسليم التعديل اليوم!</span>';
            } else {
                deadlineBoxClass = 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200';
                deadlineBadgeHtml = '<span class="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">✍️ جاري التعديل</span>';
            }
        } else if (effectiveDeadline < todayStr) {
            deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
            deadlineBadgeHtml = '<span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">🚨 متأخر عن الموعد!</span>';
        } else if (effectiveDeadline === todayStr) {
            deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
            deadlineBadgeHtml = '<span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">⏰ تسليم اليوم!</span>';
        } else if (effectiveDeadline === tomorrowStr) {
            deadlineBoxClass = 'bg-amber-50/60 border-amber-300';
            deadlineBadgeHtml = '<span class="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">⏳ تسليم غداً</span>';
        } else {
            deadlineBadgeHtml = '<span class="text-[10px] text-slate-500 font-mono font-normal">(' + esc(effectiveDeadline) + ')</span>';
        }
    }

    var deadlineLabel = (t.status === 'Completed' || t.status === 'Approved / Scheduled') ? 'موعد التسليم (مكتملة):' : (isDeliveredOrReview ? 'موعد التسليم (مُسلّمة):' : (hasActiveMod ? 'موعد تسليم التعديل:' : 'موعد التسليم:'));
    var isCardLocked = (t.status === 'Completed' || t.status === 'Approved / Scheduled' || isDeliveredOrReview) && !hasActiveMod;

    var html = captionHtml +
        visHtml +
        modHtml +
        driveMaterialsHtml +
        refsHtml + links +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">' +
            (isCardLocked ? (
                '<button type="button" onclick="openTaskContentEditorModal(\'' + escJs(t.task_id) + '\')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-slate-300 shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer" title="المهمة مسلّمة بالفعل — اضغط للمعاينة فقط دون تعديل">' +
                    '<span>🔒 نصوص البوست (معاينة فقط — مقفولة)</span>' +
                '</button>'
            ) : (
                '<button type="button" onclick="openTaskContentEditorModal(\'' + escJs(t.task_id) + '\')" class="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-amber-200 shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer">' +
                    ICONS.edit +
                    '<span>تعديل نصوص البوست</span>' +
                '</button>'
            )) +
            '<button type="button" onclick="requestReturnMyTask(\'' + escJs(t.task_id) + '\')" class="w-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1.5 px-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer" title="استرجاع المهمة لقيد التنفيذ لإجراء تعديلات عليها">' +
                '<span>↩️ طلب استرجاع للتعديل</span>' +
            '</button>' +
            '<button type="button" onclick="openTaskNotesEditorModal(\'' + escJs(t.task_id) + '\')" class="w-full bg-rose-50 hover:bg-rose-100 text-rose-900 text-[11px] font-bold py-1.5 px-2 rounded-xl border border-rose-200 shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer">' +
                '<span>✍️ إضافة ملاحظة</span>' +
            '</button>' +
        '</div>';

    html += '<div class="' + deadlineBoxClass + ' p-2.5 rounded-2xl border text-xs space-y-1.5 shadow-2xs transition">' +
        '<div class="flex items-center justify-between gap-1 mb-1">' +
            '<span class="text-[11px] text-amber-950 font-bold flex items-center gap-1.5">' +
                ICONS.calendar + ' <span>' + deadlineLabel + '</span>' +
            '</span>' +
            deadlineBadgeHtml +
        '</div>' +
        (isCardLocked ? (
            '<div class="flex items-center justify-between gap-2 bg-white/90 p-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800">' +
                '<span>📅 ' + esc(effectiveDeadline || dDead) + '</span>' +
                '<span class="text-[10px] text-slate-500 font-sans font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">🔒 موعد مثبت بعد التسليم</span>' +
            '</div>'
        ) : (
            '<div class="flex items-center gap-1.5">' +
                '<input type="date" id="d-dead-' + esc(t.task_id) + '" value="' + esc(effectiveDeadline || dDead) + '" onchange="saveTaskDates(\'' + escJs(t.task_id) + '\')" class="flex-1 min-w-0 text-xs font-bold font-mono px-2.5 py-1.5 border border-amber-300 rounded-xl bg-white text-slate-950 focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer" style="color-scheme: light;">' +
                '<button onclick="saveTaskDates(\'' + escJs(t.task_id) + '\')" class="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl whitespace-nowrap shadow-xs cursor-pointer transition flex items-center gap-1 shrink-0" title="حفظ موعد التسليم">' +
                    ICONS.save +
                    '<span>حفظ</span>' +
                '</button>' +
            '</div>'
        )) +
    '</div>';

    // Deliverables section
    if (deliverablesBox) {
        html += deliverablesBox;
    }

    // Upload & Reference from device & link
    html += '<div class="space-y-1.5 pt-1">' +
        '<div class="grid grid-cols-2 gap-1.5">' +
            '<button type="button" onclick="submitMyTask(\'' + escJs(t.task_id) + '\')" class="text-center bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-2 rounded-xl shadow-xs flex items-center justify-center gap-1 transition cursor-pointer">' +
                '<span>✅ سلّمت وخلصت</span>' +
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

    // Revision Sub-tasks (مهام التعديل الفرعية)
    if (!isSub && t.subtasks && t.subtasks.length) {
        var revs = t.subtasks.filter(function(st){ return st && (st.type === 'revision' || st.is_subtask); });
        if (revs.length) {
            html += '<div class="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-2.5 space-y-1.5 mt-2">' +
                '<div class="flex items-center justify-between text-[11px] font-bold text-amber-900">' +
                    '<span class="flex items-center gap-1"><span>🔄</span> مهام التعديل الفرعية (' + revs.length + ')</span>' +
                    '<span class="bg-amber-100 text-amber-900 text-[9px] px-2 py-0.5 rounded-md font-mono border border-amber-300">ديدلاين: ' + esc(t.modification_deadline || revs[revs.length-1].delivery_deadline || 'غداً') + '</span>' +
                '</div>' +
                '<div class="space-y-1">';
            revs.forEach(function(st, idx) {
                var stStatusBadge = (st.status === 'Completed') ? '<span class="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">✅ مكتمل</span>' :
                    (st.submitted_at) ? '<span class="text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-bold border border-purple-200">📤 تم تسليمه</span>' :
                    '<span class="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-bold border border-amber-200">⏱️ قيد التعديل</span>';
                html += '<div class="bg-white/95 p-1.5 rounded-xl border border-amber-100 text-[11px] flex items-center justify-between gap-1.5">' +
                    '<div class="min-w-0">' +
                        '<div class="font-bold text-slate-800 truncate flex items-center gap-1">' +
                            '<span class="bg-amber-100 text-amber-900 font-mono text-[9px] px-1 rounded font-bold">' + esc(st.subtask_id || ('تعديل #' + (idx+1))) + '</span>' +
                            '<span class="truncate">' + esc(st.title || st.notes || 'طلب تعديل') + '</span>' +
                        '</div>' +
                        (st.delivery_deadline ? '<div class="text-[9px] text-slate-500 font-mono">📅 موعد التسليم: ' + esc(st.delivery_deadline) + '</div>' : '') +
                    '</div>' +
                    '<div class="shrink-0 text-[9px]">' + stStatusBadge + '</div>' +
                '</div>';
            });
            html += '</div></div>';
        }
    }

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
        var isModTask = Boolean(t.modification_requested_at || t.returned_to_employee_at || (kpis && kpis.is_modification));
        var turnaroundText = '';
        if (kpis && kpis.turnaround_hours !== undefined) {
            var th = kpis.turnaround_hours;
            turnaroundText = th < 1 ? (Math.round(th * 60) + ' دقيقة') : (th + ' ساعة');
        } else if ((t.modification_requested_at || t.assigned_at) && t.submitted_at) {
            var startIso = t.modification_requested_at || t.assigned_at;
            var diffMs = new Date(t.submitted_at) - new Date(startIso);
            if (diffMs > 0) {
                var diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
                turnaroundText = diffHrs < 1 ? (Math.round(diffMs / 60000) + ' دقيقة') : (diffHrs + ' ساعة');
            }
        }
        
        var isOnTime = kpis ? kpis.is_on_time : undefined;
        var effectiveDl = (t.modification_deadline || t.delivery_deadline);
        if (isOnTime === undefined && effectiveDl && t.submitted_at) {
            var dl = String(effectiveDl).slice(0, 10);
            var sub = String(t.submitted_at).slice(0, 10);
            isOnTime = sub <= dl;
        }

        var kpiBadge = isOnTime === true ?
            '<span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0">' + (isModTask ? '✅ تم إنجاز التعديل في الموعد' : '✅ تم التسليم في الموعد') + '</span>' :
            (isOnTime === false ?
                '<span class="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0">' + (isModTask ? '⚠️ تأخير عن موعد التعديل' : '⚠️ تأخير عن موعد التسليم') + '</span>' : '');

        kpisHtml = '<div class="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5 text-xs space-y-1.5 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-indigo-900 border-b border-indigo-100 pb-1">' +
                '<span class="flex items-center gap-1">📊 تقرير الـ KPIs والسرعة:</span>' +
                kpiBadge +
            '</div>' +
            '<div class="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 pt-0.5">' +
                '<div>👤 المسلم: <b class="text-indigo-950">' + esc(t.am_name || 'مدير الحساب') + '</b></div>' +
                '<div>👤 المستلم: <b class="text-indigo-950">' + esc(t.assignee_name || 'غير محدد') + '</b></div>' +
                (t.modification_requested_at ?
                    '<div>✍️ تاريخ طلب التعديل: <span class="font-mono text-[10px] block text-rose-700 font-bold">' + esc(fmtCairoTime(t.modification_requested_at)) + '</span></div>' :
                    (t.assigned_at ? '<div>📅 تاريخ الإسناد: <span class="font-mono text-[10px] block text-slate-600">' + esc(fmtCairoTime(t.assigned_at)) + '</span></div>' : '')
                ) +
                (t.submitted_at ? '<div>🚀 تاريخ التسليم: <span class="font-mono text-[10px] block text-slate-600">' + esc(fmtCairoTime(t.submitted_at)) + '</span></div>' : '') +
                (t.completed_at ? '<div>✅ تاريخ اعتماد AM: <span class="font-mono text-[10px] block text-emerald-700 font-bold">' + esc(fmtCairoTime(t.completed_at)) + '</span></div>' : '') +
                (turnaroundText ? '<div class="col-span-2 text-indigo-900 font-bold bg-white/80 px-2 py-1 rounded-lg border border-indigo-100 flex items-center justify-between mt-1"><span>' + (isModTask ? '⏱️ مدة إنجاز التعديل:' : '⏱️ مدة إنجاز الموظف:') + '</span><span class="font-mono text-xs text-indigo-700">' + turnaroundText + '</span></div>' : '') +
                ((function(){
                    var ath = (kpis && kpis.am_review_hours !== undefined) ? kpis.am_review_hours : null;
                    if (ath === null && t.submitted_at && t.completed_at) {
                        var dMs = new Date(t.completed_at) - new Date(t.submitted_at);
                        if (dMs > 0) ath = +(dMs / 3600000).toFixed(1);
                    }
                    if (ath !== null && ath >= 0) {
                        var athText = ath < 1 ? (Math.round(ath * 60) + ' دقيقة') : (ath + ' ساعة');
                        return '<div class="col-span-2 text-purple-900 font-bold bg-purple-50/80 px-2 py-1 rounded-lg border border-purple-200 flex items-center justify-between mt-1"><span>⏱️ سرعة مراجعة واعتماد AM:</span><span class="font-mono text-xs text-purple-700 font-bold">' + athText + '</span></div>';
                    }
                    return '';
                })()) +
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
            var icon = l.action === 'created' ? '✨' :
                       l.action === 'assigned' ? '👤' :
                       l.action === 'co_assigned' ? '👥' :
                       l.action === 'creator_assigned' ? '✍️' :
                       l.action === 'creator_cleared' ? '❌' :
                       l.action === 'co_assignee_cleared' ? '❌' :
                       l.action === 'started' ? '▶️' :
                       l.action === 'submitted' ? '📤' :
                       l.action === 'reviewed_reject' ? '↩️' :
                       l.action === 'reviewed_forward' ? '➡️' :
                       l.action === 'reviewed_approved' ? '✅' :
                       l.action === 'recalled' ? '🔄' :
                       l.action === 'recalled_by_employee' ? '↩️' :
                       l.action === 'dates_updated' ? '📅' :
                       l.action === 'reference_added' ? '🔗' :
                       l.action === 'asset_uploaded' ? '📁' :
                       l.action === 'content_updated' ? '📝' :
                       l.action === 'client_feedback' ? '💬' :
                       l.action === 'archived' ? '📦' :
                       l.action === 'unarchived' ? '📂' : '⚡';
            
            var actionTitle = l.action === 'created' ? 'إنشاء وتفريغ المهمة' :
                              l.action === 'assigned' ? ('إسناد إلى ' + (l.target_employee_name || 'موظف')) :
                              l.action === 'co_assigned' ? ('إسناد شريك عمل إلى ' + (l.target_employee_name || 'موظف')) :
                              l.action === 'creator_assigned' ? ('تحديد كاتب المحتوى: ' + (l.target_employee_name || 'كاتب المحتوى')) :
                              l.action === 'creator_cleared' ? 'إلغاء كاتب المحتوى' :
                              l.action === 'co_assignee_cleared' ? 'إلغاء شريك العمل' :
                              l.action === 'started' ? 'بدء العمل وتشغيل المؤقت' :
                              l.action === 'submitted' ? 'تسليم مخرجات العمل' :
                              l.action === 'reviewed_reject' ? 'طلب تعديل من الموظف' :
                              l.action === 'reviewed_forward' ? ('تمرير إلى ' + (l.target_employee_name || 'موظف آخر')) :
                              l.action === 'reviewed_approved' ? 'اعتماد نهائي وجدولة' :
                              l.action === 'recalled' ? 'سحب المهمة من الموظف' :
                              l.action === 'recalled_by_employee' ? 'استرجاع المهمة للتعديل بواسطة الموظف' :
                              l.action === 'dates_updated' ? 'تعديل وتحديد المواعيد' :
                              l.action === 'reference_added' ? 'إضافة ريفرنس ومراجع' :
                              l.action === 'asset_uploaded' ? 'رفع مخرجات / فيديو على Drive' :
                              l.action === 'content_updated' ? 'تعديل نصوص وكابشن البوست' :
                              l.action === 'client_feedback' ? 'ملاحظات وتعديلات العميل' :
                              l.action === 'archived' ? 'أرشفة المهمة' :
                              l.action === 'unarchived' ? 'إلغاء أرشفة المهمة' : (l.note || l.action || 'عملية');

            var dLink = (l.details && l.details.drive_link) ? l.details.drive_link : '';
            var dLinkHtml = dLink ? (' · <a href="' + esc(dLink) + '" target="_blank" class="text-emerald-700 hover:text-emerald-900 underline font-bold">↗️ فتح الملف المسلّم</a>') : '';

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
                        dLinkHtml +
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
            var subDrive = (s.drive_link || (Array.isArray(s.deliverables) && s.deliverables[0] && (s.deliverables[0].url || s.deliverables[0])) || (Array.isArray(s.media_urls) && s.media_urls[0]) || '').trim();
            var subNotes = (s.notes || '').trim();
            var subTime = s.submitted_at ? fmtCairoTime(s.submitted_at) : '—';
            var subBy = s.submitted_by || 'الموظف';
            var subDelivs = Array.isArray(s.deliverables) ? s.deliverables : [];

            historyArchiveHtml += '<div class="bg-white border border-emerald-100 rounded-lg p-2 space-y-1.5 shadow-2xs">' +
                '<div class="flex items-center justify-between text-[10px] border-b border-slate-100 pb-1">' +
                    '<span class="font-bold text-emerald-950">تسليم #' + subNum + ' — ' + esc(subBy) + '</span>' +
                    '<span class="text-slate-500 font-mono">' + esc(subTime) + '</span>' +
                '</div>';

            if (subNotes && subNotes !== '—') {
                historyArchiveHtml += '<div class="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100 whitespace-pre-wrap leading-relaxed">' + esc(subNotes) + '</div>';
            }

            if (subDelivs.length > 1) {
                historyArchiveHtml += '<div class="grid grid-cols-2 gap-1 pt-0.5">';
                subDelivs.forEach(function(df, dIdx) {
                    var du = df.url || df.drive_link || df;
                    var dnm = df.filename || ('ملف #' + (dIdx + 1));
                    historyArchiveHtml += '<a href="' + esc(du) + '" target="_blank" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[10px] font-bold p-1 rounded border border-emerald-200 truncate block text-center">📁 ' + esc(dnm) + ' ↗</a>';
                });
                historyArchiveHtml += '</div>';
            } else if (subDrive) {
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

    // AM controls - 100% enclosed within card boundaries with no overflow
    html += '<div class="pt-2 border-t border-slate-100 w-full space-y-2">';

    // AM Creator Selection Row (Allows Account Manager to explicitly select/change the content creator on the task)
    var curCreatorId = t.creator_id || t.content_creator_id || '';
    var curCreatorName = t.creator_name || t.content_creator_name || t.writer_name || '';
    if (!curCreatorName && curCreatorId) {
        var _roster = (window.allTeamEmployees && window.allTeamEmployees.length) ? window.allTeamEmployees : (employeesList || []);
        var _match = _roster.find(function(e){ return String(e.employee_id || '').toLowerCase() === String(curCreatorId).toLowerCase(); });
        if (_match) {
            curCreatorName = _match.name;
        } else {
            var _fallbackMap = {
                'emp-8069-7345': 'ولاء أشرف محمد',
                'emp-2945-2364': 'هدير أنور عباس',
                'emp-7189-7780': 'عبدالرحمن محمد عربي',
                'emp-3264-8790': 'ليالي أحمد',
                'emp-7775-2303': 'منة جمال',
                'emp-8148': 'عمر أحمد عبدالرحمن',
                'am-2072-9827': 'محمود خالد',
                'emp-5887-5256': 'آيه أحمد مجاهد',
                'emp-0652-9532': 'حبيبه احمد محمد',
                'emp-8986-4947': 'راما ممدوح سرج',
                'emp-8142': 'ندى أيمن كمال',
                'emp-8143': 'فرح ياسر إبراهيم'
            };
            curCreatorName = _cleanEmployeeArabicName(_fallbackMap[String(curCreatorId).toLowerCase()] || curCreatorId);
        }
    }
    html += '<div class="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-2.5 space-y-1.5 shadow-2xs w-full box-border">' +
        '<div class="flex items-center justify-between text-[11px] font-bold text-purple-950">' +
            '<span class="flex items-center gap-1">✍️ <span>كاتب المحتوى (اختيار AM):</span></span>' +
            (curCreatorName ? ('<span class="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md font-bold truncate max-w-[160px]" title="' + esc(curCreatorName) + '">✓ ' + esc(curCreatorName) + '</span>') : ('<span class="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">لم يُحدد</span>')) +
        '</div>' +
        '<div class="flex items-center gap-1.5 w-full">' +
            '<select id="creator-select-' + esc(t.task_id) + '" class="w-full min-w-0 flex-1 h-9 text-xs px-2.5 border border-purple-300 bg-white rounded-xl font-bold text-slate-900 truncate focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer flex items-center">' +
                creatorOptionsHtml(curCreatorId, curCreatorName) +
            '</select>' +
            '<button onclick="assignCreatorFromBoard(\'' + esc(t.task_id) + '\')" class="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1" title="حفظ كاتب المحتوى">' +
                '<span>حفظ ✍️</span>' +
            '</button>' +
        '</div>' +
    '</div>';

    var curSecEmpId = t.secondary_employee_id || '';
    var curSecEmpName = _cleanEmployeeArabicName(t.secondary_assignee_name || '');
    html += '<div class="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-2.5 space-y-1.5 shadow-2xs w-full box-border">' +
        '<div class="flex items-center justify-between text-[11px] font-bold text-indigo-950">' +
            '<span class="flex items-center gap-1">👥 <span>شريك عمل / منفذ ثانٍ (اختياري):</span></span>' +
            (curSecEmpName ? ('<span class="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md font-bold truncate max-w-[160px]" title="' + esc(curSecEmpName) + '">✓ ' + esc(curSecEmpName) + '</span>') : ('<span class="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">بدون شريك</span>')) +
        '</div>' +
        '<div class="flex items-center gap-1.5 w-full">' +
            '<select id="co-emp-select-' + esc(t.task_id) + '" class="w-full min-w-0 flex-1 h-9 text-xs px-2.5 border border-indigo-300 bg-white rounded-xl font-bold text-slate-900 truncate focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer flex items-center">' +
                coEmpOptionsHtml(curSecEmpId, t.assigned_employee_id) +
            '</select>' +
            '<button onclick="coAssignTaskFromBoard(\'' + esc(t.task_id) + '\')" class="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1" title="تعيين شريك عمل للتعاون على هذه المهمة">' +
                '<span>حفظ 👥</span>' +
            '</button>' +
        '</div>' +
    '</div>';

    if (st === 'Pending AM Approval') {
        html += '<div class="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-2.5 space-y-1.5 shadow-2xs w-full box-border">' +
            '<div class="flex items-center justify-between text-[11px] font-bold text-blue-950">' +
                '<span class="flex items-center gap-1">👤 <span>إسناد المهمة (للمصمم/المنفذ):</span></span>' +
                '<span class="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-bold">⏳ بانتظار الإسناد</span>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 w-full">' +
                '<select id="emp-select-' + esc(t.task_id) + '" class="w-full min-w-0 flex-1 h-9 text-xs px-2.5 border border-blue-300 bg-white rounded-xl font-bold text-slate-900 truncate focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer flex items-center">' +
                    empOptionsHtml(t.assigned_employee_id) +
                '</select>' +
                '<button onclick="assignTaskFromBoard(\'' + esc(t.task_id) + '\')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl whitespace-nowrap shadow-xs transition cursor-pointer shrink-0 flex items-center gap-1">' +
                    '<span>إسناد 🚀</span>' +
                '</button>' +
            '</div>' +
        '</div>';
    }
    if (st === 'Assigned' || st === 'In Progress') {

        html += '<div class="space-y-2 w-full">' +
            '<div class="grid grid-cols-2 gap-1.5">' +
                '<button onclick="recallTaskAction(\'' + esc(t.task_id) + '\')" class="w-full h-9 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer">↩️ سحب المهمة</button>' +
                '<button onclick="resendTaskCard(\'' + esc(t.task_id) + '\')" class="w-full h-9 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer">✈️ تليجرام</button>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 w-full">' +
                '<select id="reassign-select-' + esc(t.task_id) + '" class="w-full min-w-0 flex-1 h-9 text-xs px-2.5 border border-slate-300 rounded-xl truncate bg-white text-slate-800 focus:outline-blue-500 shadow-2xs cursor-pointer flex items-center">' +
                    '<option value="">تحويل لموظف آخر...</option>' + empOptionsHtml(t.assigned_employee_id) +
                '</select>' +
                '<button onclick="reassignTaskFromBoard(\'' + esc(t.task_id) + '\')" class="h-9 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 rounded-xl whitespace-nowrap shadow-xs transition cursor-pointer shrink-0 flex items-center justify-center">' +
                    'تحويل' +
                '</button>' +
            '</div>' +
        '</div>';
    }
    if (isSubmitted) {
        html += '<div class="space-y-2 w-full">' +
            '<div class="grid grid-cols-2 gap-1.5">' +
                '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'reject\')" class="w-full h-9 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer">↩️ طلب تعديل</button>' +
                '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'finalize\')" class="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1 cursor-pointer">✅ اعتماد واكتمال</button>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 w-full">' +
                '<select id="fwd-select-' + esc(t.task_id) + '" class="w-full min-w-0 flex-1 h-9 text-xs px-2.5 border border-slate-300 rounded-xl truncate bg-white text-slate-800 focus:outline-blue-500 shadow-2xs cursor-pointer flex items-center">' +
                    '<option value="">مرّرها للموظف التالي...</option>' + empOptionsHtml('') +
                '</select>' +
                '<button onclick="reviewTaskDecision(\'' + esc(t.task_id) + '\',\'forward\')" class="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 rounded-xl whitespace-nowrap shadow-xs transition cursor-pointer shrink-0 flex items-center justify-center">' +
                    'تمرير ➡️' +
                '</button>' +
            '</div>' +
            '<div class="grid grid-cols-2 gap-1.5">' +
                '<button onclick="requestReturnMyTask(\'' + esc(t.task_id) + '\')" class="w-full h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer flex items-center justify-center gap-1" title="إرجاع المهمة للموظف نفسه كـ قيد التنفيذ لإجراء تعديلات">↩️ استرجاع للتعديل</button>' +
                '<button onclick="recallTaskAction(\'' + esc(t.task_id) + '\')" class="w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer flex items-center justify-center gap-1" title="سحب المهمة وإلغاء الإسناد">↩️ إلغاء الإسناد</button>' +
            '</div>' +
        '</div>';
    }
    if (isCompleted) {
        html += '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs font-bold text-emerald-800 flex items-center justify-between gap-2 flex-wrap">' +
            '<span class="flex items-center gap-1">مكتملة ومعتمدة بنجاح ✅</span>' +
            '<button type="button" onclick="requestReturnMyTask(\'' + escJs(t.task_id) + '\')" class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold px-3 py-1 rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1" title="إعادة فتح واسترجاع المهمة لإجراء تعديلات"><span>↩️ إعادة فتح للتعديل</span></button>' +
        '</div>';
    }
    html += '</div>'; // close AM controls container
    html += '<button type="button" onclick="toggleTaskCardDetails(\'' + escJs(t.task_id) + '\')" class="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer mt-3 shadow-2xs">▲ إخفاء وطي التفاصيل</button>';

    return html;
}

function renderTaskCard(t, indexInPlan) {
    var isSub = Boolean(t.is_subtask);
    var st = t.status || 'Pending AM Approval';
    var isSubmitted = (st === 'Awaiting AM Review' || st === 'Submitted / In Review' || st === 'Submitted' || st === 'Review Required');
    var isCompleted = (st === 'Completed' || st === 'Approved / Scheduled' || st === 'Done');
    var statusBadgeClass = isSub ? (
                               isCompleted ? 'bg-emerald-100 text-emerald-800' :
                               isSubmitted ? 'bg-purple-100 text-purple-800 font-bold animate-pulse' :
                               'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                           ) : (
                               isCompleted ? 'bg-emerald-100 text-emerald-800' :
                               st === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                               isSubmitted ? 'bg-purple-100 text-purple-800 font-bold animate-pulse' :
                               st === 'Assigned' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                           );
    var stLabel = isSub ? (
                      isCompleted ? '✅ تم اعتماد التعديل' :
                      isSubmitted ? '🔍 التعديل قيد مراجعة AM' :
                      '🔄 مهمة تعديل قيد التنفيذ'
                  ) : (
                      isCompleted ? 'مكتملة ومعتمدة ' : st === 'In Progress' ? 'جاري العمل ' :
                      isSubmitted ? 'تم التسليم / بانتظار مراجعتك ' : st === 'Assigned' ? 'مُسندة ' : 'بانتظار الإسناد '
                  );

    var cleanAM = (t.am_name || '').trim();
    var tAmid = (t.am_id || '').trim().toUpperCase();
    var tCid = String(t.client_id || '').toLowerCase();
    var habibaClientIds = ['cli_dr_ahmed_1788270119', 'cli_sk_1788270118', 'cli_انفينيتي_1788270119'];
    if (habibaClientIds.indexOf(tCid) !== -1 || tAmid === 'EMP-0652-9532' || tAmid === 'AM-0652-9532' || cleanAM.indexOf('حبيبه') !== -1 || cleanAM.indexOf('حبيبة') !== -1) {
        cleanAM = 'حبيبه أحمد محمد';
        tAmid = 'EMP-0652-9532';
    } else if (tAmid === 'EMP-5887-5256' || tAmid === 'AM-5887-5256' || cleanAM.indexOf('آيه') !== -1 || cleanAM.indexOf('ايه') !== -1 || tCid.indexOf('domya') !== -1) {
        cleanAM = 'آيه أحمد مجاهد';
        tAmid = 'EMP-5887-5256';
    } else if (tAmid === 'AM-2072-9827' || tAmid === 'EMP-2072-9827' || cleanAM.indexOf('محمود') !== -1) {
        cleanAM = 'محمود خالد';
        tAmid = 'AM-2072-9827';
    } else {
        cleanAM = _cleanEmployeeArabicName(cleanAM, t.am_id) || 'حبيبه أحمد محمد';
        if (!tAmid) tAmid = 'EMP-0652-9532';
    }
    var amDisplay = tAmid ? ('<span class="font-mono text-[10px]">[' + esc(tAmid) + ']</span> ' + esc(cleanAM)) : esc(cleanAM);
    var amTag = '<div class="flex items-center gap-1.5 text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-xl font-bold">' +
        '<span>👤 AM:</span> <span>' + amDisplay + '</span>' +
    '</div>';

    var creatorName = (t.creator_name || t.content_creator_name || t.writer_name || '').trim();
    var creatorId = (t.creator_employee_id || t.writer_employee_id || '').trim();
    var creatorDisplay = creatorId ? ('<span class="font-mono text-[10px]">[' + esc(creatorId) + ']</span> ' + esc(creatorName)) : esc(creatorName);
    var creatorTag = creatorName ?
        ('<div class="flex items-center gap-1.5 text-[11px] text-purple-900 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-xl font-bold">' +
            '<span>✍️ كاتب المحتوى:</span> <span>' + creatorDisplay + '</span>' +
        '</div>') : '';

    var eid = (t.assigned_employee_id || '').trim();
    var secEid = (t.secondary_employee_id || '').trim();
    var assigneeName = _cleanEmployeeArabicName((t.assignee_name || '').trim(), eid);
    var secAssigneeName = _cleanEmployeeArabicName((t.secondary_assignee_name || '').trim(), secEid);
    var assigneeDisplay = eid ? ('<span class="font-mono text-[10px]">[' + esc(eid) + ']</span> ' + esc(assigneeName)) : esc(assigneeName);
    var secAssigneeDisplay = secEid ? ('<span class="font-mono text-[10px]">[' + esc(secEid) + ']</span> ' + esc(secAssigneeName)) : esc(secAssigneeName);
    var assigneeTag = (assigneeName && secAssigneeName) ?
        ('<div class="flex items-center gap-1.5 text-[11px] text-purple-900 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-xl font-bold" title="عمل مشترك بين شخصين">' +
            '<span>👥 المنفذين (عمل مشترك):</span> <span>' + assigneeDisplay + ' + ' + secAssigneeDisplay + '</span>' +
        '</div>') :
        assigneeName ?
        ('<div class="flex items-center gap-1.5 text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl font-bold">' +
            '<span>🎨 المنفذ:</span> <span>' + assigneeDisplay + '</span>' +
        '</div>') :
        ('<div class="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl font-bold">' +
            '<span>🎨 المنفذ:</span> <span>بانتظار الإسناد للمصمم</span>' +
        '</div>');

    var cid = (t.client_id || '').trim();
    var cname = (t.client_name || '').trim();
    var clientDisplay = (cid && cname && cid !== cname) ? ('<span class="font-mono text-[10px]">[' + esc(cid) + ']</span> ' + esc(cname)) : esc(cname || cid);
    var clientTag = (cname && cname !== 'None' && cname !== 'null' && cname !== 'عميل عام') ?
        '<div class="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">' +
            '<span>🏢 ' + clientDisplay + '</span>' +
        '</div>' : '';

    // 1) Reference images (strictly actual images from docx / plan brief - NOT drive folders)
    var rawImgs = (t.content_data && t.content_data.reference_images && t.content_data.reference_images.length) ? t.content_data.reference_images :
                  (t.graphic_data && t.graphic_data.reference_images && t.graphic_data.reference_images.length) ? t.graphic_data.reference_images :
                  (t.media_urls && t.media_urls.length) ? t.media_urls : [];
    var refs = rawImgs.filter(function(u){
        var s = String(u || '').trim();
        return s.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(s) || (s.includes('/file/d/') && !s.includes('/folders/'));
    });
    var refsHtml = refs.length ? '<div class="bg-blue-50/60 border border-blue-200/70 rounded-xl p-2.5 space-y-1.5 shadow-2xs">' +
        '<div class="text-[11px] font-bold text-blue-900 flex items-center justify-between">' +
            '<span>🖼️ صور ومراجع البوست (' + refs.length + ' صور كاملة):</span>' +
        '</div>' +
        '<div class="flex gap-2 flex-wrap pt-0.5">' + refs.map(function(u, rIdx) {
            var isData = u.startsWith('data:image/');
            var thumbSrc = isData ? u : driveThumb(u);
            return '<a href="' + esc(u) + '" target="_blank" class="block w-16 h-16 rounded-xl border border-blue-200 overflow-hidden bg-white shadow-2xs hover:scale-105 transition" title="مرجع ' + (rIdx + 1) + '"><img src="' + esc(thumbSrc) + '" class="w-full h-full object-cover" loading="lazy" onerror="this.parentNode.innerHTML=\'🖼️\'"></a>';
        }).join('') + '</div></div>' : '';

    // 2) Reference links & Drive folders (Pinterest, Behance, YouTube, Facebook, Instagram, TikTok, Drive)
    var allRefCandidates = [];
    var addRefCandidate = function(u) {
        if (!u || typeof u !== 'string') return;
        var cl = u.trim().replace(/[.,;:)\]]+$/, '');
        if (/^https?:\/\//i.test(cl) && allRefCandidates.indexOf(cl) === -1) allRefCandidates.push(cl);
    };
    if (Array.isArray(t.reference_links)) t.reference_links.forEach(addRefCandidate);
    else if (typeof t.reference_links === 'string') addRefCandidate(t.reference_links);
    if (Array.isArray(t.media_urls)) t.media_urls.forEach(addRefCandidate);
    else if (typeof t.media_urls === 'string') addRefCandidate(t.media_urls);

    addRefCandidate(t.reference_link);
    addRefCandidate(t.materials_url);
    addRefCandidate(t.materials_link);
    addRefCandidate(t.plan_drive_link);
    addRefCandidate(t.drive_plan_url);
    addRefCandidate(t.drive_link);

    if (t.content_data) {
        if (Array.isArray(t.content_data.reference_links)) t.content_data.reference_links.forEach(addRefCandidate);
        if (Array.isArray(t.content_data.reference_images)) t.content_data.reference_images.forEach(addRefCandidate);
        addRefCandidate(t.content_data.reference_link);
    }
    if (t.video_data) {
        if (Array.isArray(t.video_data.reference_links)) t.video_data.reference_links.forEach(addRefCandidate);
        addRefCandidate(t.video_data.reference_link);
        if (typeof t.video_data.script === 'string') {
            (t.video_data.script.match(/https?:\/\/[^\s"'<>]+/gi) || []).forEach(addRefCandidate);
        }
    }
    if (t.graphic_data) {
        if (Array.isArray(t.graphic_data.reference_links)) t.graphic_data.reference_links.forEach(addRefCandidate);
        if (Array.isArray(t.graphic_data.reference_images)) t.graphic_data.reference_images.forEach(addRefCandidate);
        addRefCandidate(t.graphic_data.reference_link);
    }
    var capDescText = [t.caption, t.description, t.visual_idea, t.design_brief, t.note].filter(Boolean).join(' ');
    var matchedInText = capDescText.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    matchedInText.forEach(addRefCandidate);

    var driveMaterialLinks = [];
    var otherRefLinks = [];

    allRefCandidates.forEach(function(u) {
        var uLow = u.toLowerCase();
        if (/drive\.google\.com|docs\.google\.com/i.test(uLow)) {
            driveMaterialLinks.push(u);
        } else if (!refs.includes(u)) {
            otherRefLinks.push(u);
        }
    });

    var driveMaterialsHtml = driveMaterialLinks.length ? (
        '<div class="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 rounded-xl p-3 space-y-2 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-xs text-emerald-950 flex-wrap gap-1 border-b border-emerald-200/70 pb-1.5">' +
                '<span class="flex items-center gap-1.5">' +
                    '<span class="text-base">📁</span>' +
                    '<span class="font-extrabold text-xs text-emerald-950">مجلد الماتريال والمحتوى المطلوب (Google Drive):</span>' +
                '</span>' +
                '<span class="bg-emerald-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">المواد الخام ↗</span>' +
            '</div>' +
            '<div class="space-y-1.5">' +
                driveMaterialLinks.map(function(u) {
                    return '<div class="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs flex-wrap">' +
                        '<div class="flex items-center gap-2 min-w-0 flex-1">' +
                            '<span class="text-base shrink-0">' + (u.includes('/folders/') ? '📂' : '📄') + '</span>' +
                            '<a href="' + esc(u) + '" target="_blank" dir="ltr" class="text-[11px] text-emerald-700 hover:text-emerald-900 font-mono hover:underline truncate block max-w-xs sm:max-w-md">' + esc(u) + '</a>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5 shrink-0">' +
                            '<a href="' + esc(u) + '" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-xs transition inline-flex items-center gap-1 cursor-pointer"><span>📁 فتح على Drive ↗</span></a>' +
                            '<button type="button" onclick="copyTaskDriveLink(\'' + escJs(u) + '\', this)" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px] py-1.5 px-2.5 rounded-lg shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"><span>📋 نسخ</span></button>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>'
    ) : '';

    var links = otherRefLinks.length ?
        '<div class="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">' +
        otherRefLinks.map(function(u, idx) {
            var uLow = String(u).toLowerCase();
            var label = uLow.includes('pinterest') || uLow.includes('pin.it') ? '📌 Pinterest' :
                        uLow.includes('facebook.com') || uLow.includes('fb.watch') ? '📹 فيديو Facebook' :
                        uLow.includes('instagram.com') ? '📸 Instagram Reels' :
                        uLow.includes('tiktok.com') ? '🎵 TikTok' :
                        uLow.includes('youtube') || uLow.includes('youtu.be') ? '🎬 YouTube' :
                        uLow.includes('behance') ? '🎨 Behance' : ('🔗 ريفرنس ' + (idx + 1));
            return '<a href="' + esc(u) + '" target="_blank" class="inline-flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-violet-200 transition shadow-2xs hover:border-violet-300">' + esc(label) + ' ↗</a>';
        }).join('') + '</div>' : '';

    // Clean and extract pure final caption first
    var rawCaption = (t.caption || (t.content_data && t.content_data.caption) || t.description || '').trim();
    var cleanCaption = rawCaption.replace(/^(كابشن|الكابشن|نص المنشور|نص البوست|الكابشن النهائي|Caption)\s*[:：\-–—]\s*/i, '').trim();

    // 3) Creative Brief & Visual Idea (فكرة وتوجيهات التصميم / الإسكربت)
    var visIdea = (t.visual_idea || (t.content_data && t.content_data.visual_idea) || (t.graphic_data && t.graphic_data.idea) || (t.video_data && t.video_data.idea) || t.design_brief || '').trim();
    visIdea = visIdea.replace(/^[>›»\s*#\-–—:]+/i, '').replace(/^(brief|creative brief|فكرة البوست|توجيه التصميم)\s*[:：\-–—]\s*/i, '').trim();
    var isVisDup = !visIdea || visIdea === t.title || (Boolean(cleanCaption) && (visIdea === cleanCaption || cleanCaption.indexOf(visIdea) !== -1 || visIdea.indexOf(cleanCaption) !== -1));
    var visHtml = (!isVisDup) ?
        '<div class="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3 text-xs text-purple-950 space-y-1.5 shadow-2xs">' +
            '<div class="font-bold text-[11px] text-purple-900 flex items-center justify-between border-b border-purple-200/50 pb-1">' +
                '<span class="flex items-center gap-1.5">' +
                    '<span class="w-2 h-2 rounded-full bg-purple-600 inline-block shrink-0"></span>' +
                    '<span>💡 فكرة وتوجيهات التصميم</span>' +
                    '<span dir="ltr" class="text-[10px] text-purple-600 font-mono font-normal">(Creative Brief)</span>' +
                '</span>' +
                '<button type="button" onclick="copyTextToClipboard(\'' + escJs(visIdea) + '\', \'فكرة وتوجيهات التصميم\', this)" class="bg-white hover:bg-purple-100 text-purple-800 text-[10px] font-bold py-0.5 px-2 rounded-lg border border-purple-200 shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0" title="نسخ فكرة وتوجيهات التصميم">' +
                    '<span>📋 نسخ الفكرة</span>' +
                '</button>' +
            '</div>' +
            '<div dir="rtl" class="leading-relaxed text-[12px] whitespace-pre-wrap font-medium text-slate-800 text-right bg-white/80 p-2.5 rounded-xl border border-purple-100/80 shadow-2xs select-all">' + esc(visIdea) + '</div>' +
        '</div>' : '';

    // 4) Modification Requests & Notes (طلبات التعديل والملاحظات)
    var modNotes = (t.review_note || t.modification_request || t.changes_requested_note || t.task_notes || '').trim();
    var modHtml = modNotes ?
        '<div class="bg-rose-50/90 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-950 space-y-1 shadow-2xs">' +
            '<div class="font-bold text-[11px] text-rose-800 flex items-center justify-between">' +
                '<span class="flex items-center gap-1">✍️ طلبات التعديل والملاحظات:</span>' +
                '<div class="flex items-center gap-1.5">' +
                    '<button type="button" onclick="copyTextToClipboard(\'' + escJs(modNotes) + '\', \'ملاحظات التعديل\', this)" class="bg-white hover:bg-rose-100 text-rose-800 text-[10px] font-bold py-0.5 px-2 rounded-md border border-rose-200 transition flex items-center gap-1 cursor-pointer">📋 نسخ</button>' +
                    '<button type="button" onclick="openTaskNotesEditorModal(\'' + escJs(t.task_id) + '\')" class="text-[10px] text-rose-700 hover:text-rose-900 underline font-bold cursor-pointer">تعديل</button>' +
                '</div>' +
            '</div>' +
            '<div class="leading-relaxed text-[11px] whitespace-pre-wrap font-semibold select-all">' + esc(modNotes) + '</div>' +
        '</div>' : '';

    // 5) Employee Deliverables (ZERO bleed from references! Carousel & Multi-File Aware)
    var rawNotes = (t.delivery_notes || t.deliverables_notes || (t.status === 'Submitted / In Review' ? t.notes : '') || '').trim();
    var driveLink = (t.drive_link || t.google_drive_url || t.submission_link || '').trim();
    var delivList = Array.isArray(t.deliverables) ? t.deliverables : [];

    var isSubmitted = (t.status === 'Submitted / In Review' || t.status === 'Awaiting AM Review' || t.status === 'Completed' || t.status === 'Approved / Scheduled' || !!driveLink || delivList.length > 0);
    var isTimerRunning = !isSubmitted && !!(t.timer_state && t.timer_state.is_running);
    var elapsedSecs = t.timer_state ? (t.timer_state.elapsed_seconds || 0) : 0;
    var elapsedMins = Math.round(elapsedSecs / 60);

    var deliverablesBox = '';
    if (delivList.length > 0 || driveLink || rawNotes || isTimerRunning || elapsedMins > 0 || t.submitted_at) {
        var timerTag = '';
        if (t.status === 'Completed' || t.status === 'Approved / Scheduled') {
            timerTag = '<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">✅ تم الاعتماد والاكتمال</span>';
        } else if (t.status === 'Submitted / In Review' || t.status === 'Awaiting AM Review' || driveLink || delivList.length > 0) {
            timerTag = '<span class="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">📤 تم التسليم / بانتظار الاعتماد</span>';
        } else if (isTimerRunning) {
            timerTag = '<span class="bg-amber-500 text-white animate-pulse px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">⏱️ جاري العمل الآن</span>';
        } else if (elapsedMins > 0) {
            timerTag = '<span class="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">⏱️ ' + elapsedMins + ' دقيقة</span>';
        }

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
                var isPdf = (df.mime && (df.mime === 'application/pdf' || df.mime.includes('pdf'))) || /\.pdf(\?|$)/i.test(dName);
                deliverablesBox += '<a href="' + esc(dUrl) + '" target="_blank" class="bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded-lg p-1.5 text-right transition flex items-center gap-1.5 shadow-2xs group">' +
                    '<span class="text-sm shrink-0">' + (isVid ? '🎬' : (isPdf ? '📄' : '🖼️')) + '</span>' +
                    '<div class="min-w-0 flex-1">' +
                        '<div class="font-bold text-[10px] text-slate-800 truncate group-hover:text-emerald-900">' + esc(dName) + '</div>' +
                        '<div class="text-[9px] text-emerald-700 font-mono">' + (isPdf ? 'استعراض PDF على Drive ↗' : 'فتح على Drive ↗') + '</div>' +
                    '</div>' +
                '</a>';
            });
            deliverablesBox += '</div></div>';
        }

        if (driveLink && !delivList.some(function(d){ return (d.url || d) === driveLink; })) {
            var viewUrl = formatGoogleDriveViewLink(driveLink);
            var isVid = (t.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(driveLink));
            var isPdf = (t.media_type === 'pdf' || /\.pdf(\?|$)/i.test(driveLink));
            var label = isVid ? '🎬 فيديو المخرجات على Drive:' : (isPdf ? '📄 ملف PDF المسلّم على Drive:' : '📁 رابط مجلد/ملف التسليم:');
            var btnText = isVid ? '▶️ تشغيل الفيديو على Google Drive ↗️' : (isPdf ? '📄 فتح واستعراض ملف PDF على Drive ↗️' : '↗️ فتح ملف/مجلد التسليم ↗️');
            deliverablesBox += '<div class="bg-white/90 border border-emerald-200 rounded-xl p-2 space-y-1.5 shadow-2xs">' +
                '<div class="flex items-center justify-between gap-1 flex-wrap">' +
                    '<span class="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">' + label + '</span>' +
                    '<span class="bg-emerald-200 text-emerald-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">جاهز للمعاينة ↗</span>' +
                '</div>' +
                '<div class="flex items-center gap-1.5">' +
                    '<a href="' + esc(viewUrl) + '" target="_blank" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs">' +
                        '<span>' + btnText + '</span>' +
                    '</a>' +
                    '<button type="button" onclick="copyTaskDriveLink(\'' + esc(viewUrl) + '\', this)" class="bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] py-1.5 px-3 rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-xs cursor-pointer">' +
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
            if (firstLine) displayTitle = firstLine.slice(0, 80);
        } else if (t.visual_idea) {
            displayTitle = t.visual_idea.slice(0, 80);
        }
    }
    // If displayTitle is an exact match to the entire caption, show a neat post heading
    var isTitleExactCaption = Boolean(cleanCaption) && (displayTitle.trim() === cleanCaption.trim());
    var cardHeading = isSub ? (t.title || ('مهمة تعديل فرعية #' + (t.revision_number || 1))) :
        (isTitleExactCaption ? ('منشور #' + postSeq + (t.client_name ? (' — ' + t.client_name) : '')) : displayTitle);

    var captionHtml = '';
    if (cleanCaption) {
        var captionParts = splitCaptionIntoParts(cleanCaption);
        var hasMultipleParts = captionParts.length > 1;

        var partsPillsHtml = '';
        var partsCardsHtml = '';

        if (hasMultipleParts) {
            partsPillsHtml = '<div class="flex items-center gap-1.5 flex-wrap pt-1 pb-1 border-b border-blue-100/80">' +
                '<span class="text-[10px] font-bold text-blue-900 flex items-center gap-1">📋 نسخ مفرد:</span>' +
                captionParts.map(function(part, pIdx) {
                    return '<button type="button" onclick="copyTextToClipboard(\'' + escJs(part.text) + '\', \'' + escJs(part.label) + '\', this)" class="bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold py-0.5 px-2 rounded-md border border-blue-200 transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0" title="نسخ ' + esc(part.label) + '">' +
                        '<span>' + esc(part.label) + '</span>' +
                    '</button>';
                }).join('') +
            '</div>';

            partsCardsHtml = '<div class="space-y-1.5 pt-1.5 max-h-72 overflow-y-auto pr-0.5">' +
                captionParts.map(function(part, pIdx) {
                    return '<div class="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs space-y-1 hover:border-blue-300 transition group">' +
                        '<div class="flex items-center justify-between text-[10px] font-bold text-blue-700 border-b border-slate-100 pb-1">' +
                            '<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span> ' + esc(part.label) + '</span>' +
                            '<button type="button" onclick="copyTextToClipboard(\'' + escJs(part.text) + '\', \'' + escJs(part.label) + '\', this)" class="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 transition text-[9px] font-bold flex items-center gap-1 cursor-pointer">' +
                                '<span>📋 نسخ</span>' +
                            '</button>' +
                        '</div>' +
                        '<div dir="rtl" class="text-[12px] text-slate-800 whitespace-pre-wrap leading-relaxed font-sans text-right select-all">' + esc(part.text) + '</div>' +
                    '</div>';
                }).join('') +
            '</div>';
        }

        captionHtml = '<div class="bg-blue-50/50 border border-blue-200/90 rounded-2xl p-3 text-xs space-y-2 shadow-2xs">' +
            '<div class="flex items-center justify-between font-bold text-[11px] text-blue-950 border-b border-blue-200/60 pb-1.5">' +
                '<span class="flex items-center gap-1.5 text-blue-900 font-bold">' +
                    '<span class="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0"></span>' +
                    '<span>📝 الكابشن والاسكريبت</span>' +
                    (hasMultipleParts ? ('<span class="bg-blue-200/70 text-blue-900 font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold">' + captionParts.length + ' أجزاء</span>') : '') +
                '</span>' +
                '<button type="button" onclick="copyTaskCaption(\'' + escJs(t.task_id) + '\', this)" class="bg-white hover:bg-blue-100 text-blue-800 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-blue-200 shadow-2xs transition flex items-center gap-1 cursor-pointer shrink-0" title="نسخ الكابشن كاملاً">' +
                    '<span>📋 نسخ الكابشن كاملاً</span>' +
                '</button>' +
            '</div>' +
            partsPillsHtml +
            (hasMultipleParts ? partsCardsHtml :
                '<div dir="rtl" class="text-[13px] text-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed font-sans select-all bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs text-right font-normal">' +
                    esc(cleanCaption) +
                '</div>'
            ) +
        '</div>';
    }

    var teamHtml = '<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 space-y-1.5">' +
        '<div class="text-[10px] font-bold text-slate-500 flex items-center justify-between">' +
            '<span>👥 فريق العمل المسؤول:</span>' +
        '</div>' +
        '<div class="flex flex-wrap gap-1.5">' +
            amTag +
            creatorTag +
            assigneeTag +
        '</div>' +
    '</div>';


    // Delivery Deadline Date with Smart Visual Urgency (Computed early for card header & editor)
    var dDead = (t.delivery_deadline || t.publish_date || t.scheduled_start_date || '').trim();
    var deadlineBoxClass = 'bg-slate-50 border-slate-200';
    var deadlineBadgeHtml = '';

    // Check if task has an active modification request / note
    var modNotes = (t.review_note || t.modification_request || t.notes || '').trim();
    var hasActiveMod = (t.status !== 'Completed' && Boolean(t.modification_requested_at || t.returned_to_employee_at || (modNotes && t.status !== 'Submitted / In Review')));
    var effectiveDeadline = dDead;

    if (hasActiveMod) {
        if (t.modification_deadline) {
            effectiveDeadline = String(t.modification_deadline).slice(0, 10);
        } else if (dDead) {
            effectiveDeadline = dDead;
        } else if (t.modification_requested_at) {
            try {
                var mDt = new Date(t.modification_requested_at);
                mDt.setDate(mDt.getDate() + 1);
                effectiveDeadline = mDt.toISOString().slice(0, 10);
            } catch(e){}
        }
    }

    if (effectiveDeadline) {
        var todayStr = new Date().toISOString().slice(0, 10);
        var tomDate = new Date();
        tomDate.setDate(tomDate.getDate() + 1);
        var tomorrowStr = tomDate.toISOString().slice(0, 10);

        var isDeliveredOrReview = (t.status === 'Submitted / In Review' || t.status === 'Awaiting AM Review' || !!t.drive_link || (Array.isArray(t.deliverables) && t.deliverables.length > 0));

        if (t.status === 'Completed' || t.status === 'Approved / Scheduled') {
            deadlineBoxClass = 'bg-emerald-50/40 border-emerald-200';
            deadlineBadgeHtml = '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">✅ مكتمل ومعتمد</span>';
        } else if (isDeliveredOrReview) {
            deadlineBoxClass = 'bg-purple-50/40 border-purple-200';
            var kpis = t.kpis || {};
            var isOnTime = (typeof kpis.is_on_time === 'boolean') ? kpis.is_on_time : (t.submitted_at && dDead ? String(t.submitted_at).slice(0, 10) <= String(dDead).slice(0, 10) : undefined);
            if (isOnTime === true) {
                deadlineBadgeHtml = '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">✅ تم التسليم في الموعد</span>';
            } else if (isOnTime === false) {
                deadlineBadgeHtml = '<span class="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">⚠️ تم التسليم بعد الموعد</span>';
            } else {
                deadlineBadgeHtml = '<span class="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">📤 تم التسليم / بانتظار الاعتماد</span>';
            }
        } else if (hasActiveMod) {
            if (effectiveDeadline < todayStr) {
                deadlineBoxClass = 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300';
                deadlineBadgeHtml = '<span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">🚨 متأخر عن موعد التعديل!</span>';
            } else if (effectiveDeadline === todayStr) {
                deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
                deadlineBadgeHtml = '<span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">⏰ تسليم التعديل اليوم!</span>';
            } else {
                deadlineBoxClass = 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200';
                deadlineBadgeHtml = '<span class="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">✍️ جاري التعديل</span>';
            }
        } else if (effectiveDeadline < todayStr) {
            deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
            deadlineBadgeHtml = '<span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse">🚨 متأخر عن الموعد!</span>';
        } else if (effectiveDeadline === todayStr) {
            deadlineBoxClass = 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200';
            deadlineBadgeHtml = '<span class="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">⏰ تسليم اليوم!</span>';
        } else if (effectiveDeadline === tomorrowStr) {
            deadlineBoxClass = 'bg-amber-50/60 border-amber-300';
            deadlineBadgeHtml = '<span class="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">⏳ تسليم غداً</span>';
        } else {
            deadlineBadgeHtml = '<span class="text-[10px] text-slate-500 font-mono font-normal">(' + esc(effectiveDeadline) + ')</span>';
        }
    }

    var headerDeadlineHtml = (effectiveDeadline || dDead) ?
        ('<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-lg border bg-amber-50 text-amber-950 border-amber-300 flex items-center gap-1.5 shadow-2xs" title="موعد التسليم">' +
            '<span>📅 التسليم: ' + esc(effectiveDeadline || dDead) + '</span>' +
            (deadlineBadgeHtml ? (' ' + deadlineBadgeHtml) : '') +
        '</span>') :
        ('<span class="text-[11px] font-bold px-2 py-0.5 rounded-lg border bg-slate-100 text-slate-500 border-slate-200">📅 التسليم: غير محدد</span>');

    var isDeliveredCard = Boolean(isSubmitted || isCompleted || Boolean(t.submitted_at) || Boolean(t.drive_link) || (Array.isArray(t.deliverables) && t.deliverables.length > 0));

    var cardWrapperClass = isSub ?
        'bg-amber-50/15 border-2 border-amber-400 border-r-[8px] border-r-amber-500 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition space-y-3 w-full max-w-full overflow-hidden box-border task-card-inner' :
        (isCompleted ?
            'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-50/70 border-2 border-emerald-500 border-r-[8px] border-r-emerald-600 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition space-y-3 w-full max-w-full overflow-hidden box-border task-card-inner ring-1 ring-emerald-400/30' :
            (isDeliveredCard ?
                'bg-gradient-to-br from-teal-50/80 via-cyan-50/30 to-emerald-50/60 border-2 border-teal-500 border-r-[8px] border-r-teal-600 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition space-y-3 w-full max-w-full overflow-hidden box-border task-card-inner ring-1 ring-teal-400/30' :
                'bg-white border-2 border-slate-300 border-r-[8px] border-r-slate-400 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition space-y-3 w-full max-w-full overflow-hidden box-border task-card-inner'
            )
        );

    var deliveryTopBannerHtml = '';
    if (isCompleted) {
        deliveryTopBannerHtml = '<div class="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-1">' +
            '<span class="flex items-center gap-1.5"><span class="text-sm">✅</span> <span>تم التسليم واكتمال المهمة (معتمدة ومكتملة)</span></span>' +
            '<span class="bg-emerald-800/90 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold tracking-wider">COMPLETED & LOCKED</span>' +
        '</div>';
    } else if (isDeliveredCard) {
        deliveryTopBannerHtml = '<div class="bg-teal-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-1">' +
            '<span class="flex items-center gap-1.5"><span class="text-sm">📦</span> <span>تم تسليم مخرجات المهمة — بانتظار مراجعة واعتماد مدير الحساب (AM)</span></span>' +
            '<span class="bg-teal-900/90 text-[10px] px-2 py-0.5 rounded-lg font-mono font-bold tracking-wider">DELIVERED</span>' +
        '</div>';
    } else if (!isSub) {
        deliveryTopBannerHtml = '<div class="bg-slate-100/90 border border-slate-200 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-xl flex items-center justify-between flex-wrap gap-1">' +
            '<span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> <span>مهمة قيد التنفيذ (بانتظار التسليم والمخرجات)</span></span>' +
            '<span class="text-[10px] text-slate-500 font-mono font-medium">IN PROGRESS</span>' +
        '</div>';
    }

    var headerBadgesHtml = isSub ? (
        '<span class="bg-amber-600 text-white font-extrabold font-mono text-xs px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1"><span>🔄</span> <span>تعديل فرعي #' + (t.revision_number || 1) + '</span></span>' +
        '<span class="font-mono font-bold text-xs bg-amber-950 text-amber-100 px-2 py-0.5 rounded-lg border border-amber-800">' + esc(t.task_id) + '</span>' +
        '<span class="bg-white text-amber-950 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">🔗 تابعة للمهمة: [' + esc(t.parent_task_id || '') + ']</span>'
    ) : (
        postBadge +
        '<span class="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-lg">' + esc(t.task_id) + '</span>'
    );

    var subtaskReasonBanner = isSub ? (
        '<div class="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-400 rounded-2xl p-3.5 space-y-2 shadow-xs">' +
            '<div class="flex items-center justify-between font-black text-xs text-rose-950 border-b border-rose-200/80 pb-1.5 flex-wrap gap-1">' +
                '<span class="flex items-center gap-2">' +
                    '<span class="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-ping"></span>' +
                    '<span class="text-xs sm:text-sm font-black text-rose-950">⚠️ سبب وملاحظات التعديل المطلوب من مدير الحساب (AM):</span>' +
                '</span>' +
                '<span class="bg-rose-600 text-white text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-xl font-mono font-bold shadow-2xs">' +
                    '📅 موعد تسليم التعديل: ' + esc(t.delivery_deadline || t.modification_deadline || 'غداً') +
                '</span>' +
            '</div>' +
            '<div class="text-xs sm:text-sm text-slate-950 font-bold bg-white p-3 rounded-xl border border-rose-200 whitespace-pre-wrap leading-relaxed shadow-2xs select-all">' +
                esc(t.revision_reason || t.review_note || t.notes || 'يرجى مراجعة التعديلات المطلوبة وتحديث المطلوب') +
            '</div>' +
        '</div>'
    ) : '';

    var parentActiveSubtaskNotice = (!isSub && t.active_subtask_id && !isCompleted) ? (
        '<div class="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-2 flex-wrap">' +
            '<div class="flex items-center gap-1.5 text-xs font-bold text-amber-950">' +
                '<span class="text-base">🔄</span>' +
                '<span>هذه المهمة قيد التعديل حالياً عبر المهمة الفرعية: <b class="font-mono bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded">' + esc(t.active_subtask_id) + '</b></span>' +
            '</div>' +
            '<button type="button" onclick="setTaskStatusFilter(\'revisions\')" class="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded-lg shadow-2xs transition cursor-pointer">عرض مهام التعديل ↗</button>' +
        '</div>'
    ) : '';

    var isDetailed = (currentBoardCardViewMode === 'detailed');

    var captionSnippetHtml = cleanCaption ? (
        '<div class="text-[12px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 select-text" title="مقتطف من الكابشن">' +
            esc(cleanCaption.slice(0, 160)) + (cleanCaption.length > 160 ? '...' : '') +
        '</div>'
    ) : (visIdea ? (
        '<div class="text-[12px] text-purple-900 line-clamp-2 leading-relaxed bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/60 select-text" title="فكرة التصميم">' +
            '💡 ' + esc(visIdea.slice(0, 160)) + (visIdea.length > 160 ? '...' : '') +
        '</div>'
    ) : '');

    var quickChipsHtml = '<div class="flex items-center gap-1.5 flex-wrap pt-0.5">' +
        (driveMaterialLinks.length ? (
            '<a href="' + esc(driveMaterialLinks[0]) + '" target="_blank" class="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition shadow-2xs"><span>📁 Drive ↗</span></a>'
        ) : '') +
        (refs.length ? (
            '<span class="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">🖼️ ' + refs.length + ' صور</span>'
        ) : '') +
        (cleanCaption ? (
            '<button type="button" onclick="copyTaskCaption(\'' + escJs(t.task_id) + '\', this)" class="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-2 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"><span>📋 نسخ الكابشن</span></button>'
        ) : '') +
    '</div>';

    var fastActionRowHtml = '<div class="grid grid-cols-2 gap-2 pt-1.5">' +
        (isCompleted ? (
            '<div class="h-10 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 cursor-default shadow-2xs">' +
                '<span>🔒 معتمدة ومقفولة للتعديل</span>' +
            '</div>'
        ) : (isSubmitted ? (
            '<div class="h-10 bg-teal-100 text-teal-800 text-xs font-bold px-3 rounded-xl border border-teal-300 flex items-center justify-center gap-1.5 cursor-default shadow-2xs">' +
                '<span>🔒 تم التسليم (بانتظار AM)</span>' +
            '</div>'
        ) : (
            '<button type="button" onclick="submitMyTask(\'' + escJs(t.task_id) + '\')" class="h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">' +
                '<span>✅ سلّمت وخلصت</span>' +
            '</button>'
        ))) +
        '<button type="button" id="btn-toggle-details-' + esc(t.task_id) + '" onclick="toggleTaskCardDetails(\'' + escJs(t.task_id) + '\')" class="h-10 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">' +
            '<span>' + (isDetailed ? '👁️ إخفاء التفاصيل والماتريال ▲' : '👁️ كامل التفاصيل والماتريال ▼') + '</span>' +
        '</button>' +
    '</div>';

    var html = '<div class="' + cardWrapperClass + '">' +
        deliveryTopBannerHtml +
        '<div class="flex items-center justify-between gap-1 flex-wrap">' +
            '<div class="flex items-center gap-1.5 flex-wrap">' +
                headerBadgesHtml +
                '<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ' + statusBadgeClass + '">' + stLabel + '</span>' +
                clientTag +
                headerDeadlineHtml +
            '</div>' +
            '<button onclick="deleteTaskAction(\'' + escJs(t.task_id) + '\')" title="حذف المهمة" class="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer flex items-center justify-center">' + ICONS.trash + '</button>' +
        '</div>' +
        teamHtml +
        subtaskReasonBanner +
        parentActiveSubtaskNotice +
        '<div class="flex items-start justify-between gap-2">' +
            '<h4 class="font-bold text-sm text-slate-900 leading-snug break-words flex-1">' + esc(cardHeading) + '</h4>' +
            (displayTitle ? ('<button type="button" onclick="copyTextToClipboard(\'' + escJs(displayTitle) + '\', \'عنوان البوست\', this)" class="shrink-0 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-1 px-2 rounded-lg border border-slate-200 shadow-2xs transition flex items-center gap-1 cursor-pointer" title="نسخ العنوان / التاج لاين"><span>📋 نسخ العنوان</span></button>') : '') +
        '</div>' +
        captionSnippetHtml +
        quickChipsHtml +
        fastActionRowHtml;
    var isExpanded = isDetailed || (window._expandedTaskCardIds && window._expandedTaskCardIds.has(String(t.task_id)));
    if (isExpanded) {
        html += '<div id="task-details-' + esc(t.task_id) + '" class="card-details-panel expanded space-y-3 pt-2 border-t border-slate-200/80" data-rendered="true">' +
            renderTaskCardDetailsContent(t) +
            '</div>';
    } else {
        html += '<div id="task-details-' + esc(t.task_id) + '" class="card-details-panel collapsed space-y-3 pt-2 border-t border-slate-200/80" data-rendered="false" style="display:none;"></div>';
    }
    html += '</div>'; // close card outer wrapper
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

        // Scope tasks to the active client if one is selected
        var curCid = window.activeClientId || (function(){ try { return localStorage.getItem('active_client_id'); } catch(e){ return null; } })();
        if (curCid && curCid !== 'all' && curCid !== '__all__' && curCid !== 'client_default') {
            var clientScoped = allTasks.filter(function(t) {
                var tCid = String(t.client_id || '').toLowerCase();
                var sCid = String(curCid).toLowerCase();
                return tCid === sCid || (t.client_id && t.client_id === curCid);
            });
            if (clientScoped.length > 0) {
                allTasks = clientScoped;
            } else {
                try { localStorage.removeItem('active_client_id'); } catch(e){}
                window.activeClientId = null;
            }
        }

        // Ensure AM is strictly normalized across all loaded tasks without overriding explicitly assigned AMs
        allTasks.forEach(function(t) {
            var amId = (t.am_id || '').trim();
            var amName = (t.am_name || '').trim();
            var cid = String(t.client_id || '').toLowerCase();
            var cname = String(t.client_name || '').toLowerCase();

            var habibaClientIds = ['cli_dr_ahmed_1788270119', 'cli_sk_1788270118', 'cli_انفينيتي_1788270119'];
            var isHabibaClient = habibaClientIds.indexOf(cid) !== -1 || cname.includes('أحمد حمدي') || cname.includes('احمد حمدي') || cname.includes('sk') || cname.includes('انفينيتي');
            var ayaClientIds = ['client_100821894800009', 'cli_معامل_رعاية_1788336726', 'cli_هبه_حافظ_1788431922', 'cli_dr_ahmed_fahmy_1788683119', 'cli_dr_hadeer_1788684282', 'cli_hayat_dental_center_1788685057', 'cli_dr_shimaa_atef_1788298157', 'cli_dr_shahenda_1788685119'];
            var isAyaClient = ayaClientIds.indexOf(cid) !== -1 || cid.includes('domya') || cname.includes('domya') || cname.includes('رعاية') || cname.includes('هبه حافظ') || cname.includes('fahmy') || cname.includes('hadeer') || cname.includes('hayat') || cname.includes('shimaa') || cname.includes('shahenda');

            if (isHabibaClient || amId === 'EMP-0652-9532' || amId === 'AM-0652-9532' || amName.includes('حبيبه') || amName.includes('حبيبة')) {
                t.am_id = 'EMP-0652-9532';
                t.am_name = 'حبيبه أحمد محمد';
            } else if (isAyaClient || amId === 'EMP-5887-5256' || amId === 'AM-5887-5256' || amName.includes('آيه') || amName.includes('ايه')) {
                t.am_id = 'EMP-5887-5256';
                t.am_name = 'آيه أحمد مجاهد';
            } else if (amId === 'AM-2072-9827' || amId === 'EMP-2072-9827' || amName.includes('محمود')) {
                t.am_id = 'AM-2072-9827';
                t.am_name = 'محمود خالد';
            } else if (amId && amId !== 'EMP-001' && amId !== 'EMP-001-AM' && amId !== 'AM-001' && amId !== 'system' && amId !== 'unassigned') {
                var foundAm = (window.allAccountManagers || []).find(function(a){ return String(a.id || a.employee_id).toUpperCase() === String(amId).toUpperCase(); });
                if (foundAm) {
                    t.am_name = foundAm.name || amName;
                }
            } else {
                t.am_id = 'EMP-0652-9532';
                t.am_name = 'حبيبه أحمد محمد';
            }
        });

        // 0. Month Filter (both in active mode and archive mode)
        if (selectedMonthFilter && selectedMonthFilter !== 'all') {
            allTasks = allTasks.filter(function(t) {
                return getTaskMonthKey(t) === selectedMonthFilter;
            });
        }
        var displayTasks = allTasks.slice();

        // 0. Plan/Employee/AM Filters (Task board displays all plans with interactive plan tabs)

        // 1. Employee AND AM Filters (Combinable)
        if (selectedAMFilter) {
            displayTasks = displayTasks.filter(function(t) {
                return String(t.am_id || '').trim() === String(selectedAMFilter).trim() ||
                       String(t.am_name || '').trim() === String(selectedAMName).trim();
            });
        }
        if (selectedEmployeeFilter) {
            displayTasks = displayTasks.filter(function(t) {
                var eid = String(t.assigned_employee_id || '').trim().toLowerCase();
                var secEid = String(t.secondary_employee_id || '').trim().toLowerCase();
                var target = String(selectedEmployeeFilter).trim().toLowerCase();
                if (target === 'unassigned') {
                    return !eid && !secEid;
                }
                // STRICT ID-BASED MATCHING (Separation strictly by employee_id)
                return eid === target || secEid === target;
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

        // Keep scopedTasks before status/search filter to compute accurate scoped status counts
        var scopedTasks = displayTasks.slice();

        // 2. Status Filter: if current status yields 0 results but scopedTasks has items, auto-reset to 'all' to avoid false empty screen
        if (currentTaskStatusFilter && currentTaskStatusFilter !== 'all') {
            var matchingStatusCount = scopedTasks.filter(function(t){ return matchTaskStatus(t.status, currentTaskStatusFilter, t); }).length;
            if (matchingStatusCount === 0 && scopedTasks.length > 0) {
                currentTaskStatusFilter = 'all';
            }
        }

        if (currentTaskStatusFilter && currentTaskStatusFilter !== 'all') {
            displayTasks = displayTasks.filter(function(t) {
                return matchTaskStatus(t.status, currentTaskStatusFilter, t);
            });
        }

        // 3. Search Filter
        if (taskSearchQuery) {
            var q = taskSearchQuery.trim().toLowerCase();
            var qNorm = (typeof _norm_ar_str === 'function') ? _norm_ar_str(q) : q;
            // Map employee names/queries to canonical employee_id
            var empQueryMap = {
                'عمر': 'emp-8148', 'عمر احمد': 'emp-8148', 'عمر أحمد': 'emp-8148', 'عمر احمد عبدالرحمن': 'emp-8148', 'عمر أحمد عبدالرحمن': 'emp-8148', 'emp-8148': 'emp-8148', 'omar': 'emp-8148',
                'عبدالرحمن': 'emp-7189-7780', 'عبد الرحمن': 'emp-7189-7780', 'عربي': 'emp-7189-7780', 'عبدالرحمن عربي': 'emp-7189-7780', 'عبدالرحمن محمد عربي': 'emp-7189-7780', 'emp-7189-7780': 'emp-7189-7780', 'abdelrahman': 'emp-7189-7780',
                'زهراء': 'emp-6600-3645', 'زهرة': 'emp-6600-3645', 'زهراء قمر': 'emp-6600-3645', 'emp-6600-3645': 'emp-6600-3645', 'zahra': 'emp-6600-3645',
                'فرح': 'emp-8143', 'فرح ياسر': 'emp-8143', 'farah': 'emp-8143', 'emp-8143': 'emp-8143',
                'ندى': 'emp-8142', 'ندى أيمن': 'emp-8142', 'ندى ايمن': 'emp-8142', 'nada': 'emp-8142', 'emp-8142': 'emp-8142',
                'راما': 'emp-8986-4947', 'راما ممدوح': 'emp-8986-4947', 'rama': 'emp-8986-4947', 'emp-8986-4947': 'emp-8986-4947',
                'منة': 'emp-7775-2303', 'منه': 'emp-7775-2303', 'منة جمال': 'emp-7775-2303', 'menna': 'emp-7775-2303', 'emp-7775-2303': 'emp-7775-2303',
                'ليالي': 'emp-3264-8790', 'layaly': 'emp-3264-8790', 'emp-3264-8790': 'emp-3264-8790',
                'ولاء': 'emp-8069-7345', 'walaa': 'emp-8069-7345', 'emp-8069-7345': 'emp-8069-7345',
                'هدير': 'emp-2945-2364', 'hadeer': 'emp-2945-2364', 'emp-2945-2364': 'emp-2945-2364',
                'محمود': 'am-2072-9827', 'محمود خالد': 'am-2072-9827', 'mahmoud': 'am-2072-9827', 'am-2072-9827': 'am-2072-9827',
                'اية': 'emp-5887-5256', 'آيه': 'emp-5887-5256', 'آية': 'emp-5887-5256', 'ايه احمد': 'emp-5887-5256', 'آيه أحمد': 'emp-5887-5256', 'aya': 'emp-5887-5256', 'emp-5887-5256': 'emp-5887-5256',
                'حبيبه': 'emp-0652-9532', 'حبيبة': 'emp-0652-9532', 'habiba': 'emp-0652-9532', 'emp-0652-9532': 'emp-0652-9532',
                'سما': 'emp-4481-0404', 'sama': 'emp-4481-0404', 'emp-4481-0404': 'emp-4481-0404',
                'روضة': 'emp-5970-2611', 'روضه': 'emp-5970-2611', 'rawda': 'emp-5970-2611', 'emp-5970-2611': 'emp-5970-2611',
                'مروة': 'emp-3555-1067', 'marwa': 'emp-3555-1067', 'emp-3555-1067': 'emp-3555-1067',
                'سعيد': 'emp-8086-4520', 'محمد سعيد': 'emp-8086-4520', 'emp-8086-4520': 'emp-8086-4520'
            };

            var targetEid = empQueryMap[q] || empQueryMap[qNorm] || (q.indexOf('emp-') === 0 || q.indexOf('am-') === 0 ? q : null);

            displayTasks = displayTasks.filter(function(t) {
                var eid = String(t.assigned_employee_id || '').trim().toLowerCase();
                var secEid = String(t.secondary_employee_id || '').trim().toLowerCase();

                // If searching for an employee specifically, match their assigned tasks
                if (targetEid) {
                    if (eid === targetEid || secEid === targetEid) return true;
                }

                var hay = (
                    String(t.task_id || '') + ' ' +
                    String(t.title || '') + ' ' +
                    String(t.caption || '') + ' ' +
                    String(t.description || '') + ' ' +
                    String(t.visual_idea || '') + ' ' +
                    String(t.design_brief || '') + ' ' +
                    String(t.client_name || '') + ' ' +
                    String(t.file_name || '') + ' ' +
                    String(t.plan_name || '') + ' ' +
                    String(t.assignee_name || '') + ' ' +
                    String(t.secondary_assignee_name || '') + ' ' +
                    String(t.am_name || '') + ' ' +
                    String(t.assigned_employee_id || '')
                ).toLowerCase();

                return hay.indexOf(q) !== -1;
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
            var cid = String(t.client_id || '').toLowerCase();
            var cname = String(t.client_name || '').toLowerCase();

            var habibaClientIds = ['cli_dr_ahmed_1788270119', 'cli_sk_1788270118', 'cli_انفينيتي_1788270119'];
            var isHabibaClient = habibaClientIds.indexOf(cid) !== -1 || cname.includes('أحمد حمدي') || cname.includes('احمد حمدي') || cname.includes('sk') || cname.includes('انفينيتي');
            var ayaClientIds = ['client_100821894800009', 'cli_معامل_رعاية_1788336726', 'cli_هبه_حافظ_1788431922', 'cli_dr_ahmed_fahmy_1788683119', 'cli_dr_hadeer_1788684282', 'cli_hayat_dental_center_1788685057', 'cli_dr_shimaa_atef_1788298157', 'cli_dr_shahenda_1788685119'];
            var isAyaClient = ayaClientIds.indexOf(cid) !== -1 || cid.includes('domya') || cname.includes('domya') || cname.includes('رعاية') || cname.includes('هبه حافظ') || cname.includes('fahmy') || cname.includes('hadeer') || cname.includes('hayat') || cname.includes('shimaa') || cname.includes('shahenda');

            if (isHabibaClient || amId === 'EMP-0652-9532' || amId === 'AM-0652-9532' || amName.includes('حبيبه') || amName.includes('حبيبة')) {
                amId = 'EMP-0652-9532';
                amName = 'حبيبه أحمد محمد';
            } else if (isAyaClient || amId === 'EMP-5887-5256' || amId === 'AM-5887-5256' || amName.includes('آيه') || amName.includes('ايه')) {
                amId = 'EMP-5887-5256';
                amName = 'آيه أحمد مجاهد';
            } else if (amId === 'AM-2072-9827' || amId === 'EMP-2072-9827' || amName.includes('محمود')) {
                amId = 'AM-2072-9827';
                amName = 'محمود خالد';
            } else if (amId && amId !== 'EMP-001' && amId !== 'EMP-001-AM' && amId !== 'AM-001' && amId !== 'system' && amId !== 'unassigned') {
                var foundAm = (window.allAccountManagers || []).find(function(a){ return String(a.id || a.employee_id).toUpperCase() === String(amId).toUpperCase(); });
                if (foundAm) {
                    amName = foundAm.name || amName;
                }
            } else {
                amId = 'EMP-0652-9532';
                amName = 'حبيبه أحمد محمد';
            }
            t.am_id = amId;
            t.am_name = amName;
            if (!amMap[amId]) amMap[amId] = { id: amId, name: amName, count: 0 };
            amMap[amId].count++;
        });
        var amList = Object.values(amMap);


        var filterBannerHtml = '';
        if (selectedEmployeeFilter) {
            var currentCid = (window._me && window._me.active_client_id) || '';
            var empTotalTasks = scopedTasks || [];
            var otherClientsCount = empTotalTasks.filter(function(ot){ return ot.client_id !== currentCid; }).length;

            var bannerSub = '';
            if (empTotalTasks.length === 0) {
                bannerSub = 'لا توجد مهام مسندة لهذا الموظف في الشهر المختار حالياً.';
            } else if (displayTasks.length < empTotalTasks.length && currentTaskStatusFilter !== 'all') {
                bannerSub = 'يتم عرض ' + displayTasks.length + ' مهمة تطابق الفلتر من إجمالي ' + empTotalTasks.length + ' مهمة مسندة للموظف.';
            } else {
                bannerSub = 'يتم الآن عرض كافة المهام المسندة لهذا الموظف (' + empTotalTasks.length + ' مهمة).';
            }

            filterBannerHtml = '<div class="col-span-full bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-sm">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">👤</div>' +
                    '<div>' +
                        '<div class="font-bold text-sm text-blue-900 flex items-center gap-2">' +
                            '<span>كل مهام الموظف: <b>' + esc(selectedEmployeeName) + '</b> عبر جميع العملاء والمشاريع</span>' +
                            '<span class="bg-blue-200 text-blue-800 text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold">' + empTotalTasks.length + ' مهمة مسندة</span>' +
                        '</div>' +
                        '<p class="text-xs text-blue-700 mt-0.5">' + bannerSub + 
                        (otherClientsCount > 0 ? ' <span class="font-bold">(' + otherClientsCount + ' منها في عملاء آخرين)</span>' : '') + '</p>' +
                    '</div>' +
                '</div>' +
                '<button type="button" onclick="clearEmployeeFilter()" class="text-xs bg-white hover:bg-blue-100 text-blue-800 font-bold border border-blue-300 px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer">' +
                    '<span>عرض كل مهام الفريق 👥</span>' +
                '</button>' +
            '</div>';
        }

        // Status filter counts scoped to active employee/plan to prevent showing false non-zero counts
        var statusBaseTasks = scopedTasks || allTasks;
        var countAll = statusBaseTasks.length;
        var countRevisions = statusBaseTasks.filter(function(t){ return matchTaskStatus(t.status, 'revisions', t); }).length;
        var countReview = statusBaseTasks.filter(function(t){ return matchTaskStatus(t.status, 'review', t); }).length;
        var countInProgress = statusBaseTasks.filter(function(t){ return matchTaskStatus(t.status, 'in_progress', t); }).length;
        var countAssigned = statusBaseTasks.filter(function(t){ return matchTaskStatus(t.status, 'assigned', t); }).length;
        var countPending = statusBaseTasks.filter(function(t){ return matchTaskStatus(t.status, 'pending', t); }).length;
        var countCompleted = statusBaseTasks.filter(function(t){ return matchTaskStatus(t.status, 'completed', t); }).length;

        // 1. Account Managers (Strict dedicated row)
        var amRowHtml = '';
        if (amList.length > 0) {
            amRowHtml = '<div class="flex items-center gap-1.5 flex-wrap bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">' +
                '<span class="text-[11px] font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">🧑‍💼 مدير الحساب (Account Manager):</span>' +
                '<button type="button" onclick="clearAMFilter()" class="text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ' +
                    (!selectedAMFilter ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300 font-extrabold' : 'bg-white text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200') + '">' +
                    'الكل (' + allTasks.length + ')' +
                '</button>' +
                amList.map(function(am) {
                    var isSel = (selectedAMFilter === am.id || (selectedAMName && selectedAMName === am.name));
                    return '<button type="button" onclick="toggleAMFilter(\'' + esc(am.id) + '\', \'' + esc(am.name) + '\')" class="text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ' +
                        (isSel ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300 font-extrabold' : 'bg-white text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200') + '">' +
                        '🧑‍💼 <span class="font-mono text-[10px]">[' + esc(am.id) + ']</span> ' + esc(am.name) + ' <span class="text-[10px] font-mono ' + (isSel ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-900') + ' px-1.5 py-0.2 rounded-full font-bold">(' + am.count + ')</span>' +
                    '</button>';
                }).join('') +
                (selectedAMFilter ? '<button type="button" onclick="clearAMFilter()" class="text-[11px] text-emerald-800 font-bold hover:underline mr-auto">إلغاء فلترة AM ✕</button>' : '') +
            '</div>';
        }

        // 2. Executors / Team Members (Strict dedicated row)
        var execMap = {};
        var unassignedCount = 0;
        allTasks.forEach(function(t) {
            var eid   = (t.assigned_employee_id || '').trim();
            var ename = _cleanEmployeeArabicName((t.assignee_name || '').trim(), eid);
            if (!eid) {
                unassignedCount++;
                return;
            }
            var k = eid;
            if (!execMap[k]) {
                execMap[k] = { id: eid, name: ename || eid, count: 0 };
            }
            execMap[k].count++;
        });
        var executorsList = Object.values(execMap).sort(function(a, b){ return b.count - a.count; });

        var execRowHtml = '';
        if (executorsList.length > 0 || unassignedCount > 0) {
            var hasActiveEmpFilter = !!selectedEmployeeFilter;
            var isUnassignedSel = (selectedEmployeeFilter === 'unassigned');
            var unassignedBtn = unassignedCount > 0 ? (
                '<button type="button" onclick="toggleEmployeeFilter(\'unassigned\', \'غير مسندة\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ' +
                (isUnassignedSel ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300 font-extrabold' : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-300') + '">' +
                '⏳ غير مسندة <span class="text-[10px] font-mono ' + (isUnassignedSel ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900') + ' px-1.5 py-0.5 rounded-full font-bold">(' + unassignedCount + ')</span>' +
                '</button>'
            ) : '';

            execRowHtml = '<div class="flex items-center gap-2 flex-wrap bg-slate-100/80 border border-slate-200/90 rounded-2xl px-3 py-2 shadow-2xs">' +
                '<span class="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">👥 فريق التنفيذ:</span>' +
                '<button type="button" onclick="clearEmployeeFilter()" class="text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ' +
                    (!hasActiveEmpFilter ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300 font-extrabold' : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200') + '">' +
                    'الكل (' + countAll + ')' +
                '</button>' +
                executorsList.map(function(emp) {
                    var isSel = (selectedEmployeeFilter && selectedEmployeeFilter.toLowerCase() === emp.id.toLowerCase());
                    var icon = '👤';
                    if (emp.name.includes('راما') || emp.name.includes('ندى') || emp.name.includes('منة')) icon = '🎨';
                    else if (emp.name.includes('فرح') || emp.name.includes('عمر')) icon = '🎬';
                    else if (emp.name.includes('ولاء') || emp.name.includes('هدير') || emp.name.includes('ليالي') || emp.name.includes('عربي')) icon = '✍️';
                    return '<button type="button" onclick="toggleEmployeeFilter(\'' + esc(emp.id) + '\', \'' + esc(emp.name) + '\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ' +
                        (isSel ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300 font-extrabold' : 'bg-white text-slate-800 hover:bg-indigo-50 border border-slate-200') + '">' +
                        icon + ' <span class="font-mono text-[10px]">[' + esc(emp.id) + ']</span> ' + esc(emp.name) + ' <span class="text-[10px] font-mono ' + (isSel ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700') + ' px-1.5 py-0.5 rounded-full font-bold">(' + emp.count + ')</span>' +
                    '</button>';
                }).join('') +
                unassignedBtn +
                (hasActiveEmpFilter ? '<button type="button" onclick="clearEmployeeFilter()" class="text-xs text-indigo-700 font-bold hover:underline mr-auto">عرض كل المنفذين ✕</button>' : '') +
            '</div>';
        }

        var sortToolbarHtml = '<div class="col-span-full bg-slate-50 border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-2 mb-1">' +
            '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                '<div class="flex items-center gap-1.5 flex-wrap">' +
                    '<span class="text-xs font-bold text-slate-700 flex items-center gap-1">🔀 ترتيب حسب:</span>' +
                    '<button type="button" onclick="setTaskSort(\'sequence\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'sequence' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span>🔢 رقم البوست</span>' + (currentTaskSort === 'sequence' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'deadline\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'deadline' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span>📅 موعد التسليم</span>' + (currentTaskSort === 'deadline' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'status\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'status' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span>🚦 الحالة</span>' + (currentTaskSort === 'status' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'task_id\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'task_id' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span>🏷️ الكود</span>' + (currentTaskSort === 'task_id' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                    '<button type="button" onclick="setTaskSort(\'created_at\')" class="text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ' + (currentTaskSort === 'created_at' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200') + '">' +
                    '<span>⏰ الأحدث</span>' + (currentTaskSort === 'created_at' ? (currentTaskSortDir === 'asc' ? ' ↑' : ' ↓') : '') +
                    '</button>' +
                '</div>' +
                '<div class="flex items-center gap-2 w-full sm:w-auto">' +
                    '<div class="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">' +
                        '<button type="button" onclick="setBoardCardViewMode(\'compact\')" class="text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ' + (currentBoardCardViewMode === 'compact' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100') + '" title="عرض مدمج ومختصر">' +
                            '<span>⊞ مدمج</span>' +
                        '</button>' +
                        '<button type="button" onclick="setBoardCardViewMode(\'detailed\')" class="text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ' + (currentBoardCardViewMode === 'detailed' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100') + '" title="عرض مفصل بكامل الماتريال">' +
                            '<span>⊟ مفصل</span>' +
                        '</button>' +
                    '</div>' +
                    '<div class="relative w-full sm:w-64">' +
                        '<input type="text" value="' + esc(taskSearchQuery) + '" oninput="onTaskSearchInput(this.value)" placeholder="🔍 بحث في عنوان أو كابشن أو كود المهمة..." class="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-blue-500 shadow-2xs">' +
                        (taskSearchQuery ? '<button type="button" onclick="onTaskSearchInput(\'\')" class="absolute left-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700">✕</button>' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 flex-wrap border-t border-slate-200/60 pt-2">' +
                '<span class="text-[11px] font-bold text-slate-500">تصفية الحالة:</span>' +
                '<button type="button" onclick="setTaskStatusFilter(\'all\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100') + '">الكل (' + countAll + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'revisions\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'revisions' ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300' : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100') + '">🔄 مهام التعديل (' + countRevisions + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'in_progress\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'in_progress' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50') + '">⏱️ جاري العمل (' + countInProgress + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'review\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'review' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50') + '">📤 تم التسليم / قيد المراجعة (' + countReview + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'assigned\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'assigned' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50') + '">📌 مُسندة (' + countAssigned + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'pending\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50') + '">⏳ بانتظار الإسناد (' + countPending + ')</button>' +
                '<button type="button" onclick="setTaskStatusFilter(\'completed\')" class="text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ' + (currentTaskStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50') + '">✅ مكتملة (' + countCompleted + ')</button>' +
            '</div>' +
            amRowHtml +
            execRowHtml +
        '</div>';

        var topBanners = filterBannerHtml + sortToolbarHtml;

        if (currentTaskStatusFilter === 'review' && countReview > 0) {
            topBanners += '<div class="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap mb-4">' +
                '<div class="space-y-0.5">' +
                    '<div class="font-bold text-sm text-purple-950 flex items-center gap-2">' +
                        '<span>📬 مهام مسلّمة بانتظار مراجعتك واعتمادك (' + countReview + ' مهمة)</span>' +
                    '</div>' +
                    '<div class="text-xs text-purple-800">قام فريق العمل برفع الملفات وروابط Google Drive وجاهزة للمراجعة المباشرة والاعتماد.</div>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<button type="button" onclick="bulkApproveFilteredTasks()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer">' +
                        '<span>✅ اعتماد واكتمال كافة المهام المسلّمة (' + countReview + ')</span>' +
                    '</button>' +
                '</div>' +
            '</div>';
        }


        if (!displayTasks || displayTasks.length === 0) {
            var emptyMsg = '';
            var totalAvailableTasks = (allTasks || []).length;
            var scopeTotal = (scopedTasks || []).length;
            
            if (currentTaskStatusFilter && currentTaskStatusFilter !== 'all') {
                var stNames = { in_progress: 'جاري العمل', review: 'تم التسليم / قيد المراجعة', assigned: 'مُسندة', pending: 'بانتظار الإسناد', completed: 'مكتملة' };
                var stLabel = stNames[currentTaskStatusFilter] || currentTaskStatusFilter;
                var scopeLabel = selectedEmployeeName ? ('للموظف «' + esc(selectedEmployeeName) + '»') :
                                 (selectedPlanFilter ? ('في خطة «' + esc(selectedPlanFilter) + '»') : '');
                emptyMsg = '<div class="space-y-2"><div class="font-bold text-sm text-slate-900 flex items-center justify-center gap-2"><span>💾 كافة بيانات السيستم محفوظة بالكامل</span></div>' +
                           '<div class="text-slate-700 text-xs font-semibold">لا توجد مهام بحالة «<b>' + stLabel + '</b>» ' + scopeLabel + ' حالياً. ' + (scopeTotal > 0 ? ('(يوجد <b>' + scopeTotal + '</b> مهمة بحالات أخرى)') : '') + '</div>' +
                           '<p class="text-slate-500 text-[11px]">اضغط على زر «عرض كافة المهام» لعرض كافة مهام الخطة وفريق العمل.</p>' +
                           '<button type="button" onclick="setTaskStatusFilter(\'all\')" class="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs">عرض كافة المهام (الكل: ' + (scopeTotal || totalAvailableTasks) + ' مهمة)</button></div>';
            } else if (selectedMonthFilter && selectedMonthFilter !== 'all') {
                emptyMsg = '<div class="space-y-2"><div class="font-bold text-sm text-slate-900 flex items-center justify-center gap-2"><span>🗓️ فلترة الشهر: ' + formatMonthLabel(selectedMonthFilter) + '</span></div>' +
                           '<p class="text-slate-600 text-xs">لا توجد مهام مسجلة لهذا الشهر المحدد. كافة مهام الشهور الأخرى محفوظة بأمان في السيستم.</p>' +
                           '<button type="button" onclick="setTaskMonthFilter(\'all\'); try{localStorage.removeItem(\'active_client_id\');window.activeClientId=null;}catch(e){} loadTasksEngine();" class="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs">عرض جميع الشهور (كافة الخطط: ' + totalAvailableTasks + ' مهمة)</button></div>';
            } else if (taskSearchQuery) {
                emptyMsg = '<div class="space-y-2"><div class="font-bold text-sm text-slate-800">لا توجد نتائج تطابق بحثك: «<b>' + esc(taskSearchQuery) + '</b>»</div>' +
                           '<button type="button" onclick="onTaskSearchInput(\'\')" class="mt-2 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-xs">إلغاء البحث وعرض كل المهام</button></div>';
            } else if (selectedEmployeeFilter) {
                emptyMsg = '<div class="space-y-2"><div class="font-bold text-sm text-slate-800">لا توجد مهام مسندة للموظف <b>' + esc(selectedEmployeeName) + '</b> في هذا العرض.</div>' +
                           '<button type="button" onclick="clearEmployeeFilter()" class="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs">عرض كافة مهام الفريق (' + totalAvailableTasks + ' مهمة)</button></div>';
            } else if (selectedAMFilter) {
                emptyMsg = '<div class="space-y-2"><div class="font-bold text-sm text-slate-800">لا توجد مهام مسندة لمدير الحساب <b>' + esc(selectedAMName) + '</b></div>' +
                           '<button type="button" onclick="clearAMFilter()" class="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs">عرض كافة مهام الفريق (' + totalAvailableTasks + ' مهمة)</button></div>';
            } else {
                emptyMsg = 'لا توجد مهام مسجلة حالياً. ارفع الخطة الشهرية أو أضف مهمة جديدة 📑';
            }
            board.innerHTML = topBanners + '<div class="col-span-full p-8 text-center text-slate-700 text-xs bg-white border border-slate-200 rounded-2xl shadow-xs">' + emptyMsg + '</div>';
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
                t.post_number_in_plan = t.post_number || (idx + 1);
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
                        '<button type="button" onclick="openAddPlanTaskModal(\'' + escJs(grp.fileName) + '\', \'' + escJs(grp.clientName) + '\', \'' + escJs((grp.tasks[0] && grp.tasks[0].client_id) || '') + '\')" class="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer" title="إضافة بوست أو تاسك جديد لهذه الخطة مباشرة">' +
                            '<span>➕ إضافة تاسك للخطة</span>' +
                        '</button>' +
                        '<button type="button" onclick="openBulkAssignModal(\'' + escJs(grp.fileName) + '\', \'' + escJs((grp.tasks[0] && grp.tasks[0].client_id) || '') + '\')" class="text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer" title="إسناد مهام هذه الخطة لموظف محدد دفعة واحدة">' +
                            '<span>👥 إسناد جماعي</span>' +
                        '</button>' +
                        '<button type="button" onclick="openBulkPlanDatesModal(\'' + escJs(grp.fileName) + '\', \'' + escJs((grp.tasks[0] && grp.tasks[0].client_id) || '') + '\')" class="text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer" title="تعديل وتحديد تاريخ مهام هذه الخطة دفعة واحدة">' +
                            '<span>📅 تاريخ الخطة</span>' +
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
                    fTasks.map(function(t, idx) { return renderTaskCard(t, t.post_number || t.post_number_in_plan || (idx + 1)); }).join('') +
                '</div>' +
            '</div>';
        } else {
            columnsHtml = '<div class="col-span-full flex gap-6 overflow-x-auto pb-6 items-start w-full pt-1">';
            groupKeys.forEach(function(k) {
                var grp = fileGroups[k];
                var fTasks = sortTaskList(grp.tasks, currentTaskSort, currentTaskSortDir);
                fTasks.forEach(function(t, idx) {
                    t.post_number_in_plan = t.post_number || (idx + 1);
                });
                var completedCount = fTasks.filter(function(t){ return t.status === 'Completed'; }).length;

                columnsHtml += '<div class="w-96 sm:w-[460px] md:w-[480px] shrink-0 bg-slate-100/90 border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-3.5 flex flex-col">' +
                    '<div class="sticky top-0 z-10 border-b border-slate-200/90 pb-3 bg-white -m-4 mb-0 p-4 rounded-t-3xl shadow-xs space-y-2.5">' +
                        '<div class="flex items-start justify-between gap-2">' +
                            '<div class="flex items-start gap-2.5 min-w-0 flex-1">' +
                                '<div class="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 mt-0.5">' + ICONS.folder + '</div>' +
                                '<div class="min-w-0 flex-1">' +
                                    '<div class="text-xs font-bold text-blue-700 flex items-center gap-1.5 flex-wrap">' +
                                        '<span>🏢 ' + esc(grp.clientName) + '</span>' +
                                    '</div>' +
                                    '<h4 class="font-bold text-sm text-slate-900 leading-snug break-words mt-0.5" title="' + esc(grp.fileName) + '">ملف: ' + esc(grp.fileName) + '</h4>' +
                                '</div>' +
                            '</div>' +
                            '<span class="bg-blue-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-full shadow-xs shrink-0">' + fTasks.length + ' مهام</span>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 flex-wrap">' +
                            '<div class="flex items-center gap-2 text-xs text-slate-500">' +
                                '<button type="button" onclick="openBulkPlanDatesModal(\'' + escJs(grp.fileName) + '\', \'' + escJs((grp.tasks[0] && grp.tasks[0].client_id) || '') + '\')" class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] px-2.5 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs" title="تعديل وتحديد تاريخ ومواعيد الخطة بالكامل">' +
                                    '<span>🗓️ ' + esc(formatMonthLabel(getTaskMonthKey(fTasks[0]))) + '</span>' +
                                '</button>' +
                                '<span dir="ltr" class="text-slate-600 font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded-md">' + completedCount + ' / ' + fTasks.length + ' منجز</span>' +
                            '</div>' +
                            '<div class="flex items-center gap-1.5 flex-wrap">' +
                                '<button type="button" onclick="openAddPlanTaskModal(\'' + escJs(grp.fileName) + '\', \'' + escJs(grp.clientName) + '\', \'' + escJs((grp.tasks[0] && grp.tasks[0].client_id) || '') + '\')" class="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer" title="إضافة بوست أو تاسك جديد لهذه الخطة مباشرة">' +
                                    '<span>➕ تاسك</span>' +
                                '</button>' +
                                '<button type="button" onclick="openBulkAssignModal(\'' + escJs(grp.fileName) + '\', \'' + escJs((grp.tasks[0] && grp.tasks[0].client_id) || '') + '\')" class="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer" title="إسناد جماعي لمهام الخطة">' +
                                    '<span>👥 إسناد</span>' +
                                '</button>' +
                                '<button type="button" onclick="openBulkPlanDatesModal(\'' + escJs(grp.fileName) + '\', \'' + escJs((grp.tasks[0] && grp.tasks[0].client_id) || '') + '\')" class="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer" title="تعديل وتحديد تاريخ مهام الخطة">' +
                                    '<span>📅 التاريخ</span>' +
                                '</button>' +
                                '<button type="button" onclick="sharePlanWithClient(\'' + escJs(grp.clientName) + '\', \'' + escJs(grp.fileName) + '\')" class="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer" title="نسخ رابط مشاركة الخطة للعميل">' +
                                    '<span>🔗 مشاركة</span>' +
                                '</button>' +
                                '<button type="button" onclick="deleteWholePlanAction(\'' + escJs(grp.fileName) + '\')" class="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center cursor-pointer" title="حذف الخطة">' +
                                    ICONS.trash +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="space-y-3.5 pt-1 max-h-[850px] overflow-y-auto pr-1">' +
                        fTasks.map(function(t, idx) { return renderTaskCard(t, t.post_number || t.post_number_in_plan || (idx + 1)); }).join('') +
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
    var check = prompt('⚠️ تحذير أمني شديد: سيتم مسح كافة مهام النظام بالكامل ولا يمكن التراجع!\nلحماية بياناتك، اكتب كلمة "تأكيد" للمتابعة:');
    if (!check || check.trim() !== 'تأكيد') {
        showToast('تم إلغاء العملية، كافة بياناتك في أمان تام ✅');
        return;
    }
    if (!confirm('تأكيد نهائي: هل أنت متأكد من مسح جميع المهام؟')) return;
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
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var defDl = tomorrow.toISOString().split('T')[0];
        var customDl = prompt('الموعد النهائي الجديد للتعديل (ديدلاين بصيغة YYYY-MM-DD):', defDl);
        if (customDl !== null && customDl.trim()) {
            body.modification_deadline = customDl.trim();
        } else {
            body.modification_deadline = defDl;
        }
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
window.reviewTaskDecision = reviewTaskDecision;

async function bulkApproveFilteredTasks() {
    var all = tasksList || [];
    var curCid = window.activeClientId || (function(){ try { return localStorage.getItem('active_client_id'); } catch(e){ return null; } })();
    if (curCid && curCid !== 'all' && curCid !== '__all__' && curCid !== 'client_default') {
        all = all.filter(function(t) {
            var tCid = String(t.client_id || '').toLowerCase();
            var sCid = String(curCid).toLowerCase();
            return tCid === sCid || (t.client_id && t.client_id === curCid);
        });
    }

    if (selectedMonthFilter && selectedMonthFilter !== 'all') {
        all = all.filter(function(t) {
            return getTaskMonthKey(t) === selectedMonthFilter;
        });
    }

    if (selectedAMFilter) {
        all = all.filter(function(t) {
            return String(t.am_id || '').trim() === String(selectedAMFilter).trim() ||
                   String(t.am_name || '').trim() === String(selectedAMName).trim();
        });
    }

    if (selectedEmployeeFilter) {
        all = all.filter(function(t) {
            var eid = String(t.assigned_employee_id || '').trim().toLowerCase();
            var secEid = String(t.secondary_employee_id || '').trim().toLowerCase();
            var target = String(selectedEmployeeFilter).trim().toLowerCase();
            if (target === 'unassigned') return !eid && !secEid;
            return eid === target || secEid === target;
        });
    }

    if (selectedPlanFilter) {
        all = all.filter(function(t) {
            var p = (t.plan_name || t.file_name || 'خطة عامة').trim();
            var f = (t.file_name || '').trim();
            return p === selectedPlanFilter || f === selectedPlanFilter;
        });
    }

    var reviewTasks = all.filter(function(t) {
        return matchTaskStatus(t.status, 'review');
    });

    if (!reviewTasks || reviewTasks.length === 0) {
        showToast('لا توجد مهام مسلّمة بانتظار الاعتماد حالياً', 'info');
        return;
    }

    var count = reviewTasks.length;
    var confirmMsg = 'هل أنت متأكد من اعتماد واكتمال ' + count + ' مهمة مسلّمة دفعة واحدة؟\nسيتم تحديث حالتها إلى «مكتملة ومعتمدة ✅» وإشعار المنفذين.';
    if (!confirm(confirmMsg)) return;

    var note = prompt('ملاحظة اعتماد جماعي (اختياري):', 'تم الاعتماد النهائي واكتمال العمل بنجاح — ممتاز!') || 'تم الاعتماد النهائي واكتمال العمل بنجاح — ممتاز!';
    var taskIds = reviewTasks.map(function(t){ return t.task_id; });

    try {
        showToast('جاري اعتماد ' + count + ' مهمة...', 'info');
        var res = await fetch('/api/tasks/bulk-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_ids: taskIds,
                action: 'finalize',
                note: note
            })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast('تم اعتماد واكتمال ' + (data.approved_count || count) + ' مهمة بنجاح ✅', 'success');
            await loadTasksEngine();
        } else {
            var okCount = 0;
            for (var i = 0; i < reviewTasks.length; i++) {
                try {
                    var r = await fetch('/api/tasks/' + encodeURIComponent(reviewTasks[i].task_id) + '/review', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'finalize', note: note })
                    });
                    if (r.ok) okCount++;
                } catch(e) {}
            }
            if (okCount > 0) {
                showToast('تم اعتماد ' + okCount + ' من إجمالي ' + count + ' مهمة بنجاح ✅', 'success');
                await loadTasksEngine();
            } else {
                showToast(data.error || 'تعذّر إتمام الاعتماد الجماعي', 'error');
            }
        }
    } catch(err) {
        console.error('bulkApprove error:', err);
        showToast('خطأ في الاتصال أثناء الاعتماد الجماعي', 'error');
    }
}
window.bulkApproveFilteredTasks = bulkApproveFilteredTasks;


async function assignCreatorFromBoard(taskId) {
    var sel = document.getElementById('creator-select-' + taskId);
    var creatorId = sel ? sel.value : '';
    var creatorName = (sel && sel.selectedIndex > 0) ? sel.options[sel.selectedIndex].text.replace(/\s*\([^)]*\)$/, '').trim() : '';
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/assign-creator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creator_id: creatorId, creator_name: creatorName })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast(data.creator_name ? ('تم تعيين كاتب المحتوى: ' + data.creator_name + ' ✍️') : 'تم إلغاء تعيين كاتب المحتوى ↩️');
            loadTasksEngine();
        } else {
            showToast(data.error || 'تعذّر تعيين كاتب المحتوى', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}
window.assignCreatorFromBoard = assignCreatorFromBoard;

async function coAssignTaskFromBoard(taskId) {
    var sel = document.getElementById('co-emp-select-' + taskId);
    var secId = sel ? sel.value : '';
    try {
        var res = await fetch('/api/tasks/' + encodeURIComponent(taskId) + '/co-assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secondary_employee_id: secId })
        });
        var data = await res.json();
        if (res.ok && data.ok) {
            showToast(secId ? (data.telegram_sent ? 'تم إسناد شريك العمل وإشعاره على تليجرام 👥✈️' : 'تم تعيين شريك العمل للمهمة بنجاح 👥') : 'تم إزالة شريك العمل بنجاح');
            loadTasksEngine();
        } else {
            showToast(data.error || 'تعذّر تعيين شريك العمل', 'error');
        }
    } catch(e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}
window.coAssignTaskFromBoard = coAssignTaskFromBoard;

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



// Window exports for global compatibility
window.currentBoardCardViewMode = currentBoardCardViewMode;
window.setBoardCardViewMode = setBoardCardViewMode;
window.toggleTaskCardDetails = toggleTaskCardDetails;
window.renderTaskCard = renderTaskCard;
window.renderTaskCardDetailsContent = renderTaskCardDetailsContent;
window.sortTaskList = sortTaskList;
window.renderTasksBoard = renderTasksBoard;
window.reviewTaskDecision = reviewTaskDecision;
window.bulkApproveFilteredTasks = bulkApproveFilteredTasks;
window.assignCreatorFromBoard = assignCreatorFromBoard;
window.coAssignTaskFromBoard = coAssignTaskFromBoard;
window.assignTaskFromBoard = assignTaskFromBoard;
window.recallTaskAction = recallTaskAction;
window.reassignTaskFromBoard = reassignTaskFromBoard;
window.uploadTaskAsset = uploadTaskAsset;
window.uploadTaskReferenceFile = uploadTaskReferenceFile;
window.promptAddLinkReference = promptAddLinkReference;
window.addTaskReference = addTaskReference;
window.resendTaskCard = resendTaskCard;
window.promptCompleteTask = promptCompleteTask;
window.updateTaskStatusAction = updateTaskStatusAction;
