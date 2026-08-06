with open('api/index.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
import re
for i, line in enumerate(lines):
    if re.search(r'.{0,20}[ØÙ].{0,20}', line):
        print(f"{i+1}: {line.strip().encode('utf-8')}")
