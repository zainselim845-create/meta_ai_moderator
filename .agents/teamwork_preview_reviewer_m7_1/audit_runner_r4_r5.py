import os
import re
import glob
import json
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

root_dir = r'C:\Users\mhmd\meta_ai_moderator'

def audit_r4_detailed():
    print("==================================================")
    print("AUDIT R4 DETAILED: VIEWS & SCHEDULER")
    print("==================================================")

    # Check 10 view panes in index.html
    html_path = os.path.join(root_dir, 'templates', 'index.html')
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    expected_panes = ['v-inbox', 'v-dash', 'v-rules', 'v-kb', 'v-crm', 'v-settings', 'v-logs', 'v-scheduler', 'v-chatwoot', 'v-analytics']
    found_panes = []
    for p in expected_panes:
        if f'id="{p}"' in html_content or f"id='{p}'" in html_content:
            found_panes.append(p)

    print(f"View Panes Found in index.html: {len(found_panes)}/10")
    for p in expected_panes:
        status = "FOUND" if p in found_panes else "MISSING"
        print(f"   - {p}: {status}")

    # Check Scheduler cron logic
    server_path = os.path.join(root_dir, 'server.py')
    with open(server_path, 'r', encoding='utf-8') as f:
        server_content = f.read()

    has_scheduler_thread = 'scheduler_cron_loop' in server_content
    print(f"\nScheduler Cron Loop in server.py: {has_scheduler_thread}")

def audit_r5():
    print("\n==================================================")
    print("AUDIT R5: GIT REPO & 5 LEAD BRANCHES")
    print("==================================================")

    # Check git branches
    try:
        res_branches = subprocess.run(['git', 'branch', '-a'], cwd=root_dir, capture_output=True, text=True)
        print(f"Git Branches Output:\n{res_branches.stdout.strip()}")
        
        branches = [b.strip().replace('* ', '').strip() for b in res_branches.stdout.splitlines()]
        expected_branches = ['frontend-lead', 'backend-lead', 'integration-lead', 'functionality-lead', 'qa-lead']
        
        found_branches = [eb for eb in expected_branches if any(eb in b for b in branches)]
        print(f"\nLead Branches Found: {len(found_branches)}/5 -> {found_branches}")

        # Check commits
        res_log = subprocess.run(['git', 'log', '--oneline', '-n', '10'], cwd=root_dir, capture_output=True, text=True)
        print(f"\nGit Recent Commits:\n{res_log.stdout.strip()}")

    except Exception as e:
        print(f"Git audit error: {e}")

if __name__ == '__main__':
    audit_r4_detailed()
    audit_r5()
