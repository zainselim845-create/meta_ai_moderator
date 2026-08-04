/* Domya AI Moderator - Inbox Module */

var allInboxThreads = window.allInboxThreads || [];
var activeInboxItem = window.activeInboxItem || null;
var currentInboxFilter = window.currentInboxFilter || 'all';

var FALLBACK_INBOX_THREADS = [];

async function loadInbox(force=false){
    try {
        const acctFilter = window.activeAccountFilter ? '&account_id=' + encodeURIComponent(window.activeAccountFilter) : '';
        const url = (force ? '/api/conversations?force=true' : '/api/conversations?_=1') + acctFilter;
        const res = await fetch(url);
        const data = await res.json();
        allInboxThreads = data.conversations || data.threads || data.data || [];
        if (!allInboxThreads.length && !localStorage.getItem('fb_long_token') && !localStorage.getItem('chatwoot_connected')) {
            allInboxThreads = FALLBACK_INBOX_THREADS;
        }
        renderInboxList();
        if (allInboxThreads.length > 0 && (!activeInboxItem || !activeInboxItem.id)) {
            selectThread(allInboxThreads[0].id);
        }
    } catch(e){
        console.error('[loadInbox]', e);
        allInboxThreads = FALLBACK_INBOX_THREADS;
        renderInboxList();
        if (allInboxThreads.length > 0) {
            selectThread(allInboxThreads[0].id);
        }
    }
}


function renderInboxList(){
    const searchEl = document.getElementById('inbox-search');
    const searchVal = (searchEl ? searchEl.value : '').toLowerCase().trim();
    const listEl = document.getElementById('inbox-list') || document.getElementById('inbox-threads');
    if (!listEl) return;
    
    let filtered = allInboxThreads.filter(t => {
        const tId = String(t.id || '');
        const ch = String(t.channel || t.type || '');
        const platform = String(t.platform || '');
        if(currentInboxFilter === 'pending') return t.pending_approval;
        // New filter IDs matching HTML buttons
        if(currentInboxFilter === 'fb_dm') return (platform === 'facebook' || ch === 'messenger' || ch === 'dm') && !tId.startsWith('fb_comment_') && !tId.startsWith('ig_comment_');
        if(currentInboxFilter === 'ig_dm') return (platform === 'instagram' || ch === 'instagram_dm') && !tId.startsWith('ig_comment_') && !tId.startsWith('fb_comment_');
        if(currentInboxFilter === 'fb_comment') return tId.startsWith('fb_comment_') || ch === 'fb_comment';
        if(currentInboxFilter === 'ig_comment') return tId.startsWith('ig_comment_') || ch === 'ig_comment';
        // Legacy filters
        if(currentInboxFilter === 'messenger') return (ch === 'messenger' || ch === 'facebook') && !tId.startsWith('fb_comment_');
        if(currentInboxFilter === 'ig_direct') return (ch === 'instagram' || ch === 'ig' || ch === 'instagram_dm') && !tId.startsWith('ig_comment_');
        if(currentInboxFilter === 'fb_comments') return tId.startsWith('fb_comment_') || ch === 'fb_comment';
        if(currentInboxFilter === 'ig_comments') return tId.startsWith('ig_comment_') || ch === 'ig_comment';
        return true;
    });

    const pendingCount = allInboxThreads.filter(t => t.pending_approval).length;
    const pendingBadge = document.getElementById('pending-count');
    if (pendingBadge) {
        pendingBadge.textContent = pendingCount;
        if (pendingCount > 0) {
            pendingBadge.classList.remove('hidden');
        } else {
            pendingBadge.classList.add('hidden');
        }
    }

    if(searchVal){
        filtered = filtered.filter(t => (t.sender_name||'').toLowerCase().includes(searchVal) || (t.snippet||'').toLowerCase().includes(searchVal));
    }

    if(filtered.length === 0){
        listEl.innerHTML = `<div class="flex flex-col items-center justify-center p-8 text-center h-full mt-10">
            <div class="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4 border border-slate-200">
                <i data-lucide="message-square" class="w-7 h-7"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900 mb-1">لا توجد محادثات هنا</h3>
            <p class="text-xs text-slate-500 mb-4">لم يتم العثور على أي رسائل تطابق الفلتر الحالي.</p>
            <button onclick="setInboxFilter('all')" class="btn-ghost text-xs px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50">إظهار الكل</button>
        </div>`;
        lucide.createIcons();
        return;
    }

    listEl.innerHTML = filtered.map(t => {
        const sName = t.sender_name || t.sender || t.name || 'عميل جديد';
        const sTime = t.timestamp || t.updated_time || t.time_ago || '';
        const sSnip = t.snippet || t.last_msg || 'محادثة جديدة';
        const isFB = t.platform === 'facebook' || t.type === 'messenger' || String(t.id).startsWith('fb_');
        const platBadge = isFB ? '<span class="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px]">🔵 فيسبوك</span>' : '<span class="bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded text-[10px]">🟣 إنستجرام</span>';
        const isComment = t.channel === 'comment' || String(t.id).startsWith('fb_comment_') || String(t.id).startsWith('ig_comment_');
        const chanBadge = isComment ? '<span class="bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded text-[10px]">💬 تعليق</span>' : '<span class="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[10px]">📩 DM</span>';
        const isClient = t.customer_type === 'client' || (t.lead_badge && t.lead_badge.includes('مشترك'));
        const calculatedLead = typeof calculateLeadScore === 'function' ? calculateLeadScore(t).label : 'Cold 0%';
        const typeBadge = isClient ? '<span class="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px]">✨ عميل حالي</span>' : '<span class="bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded text-[10px]">🔥 ' + esc(t.lead_badge || calculatedLead) + '</span>';
        return `
        <div class="thread-item ${activeInboxItem && activeInboxItem.id === t.id ? 'active' : ''}" onclick="selectThread('${t.id}')">
            <div class="thread-avatar">
                ${t.avatar_url ? `<img src="${esc(t.avatar_url)}" class="w-full h-full object-cover rounded-full">` : esc((sName||'U')[0])}
            </div>
            <div class="thread-info">
                <div class="thread-name">
                    <span>${esc(sName)}</span>
                    <span class="thread-time">${formatDateTime(sTime)}</span>
                </div>
                <div class="flex flex-wrap gap-1 mt-1 mb-1">
                    ${platBadge} ${chanBadge} ${typeBadge}
                </div>
                <div class="thread-snippet">${esc(sSnip)}</div>
            </div>
            ${t.pending_approval ? '<div class="unread-dot"></div>' : ''}
        </div>
        `;
    }).join('');
}

function setInboxFilter(filter, btn){
    currentInboxFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderInboxList();
}


function renderBubble(m) {
    if (!m) return '';
    const text = esc(m.text || m.message || '');
    const atts = (m.attachments || []).map(a => {
        if (a.type === 'image' && a.url) {
            return `<img src="${esc(a.url)}" loading="lazy" class="m-1" onclick="window.open('${esc(a.url)}','_blank')">`;
        }
        if (a.type === 'video' && a.url) {
            return `<video src="${esc(a.url)}" controls class="m-1"></video>`;
        }
        if (a.url) {
            return `<a href="${esc(a.url)}" target="_blank" class="text-xs"><i data-lucide="paperclip" class="w-4 h-4 inline"></i> ${esc(a.name || 'ملف مرفق')}</a>`;
        }
        return '';
    }).join('');

    const aiBadge = m.source === 'ai' ? ' <span class="text-xs"><i data-lucide="bot" class="w-4 h-4 inline"></i> AI</span>' : '';
    const timeStr = formatDateTime(m.created_at || m.created_time || m.time);

    const alignClass = m.is_page ? 'self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm ml-12' : 'self-start bg-slate-100 text-slate-900 rounded-2xl rounded-tl-sm mr-12';
    const timeColor = m.is_page ? 'text-blue-100' : 'text-slate-500';
    
    return `
        <div class="flex flex-col mb-3 ${m.is_page ? 'items-end' : 'items-start'}">
            <div class="px-4 py-2 shadow-sm text-[13px] ${alignClass}">
                <div style="white-space: pre-wrap; word-break: break-word;">${text}</div>
                ${atts}
            </div>
            <span class="text-[10px] mt-1 ${timeColor} px-1 flex items-center gap-1">
                ${timeStr}
                ${aiBadge}
            </span>
        </div>
    `;
}

async function loadOlderMessages(threadId, cursor) {
    try {
        const r = await fetch(`/api/conversations/${threadId}/messages?before=${encodeURIComponent(cursor)}&limit=50`);
        if (r.ok) {
            const d = await r.json();
            const stream = document.getElementById('chat-stream');
            const btn = document.getElementById('load-older');
            if (btn) btn.remove();
            
            let topHtml = '';
            if (d.has_more && d.next_cursor) {
                topHtml += `<button id="load-older" class="btn-outline" class="text-xs" onclick="loadOlderMessages('${esc(threadId)}','${esc(d.next_cursor)}')"> تحميل رسائل أقدم</button>`;
            }
            topHtml += (d.messages || []).map(renderBubble).join('');
            stream.insertAdjacentHTML('afterbegin', topHtml);
        }
    } catch(e) {
        console.error('[loadOlderMessages]', e);
    }
}

async function selectThread(id){
    const t = allInboxThreads.find(x => String(x.id) === String(id));
    if(!t) return;
    activeInboxItem = t;
    const sName = t.sender_name || t.sender || t.name || 'عميل جديد';
    const sTime = t.timestamp || t.updated_time || t.time_ago || '';
    if (t.unread) {
        t.unread = 0;
        fetch(`/api/conversations/${encodeURIComponent(id)}/read`, {method: 'POST', credentials: 'same-origin'})
            .then(r => r.json()).catch(e => console.error('[markRead]', e));
    }
    renderInboxList();

    const isFB = t.platform === 'facebook' || t.type === 'messenger' || String(t.id).startsWith('fb_');
    const isComment = t.channel === 'comment' || String(t.id).startsWith('fb_comment_') || String(t.id).startsWith('ig_comment_');
    const isClient = t.customer_type === 'client' || (t.lead_badge && t.lead_badge.includes('مشترك'));
    const phone = t.phone || '01090121000';
    const scoreVal = t.lead_score || (isClient ? 100 : 85);

    const crmEl = document.getElementById('crm-sidebar');
    if (crmEl) {
        let avatarHtml = t.avatar_url ? `<img src="${esc(t.avatar_url)}" class="w-full h-full object-cover rounded-xl">` : esc((t.name||t.sender_name||'C')[0]);
        let linkHtml = t.profile_link ? `<a href="${esc(t.profile_link)}" target="_blank" class="text-blue-500 hover:underline text-xs block mt-1"><i data-lucide="external-link" class="w-3 h-3 inline"></i> فتح البروفايل</a>` : '';
        
        crmEl.innerHTML = `
            <div class="space-y-4 text-xs">
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-sm overflow-hidden">
                        ${avatarHtml}
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm">${esc(t.name || t.sender_name || 'عميل جديد')}</h4>
                        <div class="text-slate-500">${esc(t.business || 'عميل محتمل')}</div>
                        ${linkHtml}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <span class="text-slate-500 block text-[11px]">المنصة</span>
                        <strong class="text-slate-900 font-bold text-xs">${isFB ? '🔵 فيسبوك' : '🟣 إنستجرام'}</strong>
                    </div>
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <span class="text-slate-500 block text-[11px]">قناة التفاعل</span>
                        <strong class="text-slate-900 font-bold text-xs">${isComment ? '💬 تعليق بوست' : '📩 رسالة خاصة'}</strong>
                    </div>
                </div>

                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-600 font-bold">التصنيف / النقاط (Score):</span>
                        <span class="font-bold text-red-600">${esc(t.lead_badge || (typeof calculateLeadScore === 'function' ? calculateLeadScore(t).label : 'Cold 0%'))}</span>
                    </div>
                    <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div class="bg-red-500 h-full" style="width: ${scoreVal}%"></div>
                    </div>
                    <div class="flex justify-between text-[11px] text-slate-500">
                        <span>الميزانية المتوقعة:</span>
                        <strong class="text-slate-800">${esc(t.budget || '3000 - 6000 ج.م')}</strong>
                    </div>
                </div>

                <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
                    <h5 class="font-bold text-blue-900 flex items-center gap-1.5">
                        <i data-lucide="trending-up" class="w-4 h-4 text-blue-600"></i>
                        <span>لوحة مبيعات اليوم (Sales Dashboard)</span>
                    </h5>
                    <div class="flex justify-between text-slate-700 pt-1">
                        <span>إجمالي العملاء اليوم:</span>
                        <strong class="font-bold">14 عميل</strong>
                    </div>
                    <div class="flex justify-between text-slate-700">
                        <span>القيمة المتوقعة:</span>
                        <strong class="font-bold text-emerald-700">30,000 ج.م</strong>
                    </div>
                    <div class="flex justify-between text-slate-700">
                        <span>فرص ساخنة (Hot):</span>
                        <strong class="font-bold text-red-600">5 فرص 🔥</strong>
                    </div>
                </div>

                <div class="space-y-2 pt-1">
                    <a href="tel:${phone}" class="btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl shadow-sm">
                        <i data-lucide="phone" class="w-4 h-4"></i>
                        <span>اتصل الآن (${phone})</span>
                    </a>
                    <a href="https://wa.me/2${phone}" target="_blank" class="btn-ghost w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300">
                        <i data-lucide="message-square" class="w-4 h-4 text-emerald-600"></i>
                        <span>محادثة عبر واتساب</span>
                    </a>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }
    
    const mainChat = document.getElementById('inbox-thread') || document.getElementById('chat-messages');
    if (!mainChat) return;
    
    const titleEl = document.getElementById('chat-title');
    if (titleEl) titleEl.textContent = t.sender_name || 'عميل جديد';

    const initText = t.snippet || t.last_msg || 'محادثة جديدة';
    
    // Extract Phone Number if any
    const phoneMatch = initText.match(/(\+?2?01[0125]\d{8})|(\b01[0125]\d{8}\b)|(\b\d{10,11}\b)/);
    const extractedPhone = phoneMatch ? phoneMatch[0] : (t.phone || '01090121000');
    const cleanPhone = extractedPhone ? extractedPhone.replace(/\D/g, '') : null;
    
    // Empty State when no threads
    if (!t) {
        if(mainChat) {
            mainChat.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center p-8 mt-10">
                <div class="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 border border-slate-200">
                    <i data-lucide="ghost" class="w-7 h-7"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-900 mb-1">اختر محادثة للبدء</h3>
                <p class="text-xs text-slate-500">اختر إحدى المحادثات من القائمة الجانبية لعرض الرسائل.</p>
            </div>`;
            lucide.createIcons();
            document.getElementById('active-chat-header')?.classList.add('hidden');
            document.getElementById('reply-form')?.parentElement?.classList.add('hidden');
        }
        return;
    }
    
    document.getElementById('active-chat-header')?.classList.remove('hidden');
    document.getElementById('reply-form')?.parentElement?.classList.remove('hidden');

    mainChat.innerHTML = `
        <div class="chat-header p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm overflow-hidden">
                    ${t.avatar_url ? `<img src="${esc(t.avatar_url)}" class="w-full h-full object-cover">` : esc((sName||'U')[0])}
                </div>
                <div>
                    <h4 class="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <span>${esc(sName)}</span>
                        ${isFB ? '<span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">🔵 فيسبوك</span>' : '<span class="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded">🟣 إنستجرام</span>'}
                    </h4>
                    <div class="text-xs text-slate-500 flex items-center gap-2">
                        <span>${isComment ? '💬 تعليق منشور' : '📩 رسالة خاصة (DM)'}</span>
                        <span>• ${formatDateTime(sTime)}</span>
                    </div>
                </div>
            </div>
            ${t.permalink ? `<a href="${esc(t.permalink)}" target="_blank" class="btn-ghost text-xs py-1.5 px-3 rounded-lg border border-slate-200 flex items-center gap-1"><i data-lucide="external-link" class="w-3.5 h-3.5"></i> المنشور الأصلي</a>` : ''}
        </div>

        ${isComment ? `
            <!-- Authentic Post & Comment Card Layout -->
            <div class="p-4 space-y-4 bg-slate-50 flex-1 overflow-y-auto" id="chat-stream">
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
                        <i data-lucide="file-text" class="w-4 h-4 text-blue-600"></i>
                        <span>المنشور الأصلي على الصفحة:</span>
                    </div>
                    <p class="text-xs text-slate-800 font-medium">${esc(t.post_caption || t.snippet || 'تعليق جديد على المنشور')}</p>
                </div>

                <div class="bg-amber-50/60 border border-amber-200 rounded-xl p-4 shadow-sm space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-xs text-amber-900">${esc(sName)}</span>
                            <span class="text-[10px] text-amber-700 font-mono">ID: ${esc(t.id)}</span>
                        </div>
                        <span class="text-[11px] text-amber-600">${formatDateTime(sTime)}</span>
                    </div>
                    <p class="text-xs text-slate-900 font-semibold bg-white p-3 rounded-lg border border-amber-100">${esc(initText)}</p>
                </div>
            </div>

            <!-- Real Comment Reply Controls -->
            <div class="p-3 bg-white border-t border-slate-200 space-y-2">
                <input type="text" id="inbox-reply-input" placeholder="اكتب رداً رسمياً على هذا التعليق..." onkeydown="if(event.key==='Enter')sendInboxReply('${t.id}', 'public')" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600">
                <div class="flex items-center gap-2">
                    <button onclick="sendInboxReply('${t.id}', 'public')" class="flex-1 btn-primary text-xs py-2 rounded-xl flex items-center justify-center gap-1"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i> رد علني على البوست</button>
                    <button onclick="sendInboxReply('${t.id}', 'private')" class="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs py-2 rounded-xl flex items-center justify-center gap-1"><i data-lucide="send" class="w-3.5 h-3.5"></i> رد خاص في DM</button>
                </div>
            </div>
        ` : `
            <!-- Authentic Direct Message Layout -->
            <div class="p-4 space-y-3 bg-slate-50 flex-1 overflow-y-auto" id="chat-stream">
                <div class="bubble customer-msg">
                    ${esc(initText)}
                    <span class="bubble-time">${formatDateTime(t.timestamp)}</span>
                </div>
            </div>

            <!-- Real DM Direct Reply Input -->
            <div class="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input type="text" id="inbox-reply-input" placeholder="اكتب رسالة مباشرة للعميل هنا..." onkeydown="if(event.key==='Enter')sendInboxReply('${t.id}', 'public')" class="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600">
                <button onclick="sendInboxReply('${t.id}', 'public')" class="btn-primary text-xs px-5 py-2 rounded-xl flex items-center gap-1"><i data-lucide="send" class="w-3.5 h-3.5"></i> إرسال</button>
            </div>
        `}`;

    // (CRM sidebar already rendered above via #crm-sidebar with full details)

    try {
        const res = await fetch(`/api/conversations/${id}/messages?limit=50`);
        if (res.ok) {
            const data = await res.json();
            const msgs = data.messages || (Array.isArray(data) ? data : []);
            const stream = document.getElementById('chat-stream');
            if (stream) {
                let html = '';
                if (data.has_more && data.next_cursor) {
                    html += `<button id="load-older" class="btn-outline text-xs" onclick="loadOlderMessages('${esc(id)}','${esc(data.next_cursor)}')"> تحميل رسائل أقدم</button>`;
                }
                html += msgs.map(renderBubble).join('');
                stream.innerHTML = html;

                if (t.pending_approval) {
                    stream.innerHTML += `
                        <div class="approval-card">
                            <h4><i data-lucide="hourglass" class="w-4 h-4 text-slate-500 inline"></i> مسودة رد الذكاء الاصطناعي المقترحة:</h4>
                            <textarea id="draft-text" rows="3">${esc(t.ai_draft || t.snippet)}</textarea>
                            <div class="approval-actions">
                                <button class="btn-danger" onclick="rejectDraft('${t.id}')">تجاهل المسودة</button>
                                <button class="btn-success" onclick="approveDraft('${t.id}')">موافقة وإرسال الآن </button>
                            </div>
                        </div>
                    `;
                }
                stream.scrollTop = stream.scrollHeight;
            }
        }
    } catch(e) {
        console.error('[selectThread]', e);
        const stream = document.getElementById('chat-stream');
        if (stream) {
            stream.innerHTML += `<div class="empty-state p-2 text-xs"><i data-lucide="x-circle" class="w-4 h-4 text-slate-400 inline"></i> تعذّر تحميل سجل المحادثة — ${esc(e.message||e)}</div>`;
        }
    }
}

async function sendInboxReply(threadId, mode = 'public') {
    if (threadId && typeof threadId === 'object') {
        if (threadId.preventDefault) threadId.preventDefault();
        threadId = (activeInboxItem && activeInboxItem.id) || (typeof activeThreadId !== 'undefined' && activeThreadId) || 'fb_thread_1001';
    }
    const inp = document.getElementById('inbox-reply-input') || document.getElementById('reply-input');
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) return;

    const stream = document.getElementById('chat-stream');
    inp.disabled = true;

    try {
        const res = await fetch('/api/send_reply', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({thread_id: threadId, recipient_id: threadId, text: text, reply_mode: mode})
        });
        const d = await res.json();

        if (!res.ok || !d.ok) {
            showToast(d.error || 'فشل الإرسال — لم تصل الرسالة عبر Meta', 'error');
            return;
        }

        inp.value = '';
        if (stream) {
            stream.innerHTML += renderBubble({
                is_page: true,
                text: text,
                message: text,
                created_at: new Date().toISOString(),
                source: 'human'
            });
            stream.scrollTop = stream.scrollHeight;
        }
        showToast(d.status === 'simulated' ? ' محاكاة إرسال — لم تُرسل فعلياً' : (mode === 'public' ? 'تم نشر الرد العلني بنجاح <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500 inline"></i>' : 'تم إرسال الرد الخاص بنجاح <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500 inline"></i>'));

    } catch(e) {
        console.error('[sendInboxReply]', e);
        showToast('خطأ في الاتصال بالخادم عند الإرسال', 'error');
    } finally {
        inp.disabled = false;
        inp.focus();
    }
}

async function approveDraft(id){
    try {
        const text = document.getElementById('draft-text') ? document.getElementById('draft-text').value : '';
        await fetch('/api/approve/' + id, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({edited_reply: text})
        });
        showToast('تمت الموافقة وإرسال الرد بنجاح!');
        await loadInbox(true);
    } catch(e){ showToast('حدث خطأ أثناء الإرسال', 'error'); }
}

async function rejectDraft(id){
    try {
        await fetch('/api/reject/' + id, {method: 'POST'});
        showToast('تم تجاهل المسودة');
        await loadInbox(true);
    } catch(e){ showToast('حدث خطأ', 'error'); }
}

function setInboxFilter(filter) {
    currentInboxFilter = filter;
    window.currentInboxFilter = filter;
    // Update all filter button styles
    const filterIds = ['all', 'pending', 'fb_dm', 'ig_dm', 'fb_comment', 'ig_comment'];
    filterIds.forEach(f => {
        const btn = document.getElementById('filter-' + f);
        if (!btn) return;
        if (f === filter) {
            btn.className = 'text-xs px-2 py-1 rounded-lg bg-blue-600 text-white font-bold';
        } else {
            btn.className = 'text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200';
        }
    });
    renderInboxList();
}