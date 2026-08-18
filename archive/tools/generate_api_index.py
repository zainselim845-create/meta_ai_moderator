import sys
import os
import base64
import re
import ast

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

print("Embedding templates/index.html Base64 into HTML_B64 in api/index.py...")

with open('templates/index.html', 'r', encoding='utf-8') as f:
    html_text = f.read()

b64_html = base64.b64encode(html_text.encode('utf-8')).decode('ascii')

with open('api/index.py', 'r', encoding='utf-8') as f:
    py_code = f.read()

replacement = f'HTML_B64 = "{b64_html}"'

new_py_code = re.sub(r'HTML_B64 = ".*?"', replacement, py_code, flags=re.DOTALL)

ast.parse(new_py_code)

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(new_py_code)

print("SUCCESS: HTML_B64 updated in api/index.py. AST Parse OK!")
