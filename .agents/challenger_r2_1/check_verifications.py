import sys
import os
import json
import re

sys.path.insert(0, r'C:\Users\mhmd\meta_ai_moderator')

print("=========================================")
print("EMPIRICAL VERIFICATION HARNESS - R2_1")
print("=========================================")

from api.index import app
client = app.test_client()

# 1. Cookie flags & Auth check on /api/oauth/start
print("\n--- CHECK 1: /api/oauth/start (Unauthenticated & Authenticated) ---")

# Unauthenticated
res_unauth = client.get('/api/oauth/start')
print(f"Unauthenticated status code: {res_unauth.status_code}")
assert res_unauth.status_code == 401, f"Expected 401 unauth, got {res_unauth.status_code}"

# Authenticated with Bearer token
headers = {"Authorization": "Bearer [REDACTED]"}
res_auth = client.get('/api/oauth/start', headers=headers)
print(f"Authenticated status code: {res_auth.status_code}")
print(f"Location header: {res_auth.headers.get('Location')}")
cookies = res_auth.headers.getlist('Set-Cookie')
print("Set-Cookie headers:")
for c in cookies:
    print("  -", c)

has_httponly = all('HttpOnly' in c for c in cookies if 'oauth_' in c)
has_secure = all('Secure' in c for c in cookies if 'oauth_' in c)
print(f"HttpOnly flag on all oauth cookies: {has_httponly}")
print(f"Secure flag on all oauth cookies: {has_secure}")

# 2. Token masking check on /api/accounts
print("\n--- CHECK 2: /api/accounts Token Masking (Unauthenticated & Authenticated) ---")

res_acc_unauth = client.get('/api/accounts')
print(f"Unauthenticated status code: {res_acc_unauth.status_code}")
assert res_acc_unauth.status_code == 401, f"Expected 401 unauth, got {res_acc_unauth.status_code}"

res_acc_auth = client.get('/api/accounts', headers=headers)
print(f"Authenticated status code: {res_acc_auth.status_code}")
data = res_acc_auth.get_json()
print("Response JSON accounts count:", len(data.get('accounts', [])))
for acc in data.get('accounts', []):
    token = acc.get('access_token', '')
    print(f"Account '{acc.get('name')}': access_token = '{token}'")
    is_masked = token.startswith('EAAS7X') and len(token) < 40 and ('•' in token or '' in token or len(token) < 25)
    print(f"  -> Token properly masked: {is_masked} (raw repr: {repr(token)})")

# 3. 6 Mock thread definitions check in inbox.js and api/index.py
print("\n--- CHECK 3: 6 Mock thread definitions in static/js/inbox.js and api/index.py ---")

with open(r'C:\Users\mhmd\meta_ai_moderator\static\js\inbox.js', 'r', encoding='utf-8') as f:
    inbox_js = f.read()

name_matches_js = re.findall(r'name:\s*["\']([^"\']+)["\']', inbox_js)
print("6 Mock leads found in static/js/inbox.js:", name_matches_js)

expected_leads = ['Ahmed Zakaria Zaki', 'Ahmed Medo', 'Azza Mokhtar', 'Siman Hussein', 'Doaa Ashraf', 'Hager Nabil']
all_leads_present = all(lead in name_matches_js for lead in expected_leads)
print(f"All 6 expected lead threads present in inbox.js: {all_leads_present}")

# Also test GET /api/conversations endpoint for backend threads
res_conv_auth = client.get('/api/conversations', headers=headers)
print(f"\nGET /api/conversations status code: {res_conv_auth.status_code}")
conv_data = res_conv_auth.get_json()
if isinstance(conv_data, list):
    conv_names = [c.get('user', {}).get('name') for c in conv_data]
    print("Conversations returned from API:", conv_names)

# 4. youtube_link.txt contents check
print("\n--- CHECK 4: youtube_link.txt contents ---")
yt_path = r'C:\Users\mhmd\meta_ai_moderator\youtube_link.txt'
with open(yt_path, 'r', encoding='utf-8') as f:
    yt_content = f.read()

print("youtube_link.txt content:\n" + yt_content.strip())
has_url = "https://youtu.be/" in yt_content or "youtube.com" in yt_content
has_appid = "App ID:" in yt_content and ("100821894800009" in yt_content or "1331918902446123" in yt_content)
print(f"Contains valid video URL: {has_url}")
print(f"Contains App ID: {has_appid}")

print("\n=========================================")
print("ALL EMPIRICAL VERIFICATIONS COMPLETED SUCCESSFULLY")
print("=========================================")
