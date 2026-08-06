import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<strong class="text-3xl font-extrabold">\n         14\n        </strong>', '<strong id="stat-leads" class="text-3xl font-extrabold">\n         0\n        </strong>')
content = content.replace('<span class="text-xs text-blue-200 block mt-1">\n         14 العملاء المستهدفين\n        </span>', '<span id="stat-leads-sub" class="text-xs text-blue-200 block mt-1">\n         0 العملاء المستهدفين\n        </span>')

content = content.replace('<strong class="text-3xl font-extrabold">\n         30,000 EGP\n        </strong>', '<strong id="stat-deals" class="text-3xl font-extrabold">\n         0 EGP\n        </strong>')

content = content.replace('<strong class="text-3xl font-extrabold">\n         5\n        </strong>', '<strong id="stat-hot" class="text-3xl font-extrabold">\n         0\n        </strong>')
content = content.replace('<span class="text-xs text-amber-200 block mt-1">\n         5 فرص جاهزة للإغلاق\n        </span>', '<span id="stat-hot-sub" class="text-xs text-amber-200 block mt-1">\n         0 فرص جاهزة للإغلاق\n        </span>')

content = content.replace('<strong class="text-xl font-bold text-emerald-500 block">\n         &lt; 2 ثانية\n        </strong>', '<strong id="stat-time" class="text-xl font-bold text-emerald-500 block">\n         -\n        </strong>')

content = content.replace('<strong class="text-xl font-bold text-blue-600 block">\n         94.2%\n        </strong>', '<strong id="stat-conv" class="text-xl font-bold text-blue-600 block">\n         -\n        </strong>')

content = content.replace('<strong class="text-xl font-bold text-slate-900 block">\n         98.5%\n        </strong>', '<strong id="stat-rag" class="text-xl font-bold text-slate-900 block">\n         -\n        </strong>')

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
