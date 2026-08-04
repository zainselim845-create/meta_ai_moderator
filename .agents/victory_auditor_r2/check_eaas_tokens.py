import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

paths = ['api/index.py', 'server.py', 'build_clean.py', 'test_direct_instagram_dispatch.py']
token_pattern = re.compile(r'EAAS[A-Za-z0-9]{30,}')

for path in paths:
    print(f"=== EAAS TOKENS IN {path} ===")
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for idx, line in enumerate(lines, 1):
        matches = token_pattern.findall(line)
        if matches:
            for m in matches:
                print(f"  Line {idx}: {m[:10]}...{m[-6:]} (Length {len(m)})")
