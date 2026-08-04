import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

print("=== CHECKING LEAD SCORE BADGES & CALCULATOR ===")
with open('static/js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

if 'calculateLeadScore' in app_js:
    idx = app_js.find('calculateLeadScore')
    print("Found calculateLeadScore in app.js:")
    print(app_js[idx:idx+600])

print("\n=== CHECKING CRM SIDEBAR & SALES DASHBOARD & WA.ME LINKS ===")
with open('templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("wa.me links in templates/index.html:")
for line in html.splitlines():
    if 'wa.me' in line or 'WhatsApp' in line or 'واتساب' in line or 'Sales' in line or 'مبيعات' in line:
        print("  ", line.strip()[:120])

print("\n=== CHECKING STYLES.CSS FOR CSS GRID DISPLAY ===")
with open('static/css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

idx_grid = css.find('#v-inbox.view.show')
if idx_grid != -1:
    print("Found #v-inbox.view.show in styles.css:")
    print(css[idx_grid:idx_grid+200])
else:
    print("Searching for grid in styles.css:")
    for line in css.splitlines():
        if 'display: grid' in line or 'v-inbox' in line:
            print("  ", line.strip())
