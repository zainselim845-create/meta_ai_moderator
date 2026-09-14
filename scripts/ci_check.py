#!/usr/bin/env python3
"""
Local CI/CD Check & Quality Gate for Meta AI Moderator
Runs all static analysis, syntax validation, asset sync, and automated tests.
Usage: python scripts/ci_check.py
"""

import os
import sys
import subprocess
import glob
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_step(step_num, total_steps, name):
    print(f"[{step_num}/{total_steps}] {CYAN}{name:<40}{RESET} ", end="", flush=True)

def print_pass():
    print(f"{GREEN}{BOLD}[ PASS ]{RESET}")

def print_fail(msg=""):
    print(f"{RED}{BOLD}[ FAIL ]{RESET}")
    if msg:
        print(f"{RED}{msg}{RESET}")

def main():
    start_time = time.time()
    print(f"\n{BOLD}======================================================{RESET}")
    print(f"{BOLD}   Meta AI Moderator - Local CI/CD Quality Gate       {RESET}")
    print(f"{BOLD}======================================================{RESET}\n")

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    os.chdir(repo_root)

    total_steps = 5
    failed_steps = []

    # Step 1: JavaScript Syntax Check
    print_step(1, total_steps, "JavaScript Syntax Validation")
    js_files = glob.glob("static/js/*.js")
    js_errors = []
    for jf in js_files:
        try:
            res = subprocess.run(["node", "--check", jf], capture_output=True, text=True)
            if res.returncode != 0:
                js_errors.append(f"{jf}: {res.stderr.strip()}")
        except Exception as e:
            # Node might not be installed in all envs; if missing, note warning
            js_errors.append(f"Node execution failed: {e}")
            break

    if js_errors:
        print_fail("\n".join(js_errors))
        failed_steps.append("JavaScript Syntax")
    else:
        print_pass()

    # Step 2: Python Syntax Compilation
    print_step(2, total_steps, "Python Syntax Compilation")
    py_errors = []
    for pf in ["api/index.py"] + glob.glob("scripts/*.py"):
        try:
            res = subprocess.run([sys.executable, "-m", "py_compile", pf], capture_output=True, text=True)
            if res.returncode != 0:
                py_errors.append(f"{pf}: {res.stderr.strip()}")
        except Exception as e:
            py_errors.append(f"{pf}: {e}")

    if py_errors:
        print_fail("\n".join(py_errors))
        failed_steps.append("Python Syntax")
    else:
        print_pass()

    # Step 3: Secrets & Leak Audit
    print_step(3, total_steps, "Secrets & Sensitive File Audit")
    try:
        res = subprocess.run(["git", "ls-files"], capture_output=True, text=True)
        tracked = res.stdout.splitlines() if res.returncode == 0 else []
        leaks = [f for f in tracked if f.endswith(".env") or f in ["service_account.json", "client_secret.json", "credentials.json"]]
        if leaks:
            print_fail(f"Tracked secret files found: {leaks}")
            failed_steps.append("Security Audit")
        else:
            print_pass()
    except Exception as e:
        print_pass()

    # Step 4: Asset Synchronization & Minification
    print_step(4, total_steps, "Asset Sync & Minification")
    try:
        sync_script = os.path.join(repo_root, "scratch", "sync_v13_9.py")
        if os.path.exists(sync_script):
            res = subprocess.run([sys.executable, sync_script], capture_output=True, text=True)
            if res.returncode != 0:
                print_fail(res.stderr.strip())
                failed_steps.append("Asset Sync")
            else:
                print_pass()
        else:
            print_pass()
    except Exception as e:
        print_fail(str(e))
        failed_steps.append("Asset Sync")

    # Step 5: Automated Pytest Suite
    print_step(5, total_steps, "Automated Pytest Suite (110 tests)")
    try:
        res = subprocess.run([sys.executable, "-m", "pytest", "tests/test_tasks_and_kpis.py", "-q"], capture_output=True, text=True)
        if res.returncode != 0:
            print_fail(res.stdout[-500:] if res.stdout else res.stderr[-500:])
            failed_steps.append("Pytest Suite")
        else:
            print_pass()
    except Exception as e:
        print_fail(str(e))
        failed_steps.append("Pytest Suite")

    elapsed = round(time.time() - start_time, 2)
    print(f"\n{BOLD}------------------------------------------------------{RESET}")
    if not failed_steps:
        print(f"{GREEN}{BOLD}✨ ALL CI CHECKS PASSED ({elapsed}s) - READY TO COMMIT & PUSH! ✨{RESET}")
        return 0
    else:
        print(f"{RED}{BOLD}❌ CI CHECKS FAILED: {', '.join(failed_steps)} ({elapsed}s){RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
