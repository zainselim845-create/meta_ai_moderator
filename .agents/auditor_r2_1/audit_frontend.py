import os
import sys
import re

def audit_frontend():
    print("=== Auditing Frontend Files ===")

    # 1. index.html size
    tmpl_path = 'templates/index.html'
    if os.path.exists(tmpl_path):
        size_bytes = os.path.getsize(tmpl_path)
        size_kb = size_bytes / 1024.0
        print(f"templates/index.html size: {size_kb:.2f} KB ({size_bytes} bytes)")
        assert size_kb < 30.0, f"index.html size {size_kb:.2f} KB exceeds 30 KB limit!"
    else:
        print("ERROR: templates/index.html not found!")
        return False

    with open(tmpl_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Inline styles check
    inline_styles = re.findall(r'style=["\'][^"\']+["\']', html_content, re.IGNORECASE)
    print(f"Inline styles count in index.html: {len(inline_styles)}")

    # 2. Check 6 mock lead names in JS
    js_files = ['static/js/inbox.js', 'static/js/app.js', 'static/js/clients.js', 'static/js/views.js']
    combined_js = ""
    for jf in js_files:
        if os.path.exists(jf):
            with open(jf, 'r', encoding='utf-8') as f:
                combined_js += f.read() + "\n"

    leads = ["أحمد زكي", "ميدو", "عزة", "سيمون", "دعاء", "هاجر"]
    found_leads = []
    for lead in leads:
        if lead in combined_js or lead in html_content:
            found_leads.append(lead)
    print(f"Mock leads found ({len(found_leads)}/6): {found_leads}")
    assert len(found_leads) == 6, f"Missing mock leads! Found: {found_leads}"

    # 3. Check CSS grid rule in styles.css
    css_path = 'static/css/styles.css'
    if os.path.exists(css_path):
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()
        if '#v-inbox.view.show' in css_content and 'display: grid' in css_content:
            print("CSS Grid rule '#v-inbox.view.show' present in styles.css: PASS")
        else:
            print("WARNING: '#v-inbox.view.show' grid rule missing or modified!")

    # 4. Check wa.me and tel: protocols
    if "wa.me" in combined_js and "tel:" in combined_js:
        print("WhatsApp (wa.me) and Tel (tel:) protocols verified in JS: PASS")
    else:
        print("WARNING: wa.me or tel: links missing in JS!")

    print("=== Frontend Audit Complete ===")
    return True

if __name__ == '__main__':
    ok = audit_frontend()
    sys.exit(0 if ok else 1)
