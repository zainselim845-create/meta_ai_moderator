with open('api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()
import re
lines = content.split('\n')
with open('clean_lines.txt', 'r', encoding='utf-8') as f:
    clean_lines = f.readlines()

def get_clean(search_str):
    for l in clean_lines:
        if search_str in l: return l.split(':', 1)[1].strip()
    return None

c1 = get_clean('03:05')
c2 = get_clean('02:50')
c3 = get_clean('if any(k in msg')
c4 = get_clean('reply = "أهلاً بك! باقات')
c5 = get_clean('Google Drive')
c6 = get_clean('Graph API')

for i, line in enumerate(lines):
    if '{"time": "03:05' in line: lines[i] = "            " + c1
    if '{"time": "02:50' in line: lines[i] = "            " + c2
    if 'if any(k in msg for k in [' in line: lines[i] = "    " + c3
    if 'reply = "أهلاً بك' in line or 'reply = "\\xc3' in line:
        if i > 3700 and i < 3750: lines[i] = "        " + c4
    if 'Google Drive' in line or '\\xc3' in line and 'Google Drive' in str(line.encode('utf-8')):
        if '"""' in line: lines[i] = "    " + c5
    if 'Graph API' in line or '\\xd9' in line and 'Graph API' in str(line.encode('utf-8')):
        if '"""' in line: lines[i] = "    " + c6

# Also let's fix the 100% corrupted lines that are purely utf-8 escapes
for i, line in enumerate(lines):
    if '\\xc3' in line or '\\xd8' in line:
        # just comment them out if we can't fix them, but we fixed the known ones
        pass

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
