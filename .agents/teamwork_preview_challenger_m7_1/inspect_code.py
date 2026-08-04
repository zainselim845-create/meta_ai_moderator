import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\mhmd\meta_ai_moderator\server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines in server.py: {len(lines)}")

keywords = ["calculate_lead_score", "chatwoot", "login-url", "FacebookFreeConnector", "scheduler", "cron", "require_auth", "auth", "401", "Unauthorized"]

for idx, line in enumerate(lines, 1):
    for kw in keywords:
        if kw.lower() in line.lower():
            print(f"Line {idx}: [{kw}] {line.strip()[:120]}")
