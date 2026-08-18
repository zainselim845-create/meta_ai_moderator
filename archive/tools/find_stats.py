with open('templates/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if '14' in l or '30,000 EGP' in l or '94.2%' in l or '98.5%' in l or '< 2' in l:
        if i > 1000:
            print(f'{i+1}: {l.strip().encode("utf-8")}')
