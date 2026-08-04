import os
import re
import glob

def check_frontend():
    print("=== FRONTEND INTEGRITY AUDIT ===")
    
    # 1. Inline style count
    inline_styles = []
    files_to_check = glob.glob("templates/**/*.html", recursive=True) + glob.glob("static/js/*.js", recursive=True)
    for filepath in files_to_check:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            matches = re.findall(r'style\s*=\s*["\'][^"\']*["\']', content, re.IGNORECASE)
            for m in matches:
                inline_styles.append((filepath, m))
                
    print(f"1. Inline Styles Count: {len(inline_styles)} (Target: < 20)")
    for fp, st in inline_styles:
        print(f"   - {fp}: {st}")
        
    # 2. Emoji count in templates/
    emojis_found = []
    for filepath in glob.glob("templates/**/*.html", recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            for char in content:
                cp = ord(char)
                if (0x1F600 <= cp <= 0x1F64F) or (0x1F300 <= cp <= 0x1F5FF) or \
                   (0x1F680 <= cp <= 0x1F6FF) or (0x1F700 <= cp <= 0x1F77F) or \
                   (0x1F780 <= cp <= 0x1F7FF) or (0x1F800 <= cp <= 0x1F8FF) or \
                   (0x1F900 <= cp <= 0x1F9FF) or (0x1FA00 <= cp <= 0x1FA6F) or \
                   (0x1FA70 <= cp <= 0x1FAFF) or (0x2600 <= cp <= 0x26FF) or \
                   (0x2700 <= cp <= 0x27BF):
                    emojis_found.append((filepath, char, hex(cp)))
                
    print(f"2. Emoji Count in Templates: {len(emojis_found)} (Target: 0)")
    for fp, em, hx in emojis_found[:10]:
        print(f"   - {fp}: {hx}")

    # 3. Font size compliance
    font_9px_found = []
    invalid_font_sizes = []
    for filepath in glob.glob("templates/**/*.html", recursive=True) + glob.glob("static/css/*.css", recursive=True) + glob.glob("static/js/*.js", recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if '9px' in content or 'text-[9px]' in content:
                font_9px_found.append(filepath)
            font_size_matches = re.findall(r'font-size\s*:\s*(\d+)px', content)
            for fs in font_size_matches:
                if int(fs) not in [12, 13, 14, 16, 20]:
                    invalid_font_sizes.append((filepath, fs))
            tw_matches = re.findall(r'text-\[(\d+)px\]', content)
            for fs in tw_matches:
                if int(fs) not in [12, 13, 14, 16, 20]:
                    invalid_font_sizes.append((filepath, f"text-[{fs}px]"))
                    
    print(f"3a. 9px Font Size Count: {len(font_9px_found)} (Target: 0)")
    if font_9px_found:
        print(f"    Found in: {font_9px_found}")
    print(f"3b. Invalid Font Sizes (Not in 12, 13, 14, 16, 20px): {len(invalid_font_sizes)} (Target: 0)")
    for fp, fs in invalid_font_sizes[:10]:
        print(f"    - {fp}: {fs}")

    # 4. Page Sizes (< 30KB per page / template file)
    print("4. File Sizes (< 30KB target per file):")
    html_files = glob.glob("templates/**/*.html", recursive=True)
    for hf in html_files:
        size_bytes = os.path.getsize(hf)
        size_kb = size_bytes / 1024
        print(f"   - {hf}: {size_bytes} bytes ({size_kb:.2f} KB) - {'PASS' if size_bytes < 30720 else 'FAIL (>30KB)'}")

    # 5. 10 View Panes Functionality
    with open("templates/index.html", "r", encoding="utf-8") as f:
        tmpl = f.read()
    
    view_panes = re.findall(r'id=["\']v-([a-zA-Z0-9_-]+)["\']', tmpl)
    print(f"5. View Panes Count (id='v-...') in index.html: {len(view_panes)} (Target: 10)")
    print(f"   Panes: {view_panes}")

    # 6. Real tel: and whatsapp:// links
    tel_in_html = re.findall(r'href=["\']tel:[^"\']+["\']', tmpl)
    wa_in_html = re.findall(r'href=["\']whatsapp:[^"\']+["\']', tmpl) or re.findall(r'href=["\']https://wa\.me/[^"\']+["\']', tmpl)
    
    js_tel = []
    js_wa = []
    for jsf in glob.glob("static/js/*.js"):
        with open(jsf, "r", encoding="utf-8") as f:
            jsc = f.read()
            if 'tel:' in jsc:
                js_tel.append(jsf)
            if 'whatsapp://' in jsc or 'wa.me' in jsc:
                js_wa.append(jsf)
                
    print(f"6a. tel: Links Found: {len(tel_in_html) > 0 or len(js_tel) > 0} (HTML: {len(tel_in_html)}, JS: {js_tel})")
    print(f"6b. whatsapp:// Links Found: {len(wa_in_html) > 0 or len(js_wa) > 0} (HTML: {len(wa_in_html)}, JS: {js_wa})")

    # 7. Chatwoot Free Button & loginFromChatwoot()
    chatwoot_btn = ('ربط من Chatwoot - فري' in tmpl) or any('ربط من Chatwoot - فري' in open(jsf, encoding='utf-8').read() for jsf in glob.glob("static/js/*.js"))
    has_login_fn = any('loginFromChatwoot' in open(jsf, encoding='utf-8').read() for jsf in glob.glob("static/js/*.js")) or ('loginFromChatwoot' in tmpl)
    
    print(f"7a. Chatwoot Free Button ('Chatwoot Free'): {chatwoot_btn}")
    print(f"7b. loginFromChatwoot() Function: {has_login_fn}")

if __name__ == "__main__":
    check_frontend()
