import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

print("=== SEARCHING FOR WA.ME LINKS ===")
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.agents' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.py', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            if 'wa.me' in content:
                print(f"Found 'wa.me' in {path}:")
                for line in content.splitlines():
                    if 'wa.me' in line:
                        print("  ", line.strip()[:140])
