import subprocess
clean_content = subprocess.check_output(['git', 'show', '8faf367~1:api/index.py'], encoding='utf-8')

with open('api/index.py', 'r', encoding='utf-8') as f:
    current = f.read()

import re

# find the _DEFAULT_FAQ_DATA list
faq_clean = re.search(r'_DEFAULT_FAQ_DATA = \[.*?\]', clean_content, re.DOTALL)
faq_curr = re.search(r'_DEFAULT_FAQ_DATA = \[.*?\]', current, re.DOTALL)

if faq_clean and faq_curr:
    current = current.replace(faq_curr.group(0), faq_clean.group(0))

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(current)
    
print("Replaced _DEFAULT_FAQ_DATA")
