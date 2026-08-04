import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

print("=== CHECKING FOR INSTAGRAPI USAGE ===")
instagrapi_found = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.agents' in root or '__pycache__' in root or '.pytest_cache' in root:
        continue
    for file in files:
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if 'instagrapi' in content:
            instagrapi_found.append(path)

print(f"Instagrapi occurrences found: {len(instagrapi_found)}")
for p in instagrapi_found:
    print("  ", p)

print("\n=== CHECKING REQUIREMENTS.TXT ===")
with open('requirements.txt', 'r', encoding='utf-8') as f:
    print(f.read())

print("\n=== CHECKING FOR HARDCODED UNMASKED TOKENS (EAAS...) ===")
token_leaks = []
token_pattern = re.compile(r'EAAS[A-Za-z0-9]{30,}')
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.agents' in root or '__pycache__' in root or '.pytest_cache' in root:
        continue
    for file in files:
        path = os.path.join(root, file)
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        matches = token_pattern.findall(content)
        if matches:
            token_leaks.append((path, len(matches)))

print(f"Unmasked EAAS tokens found: {len(token_leaks)}")
for p, count in token_leaks:
    print(f"  {p}: {count} occurrences")
