import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

print("=== CHECKING INBOX.JS ===")
with open('static/js/inbox.js', 'r', encoding='utf-8') as f:
    inbox_js = f.read()

keywords = ['Zaki', 'Ahmed', 'Medo', 'Azza', 'Siman', 'Doaa', 'Hager']
for kw in keywords:
    matches = [line.strip() for line in inbox_js.splitlines() if kw in line]
    print(f"Keyword '{kw}': {len(matches)} matches")
    for m in matches[:3]:
        print("  ", m)

print("\n=== CHECKING API/INDEX.PY ===")
with open('api/index.py', 'r', encoding='utf-8') as f:
    api_py = f.read()

for kw in keywords:
    matches = [line.strip() for line in api_py.splitlines() if kw in line]
    print(f"Keyword '{kw}': {len(matches)} matches")
    for m in matches[:3]:
        print("  ", m)
