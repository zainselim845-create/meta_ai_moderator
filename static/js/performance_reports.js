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
        tbody.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-slate-500">لا توجد سجلات أداء لشهر (' + esc(selectedMonth) + ') بعد</td></tr>';
        return;
    }

    var filtered = report.filter(function(r) {
        if (currentMonthlyReportRoleFilter === 'am') return !!r.is_am;
        if (currentMonthlyReportRoleFilter === 'executors') return !r.is_am;
        return true;
    });

    if (filtered.length === 0) {
        var emptyMsg = currentMonthlyReportRoleFilter === 'am' ? 'لا يوجد مديرو حسابات في تقرير هذا الشهر' :
                      (currentMonthlyReportRoleFilter === 'executors' ? 'لا يوجد فريق تنفيذ في تقرير هذا الشهر' : 'لا توجد سجلات أداء لهذا الشهر');
        tbody.innerHTML = '<tr><td colspan="9" class="p-6 text-center text-slate-500 font-bold">' + esc(emptyMsg) + '</td></tr>';
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
            '<td class="p-3 font-mono font-bold text-slate-800 text-center align-middle" title="' + (r.is_am ? 'إجمالي مهام العملاء تحت الإشراف' : 'إجمالي المهام المسندة للتنفيذ') + '">' + r.assigned + (r.is_am ? ' <span class="text-[9px] text-purple-600 block font-normal">إشراف</span>' : '') + '</td>' +
            '<td class="p-3 font-mono text-amber-600 font-bold text-center align-middle" title="' + (r.is_am ? 'مهام بانتظار مراجعة واعتماد AM' : 'مهام قيد العمل من المنفذ') + '">' + inProg + (r.is_am ? ' <span class="text-[9px] text-amber-600 block font-normal">بانتظار AM</span>' : '') + '</td>' +
            '<td class="p-3 font-mono font-bold text-emerald-600 text-center align-middle" title="' + (r.is_am ? 'مهام راجعها واعتمدها AM' : 'مهام تم تسليمها من المنفذ') + '">' + deliv + (r.is_am ? ' <span class="text-[9px] text-emerald-600 block font-normal">معتمدة ومغلقة</span>' : '') + '</td>' +
            '<td class="p-3 text-center align-middle">' + rateBadge + '</td>' +
            '<td class="p-3 font-mono align-middle">' + onTimeBadge + '</td>' +
            '<td class="p-3 font-mono text-indigo-900 font-bold align-middle" title="' + (r.is_am ? 'متوسط سرعة مراجعة واعتماد المهام' : 'متوسط مدة تنفيذ المهمة') + '">' + esc(r.avg_turnaround || '-') + (r.is_am ? ' <span class="text-[9px] text-indigo-600 block font-normal">سرعة المراجعة</span>' : '') + '</td>' +
            '<td class="p-3 font-mono text-slate-700 font-bold align-middle">' + (r.is_am ? '<span class="text-slate-400 font-normal text-[11px]">—</span>' : esc(r.avg_duration || '-')) + '</td>' +
            '<td class="p-3 text-xs text-slate-700 min-w-[240px] max-w-sm align-middle">' + notesHtml + '</td>' +
        '</tr>';
    }).join('');
}

async function loadTaskMonthlyReport() {
    try {
        var mInput = document.getElementById('monthly-report-month');
        var nowMonth = new Date().toISOString().slice(0, 7);
        if (mInput && !mInput.value) {
            mInput.value = nowMonth;
        }
        var selectedMonth = (mInput && mInput.value) ? mInput.value : nowMonth;
        var res = await fetch('/api/tasks/monthly-report?month=' + encodeURIComponent(selectedMonth));
        var data = await res.json();
        var tbody = document.getElementById('monthly-report-table-body');
        if (!tbody) return;

        var report = (data && data.report) ? data.report : [];
        window._lastMonthlyReportData = report;
        window._lastMonthlyReportMonth = selectedMonth;

        renderMonthlyReportTable();
    } catch(e) { console.error(e); }
}

function exportMonthlyReportCsv() {
    var tbody = document.getElementById('monthly-report-table-body');
    if (!tbody || !window._lastMonthlyReportData || !window._lastMonthlyReportData.length) {
        showToast('لا توجد بيانات متاحة للتصدير حالياً', 'error');
        return;
    }
    var rows = [
        ["كود الموظف", "اسم الموظف", "الدور / المسمى الوظيفي", "تصنيف الدور", "المسندة / إشراف (Total)", "قيد العمل / بانتظار AM", "المسلمة / المعتمدة (Delivered)", "المعتمدة (Completed)", "معدل الإنجاز (Rate)", "الالتزام بالموعد (On-Time KPI)", "متوسط مدة الإنجاز / سرعة المراجعة", "وقت التايمر"]
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
    var mInput = document.getElementById('monthly-report-month');
    var m = (mInput && mInput.value) ? mInput.value : new Date().toISOString().slice(0, 7);
    var filterSuffix = currentMonthlyReportRoleFilter === 'am' ? '_AM' : (currentMonthlyReportRoleFilter === 'executors' ? '_Executors' : '_All');
    a.download = 'Monthly_Performance_Report_' + m + filterSuffix + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم تصدير التقرير الشهري بنجاح ');
}

async function sendMonthlyReportAction() {
    var targetEmail = prompt("أدخل البريد الإلكتروني لاستلام التقرير الشهري:", "agencydomya@gmail.com");
    if (!targetEmail) return;
    try {
        showToast("جاري تجهيز وإرسال التقرير للإيميل... ");
        var res = await fetch('/api/tasks/send-monthly-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail })
        });
        var data = await res.json();
        if (data.success) {
            showToast(data.message || 'تم إرسال التقرير بنجاح ');
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
