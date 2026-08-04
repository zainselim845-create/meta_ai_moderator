# -*- coding: utf-8 -*-
import requests, json, os

TOKEN = "[REDACTED]"
BASE = "https://graph.facebook.com/v21.0"

print("1. Fetching Page & Instagram Account Info...")
r = requests.get(f"{BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{{id,username,name,followers_count,follows_count,media_count}}&limit=5", params={"access_token": TOKEN}, timeout=15)
pages = r.json().get("data", [])
if not pages:
    print("No pages found!")
    exit(1)

page = pages[0]
PAGE_ID = page["id"]
PAGE_TOKEN = page["access_token"]
IG_BIZ = page.get("instagram_business_account", {})
IG_ID = IG_BIZ.get("id", "17841413562796856")
IG_USERNAME = IG_BIZ.get("username", "domya_marketing")

print(f"Page: {page.get('name')} (ID: {PAGE_ID})")
print(f"IG Account: @{IG_USERNAME} (ID: {IG_ID})")

ig_data = {
    "account": IG_BIZ,
    "media": [],
    "comments": [],
    "conversations": []
}

# Step 2: Fetch Instagram Posts & Reels & Comments
print("\n2. Fetching Instagram Media, Posts & Comments...")
try:
    r_media = requests.get(
        f"{BASE}/{IG_ID}/media?fields=id,caption,media_type,media_url,permalink,timestamp,comments_count,like_count,comments.limit(50){{id,text,username,timestamp,from}}&limit=50",
        params={"access_token": PAGE_TOKEN},
        timeout=15
    )
    if r_media.status_code == 200:
        media_list = r_media.json().get("data", [])
        print(f"   Found {len(media_list)} Instagram Media Posts/Reels")
        for m in media_list:
            ig_data["media"].append(m)
            comments = m.get("comments", {}).get("data", [])
            caption = (m.get("caption") or "(no caption)")[:60]
            print(f"   📸 [{m.get('timestamp')}] {caption} ({len(comments)} comments)")
            for c in comments:
                ig_data["comments"].append(c)
                print(f"      💬 @{c.get('username')}: {c.get('text')} [{c.get('timestamp')}]")
        print(f"   Total IG Comments extracted: {len(ig_data['comments'])}")
    else:
        print(f"   Media API error: {r_media.status_code} -> {r_media.text}")
except Exception as e:
    print(f"   Media Exception: {e}")

# Step 3: Fetch Instagram Direct Conversations
print("\n3. Fetching Instagram Direct Conversations...")
try:
    r_conv = requests.get(
        f"{BASE}/{PAGE_ID}/conversations?platform=instagram&fields=id,updated_time,unread_count,senders{{id,name,username}},snippet&limit=50",
        params={"access_token": PAGE_TOKEN},
        timeout=10
    )
    if r_conv.status_code == 200:
        threads = r_conv.json().get("data", [])
        print(f"   Found {len(threads)} Instagram DM Threads")
        for t in threads:
            ig_data["conversations"].append(t)
            senders = [s.get("username", s.get("name","?")) for s in t.get("senders",{}).get("data",[])]
            print(f"      📩 Thread {t['id']}: {', '.join(senders)} | {t.get('updated_time')}")
    else:
        print(f"   Conversations Info: {r_conv.status_code} -> {r_conv.text}")
except Exception as e:
    print(f"   Conversations Exception: {e}")

# Save full Instagram extraction to file
with open("instagram_full_data.json", "w", encoding="utf-8") as f:
    json.dump(ig_data, f, indent=2, ensure_ascii=False)

print("\n" + "=" * 60)
print(f"SUMMARY OF INSTAGRAM DATA EXTRACTED:")
print(f"  IG Account: @{IG_USERNAME} (ID: {IG_ID})")
print(f"  Media Posts/Reels: {len(ig_data['media'])}")
print(f"  Comments Extracted: {len(ig_data['comments'])}")
print(f"  DM Threads: {len(ig_data['conversations'])}")
print("=" * 60)
print("Saved to instagram_full_data.json")
