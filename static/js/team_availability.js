// ============================================================
// Team Availability & Workload Module
// Handles employee status cards, department filters, capacity bars,
// and board task filtering by employee.
// ============================================================

var currentEmployeesDeptFilter = 'all';

function setEmployeesDeptFilter(dept) {
    currentEmployeesDeptFilter = dept;
    renderEmployeesStatus();
}

function switchTasksSection(secName) {
    var valid = ['board', 'team', 'ingest', 'reports'];
    var target = valid.indexOf(secName) !== -1 ? secName : 'board';

    valid.forEach(function(s) {
        var btn = document.getElementById('tab-tasks-' + s);
        var sec = document.getElementById('tasks-section-' + s);
        if (btn) {
            if (s === target) {
                btn.className = 'tasks-sec-tab px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition bg-blue-600 text-white shadow-xs cursor-pointer';
            } else {
                btn.className = 'tasks-sec-tab px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer';
            }
        }
        if (sec) {
            if (s === target) {
                sec.classList.remove('hidden');
            } else {
                sec.classList.add('hidden');
            }
        }
    });

    try { localStorage.setItem('tasks_active_section', target); } catch(e){}

    if (target === 'team') {
        renderEmployeesStatus();
    } else if (target === 'reports') {
        if (typeof loadTaskMonthlyReport === 'function') loadTaskMonthlyReport();
    } else if (target === 'board') {
        renderTasksBoard();
    }
}
window.switchTasksSection = switchTasksSection;

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
        box.innerHTML = '<div class="py-8 text-slate-400 text-center text-xs">لا يوجد موظفون متاحون حالياً</div>';
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

    function getEmployeeArabicRole(roleStr) {
        var r = (roleStr || '').toLowerCase();
        if (/فيديو|video|edit|مونت/i.test(r)) return '🎬 مونتير فيديو';
        if (/جرافيك|graphic|design|ديزاين/i.test(r)) return '🎨 مصمم جرافيك';
        if (/content|writer|كاتب|محتوى|script/i.test(r)) return '✍️ كاتب محتوى';
        if (/account|أكونت|حسابات/i.test(r)) return '👤 مدير حسابات';
        return '💼 عضو فريق';
    }

    function getRoleBadgeStyle(rType) {
        if (rType === 'video') return 'bg-blue-50 text-blue-700 border border-blue-200';
        if (rType === 'graphic') return 'bg-purple-50 text-purple-700 border border-purple-200';
        if (rType === 'content') return 'bg-amber-50 text-amber-800 border border-amber-200';
        if (rType === 'am') return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }

    var countAm = emps.filter(function(e){ return getEmployeeRoleType(e.role) === 'am'; }).length;
    var countVideo = emps.filter(function(e){ return getEmployeeRoleType(e.role) === 'video'; }).length;
    var countGraphic = emps.filter(function(e){ return getEmployeeRoleType(e.role) === 'graphic'; }).length;
    var countContent = emps.filter(function(e){ return getEmployeeRoleType(e.role) === 'content'; }).length;

    // Full-width segmented tabs bar with 0 scrollbar and 0 dead space
    var deptTabsHtml = '<div class="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100/90 rounded-2xl mb-4 text-xs font-bold w-full">' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'all\')" class="w-full py-2 px-3 rounded-xl transition text-center cursor-pointer ' + (currentEmployeesDeptFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-slate-900') + '">👥 الكل (' + emps.length + ')</button>' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'am\')" class="w-full py-2 px-3 rounded-xl transition text-center cursor-pointer ' + (currentEmployeesDeptFilter === 'am' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-indigo-700') + '">💼 أكونت مانيجر (' + countAm + ')</button>' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'video\')" class="w-full py-2 px-3 rounded-xl transition text-center cursor-pointer ' + (currentEmployeesDeptFilter === 'video' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-blue-700') + '">🎬 فيديو (' + countVideo + ')</button>' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'graphic\')" class="w-full py-2 px-3 rounded-xl transition text-center cursor-pointer ' + (currentEmployeesDeptFilter === 'graphic' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-purple-700') + '">🎨 جرافيك (' + countGraphic + ')</button>' +
        '<button type="button" onclick="setEmployeesDeptFilter(\'content\')" class="w-full py-2 px-3 rounded-xl transition text-center cursor-pointer ' + (currentEmployeesDeptFilter === 'content' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white hover:text-amber-700') + '">✍️ كونتنت (' + countContent + ')</button>' +
    '</div>';

    var filteredEmps = emps.filter(function(e) {
        if (currentEmployeesDeptFilter === 'all') return true;
        return getEmployeeRoleType(e.role) === currentEmployeesDeptFilter;
    });

    var arabicStatusMap = {
        'Assigned': '📋 مسندة',
        'In Progress': '⚡ قيد التنفيذ',
        'Review Required': '🔍 بانتظار المراجعة',
        'Awaiting AM Review': '🔍 مراجعة AM',
        'Pending Revision': '↩️ طلب تعديل',
        'Submitted': '🚀 تم التسليم',
        'Submitted / In Review': '🚀 تم التسليم',
        'Delivered to Client': '📦 مسلّمة للعميل',
        'Completed': '✅ مكتملة'
    };

    var itemsHtml = filteredEmps.map(function(e){
        var eid = String(e.employee_id || '').trim();
        var enm = String(e.name || '').trim();
        var cleanName = (typeof _cleanEmployeeArabicName === 'function') ? _cleanEmployeeArabicName(enm, eid) : (enm || eid);
        var rType = getEmployeeRoleType(e.role);
        var arabicRole = getEmployeeArabicRole(e.role);
        var roleBadgeStyle = getRoleBadgeStyle(rType);
        
        var empTasks = (tasksByEmp[eid] || tasksByEmp[enm] || []).slice();
        var activeTasks = empTasks.filter(function(t){ return t.status !== 'Completed'; });
        var n = (typeof load[eid] !== 'undefined') ? load[eid] : (typeof load[enm] !== 'undefined' ? load[enm] : activeTasks.length);
        if (!n && activeTasks.length) {
            n = activeTasks.length;
        }

        var working = ((inprog[eid] || inprog[enm] || 0) > 0) || activeTasks.some(function(t){ return t.status === 'In Progress'; });
        var isSelected = (selectedEmployeeFilter && eid && selectedEmployeeFilter.toLowerCase() === eid.toLowerCase());
        var dot = n === 0 ? 'bg-emerald-500' : (working ? 'bg-amber-500 animate-pulse' : 'bg-blue-500');
        var loadPercent = Math.min(100, Math.round((n / 5) * 100));
        var loadBarColor = n === 0 ? 'bg-emerald-500' : (working ? 'bg-amber-500' : 'bg-blue-500');

        var statusPill = '';
        if (n === 0) {
            statusPill = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 shadow-2xs"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> متاح لاستلام مهام</span>';
        } else if (working) {
            statusPill = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 shadow-2xs"><span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> شغّال الآن (' + n + ' مهمة)</span>';
        } else {
            statusPill = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0 shadow-2xs"><span class="w-2 h-2 rounded-full bg-blue-500"></span> ' + n + ' مهمة مسندة</span>';
        }

        var bgClass = isSelected ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-md' : 'bg-white hover:bg-slate-50/70 border-slate-200/90 shadow-2xs';

        var headlinesHtml = '';
        if (activeTasks.length > 0) {
            headlinesHtml = '<div class="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">' +
                '<div class="font-bold text-xs text-slate-500 flex items-center justify-between">' +
                    '<span>عناوين المهام الحالية (' + activeTasks.length + '):</span>' +
                    '<button type="button" onclick="event.stopPropagation(); toggleEmployeeFilter(\'' + escJs(eid) + '\', \'' + escJs(cleanName) + '\')" class="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer">فلترة على البورد ←</button>' +
                '</div>' +
                activeTasks.map(function(t){
                    var pType = (t.post_type || '').toLowerCase();
                    var pTypeIcon = pType === 'carousel' ? '📑' : (pType === 'reel' ? '🎬' : (pType === 'story' ? '📱' : '🖼️'));
                    var rawSt = t.status || 'Assigned';
                    var arabicSt = arabicStatusMap[rawSt] || rawSt;
                    var stClass = rawSt === 'In Progress' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                  (rawSt.indexOf('Review') !== -1 ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                  (rawSt === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-blue-100 text-blue-800 border-blue-200'));
                    var cid = (t.client_id || '').trim();
                    var cname = (t.client_name || '').trim();
                    var cBadgeText = (cid && cname && cid !== cname) ? ('<span class="font-mono text-[9px]">[' + esc(cid) + ']</span> ' + esc(cname)) : esc(cname || cid);
                    var cNameBadge = cBadgeText ? '<span class="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold border border-slate-200 shrink-0 flex items-center gap-1">🏢 ' + cBadgeText + '</span>' : '';
                    var deadlineBadge = t.delivery_deadline ? '<span class="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono shrink-0">📅 ' + esc(t.delivery_deadline) + '</span>' : '';
                    var titleText = esc(t.title || t.tagline || 'مهمة بدون عنوان');
                    
                    return '<div onclick="event.stopPropagation(); highlightTaskCard(\'' + escJs(t.task_id) + '\')" ' +
                        'title="اضغط للانتقال إلى المهمة على اللوحة" class="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50/90 hover:bg-blue-50/90 hover:border-blue-300 border border-slate-200/80 transition group cursor-pointer text-right">' +
                        '<div class="flex items-center gap-2 flex-1 min-w-0">' +
                            '<span class="flex-shrink-0 text-sm">' + pTypeIcon + '</span>' +
                            '<span class="font-bold text-xs text-slate-800 group-hover:text-blue-700 leading-snug flex-1 min-w-0 break-words">' + titleText + '</span>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5 shrink-0">' +
                            cNameBadge +
                            deadlineBadge +
                            '<span class="text-[10px] px-2 py-0.5 rounded-md font-bold border ' + stClass + '">' + arabicSt + '</span>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>';
        } else {
            headlinesHtml = '<div class="mt-3 pt-3 border-t border-slate-100 text-slate-400 text-xs text-center flex items-center justify-center gap-1.5 py-1">' +
                '<span>✨ لا توجد مهام نشطة حالياً — جاهز لاستلام عمل جديد</span>' +
            '</div>';
        }

        var initialChar = cleanName.charAt(0) || '👤';

        return '<div class="rounded-2xl border p-4 transition-all text-slate-800 ' + bgClass + ' hover:shadow-sm flex flex-col justify-between space-y-3">' +
            '<div onclick="toggleEmployeeFilter(\'' + escJs(eid) + '\', \'' + escJs(cleanName) + '\')" class="cursor-pointer space-y-2.5">' +
                '<div class="flex items-start justify-between gap-2">' +
                    '<div class="flex items-center gap-2.5 min-w-0 flex-1">' +
                        '<div class="relative shrink-0">' +
                            '<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm shadow-2xs">' +
                                initialChar +
                            '</div>' +
                            '<span class="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white ' + dot + '"></span>' +
                        '</div>' +
                        '<div class="min-w-0 flex-1">' +
                            '<h4 class="font-bold text-sm text-slate-900 truncate leading-snug"><span class="font-mono text-xs text-slate-500 font-normal">[' + esc(eid) + ']</span> ' + esc(cleanName) + '</h4>' +
                            '<span class="inline-flex items-center gap-1 text-[11px] font-bold ' + roleBadgeStyle + ' px-2 py-0.5 rounded-md mt-0.5">' + arabicRole + '</span>' +
                        '</div>' +
                    '</div>' +
                    statusPill +
                '</div>' +
                '<div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">' +
                    '<div class="h-full rounded-full transition-all ' + loadBarColor + '" style="width: ' + loadPercent + '%"></div>' +
                '</div>' +
            '</div>' +
            headlinesHtml +
        '</div>';
    }).join('');

    var html = deptTabsHtml + '<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">' + (itemsHtml || '<div class="col-span-full py-8 text-slate-400 text-center text-xs">لا يوجد موظفون في هذا القسم</div>') + '</div>';

    if (selectedEmployeeFilter) {
        html = '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between mb-4 shadow-2xs">' +
            '<span class="text-xs text-blue-800 font-bold flex items-center gap-1.5"><span>🎯 فلترة المهام المفعلة للموظف:</span> <b>' + (selectedEmployeeFilter ? '<span class="font-mono text-xs font-normal">[' + esc(selectedEmployeeFilter) + ']</span> ' : '') + esc(selectedEmployeeName) + '</b></span>' +
            '<button type="button" onclick="clearEmployeeFilter()" class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-bold transition shadow-xs cursor-pointer">إلغاء الفلترة ✕</button>' +
        '</div>' + html;
    }

    box.innerHTML = html;
}

function toggleEmployeeFilter(empId, empName) {
    var key = String(empId || '').trim();
    if (selectedEmployeeFilter && selectedEmployeeFilter.toLowerCase() === key.toLowerCase()) {
        selectedEmployeeFilter = null;
        selectedEmployeeName = '';
    } else {
        selectedEmployeeFilter = key;
        selectedEmployeeName = empName || key;
        // When filtering by a specific employee, ensure client scope doesn't hide their tasks if they belong to another client
        if (window.activeClientId && window.activeClientId !== 'all' && window.activeClientId !== '__all__') {
            var curCid = String(window.activeClientId).toLowerCase();
            var hasInCurClient = (tasksList || []).some(function(t) {
                var tCid = String(t.client_id || '').toLowerCase();
                var matchClient = (tCid === curCid || t.client_id === window.activeClientId);
                var eid = String(t.assigned_employee_id || '').trim().toLowerCase();
                var secEid = String(t.secondary_employee_id || '').trim().toLowerCase();
                var target = key.toLowerCase();
                return matchClient && (eid === target || secEid === target);
            });
            if (!hasInCurClient) {
                window.activeClientId = 'all';
                try { localStorage.setItem('active_client_id', 'all'); } catch(e){}
            }
        }
        // Switch to the board sub-feature so user immediately sees this employee's tasks on the board!
        if (typeof switchTasksSection === 'function') {
            switchTasksSection('board');
        }
    }
    // Always reset status filter to 'all' so the employee's tasks are immediately visible without conflicting status restrictions
    currentTaskStatusFilter = 'all';
    renderEmployeesStatus();
    renderTasksBoard();
}

function clearEmployeeFilter() {
    selectedEmployeeFilter = null;
    selectedEmployeeName = '';
    currentTaskStatusFilter = 'all';
    renderEmployeesStatus();
    renderTasksBoard();
}


// Expose functions globally for window and cross-module calls
window.currentEmployeesDeptFilter = currentEmployeesDeptFilter;
window.setEmployeesDeptFilter = setEmployeesDeptFilter;
window.renderEmployeesStatus = renderEmployeesStatus;
window.toggleEmployeeFilter = toggleEmployeeFilter;
window.clearEmployeeFilter = clearEmployeeFilter;
