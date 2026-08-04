import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('templates/index.html', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'id="v-' in line or "id='v-" in line:
            print(f"{i}: {line.strip()}")
