import re

def refactor_remaining():
    with open('templates/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # ----------------------------------------
    # v-schedule
    # ----------------------------------------
    schedule_tailwind = """<div id="v-schedule" class="view hidden h-full overflow-y-auto p-6 bg-slate-50">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h3 class="text-xl font-bold text-slate-900 mb-1">جدولة النشر الذكي (Smart Scheduler)</h3>
                <p class="text-sm text-slate-500 m-0">نشر متزامن على فيسبوك وإنستجرام مع AI Caption</p>
            </div>
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm text-sm">جدولة النشر</button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <!-- Left: Editor -->
            <div class="flex flex-col gap-6">
                <!-- Target Channels -->
                <div>
                    <h4 class="text-sm font-bold text-slate-900 mb-3">قنوات النشر (Target Channels)</h4>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors flex-1">
                            <input type="checkbox" checked class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">D</div>
                                <span class="text-sm font-bold text-slate-700">Domya Agency (FB)</span>
                            </div>
                        </label>
                        <label class="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors flex-1">
                            <input type="checkbox" checked class="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm">I</div>
                                <span class="text-sm font-bold text-slate-700">domya_marketing (IG)</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Caption & AI -->
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-sm font-bold text-slate-900 m-0">النص (Caption)</h4>
                        <button class="flex items-center gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-purple-100">
                            <i data-lucide="sparkles" class="w-3 h-3"></i> تحسين بالذكاء الاصطناعي
                        </button>
                    </div>
                    <textarea class="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-900 placeholder-slate-400" placeholder="اكتب محتوى البوست هنا..."></textarea>
                    <div class="flex justify-between items-center mt-2">
                        <div class="flex gap-2">
                            <button class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">#تسويق</button>
                            <button class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">#دوميا</button>
                        </div>
                        <span class="text-xs text-slate-400">0 / 2200</span>
                    </div>
                </div>

                <!-- Media Upload -->
                <div>
                    <h4 class="text-sm font-bold text-slate-900 mb-3">الوسائط (Media)</h4>
                    <div class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center">
                        <i data-lucide="image" class="w-8 h-8 text-slate-400 mb-3"></i>
                        <span class="text-sm font-bold text-slate-700">اضغط لرفع صورة أو فيديو</span>
                        <span class="text-xs text-slate-500 mt-1">يدعم JPG, PNG, MP4 (أقصى حجم 100MB)</span>
                    </div>
                </div>
            </div>

            <!-- Right: Preview & Settings -->
            <div class="flex flex-col gap-6">
                <!-- Schedule Settings -->
                <div class="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <h4 class="text-sm font-bold text-slate-900 mb-3">موعد النشر</h4>
                    <input type="datetime-local" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 text-slate-700">
                    <div class="grid grid-cols-2 gap-2">
                        <button class="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors">اليوم 8 PM</button>
                        <button class="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors">غداً 10 AM</button>
                    </div>
                </div>

                <!-- Live Preview -->
                <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div class="bg-slate-50 p-3 border-b border-slate-200 flex justify-center gap-4">
                        <button class="text-xs font-bold text-blue-600 flex items-center gap-1"><i data-lucide="smartphone" class="w-3 h-3"></i> Reel (9:16)</button>
                        <button class="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"><i data-lucide="layout-grid" class="w-3 h-3"></i> Feed (1:1)</button>
                    </div>
                    <div class="p-4 flex flex-col items-center">
                        <div class="w-[200px] h-[350px] bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                            <i data-lucide="image" class="w-8 h-8"></i>
                        </div>
                        <div class="w-[200px] mt-3">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">D</div>
                                <div class="text-[10px] font-bold text-slate-700">Domya Agency</div>
                            </div>
                            <div class="text-[10px] text-slate-500">معاينة النص ستظهر هنا...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>"""

    # ----------------------------------------
    # v-mode
    # ----------------------------------------
    mode_tailwind = """<div id="v-mode" class="view hidden h-full overflow-y-auto p-6 bg-slate-50">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-xl font-bold text-slate-900 mb-6">وضع التشغيل (Operation Mode)</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white border-2 border-blue-600 rounded-xl p-5 relative overflow-hidden cursor-pointer">
                <div class="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">نشط الآن</div>
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><i data-lucide="bot" class="w-5 h-5"></i></div>
                    <div class="text-lg font-bold text-slate-900">الوضع التلقائي (Auto)</div>
                </div>
                <p class="text-sm text-slate-500 m-0 leading-relaxed">يقوم الذكاء الاصطناعي بالرد فوراً على التعليقات والرسائل بناءً على قاعدة المعرفة (RAG).</p>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 cursor-pointer hover:bg-slate-100 transition-colors">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center"><i data-lucide="user" class="w-5 h-5"></i></div>
                    <div class="text-lg font-bold text-slate-900">الوضع اليدوي (Manual)</div>
                </div>
                <p class="text-sm text-slate-500 m-0 leading-relaxed">يقترح الذكاء الاصطناعي الردود فقط، ولا يتم إرسال أي شيء دون موافقتك اليدوية (Draft Only).</p>
            </div>
        </div>
    </div>
</div>"""

    # ----------------------------------------
    # v-chat (Sandbox)
    # ----------------------------------------
    chat_tailwind = """<div id="v-chat" class="view hidden h-full overflow-y-auto p-6 bg-slate-50">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
        <div class="p-5 border-b border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 m-0">بيئة التجربة الحية (Sandbox)</h3>
            <p class="text-xs text-slate-500 m-0 mt-1">اختبر ردود البوت كأنك عميل حقيقي قبل التفعيل</p>
        </div>
        <div class="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-50">
            <div class="flex justify-center"><span class="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">بداية المحادثة التجريبية</span></div>
        </div>
        <div class="p-4 bg-white border-t border-slate-200 flex gap-2">
            <input type="text" placeholder="اكتب رسالة لتجربة البوت..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <button class="bg-blue-600 hover:bg-blue-700 text-white w-12 rounded-xl flex items-center justify-center"><i data-lucide="send" class="w-5 h-5 rtl:rotate-180"></i></button>
        </div>
    </div>
</div>"""

    # ----------------------------------------
    # v-clients
    # ----------------------------------------
    clients_tailwind = """<div id="v-clients" class="view hidden h-full overflow-y-auto p-6 bg-slate-50">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 class="text-xl font-bold text-slate-900 mb-6">قاعدة العملاء (CRM)</h3>
        <div class="text-center py-12">
            <i data-lucide="users" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
            <h4 class="text-lg font-bold text-slate-700 mb-2">لا يوجد عملاء بعد</h4>
            <p class="text-sm text-slate-500 mb-6">سيظهر العملاء هنا تلقائياً عند بدء المحادثات.</p>
            <button class="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-sm" onclick="alert('تصدير CSV')">تصدير (CSV)</button>
        </div>
    </div>
</div>"""

    html = re.sub(r'<div[^>]*id="v-schedule"[^>]*>[\s\S]*?</div>\s*(?=<!--|<div[^>]*id="v-|</main>)', schedule_tailwind + '\n    ', html, count=1)
    html = re.sub(r'<div[^>]*id="v-mode"[^>]*>[\s\S]*?</div>\s*(?=<!--|<div[^>]*id="v-|</main>)', mode_tailwind + '\n    ', html, count=1)
    html = re.sub(r'<div[^>]*id="v-chat"[^>]*>[\s\S]*?</div>\s*(?=<!--|<div[^>]*id="v-|</main>)', chat_tailwind + '\n    ', html, count=1)
    html = re.sub(r'<div[^>]*id="v-clients"[^>]*>[\s\S]*?</div>\s*(?=<!--|<div[^>]*id="v-|</main>)', clients_tailwind + '\n    ', html, count=1)

    with open('templates/index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print("REMAINING_VIEWS_REFACTORED")

if __name__ == '__main__':
    refactor_remaining()
