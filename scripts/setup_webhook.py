# -*- coding: utf-8 -*-
import requests, json, os

TOKEN = "[REDACTED]"
BASE = "https://graph.facebook.com/v21.0"
CALLBACK_URL = "https://metaaimoderator.vercel.app/webhook"
VERIFY_TOKEN = "8xTixM78GBd_XcWbLt34mJu4"

# 1. Test webhook endpoint is alive
print("1. Testing webhook endpoint...")
try:
    r = requests.get(f"{CALLBACK_URL}?hub.mode=subscribe&hub.verify_token={VERIFY_TOKEN}&hub.challenge=TEST_CHALLENGE_123", timeout=10)
    print(f"   Status: {r.status_code}, Body: {r.text[:100]}")
    if r.status_code == 200 and "TEST_CHALLENGE_123" in r.text:
        print("   WEBHOOK VERIFICATION: OK")
    else:
        print("   WEBHOOK VERIFICATION: FAILED")
except Exception as e:
    print(f"   Error: {e}")

# 2. Get Page info
print("\n2. Getting Page Token...")
r = requests.get(f"{BASE}/me/accounts?fields=id,name,access_token&limit=5", params={"access_token": TOKEN}, timeout=10)
pages = r.json().get("data", [])
if not pages:
    print(f"   No pages found: {r.text[:200]}")
    exit(1)
    
page = pages[0]
PAGE_ID = page["id"]
PAGE_TOKEN = page["access_token"]
print(f"   Page: {page.get('name')} (ID: {PAGE_ID})")
print(f"   Page Token: {PAGE_TOKEN[:20]}...{PAGE_TOKEN[-10:]}")

# 3. Subscribe page to webhook
print("\n3. Subscribing page to webhook...")
r = requests.post(
    f"{BASE}/{PAGE_ID}/subscribed_apps",
    params={"access_token": PAGE_TOKEN},
    json={
        "subscribed_fields": "messages,messaging_postbacks,feed,mention"
    },
    timeout=10
)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text}")

# 4. Check current subscriptions
print("\n4. Checking current subscriptions...")
r = requests.get(f"{BASE}/{PAGE_ID}/subscribed_apps", params={"access_token": PAGE_TOKEN}, timeout=10)
print(f"   Status: {r.status_code}")
subs = r.json()
print(f"   Subscriptions: {json.dumps(subs, indent=2)}")

# 5. Check app webhook config
print("\n5. Checking app webhook config for app 1331918902446123...")
APP_ID = "1331918902446123"
r = requests.get(f"{BASE}/{APP_ID}/subscriptions", params={"access_token": TOKEN}, timeout=10)
print(f"   Status: {r.status_code}")
print(f"   Response: {json.dumps(r.json(), indent=2)}")

print("\nDONE")
