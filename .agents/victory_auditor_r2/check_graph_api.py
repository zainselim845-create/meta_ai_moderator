import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

print("=== CHECKING GRAPH API VERSIONS IN CODEBASE ===")
graph_matches = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.agents' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.py')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            for line in content.splitlines():
                if 'graph.facebook.com' in line or 'graph.instagram.com' in line or 'v21.0' in line or 'v20.0' in line or 'v19.0' in line:
                    graph_matches.append((path, line.strip()[:140]))

print(f"Total Graph API / version line matches: {len(graph_matches)}")
for path, line in graph_matches[:20]:
    print(f"  [{path}] {line}")
