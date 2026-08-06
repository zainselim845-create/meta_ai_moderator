import subprocess
clean_content = subprocess.check_output(['git', 'show', '8faf367~1:api/index.py'], encoding='utf-8')

with open('api/index.py', 'r', encoding='utf-8') as f:
    current = f.read()

import re

# find the _SYSTEM_PROMPT string in both
sys_clean = re.search(r'_SYSTEM_PROMPT = """(.*?)"""', clean_content, re.DOTALL)
sys_curr = re.search(r'_SYSTEM_PROMPT = """(.*?)"""', current, re.DOTALL)

if sys_clean and sys_curr:
    current = current.replace(sys_curr.group(0), sys_clean.group(0))

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(current)
    
print("Replaced _SYSTEM_PROMPT")
