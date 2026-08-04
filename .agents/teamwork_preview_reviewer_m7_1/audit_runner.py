import os
import re
import glob
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

root_dir = r'C:\Users\mhmd\meta_ai_moderator'

def audit_r1():
    print("==================================================")
    print("AUDIT R1: FRONTEND & DESIGN SYSTEM")
    print("==================================================")

    # 1. Inline styles count (< 20 total across codebase)
    inline_styles = []
    for ext in ['*.html', '*.js', '*.py']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path or 'node_modules' in path:
                continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    if 'style=' in line:
                        inline_styles.append((os.path.relpath(path, root_dir), idx, line.strip()))

    print(f"1. Inline Styles Count: {len(inline_styles)} (Requirement: < 20)")
    for path, line_no, line in inline_styles:
        print(f"   - {path}:{line_no} -> {line[:100]}")

    # 2. Emoji check (0 emojis, only Lucide icons)
    # Match emoji characters in unicode
    emojis_found = []
    for ext in ['*.html', '*.js', '*.css', '*.py', '*.json']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path or 'node_modules' in path or '.git' in path:
                continue
            if 'audit_report.json' in path: continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    # Check non-ascii emoji characters
                    for ch in line:
                        # Emoji range roughly U+1F300-1F9FF, U+2600-27BF, U+1F600-1F64F, etc.
                        codepoint = ord(ch)
                        if (0x1F600 <= codepoint <= 0x1F64F) or \
                           (0x1F300 <= codepoint <= 0x1F5FF) or \
                           (0x1F680 <= codepoint <= 0x1F6FF) or \
                           (0x2600 <= codepoint <= 0x27BF) or \
                           (0x1F900 <= codepoint <= 0x1F9FF):
                            emojis_found.append((os.path.relpath(path, root_dir), idx, f"U+{codepoint:04X} ({ch})", line.strip()[:80]))
                            break

    print(f"\n2. Emoji Count: {len(emojis_found)} (Requirement: 0 emojis)")
    for path, line_no, emoji_info, line in emojis_found:
        print(f"   - {path}:{line_no} -> {emoji_info} in: '{line}'")

    # 3. Font sizes check (no 9px; allowed: 12px, 13px, 14px, 16px, 20px)
    print("\n3. Font Sizes Check:")
    font_9px_found = []
    font_sizes_all = []
    for ext in ['*.html', '*.js', '*.css', '*.py']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path or 'node_modules' in path:
                continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    if '9px' in line:
                        font_9px_found.append((os.path.relpath(path, root_dir), idx, line.strip()[:80]))
                    for m in re.finditer(r'font-size:\s*([^;]+)|text-(xs|sm|base|lg|xl|2xl|3xl|\[\d+px\])', line):
                        font_sizes_all.append((os.path.relpath(path, root_dir), idx, m.group(0), line.strip()[:80]))

    print(f"   - Occurrences of '9px': {len(font_9px_found)}")
    for path, idx, line in font_9px_found:
        print(f"     - {path}:{idx} -> {line}")

    # 4. Color Palette Check (3 colors: #2563eb [blue], Gray, #10b981 [emerald/green])
    print("\n4. Colors Check:")
    hex_pattern = re.compile(r'#(?:[0-9a-fA-F]{3}){1,2}\b')
    colors = set()
    non_conforming_colors = []
    allowed_hexes = {
        '#2563eb', # primary blue
        '#10b981', # emerald green
        '#000', '#000000', '#fff', '#ffffff', # black / white base
        # gray palette allowed
        '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
        '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827',
        '#fafafa', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b',
        '#ef4444', '#dc2626' # red if used for errors? Let's check
    }
    for ext in ['*.html', '*.js', '*.css']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path or 'node_modules' in path:
                continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    for m in hex_pattern.finditer(line):
                        h = m.group(0).lower()
                        colors.add(h)
                        if h not in allowed_hexes:
                            non_conforming_colors.append((os.path.relpath(path, root_dir), idx, h, line.strip()[:80]))

    print(f"   - Unique HEX colors in HTML/CSS/JS: {len(colors)}")
    print(f"   - Non-standard colors: {len(non_conforming_colors)}")
    for path, idx, h, line in non_conforming_colors[:15]:
        print(f"     - {path}:{idx} -> {h} in '{line}'")

    # 5. Border Radii Check (3 radii: 8px, 12px, 16px)
    print("\n5. Border Radii Check:")
    radii_found = []
    for ext in ['*.html', '*.js', '*.css']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path or 'node_modules' in path:
                continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    for m in re.finditer(r'rounded-(none|sm|md|lg|xl|2xl|3xl|full|\[\d+px\])|border-radius:\s*([^;]+)', line):
                        radii_found.append((os.path.relpath(path, root_dir), idx, m.group(0), line.strip()[:80]))
    radii_types = set(r[2] for r in radii_found)
    print(f"   - Distinct border radius declarations: {radii_types}")

    # 6. Page Size Check (< 30KB per page)
    print("\n6. Page Size Check:")
    for path in glob.glob(os.path.join(root_dir, 'templates', '*.html')):
        sz = os.path.getsize(path) / 1024
        print(f"   - {os.path.basename(path)}: {sz:.2f} KB (Requirement: < 30 KB)")

def audit_r2():
    print("\n==================================================")
    print("AUDIT R2: FREE-TIER, SECURITY, LRU & OAUTH")
    print("==================================================")

    # 1. 100% free-tier check
    # Check requirements.txt, imports
    req_file = os.path.join(root_dir, 'requirements.txt')
    if os.path.exists(req_file):
        with open(req_file, 'r', encoding='utf-8') as f:
            print(f"1. requirements.txt content:\n{f.read().strip()}")

    # 2. instagrapi check (0 instagrapi)
    instagrapi_matches = []
    for ext in ['*.py', '*.js', '*.html', '*.txt']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path: continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    if 'instagrapi' in line.lower():
                        instagrapi_matches.append((os.path.relpath(path, root_dir), idx, line.strip()[:80]))
    print(f"\n2. Instagrapi occurrences: {len(instagrapi_matches)} (Requirement: 0)")
    for path, idx, line in instagrapi_matches:
        print(f"   - {path}:{idx} -> {line}")

    # 3. Hardcoded credentials check ('domya' or hardcoded secrets)
    domya_matches = []
    for ext in ['*.py', '*.js', '*.html']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path: continue
            if 'domya_n8n' in path or 'seed_data' in path or 'test_' in path: continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    if 'domya' in line.lower():
                        domya_matches.append((os.path.relpath(path, root_dir), idx, line.strip()[:80]))
    print(f"\n3. 'domya' in core code (excluding n8n config/seed/test): {len(domya_matches)} (Requirement: 0)")
    for path, idx, line in domya_matches:
        print(f"   - {path}:{idx} -> {line}")

    # 4. LRU Cache implementation check
    print("\n4. LRU Cache & Encryption Check:")
    lru_matches = []
    aes_matches = []
    for ext in ['*.py']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path: continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'lru_cache' in content or 'LRUCache' in content or 'lru' in content.lower():
                    lru_matches.append(os.path.relpath(path, root_dir))
                if 'AES' in content or 'gcm' in content.lower() or 'encrypt' in content.lower():
                    aes_matches.append(os.path.relpath(path, root_dir))
    print(f"   - LRU Cache files: {lru_matches}")
    print(f"   - AES/Encryption files: {aes_matches}")

    # 5. Security 401 endpoints check
    print("\n5. Security 401 Endpoints Check:")
    py_files = [os.path.join(root_dir, 'server.py'), os.path.join(root_dir, 'api', 'index.py')]
    for path in py_files:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                has_401 = '401' in content or 'Unauthorized' in content
                print(f"   - {os.path.basename(path)} has 401 handling: {has_401}")

def audit_r3():
    print("\n==================================================")
    print("AUDIT R3: CHATWOOT CONNECTOR INTEGRATION")
    print("==================================================")

    matches = []
    for ext in ['*.py', '*.js', '*.html']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path: continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    if 'FacebookFreeConnector' in line or 'getLoginUrl' in line or 'loginFromChatwoot' in line or 'ربط من Chatwoot' in line or 'Chatwoot' in line:
                        matches.append((os.path.relpath(path, root_dir), idx, line.strip()[:90]))

    print(f"Chatwoot connector references found: {len(matches)}")
    for path, idx, line in matches[:20]:
        print(f"   - {path}:{idx} -> {line}")

def audit_r4():
    print("\n==================================================")
    print("AUDIT R4: FUNCTIONAL REQUIREMENTS & SALES DASHBOARD")
    print("==================================================")

    # 1. calculateLeadScore check
    print("1. calculateLeadScore Check:")
    for path in [os.path.join(root_dir, 'server.py'), os.path.join(root_dir, 'static', 'js', 'app.js'), os.path.join(root_dir, 'static', 'js', 'views.js')]:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'calculateLeadScore' in content:
                    print(f"   - Found in {os.path.relpath(path, root_dir)}")

    # 2. tel: and whatsapp:// links vs fake JavaScript alerts
    print("\n2. Tel / Whatsapp links & Alert check:")
    tel_wa_matches = []
    alert_matches = []
    for ext in ['*.html', '*.js', '*.py']:
        for path in glob.glob(os.path.join(root_dir, '**', ext), recursive=True):
            if '.agents' in path or '.venv' in path or 'test_' in path: continue
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    if 'tel:' in line or 'whatsapp://' in line or 'https://wa.me' in line:
                        tel_wa_matches.append((os.path.relpath(path, root_dir), idx, line.strip()[:80]))
                    if 'alert(' in line:
                        alert_matches.append((os.path.relpath(path, root_dir), idx, line.strip()[:80]))

    print(f"   - Real tel: or whatsapp:// links count: {len(tel_wa_matches)}")
    for path, idx, line in tel_wa_matches[:10]:
        print(f"     - {path}:{idx} -> {line}")
    print(f"   - alert() calls in non-test code: {len(alert_matches)}")
    for path, idx, line in alert_matches:
        print(f"     - {path}:{idx} -> {line}")

    # 3. View Panes check (10 view panes)
    print("\n3. View Panes Check:")
    view_pane_matches = []
    for path in glob.glob(os.path.join(root_dir, 'static', 'js', '*.js')):
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            for idx, line in enumerate(f, 1):
                if 'view-' in line or 'View' in line or 'pane' in line.lower() or 'switchView' in line or 'renderView' in line:
                    view_pane_matches.append((os.path.relpath(path, root_dir), idx, line.strip()[:80]))
    print(f"   - View pane logic references: {len(view_pane_matches)}")

def audit_r5():
    print("\n==================================================")
    print("AUDIT R5: GIT REPO & BRANCH STRUCTURE")
    print("==================================================")
    # Executed via git command outside

if __name__ == '__main__':
    audit_r1()
    audit_r2()
    audit_r3()
    audit_r4()
    audit_r5()
