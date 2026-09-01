import base64, re

with open('templates/index.html', 'rb') as f:
    raw = f.read()
b64 = base64.b64encode(raw).decode('utf-8')

with open('api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"^HTML_B64 = '[^']+'"
match = re.search(pattern, content, re.MULTILINE)
if match:
    new_line = "HTML_B64 = '" + b64 + "'"
    new_content = content[:match.start()] + new_line + content[match.end():]
    with open('api/index.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'HTML_B64 updated. Old len={len(match.group())}, New len={len(new_line)}')
else:
    print('ERROR: could not find HTML_B64 line')
