import subprocess
import re

clean_content = subprocess.check_output(['git', 'show', '8faf367~1:api/index.py'], encoding='utf-8')

arabic_matches = re.findall(r'[\u0600-\u06FF\s_a-zA-Z0-9.,?!()\-:\'"]{5,}', clean_content)
arabic_strings = [m for m in arabic_matches if re.search(r'[\u0600-\u06FF]', m)]

with open('api/index.py', 'r', encoding='utf-8') as f:
    current = f.read()

replaced = 0
for good in arabic_strings:
    good = good.strip()
    if len(good) < 3: continue
    
    try:
        bad = good.encode('utf-8').decode('windows-1252', errors='replace').encode('utf-8').decode('utf-8')
        if bad in current and bad != good:
            current = current.replace(bad, good)
            replaced += 1
    except Exception:
        pass

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(current)

print(f'Replaced {replaced} strings using simulated corruption.')
