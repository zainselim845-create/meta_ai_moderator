import sys
import os
import glob
import re

sys.path.insert(0, r'C:\Users\mhmd\meta_ai_moderator')

print("=========================================")
print("ADVERSARIAL STRESS & COMPLIANCE HARNESS")
print("=========================================")

# 1. HTML Size check
html_path = r'C:\Users\mhmd\meta_ai_moderator\templates\index.html'
if os.path.exists(html_path):
    size_bytes = os.path.getsize(html_path)
    size_kb = size_bytes / 1024.0
    print(f"templates/index.html size: {size_bytes} bytes ({size_kb:.2f} KB)")
    print(f"Under 30KB constraint (< 30720 bytes): {size_bytes < 30720}")

# 2. Instagrapi check
py_files = glob.glob(r'C:\Users\mhmd\meta_ai_moderator\**\*.py', recursive=True)
instagrapi_found = []
for p in py_files:
    if '.agents' in p:
        continue
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'instagrapi' in content:
        instagrapi_found.append(p)

print(f"\nInstagrapi library usage found in codebase: {len(instagrapi_found)}")
if instagrapi_found:
    print("Files containing instagrapi:", instagrapi_found)
else:
    print("Zero instagrapi library calls confirmed.")

# 3. Stress test endpoints with invalid inputs using Flask client
from api.index import app
client = app.test_client()
headers = {"Authorization": "Bearer [REDACTED]"}

print("\n--- STRESS TESTING ENDPOINTS ---")

# Test bad JSON payload
res1 = client.post('/webhook', data="NOT_JSON", content_type="application/json")
print(f"Webhook bad payload status: {res1.status_code}")

# Test SQL injection/XSS payloads on search/rules
res2 = client.get("/api/accounts?client_id=' OR 1=1 --", headers=headers)
print(f"Accounts SQLi attempt status: {res2.status_code}")

# Test invalid cron endpoint
res3 = client.get("/api/cron/refresh_tokens")
print(f"/api/cron/refresh_tokens status: {res3.status_code}")

print("\n=========================================")
print("STRESS & COMPLIANCE HARNESS COMPLETE")
print("=========================================")
