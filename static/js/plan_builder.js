// ============================================================
// Plan Builder & Template Module
// Interactive monthly plan creation, multi-row post generator,
// client/month bindings, and automated cloud task ingestion.
// ============================================================

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
    }
    updatePBPlanNameFromMonth();
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
    updatePBPlanNameFromMonth();
}

function onPlanBuilderModalClientSelectChange(val) {
    if (!val) return;
    if (val === '__new__') {
        togglePbCustomClient(true);
        updatePBPlanNameFromMonth();
        return;
    }
    var cSel = document.getElementById('pb-client-select');
    var cInp = document.getElementById('pb-client-name');
    var selOpt = cSel ? cSel.options[cSel.selectedIndex] : null;
    var clientName = (selOpt ? selOpt.getAttribute('data-name') : '') || (selOpt ? selOpt.text.split(' (')[0].trim() : '') || val;
    if (cInp) cInp.value = clientName;

    onPlanBuilderModalClientChange(clientName);
    updatePBPlanNameFromMonth();
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
        var matched = (activeCid && activeCid !== '__all__') ? (allClients || []).find(function(c){ return c.id === activeCid || c.name === activeCid; }) : null;
        activeCName = matched ? (matched.name || matched.id) : '';
    }

    // Populate pb-client-select with ALL clients
    if (clientSelect && allClients && allClients.length) {
        var opts = '<option value="">-- اختر العميل من القائمة --</option>' +
            allClients.map(function(c) {
                var amPart = c.am_name ? (' (AM: ' + c.am_name + ')') : '';
                var isSelected = (activeCid && activeCid !== '__all__' && (c.id === activeCid || c.name === activeCName || (c.company && c.company === activeCName)));
                return '<option value="' + esc(c.id) + '" data-name="' + esc(c.name) + '"' + (isSelected ? ' selected' : '') + '>' + esc(c.name) + amPart + '</option>';
            }).join('') +
            '<option value="__new__">+ كتابة اسم عميل جديد...</option>';
        clientSelect.innerHTML = opts;

        var selectedC = (activeCid && activeCid !== '__all__') ? allClients.find(function(c){ return c.id === activeCid || c.name === activeCName; }) : null;
        if (selectedC) {
            clientSelect.value = selectedC.id;
            activeCName = selectedC.name;
        } else {
            clientSelect.value = '';
            activeCName = '';
        }
    }

    if (clientInput && activeCName) {
        clientInput.value = activeCName;
    }

    populatePlanMonthDropdown();
    updatePBPlanNameFromMonth();

    // Load real AMs
    var realAMs = [
        { employee_id: 'AM-2072-9827', name: 'محمود خالد', role: 'ACCOUNT MANAGER' },
        { employee_id: 'EMP-5887-5256', name: 'آيه أحمد مجاهد', role: 'ACCOUNT MANAGER' },
        { employee_id: 'EMP-0652-9532', name: 'حبيبه احمد محمد', role: 'ACCOUNT MANAGER' }
    ];

    function fillAMSelect(list) {
        if (!amSelect) return;
        var myEmpId = (window.currentUserData && window.currentUserData.employee_id) || '';
        amSelect.innerHTML = '';
        list.forEach(function(a){
            var opt = document.createElement('option');
            opt.value = a.employee_id || a.id;
            var isMe = myEmpId && String(opt.value) === String(myEmpId);
            opt.textContent = '👤 [' + (a.employee_id || a.id) + '] ' + (a.name || a.employee_id) + ' — ' + (a.role || 'Account Manager') + (isMe ? ' (أنا 🙋‍♂️)' : '');
            if (isMe || opt.value === 'EMP-0652-9532') opt.selected = true;
            amSelect.appendChild(opt);
        });
    }

    fillAMSelect(realAMs);

    // Load Creators into pb-creator-select
    var pbCreatorSelect = document.getElementById('pb-creator-select');
    function fillPBCreatorSelect() {
        if (!pbCreatorSelect) return;
        var team = (window.allTeamEmployees && window.allTeamEmployees.length) ? window.allTeamEmployees : (employeesList || []);
        var myEmpId = (window.currentUserData && window.currentUserData.employee_id) || '';
        var curVal = pbCreatorSelect.value ? String(pbCreatorSelect.value).trim().toLowerCase() : '';
        var creators = (team || []).filter(function(e) {
            var r = (e.role || e.job || '').toLowerCase();
            var id = String(e.employee_id || '').toLowerCase();
            return r.includes('content') || r.includes('creator') || r.includes('كاتب') || r.includes('محتوى') || r.includes('writer') ||
                   id.includes('8069') || id.includes('2945') || id.includes('7189') || id.includes('3264') || id.includes('8148');
        });
        if (!creators.length) {
            creators = [
                { employee_id: 'EMP-8069-7345', name: 'ولاء أشرف محمد', role: 'Content Creator' },
                { employee_id: 'EMP-2945-2364', name: 'هدير أنور عباس', role: 'Content Creator' },
                { employee_id: 'EMP-7189-7780', name: 'عبدالرحمن محمد عربي', role: 'Content Creator' },
                { employee_id: 'EMP-3264-8790', name: 'ليالي أحمد', role: 'Content Creator' },
                { employee_id: 'EMP-8148', name: 'عمر أحمد عبدالرحمن', role: 'Creative' }
            ];
        }
        var opts = '<option value="" data-name="">👤 اختيار وتعيين بواسطة AM لاحقاً</option>';
        creators.forEach(function(c) {
            var cEid = String(c.employee_id || '').trim().toLowerCase();
            var isMe = myEmpId && cEid === String(myEmpId).trim().toLowerCase();
            var isSel = (curVal && curVal === cEid) || (!curVal && isMe);
            var cleanName = _cleanEmployeeArabicName(c.name || c.employee_id);
            opts += '<option value="' + esc(c.employee_id) + '" data-name="' + esc(cleanName) + '"' + (isSel ? ' selected' : '') + '>✍️ [' + esc(c.employee_id) + '] ' + esc(cleanName) + (isMe ? ' (أنا ✍️)' : '') + '</option>';
        });
        opts += '<option value="auto" data-name="">✨ كشف تلقائي / الحساب الحالي</option>';
        pbCreatorSelect.innerHTML = opts;
    }
    fillPBCreatorSelect();

    var pbCustomInp = document.getElementById('pb-custom-creator');
    if (pbCustomInp) {
        pbCustomInp.value = '';
        pbCustomInp.classList.add('hidden');
    }
    if (pbCreatorSelect) pbCreatorSelect.classList.remove('hidden');
    var pbToggleBtn = document.getElementById('btn-pb-custom-creator-toggle');
    if (pbToggleBtn) pbToggleBtn.textContent = '+ كاتب جديد';

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
    var pbCustomInp = document.getElementById('pb-custom-creator');
    if (pbCustomInp) {
        pbCustomInp.value = '';
        pbCustomInp.classList.add('hidden');
    }
    var pbCreatorSelect = document.getElementById('pb-creator-select');
    if (pbCreatorSelect) pbCreatorSelect.classList.remove('hidden');
    var pbToggleBtn = document.getElementById('btn-pb-custom-creator-toggle');
    if (pbToggleBtn) pbToggleBtn.textContent = '+ كاتب جديد';
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
        if (sel) {
            var currentVal = sel.value;
            sel.innerHTML = buildTeamAssigneeOptionsHtml(team, currentVal, '👤 إسناد لمصمم/منفذ (اختياري)...');
        }
        var coSel = r.querySelector('.pb-co-assignee');
        if (coSel) {
            var currentCoVal = coSel.value;
            coSel.innerHTML = buildTeamAssigneeOptionsHtml(team, currentCoVal, '👥 شريك عمل (اختياري)...');
        }
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
               ((employeesList && employeesList.length) ? employeesList : null);
    var preselectedVal = data.assigned_employee_id || '';
    var assigneeOptions = buildTeamAssigneeOptionsHtml(team, preselectedVal, '👤 إسناد لمصمم/منفذ (اختياري)...');

    var preselectedSecVal = data.secondary_employee_id || '';
    var coAssigneeOptions = buildTeamAssigneeOptionsHtml(team, preselectedSecVal, '👥 شريك عمل (اختياري)...');

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
                '<select class="pb-assignee text-xs font-bold bg-blue-50/70 border border-blue-200 rounded-xl px-2.5 py-1 text-blue-900 focus:outline-none focus:border-blue-500" title="إسناد المهمة للمصمم أو المنفذ">' +
                    assigneeOptions +
                '</select>' +
                '<select class="pb-co-assignee text-xs font-bold bg-indigo-50/70 border border-indigo-200 rounded-xl px-2.5 py-1 text-indigo-900 focus:outline-none focus:border-indigo-500" title="شريك عمل / منفذ إضافي (اختياري - عمل مشترك)">' +
                    coAssigneeOptions +
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
    if (!planSubName) {
        var pbMonth = (typeof getEffectivePlanMonth === 'function') ? getEffectivePlanMonth('pb-plan-month') : (((document.getElementById('pb-plan-month') || {}).value || '').trim());
        if (pbMonth) planSubName = 'خطة ' + resolvedCname + ' — ' + pbMonth;
    }
    var planName = planSubName || ('خطة ' + resolvedCname);
    var amId = (document.getElementById('pb-am-select') || {}).value || '';
    var creatorInp = document.getElementById('pb-custom-creator');
    var creatorEl = document.getElementById('pb-creator-select');
    var creatorId = '';
    var creatorName = '';
    if (creatorInp && !creatorInp.classList.contains('hidden') && creatorInp.value.trim()) {
        creatorName = creatorInp.value.trim();
        creatorId = creatorName;
    } else if (creatorEl && creatorEl.value !== 'auto') {
        creatorId = creatorEl.value.trim();
        var creatorOpt = (creatorEl.selectedIndex >= 0) ? creatorEl.options[creatorEl.selectedIndex] : null;
        creatorName = (creatorOpt && creatorOpt.value && creatorOpt.value !== 'auto')
            ? (creatorOpt.getAttribute('data-name') || creatorOpt.text.replace(/\s*\(.*?\)$/, '').replace(/^[^\w\u0600-\u06FF]+/, '').replace(/\s*—.*$/, '').trim())
            : '';
    }

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
        var empOpt = (empSelect && empSelect.selectedIndex > 0) ? empSelect.options[empSelect.selectedIndex] : null;
        var empName = empOpt
            ? (empOpt.getAttribute('data-name') || empOpt.text.replace(/^[^\s]+\s*/, '').replace(/\s*—.*$/, '').trim())
            : '';

        var coEmpSelect = r.querySelector('.pb-co-assignee');
        var coEmpId = coEmpSelect ? coEmpSelect.value : '';
        var coEmpOpt = (coEmpSelect && coEmpSelect.selectedIndex > 0) ? coEmpSelect.options[coEmpSelect.selectedIndex] : null;
        var coEmpName = coEmpOpt
            ? (coEmpOpt.getAttribute('data-name') || coEmpOpt.text.replace(/^[^\s]+\s*/, '').replace(/\s*—.*$/, '').trim())
            : '';

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
            delivery_deadline: pdate,
            scheduled_start_date: pdate,
            creator_id: creatorId,
            creator_name: creatorName,
            content_creator_id: creatorId,
            content_creator_name: creatorName,
            assigned_employee_id: empId,
            assignee_name: empName,
            secondary_employee_id: coEmpId,
            secondary_assignee_name: coEmpName,
            reference_links: refList,
            media_urls: refList
        };
        structuredPosts.push(postObj);

        var block = '---' + '\n' +
            'بوست #' + (idx + 1) + ' | النوع: ' + type + ' | الهدف: ' + pillar + (pdate ? (' | تاريخ النشر: ' + pdate) : '') + (empId ? (' | المسند: ' + empName) : '') + (coEmpId ? (' | شريك العمل: ' + coEmpName) : '') + '\n' +
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
                content_creator_id: creatorId,
                creator_id: creatorId,
                content_creator_name: creatorName,
                creator_name: creatorName,
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
                if (typeof switchActiveClient === 'function') {
                    await switchActiveClient(res.client_id);
                } else if (typeof switchToClient === 'function') {
                    await switchToClient(res.client_id);
                } else {
                    window.activeClientId = res.client_id;
                    currentClient = res.client_id;
                    if (typeof loadTasksEngine === 'function') loadTasksEngine();
                }
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


