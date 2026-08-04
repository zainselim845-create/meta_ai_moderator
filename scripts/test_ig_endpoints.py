# -*- coding: utf-8 -*-
import requests, json

TOKEN = "[REDACTED]"
BASE = "https://graph.facebook.com/v21.0"

# Get Page Token and IG ID
r = requests.get(f"{BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{{id,username}}&limit=5", params={"access_token": TOKEN}, timeout=10)
page = r.json()["data"][0]
PAGE_ID = page["id"]
PAGE_TOKEN = page["access_token"]
IG_ID = page.get("instagram_business_account", {}).get("id", "")

print(f"Page ID: {PAGE_ID}, IG ID: {IG_ID}")

print("\n--- Test 1: /{page_id}/conversations?platform=instagram ---")
r1 = requests.get(f"{BASE}/{PAGE_ID}/conversations?platform=instagram&fields=id,updated_time,unread_count,senders{{id,name,username}}&limit=10", params={"access_token": PAGE_TOKEN}, timeout=10)
print(f"Status: {r1.status_code}, Response: {r1.text}")

print("\n--- Test 2: /{ig_id}/conversations ---")
r2 = requests.get(f"{BASE}/{IG_ID}/conversations?fields=id,updated_time,unread_count,senders{{id,name,username}}&limit=10", params={"access_token": PAGE_TOKEN}, timeout=10)
print(f"Status: {r2.status_code}, Response: {r2.text}")

print("\n--- Test 3: /{ig_id}/media with comments ---")
r3 = requests.get(f"{BASE}/{IG_ID}/media?fields=id,caption,comments_count,timestamp,permalink,comments{{id,text,username,timestamp}}&limit=10", params={"access_token": PAGE_TOKEN}, timeout=10)
print(f"Status: {r3.status_code}")
media_data = r3.json().get("data", [])
print(f"Found {len(media_data)} IG Posts")
for m in media_data:
    comments = m.get("comments", {}).get("data", [])
    print(f"   Post ID {m.get('id')}: {m.get('caption','')[:40]} ({len(comments)} comments)")
    for c in comments:
        print(f"      💬 @{c.get('username')}: {c.get('text')} [{c.get('timestamp')}]")
