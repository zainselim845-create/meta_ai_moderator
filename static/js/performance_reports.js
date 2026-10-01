// ============================================================
// Performance & Monthly Reports Module
// Handles employee KPI monthly performance tables, AM reviews tracking,
// CSV/Excel exports, and report dispatching.
// ============================================================

var currentMonthlyReportRoleFilter = 'all';

function setMonthlyReportRoleFilter(roleFilter) {
    currentMonthlyReportRoleFilter = roleFilter || 'all';

    var btnAll = document.getElementById('btn-mr-filter-all');
    var btnAm = document.getElementById('btn-mr-filter-am');
    var btnExec = document.getElementById('btn-mr-filter-executors');

    var activeAllClass = 'bg-slate-900 text-white shadow-xs';
    var activeAmClass = 'bg-purple-600 text-white shadow-xs';
    var activeExecClass = 'bg-blue-600 text-white shadow-xs';
    var inactiveClass = 'text-slate-600 hover:bg-white';

    if (btnAll) {
        btnAll.className = 'flex-1 sm:flex-initial py-1.5 px-3.5 rounded-xl transition cursor-pointer ' + 
            (currentMonthlyReportRoleFilter === 'all' ? activeAllClass : inactiveClass + ' hover:text-slate-900');
    }
    if (btnAm) {
        btnAm.className = 'flex-1 sm:flex-initial py-1.5 px-3.5 rounded-xl transition cursor-pointer ' + 
            (currentMonthlyReportRoleFilter === 'am' ? activeAmClass : inactiveClass + ' hover:text-purple-700');
    }
    if (btnExec) {
        btnExec.className = 'flex-1 sm:flex-initial py-1.5 px-3.5 rounded-xl transition cursor-pointer ' + 
            (currentMonthlyReportRoleFilter === 'executors' ? activeExecClass : inactiveClass + ' hover:text-blue-700');
    }

    renderMonthlyReportTable();
}

function renderMonthlyReportTable() {
    var tbody = document.getElementById('monthly-report-table-body');
    if (!tbody) return;

    var report = window._lastMonthlyReportData || [];
    var selectedMonth = window._lastMonthlyReportMonth || new Date().toISOString().slice(0, 7);

    if (!report || report.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="p-4 text-center text-slate-500">لا توجد سجلات أداء لشهر (' + esc(selectedMonth) + ') بعد</td></tr>';
        return;
    }

    var filtered = report.filter(function(r) {
        var empStr = ((r.employee || '') + ' ' + (r.employee_id || '')).toLowerCase();
        if (empStr.indexOf('اسلام') !== -1 || empStr.indexOf('إسلام') !== -1 || empStr.indexOf('islam') !== -1 || empStr.indexOf('eslam') !== -1 || empStr.indexOf('4100-3630') !== -1) {
            return false;
        }
        if (currentMonthlyReportRoleFilter === 'am') return !!r.is_am;
        if (currentMonthlyReportRoleFilter === 'executors') return !r.is_am;
        return true;
    });

    if (filtered.length === 0) {
        var emptyMsg = currentMonthlyReportRoleFilter === 'am' ? 'لا يوجد مديرو حسابات في تقرير هذا الشهر' :
                      (currentMonthlyReportRoleFilter === 'executors' ? 'لا يوجد فريق تنفيذ في تقرير هذا الشهر' : 'لا توجد سجلات أداء لهذا الشهر');
        tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-slate-500 font-bold">' + esc(emptyMsg) + '</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(function(r) {
        var onTimeBadge = r.on_time_rate !== '-' ?
            ('<span class="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">' + esc(r.on_time_rate) +
             ' <span class="text-[10px] text-slate-400 font-normal">(' + r.on_time_count + ' في الموعد)</span></span>') : '<span class="text-slate-400">—</span>';
        
        var notesHtml = '<span class="text-slate-400">—</span>';
        if (r.notes && r.notes.length) {
            notesHtml = '<div class="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">' +
                r.notes.map(function(n) {
                    if (typeof n === 'object' && n && n.task_id) {
                        var subtaskBadge = n.is_subtask ?
                            '<span class="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold shrink-0 border border-amber-300">تعديل #' + (n.revision_number || '1') + '</span>' : '';

                        var isDelBadge = n.is_deleted ? 
                            '<span class="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold shrink-0 border border-amber-300" title="تم حذف الخطة/المهمة ولكن تم احتسابها ومكافأة الموظف عليها لعدم ضياع مجهوده">محتسبة (محذوفة)</span>' : '';

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
                                subtaskBadge +
                                isDelBadge +
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

        var subAssigned = r.subtasks_assigned || 0;
        var subCompleted = r.subtasks_completed || 0;
        var subtasksBadge = '<span class="text-slate-400 font-normal">—</span>';
        if (subAssigned > 0) {
            var subAllDone = (subCompleted >= subAssigned);
            subtasksBadge = '<div class="inline-flex flex-col items-center gap-0.5">' +
                '<span class="font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ' + 
                    (subAllDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300') + '">' +
                    'سلم ' + subCompleted + ' من ' + subAssigned +
                '</span>' +
                (r.subtasks_completion_rate && r.subtasks_completion_rate !== '-' ? 
                    '<span class="text-[9px] text-slate-500 font-semibold">(' + esc(r.subtasks_completion_rate) + ')</span>' : '') +
            '</div>';
        }

        var inProg = (r.in_progress !== undefined) ? r.in_progress : 0;
        var deliv = (r.submitted !== undefined) ? r.submitted : r.completed;

        var empCode = r.employee_id ? ('<span class="font-mono text-[10px] text-slate-500 font-normal">[' + esc(r.employee_id) + ']</span> ') : '';
        var roleBadge = r.is_am ? 
            '<span class="text-[10px] bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md font-bold">👤 مدير حسابات (مراجعة وإغلاق)</span>' :
            ('<span class="text-[10px] text-slate-500 font-normal">(' + esc(r.role) + ')</span>');

        return '<tr class="hover:bg-slate-50/60 transition-colors ' + (r.is_am ? 'bg-purple-50/20' : '') + '">' +
            '<td class="p-3 font-bold text-slate-900 align-middle">' +
                '<div class="flex items-center gap-2">' +
                    '<span class="w-6 h-6 rounded-full ' + (r.is_am ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200') + ' flex items-center justify-center font-bold text-[10px] shrink-0 border">' + (r.is_am ? '💼' : '👤') + '</span>' +
                    '<div>' + empCode + esc(r.employee) + ' <div class="mt-0.5">' + roleBadge + '</div></div>' +
                '</div>' +
            '</td>' +
            '<td class="p-3 font-mono font-bold text-slate-800 text-center align-middle" title="' + (r.is_am ? 'إجمالي مهام العملاء الأساسية تحت الإشراف' : 'إجمالي المهام الأساسية المسندة للتنفيذ') + '">' + r.assigned + (r.is_am ? ' <span class="text-[9px] text-purple-600 block font-normal">إشراف</span>' : '') + '</td>' +
            '<td class="p-3 font-mono text-amber-600 font-bold text-center align-middle" title="' + (r.is_am ? 'مهام أساسية بانتظار مراجعة واعتماد AM' : 'مهام أساسية قيد العمل من المنفذ') + '">' + inProg + (r.is_am ? ' <span class="text-[9px] text-amber-600 block font-normal">بانتظار AM</span>' : '') + '</td>' +
            '<td class="p-3 font-mono font-bold text-emerald-600 text-center align-middle" title="' + (r.is_am ? 'مهام أساسية راجعها واعتمدها AM' : 'مهام أساسية تم تسليمها من المنفذ') + '">' + deliv + (r.is_am ? ' <span class="text-[9px] text-emerald-600 block font-normal">معتمدة ومغلقة</span>' : '') + '</td>' +
            '<td class="p-3 text-center align-middle">' + rateBadge + '</td>' +
            '<td class="p-3 text-center align-middle" title="مهام التعديل الفرعية: سلم ' + subCompleted + ' من ' + subAssigned + '">' + subtasksBadge + '</td>' +
            '<td class="p-3 font-mono align-middle">' + onTimeBadge + '</td>' +
            '<td class="p-3 font-mono text-indigo-900 font-bold align-middle" title="' + (r.is_am ? 'متوسط سرعة مراجعة واعتماد المهام' : 'متوسط مدة تنفيذ المهمة') + '">' + esc(r.avg_turnaround || '-') + (r.is_am ? ' <span class="text-[9px] text-indigo-600 block font-normal">سرعة المراجعة</span>' : '') + '</td>' +
            '<td class="p-3 font-mono text-slate-700 font-bold align-middle">' + (r.is_am ? '<span class="text-slate-400 font-normal text-[11px]">—</span>' : esc(r.avg_duration || '-')) + '</td>' +
            '<td class="p-3 text-xs text-slate-700 min-w-[240px] max-w-sm align-middle">' + notesHtml + '</td>' +
        '</tr>';
    }).join('');
}

function formatArabicMonthName(m) {
    if (!m) return '';
    if (m === 'all') return 'كافة الشهور (التقرير الشامل)';
    var monthsMap = {
        '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
        '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
        '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
    };
    var parts = m.split('-');
    if (parts.length === 2 && monthsMap[parts[1]]) {
        return monthsMap[parts[1]] + ' ' + parts[0];
    }
    return m;
}

function populateMonthDropdown(availableMonths, selectedMonth) {
    var sel = document.getElementById('monthly-report-month-select');
    if (!sel) return;
    var currentRealMonth = new Date().toISOString().slice(0, 7);

    var allM = (availableMonths || []).slice();
    if (allM.indexOf(currentRealMonth) === -1) allM.push(currentRealMonth);
    if (selectedMonth && selectedMonth !== 'all' && allM.indexOf(selectedMonth) === -1) allM.push(selectedMonth);
    allM.sort().reverse();

    var html = '<option value="all"' + (selectedMonth === 'all' ? ' selected' : '') + '>🌐 كل الشهور (التقرير الشامل التراكمي)</option>';
    allM.forEach(function(m) {
        var isCur = (m === currentRealMonth);
        var label = '📅 ' + formatArabicMonthName(m) + (isCur ? ' (الشهر الحالي)' : '');
        html += '<option value="' + esc(m) + '"' + (selectedMonth === m ? ' selected' : '') + '>' + label + '</option>';
    });
    sel.innerHTML = html;
}

function onMonthlyReportMonthSelectChange(val) {
    if (val === '__current__') {
        val = new Date().toISOString().slice(0, 7);
    }
    var mInput = document.getElementById('monthly-report-month');
    if (mInput) {
        if (val === 'all') {
            mInput.value = '';
            mInput.disabled = true;
            mInput.classList.add('opacity-40');
        } else {
            mInput.value = val;
            mInput.disabled = false;
            mInput.classList.remove('opacity-40');
        }
    }
    loadTaskMonthlyReport(val);
}

function onMonthlyReportMonthInputChange(val) {
    if (!val) return;
    var sel = document.getElementById('monthly-report-month-select');
    if (sel) {
        var opt = sel.querySelector('option[value="' + val + '"]');
        if (opt) {
            sel.value = val;
        }
    }
    loadTaskMonthlyReport(val);
}

function navigateMonthlyReportMonth(delta) {
    var cur = window._lastMonthlyReportMonth;
    var currentRealMonth = new Date().toISOString().slice(0, 7);
    if (delta === 0 || !cur || cur === 'all') {
        onMonthlyReportMonthSelectChange(currentRealMonth);
        return;
    }
    var parts = cur.split('-');
    if (parts.length !== 2) {
        onMonthlyReportMonthSelectChange(currentRealMonth);
        return;
    }
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    m += delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    var nextM = y + '-' + (m < 10 ? '0' + m : m);
    onMonthlyReportMonthSelectChange(nextM);
}

async function loadTaskMonthlyReport(overrideMonth) {
    try {
        var mInput = document.getElementById('monthly-report-month');
        var nowMonth = new Date().toISOString().slice(0, 7);
        var selectedMonth = overrideMonth || (mInput && mInput.value) || nowMonth;

        if (mInput) {
            if (selectedMonth === 'all') {
                mInput.value = '';
                mInput.disabled = true;
                mInput.classList.add('opacity-40');
            } else {
                mInput.value = selectedMonth;
                mInput.disabled = false;
                mInput.classList.remove('opacity-40');
            }
        }

        var tbody = document.getElementById('monthly-report-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-slate-500 font-bold"><span class="animate-pulse">جاري جلب وحساب تقرير أداء ' + (selectedMonth === 'all' ? 'كافة الشهور' : formatArabicMonthName(selectedMonth)) + '...</span></td></tr>';
        }

        var res = await fetch('/api/tasks/monthly-report?month=' + encodeURIComponent(selectedMonth));
        var data = await res.json();
        if (!tbody) return;

        var report = (data && data.report) ? data.report : [];
        window._lastMonthlyReportData = report;
        window._lastMonthlyReportMonth = selectedMonth;
        window._availableReportMonths = data.available_months || [];

        populateMonthDropdown(data.available_months || [], selectedMonth);

        // Update period summary label
        var periodLabel = document.getElementById('monthly-report-period-label');
        if (periodLabel) {
            var totalAssigned = report.reduce(function(acc, r) { return acc + (r.assigned || 0); }, 0);
            var totalCompleted = report.reduce(function(acc, r) { return acc + (r.completed || 0); }, 0);
            var totalSubAssigned = report.reduce(function(acc, r) { return acc + (r.subtasks_assigned || 0); }, 0);
            var totalSubCompleted = report.reduce(function(acc, r) { return acc + (r.subtasks_completed || 0); }, 0);

            var monthNameStr = selectedMonth === 'all' ? 'كافة الشهور (التقرير الشامل التراكمي)' : formatArabicMonthName(selectedMonth);
            periodLabel.innerHTML = 'عرض أداء: <strong class="text-emerald-700 font-bold">' + esc(monthNameStr) + '</strong> &bull; ' +
                'المهام الأساسية: <span class="font-mono font-bold text-slate-800">' + totalAssigned + ' مسندة</span> (' + totalCompleted + ' منجزة) &bull; ' +
                'مهام التعديل (Subtasks): <span class="font-mono font-bold text-amber-700">' + totalSubAssigned + ' مسندة</span> (' + totalSubCompleted + ' منجزة)';
        }

        renderMonthlyReportTable();
    } catch(e) {
        console.error(e);
        var tbody = document.getElementById('monthly-report-table-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="p-6 text-center text-rose-500 font-bold">حدث خطأ أثناء تحميل تقرير الأداء</td></tr>';
        }
    }
}

function exportMonthlyReportCsv() {
    var tbody = document.getElementById('monthly-report-table-body');
    if (!tbody || !window._lastMonthlyReportData || !window._lastMonthlyReportData.length) {
        showToast('لا توجد بيانات متاحة للتصدير حالياً', 'error');
        return;
    }
    var rows = [
        ["كود الموظف", "اسم الموظف", "الدور / المسمى الوظيفي", "تصنيف الدور", "المهام الأساسية المسندة (Main Tasks)", "مهام أساسية قيد العمل", "مهام أساسية تم تسليمها", "مهام أساسية معتمدة", "معدل إنجاز المهام الأساسية", "مهام التعديل المسندة (Subtasks)", "تعديلات تم تسليمها (Delivered Subtasks)", "معدل إنجاز التعديلات", "الالتزام بالموعد (On-Time KPI)", "متوسط مدة الإنجاز / سرعة المراجعة", "وقت التايمر"]
    ];
    var dataToExport = (window._lastMonthlyReportData || []).filter(function(r) {
        if (currentMonthlyReportRoleFilter === 'am') return !!r.is_am;
        if (currentMonthlyReportRoleFilter === 'executors') return !r.is_am;
        return true;
    });
    dataToExport.forEach(function(r) {
        rows.push([
            r.employee_id || '',
            r.employee || '',
            r.role || '',
            r.is_am ? 'مدير حسابات (مراجعة وإغلاق)' : 'فريق التنفيذ',
            r.assigned || 0,
            r.in_progress || 0,
            r.submitted || 0,
            r.completed || 0,
            r.completion_rate || '-',
            r.subtasks_assigned || 0,
            r.subtasks_completed || 0,
            r.subtasks_completion_rate || '-',
            (r.on_time_rate || '-') + ' (' + (r.on_time_count || 0) + ' في الموعد)',
            r.avg_turnaround || '-',
            r.is_am ? '-' : (r.avg_duration || '-')
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
    var curMonth = window._lastMonthlyReportMonth || new Date().toISOString().slice(0, 7);
    var filterSuffix = currentMonthlyReportRoleFilter === 'am' ? '_AM' : (currentMonthlyReportRoleFilter === 'executors' ? '_Executors' : '_All');
    a.download = 'Monthly_Performance_Report_' + curMonth + filterSuffix + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم تصدير التقرير بنجاح ✅');
}

async function sendMonthlyReportAction() {
    var selectedMonth = window._lastMonthlyReportMonth || new Date().toISOString().slice(0, 7);
    var monthDisplay = selectedMonth === 'all' ? 'كافة الشهور (التقرير الشامل)' : formatArabicMonthName(selectedMonth);
    var targetEmail = prompt("أدخل البريد الإلكتروني لاستلام تقرير أداء (" + monthDisplay + "):", "agencydomya@gmail.com");
    if (!targetEmail) return;
    try {
        showToast("جاري إرسال تقرير (" + monthDisplay + ") للإيميل... ⏳");
        var res = await fetch('/api/tasks/send-monthly-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, month: selectedMonth })
        });
        var data = await res.json();
        if (data.success) {
            showToast(data.message || 'تم إرسال التقرير بنجاح ✅');
        } else {
            showToast(data.error || 'خطأ في إرسال التقرير', 'error');
        }
    } catch(e) {
        showToast('خطأ في إرسال التقرير', 'error');
    }
}


// Expose functions globally for window and cross-module calls
window.currentMonthlyReportRoleFilter = currentMonthlyReportRoleFilter;
window.setMonthlyReportRoleFilter = setMonthlyReportRoleFilter;
window.renderMonthlyReportTable = renderMonthlyReportTable;
window.loadTaskMonthlyReport = loadTaskMonthlyReport;
window.exportMonthlyReportCsv = exportMonthlyReportCsv;
window.sendMonthlyReportAction = sendMonthlyReportAction;
window.onMonthlyReportMonthSelectChange = onMonthlyReportMonthSelectChange;
window.onMonthlyReportMonthInputChange = onMonthlyReportMonthInputChange;
window.navigateMonthlyReportMonth = navigateMonthlyReportMonth;
window.formatArabicMonthName = formatArabicMonthName;
