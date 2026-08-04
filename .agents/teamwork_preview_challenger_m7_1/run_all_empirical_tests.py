import os
import sys
import subprocess
import time

sys.stdout.reconfigure(encoding='utf-8')

print("===============================================================")
print("=== META AI MODERATOR - MASTER EMPIRICAL CHALLENGER SUITE ===")
print("===============================================================")

tests = [
    ("1. Webhook Concurrency Stress Test", "python .agents/teamwork_preview_challenger_m7_1/stress_test_webhook_concurrency.py"),
    ("2. Security Endpoint 401 Protection Test", "python .agents/teamwork_preview_challenger_m7_1/test_empirical_security.py"),
    ("3. Chatwoot Free Connector & Login URL Test", "python .agents/teamwork_preview_challenger_m7_1/test_empirical_chatwoot.py"),
    ("4. Dynamic Lead Scoring Verification", "python .agents/teamwork_preview_challenger_m7_1/test_empirical_lead_score.py"),
    ("5. Scheduler Cron Daemon Loop Verification", "python .agents/teamwork_preview_challenger_m7_1/test_empirical_scheduler.py"),
    ("6a. Pytest Full Test Suite", "pytest -v"),
    ("6b. Server Suite (test_server.py)", "pytest test_server.py"),
    ("6c. Adversarial Suite (test_adversarial.py)", "python test_adversarial.py"),
    ("6d. Full System Suite (test_full_system.py)", "python test_full_system.py"),
]

summary = []
all_passed = True

for name, cmd in tests:
    print(f"\n>>> Running: {name}")
    start = time.time()
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8")
    duration = time.time() - start

    if res.returncode == 0:
        status = "PASS"
        print(f"[{name}] PASSED in {duration:.2f}s")
    else:
        status = "FAIL"
        all_passed = False
        print(f"[{name}] FAILED in {duration:.2f}s")
        print("STDOUT:", res.stdout[:500])
        print("STDERR:", res.stderr[:500])

    summary.append({
        "name": name,
        "status": status,
        "duration": round(duration, 2),
        "stdout": res.stdout,
        "stderr": res.stderr
    })

print("\n===============================================================")
print("=== FINAL EMPIRICAL SUMMARY ===")
print("===============================================================")
for s in summary:
    print(f" - {s['name']}: {s['status']} ({s['duration']}s)")

verdict = "PASS" if all_passed else "FAIL"
print(f"\nOVERALL VERDICT: {verdict}")

with open(r"C:\Users\mhmd\meta_ai_moderator\.agents\teamwork_preview_challenger_m7_1\test_summary.json", "w", encoding="utf-8") as f:
    import json
    json.dump({"verdict": verdict, "results": summary}, f, ensure_ascii=False, indent=2)

sys.exit(0 if all_passed else 1)
