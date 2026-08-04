import os
import re
import sys
import glob
import subprocess
import json

REPO_DIR = r"C:\Users\mhmd\meta_ai_moderator"
EXCLUDE_DIRS = {".git", ".agents", ".pytest_cache", "__pycache__", ".venv", ".vercel", "node_modules", "video_output"}

sys.stdout.reconfigure(encoding='utf-8')

def get_codebase_files():
    file_list = []
    for root, dirs, files in os.walk(REPO_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            file_list.append(os.path.join(root, f))
    return file_list

def check_criterion_1():
    print("\n--- CRITERION 1: Inline Styles Count (< 20 total) ---")
    files = get_codebase_files()
    matches = []
    # Search pattern for inline styles: style="..." or style='...' or style= in HTML/templates/JS/PY
    style_pattern = re.compile(r'style\s*=\s*["\'][^"\']+["\']', re.IGNORECASE)
    
    for fpath in files:
        ext = os.path.splitext(fpath)[1].lower()
        if ext not in [".html", ".py", ".js", ".css"]:
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    for match in style_pattern.finditer(line):
                        matches.append({
                            "file": os.path.relpath(fpath, REPO_DIR),
                            "line": line_idx,
                            "content": match.group(0)
                        })
        except Exception as e:
            print(f"Error reading {fpath}: {e}")
            
    print(f"Total inline styles found: {len(matches)}")
    for m in matches:
        print(f"  {m['file']}:{m['line']} -> {m['content']}")
    passed = len(matches) < 20
    print(f"Criterion 1 Verdict: {'PASS' if passed else 'FAIL'}")
    return passed, len(matches), matches

def check_criterion_2():
    print("\n--- CRITERION 2: Emoji Search (0 emojis, only Lucide icons) ---")
    files = get_codebase_files()
    matches = []
    # Regex for standard emoji ranges
    emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U0001F900-\U0001F9FF\U0001FA70-\U0001FAFF\u2600-\u26FF\u2700-\u27BF]')
    
    for fpath in files:
        ext = os.path.splitext(fpath)[1].lower()
        if ext not in [".html", ".py", ".js", ".css", ".md", ".json"]:
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    found = emoji_pattern.findall(line)
                    if found:
                        matches.append({
                            "file": os.path.relpath(fpath, REPO_DIR),
                            "line": line_idx,
                            "emojis": found,
                            "line_snippet": line.strip()[:80]
                        })
        except Exception as e:
            print(f"Error reading {fpath}: {e}")

    print(f"Total files with emojis found: {len(matches)}")
    for m in matches:
        print(f"  {m['file']}:{m['line']} -> {m['emojis']} in '{m['line_snippet']}'")
    passed = len(matches) == 0
    print(f"Criterion 2 Verdict: {'PASS' if passed else 'FAIL'}")
    return passed, len(matches), matches

def check_criterion_3():
    print("\n--- CRITERION 3: Font Sizes Check (0 9px fonts, allowed: 12, 13, 14, 16, 20px) ---")
    files = get_codebase_files()
    nine_px_matches = []
    all_font_sizes = []
    allowed_sizes = {12, 13, 14, 16, 20}
    
    font_size_pattern = re.compile(r'font-size:\s*(\d+)px', re.IGNORECASE)
    nine_px_pattern = re.compile(r'(font-size:\s*9px|text-\[9px\]|9px)', re.IGNORECASE)
    
    for fpath in files:
        ext = os.path.splitext(fpath)[1].lower()
        if ext not in [".html", ".css", ".js", ".py"]:
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    # Check for explicit 9px
                    if "9px" in line or "font-size: 9px" in line or "font-size:9px" in line:
                        nine_px_matches.append({
                            "file": os.path.relpath(fpath, REPO_DIR),
                            "line": line_idx,
                            "content": line.strip()
                        })
                    # Check general font sizes
                    for match in font_size_pattern.finditer(line):
                        size = int(match.group(1))
                        all_font_sizes.append({
                            "file": os.path.relpath(fpath, REPO_DIR),
                            "line": line_idx,
                            "size": size
                        })
        except Exception as e:
            print(f"Error reading {fpath}: {e}")

    disallowed_sizes = [fs for fs in all_font_sizes if fs["size"] not in allowed_sizes]
    print(f"9px font instances found: {len(nine_px_matches)}")
    for m in nine_px_matches:
        print(f"  9px match: {m['file']}:{m['line']} -> {m['content']}")
        
    print(f"All explicit font sizes found: {set(fs['size'] for fs in all_font_sizes)}")
    print(f"Disallowed font sizes count: {len(disallowed_sizes)}")
    for fs in disallowed_sizes:
        print(f"  Disallowed size {fs['size']}px at {fs['file']}:{fs['line']}")

    passed = (len(nine_px_matches) == 0) and (len(disallowed_sizes) == 0)
    print(f"Criterion 3 Verdict: {'PASS' if passed else 'FAIL'}")
    return passed, len(nine_px_matches), len(disallowed_sizes)

def check_criterion_4():
    print("\n--- CRITERION 4: File / Page Sizes (< 30KB per page) ---")
    # Check templates and frontend static pages/views
    targets = [
        "templates/index.html",
        "static/css/styles.css",
        "static/js/app.js",
        "static/js/views.js",
        "static/js/inbox.js",
        "static/js/clients.js",
        "server.py",
        "api/index.py"
    ]
    over_limit = []
    page_details = []
    
    # Also check all .html files in templates
    html_files = glob.glob(os.path.join(REPO_DIR, "templates", "*.html"))
    for hf in html_files:
        rel = os.path.relpath(hf, REPO_DIR)
        if rel not in targets:
            targets.append(rel)
            
    for rel_path in targets:
        full_path = os.path.join(REPO_DIR, rel_path)
        if os.path.exists(full_path):
            size_bytes = os.path.getsize(full_path)
            size_kb = size_bytes / 1024.0
            page_details.append({
                "file": rel_path,
                "bytes": size_bytes,
                "kb": round(size_kb, 2)
            })
            if size_kb >= 30.0:
                over_limit.append({
                    "file": rel_path,
                    "bytes": size_bytes,
                    "kb": round(size_kb, 2)
                })
        else:
            print(f"Target file not found: {rel_path}")

    print("Page / File Size Breakdown:")
    for pd in page_details:
        status = "OVER 30KB!" if pd['kb'] >= 30.0 else "OK"
        print(f"  {pd['file']}: {pd['bytes']} bytes ({pd['kb']} KB) -> {status}")
        
    passed = len(over_limit) == 0
    print(f"Criterion 4 Verdict: {'PASS' if passed else 'FAIL'}")
    return passed, over_limit, page_details

def check_criterion_5():
    print("\n--- CRITERION 5: Instagrapi Usages / Imports Check (0 instagrapi) ---")
    files = get_codebase_files()
    matches = []
    
    for fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    if "instagrapi" in line.lower():
                        matches.append({
                            "file": os.path.relpath(fpath, REPO_DIR),
                            "line": line_idx,
                            "content": line.strip()
                        })
        except Exception as e:
            print(f"Error reading {fpath}: {e}")

    print(f"Instagrapi occurrences found: {len(matches)}")
    for m in matches:
        print(f"  {m['file']}:{m['line']} -> {m['content']}")
        
    passed = len(matches) == 0
    print(f"Criterion 5 Verdict: {'PASS' if passed else 'FAIL'}")
    return passed, len(matches), matches

def check_criterion_6():
    print("\n--- CRITERION 6: Hardcoded Credentials Check (0 value='domya' or 'domya') ---")
    files = get_codebase_files()
    cred_matches = []
    
    # Looking for hardcoded credentials / defaults like value="domya", 'domya'
    cred_pattern = re.compile(r'value\s*=\s*["\']domya["\']|["\']domya["\']', re.IGNORECASE)
    
    for fpath in files:
        ext = os.path.splitext(fpath)[1].lower()
        if ext not in [".html", ".py", ".js", ".css"]:
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    if "value=\"domya\"" in line or "value='domya'" in line or "domya" in line.lower():
                        cred_matches.append({
                            "file": os.path.relpath(fpath, REPO_DIR),
                            "line": line_idx,
                            "content": line.strip()
                        })
        except Exception as e:
            print(f"Error reading {fpath}: {e}")

    print(f"Hardcoded credential / 'domya' instances found: {len(cred_matches)}")
    for m in cred_matches:
        print(f"  {m['file']}:{m['line']} -> {m['content']}")
        
    # Check specifically for hardcoded credential inputs value="domya"
    hardcoded_value_domya = [m for m in cred_matches if 'value="domya"' in m['content'].lower() or "value='domya'" in m['content'].lower()]
    print(f"Specific value='domya' matches: {len(hardcoded_value_domya)}")
    
    passed = (len(cred_matches) == 0)
    print(f"Criterion 6 Verdict: {'PASS' if passed else 'FAIL'}")
    return passed, len(cred_matches), cred_matches

def check_criterion_7():
    print("\n--- CRITERION 7: Git Lead Branches Count (confirm 5 lead branches exist) ---")
    try:
        res = subprocess.run(["git", "branch", "-a"], cwd=REPO_DIR, capture_output=True, text=True)
        branches = [b.strip().replace("* ", "") for b in res.stdout.strip().split("\n") if b.strip()]
        print(f"Git branches found ({len(branches)}):")
        for b in branches:
            print(f"  - {b}")
        
        # Also check git log / git show-ref or git branches
        res_heads = subprocess.run(["git", "show-ref", "--heads"], cwd=REPO_DIR, capture_output=True, text=True)
        local_branches = [line.split("refs/heads/")[-1] for line in res_heads.stdout.strip().split("\n") if "refs/heads/" in line]
        print(f"Local heads ({len(local_branches)}): {local_branches}")
        
        passed = len(branches) >= 5 or len(local_branches) >= 5
        print(f"Criterion 7 Verdict: {'PASS' if passed else 'FAIL'}")
        return passed, branches, local_branches
    except Exception as e:
        print(f"Error running git branch: {e}")
        return False, [], []

def check_criterion_8():
    print("\n--- CRITERION 8: Pytest & Full Test Suite Execution ---")
    try:
        res = subprocess.run(["pytest"], cwd=REPO_DIR, capture_output=True, text=True)
        print(res.stdout)
        if res.stderr:
            print("STDERR:", res.stderr)
        passed = res.returncode == 0
        print(f"Criterion 8 Verdict: {'PASS' if passed else 'FAIL'}")
        return passed, res.stdout
    except Exception as e:
        print(f"Error executing pytest: {e}")
        return False, str(e)

def check_criterion_2_detailed():
    print("\n--- DETAILED CRITERION 2: Emoji Search ---")
    files = get_codebase_files()
    matches = []
    emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U0001F900-\U0001F9FF\U0001FA70-\U0001FAFF\u2600-\u26FF\u2700-\u27BF]')
    
    for fpath in files:
        ext = os.path.splitext(fpath)[1].lower()
        if ext not in [".html", ".py", ".js", ".css", ".md", ".json"]:
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    found = emoji_pattern.findall(line)
                    if found:
                        matches.append({
                            "file": os.path.relpath(fpath, REPO_DIR),
                            "line": line_idx,
                            "count": len(found),
                            "sample": "".join(found[:5])
                        })
        except Exception as e:
            pass

    print(f"Total lines with emojis: {len(matches)}")
    # Group by file
    by_file = {}
    for m in matches:
        by_file.setdefault(m["file"], []).append(m)
    for f, items in by_file.items():
        print(f"  File: {f} ({len(items)} lines containing emojis)")
        for item in items[:5]: # show first 5 lines per file
            print(f"    L{item['line']}: {item['sample']}")
        if len(items) > 5:
            print(f"    ... and {len(items)-5} more lines")

def check_criterion_3_detailed():
    print("\n--- DETAILED CRITERION 3: Font Sizes ---")
    files = get_codebase_files()
    nine_px_matches = []
    font_size_pattern = re.compile(r'font-size:\s*(\d+)(px|rem)?', re.IGNORECASE)
    allowed = {12, 13, 14, 16, 20}
    disallowed = []
    
    for fpath in files:
        ext = os.path.splitext(fpath)[1].lower()
        if ext not in [".html", ".css", ".js", ".py"]:
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    if "9px" in line or "text-[9px]" in line or "font-size: 9px" in line:
                        nine_px_matches.append((os.path.relpath(fpath, REPO_DIR), line_idx, line.strip()))
                    for match in font_size_pattern.finditer(line):
                        val = int(match.group(1))
                        unit = match.group(2)
                        if unit == "px" and val not in allowed:
                            disallowed.append((os.path.relpath(fpath, REPO_DIR), line_idx, val, line.strip()))
        except Exception as e:
            pass

    print(f"9px font instances: {len(nine_px_matches)}")
    for file, line, text in nine_px_matches:
        print(f"  {file}:{line} -> {text}")
    print(f"Disallowed px font sizes: {len(disallowed)}")
    for file, line, val, text in disallowed:
        print(f"  {file}:{line} ({val}px) -> {text}")

def check_criterion_5_detailed():
    print("\n--- DETAILED CRITERION 5: Instagrapi Usages ---")
    files = get_codebase_files()
    matches = []
    for fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    if "instagrapi" in line.lower():
                        matches.append((os.path.relpath(fpath, REPO_DIR), line_idx, line.strip()))
        except Exception as e:
            pass
    print(f"Instagrapi occurrences: {len(matches)}")
    for file, line, text in matches:
        print(f"  {file}:{line} -> {text}")

if __name__ == "__main__":
    results = {}
    results["c1"] = check_criterion_1()
    results["c2"] = check_criterion_2()
    results["c3"] = check_criterion_3()
    results["c4"] = check_criterion_4()
    results["c5"] = check_criterion_5()
    results["c6"] = check_criterion_6()
    results["c7"] = check_criterion_7()
    results["c8"] = check_criterion_8()
    
    check_criterion_2_detailed()
    check_criterion_3_detailed()
    check_criterion_5_detailed()
    
    print("\n" + "="*50)
    print("FINAL MASTER ACCEPTANCE SUMMARY")
    print("="*50)
    all_pass = True
    for key, (passed, *rest) in results.items():
        print(f"{key.upper()}: {'PASS' if passed else 'FAIL'}")
        if not passed:
            all_pass = False
    print(f"OVERALL VERDICT: {'PASS' if all_pass else 'FAIL'}")
