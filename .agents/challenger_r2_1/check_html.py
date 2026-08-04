import os
import base64
import re

if os.path.exists(r'C:\Users\mhmd\meta_ai_moderator\templates\index.html'):
    s = os.path.getsize(r'C:\Users\mhmd\meta_ai_moderator\templates\index.html')
    print('templates/index.html raw file size:', s, 'bytes', f'({s/1024:.2f} KB)')

with open(r'C:\Users\mhmd\meta_ai_moderator\api\index.py', 'r', encoding='utf-8') as f:
    code = f.read()

m = re.search(r'HTML_B64\s*=\s*[\'"]([^\'"]+)[\'"]', code)
if m:
    decoded = base64.b64decode(m.group(1))
    print('api/index.py decoded HTML_TEMPLATE size:', len(decoded), 'bytes', f'({len(decoded)/1024:.2f} KB)')
