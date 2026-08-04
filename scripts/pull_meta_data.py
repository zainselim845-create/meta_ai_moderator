import os
# -*- coding: utf-8 -*-
import requests, json, sys, os

TOKEN = os.environ.get("PAGE_ACCESS_TOKEN", "")
BASE = "https://graph.facebook.com/v21.0"

out_lines = []

def p(text):
    out_lines.append(str(text))
    try:
        print(str(text))
    except:
        print(str(text).encode('ascii', 'replace').decode('ascii'))

p("=" * 60)
p("1. Token identity check")
p("=" * 60)
r = requests.get(f"{BASE}/me?fields=id,name", params={"access_token": TOKEN}, timeout=15)
p(f"Status: {r.status_code}")
me = r.json()
p(json.dumps(me, indent=2, ensure_ascii=False))

p("")
p("=" * 60)
p("2. Getting Pages (accounts)")
p("=" * 60)
r = requests.get(f"{BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{{id,username,name,followers_count}}&limit=50", params={"access_token": TOKEN}, timeout=15)
p(f"Status: {r.status_code}")
pages_data = r.json()
pages = pages_data.get("data", [])
p(f"Found {len(pages)} pages")

if not pages:
    p("No pages found.")
    p(json.dumps(pages_data, indent=2, ensure_ascii=False))
    with open("meta_results.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))
    sys.exit(0)

results = {"pages": [], "messenger": [], "ig_dm": [], "fb_comments": [], "ig_comments": [], "fb_posts": [], "ig_posts": []}

for pg in pages:
    page_id = pg["id"]
    page_name = pg.get("name", "Unknown")
    page_token = pg.get("access_token", "")
    ig = pg.get("instagram_business_account", {})
    ig_id = ig.get("id", "")
    ig_username = ig.get("username", "")

    p(f"")
    p(f">> Page: {page_name} (ID: {page_id})")
    p(f"   IG: @{ig_username} (ID: {ig_id})")
    p(f"   Page Token: {page_token[:20]}...{page_token[-10:]}" if len(page_token) > 30 else f"   Page Token: {page_token}")

    results["pages"].append({"page_id": page_id, "page_name": page_name, "page_token": page_token, "ig_id": ig_id, "ig_username": ig_username})

    # Messenger
    p(f"   --- Messenger ---")
    r = requests.get(f"{BASE}/{page_id}/conversations?platform=messenger&fields=id,updated_time,unread_count,senders{{id,name}},snippet&limit=25", params={"access_token": page_token}, timeout=15)
    resp = r.json()
    convos = resp.get("data", [])
    p(f"   {len(convos)} threads")
    for t in convos:
        senders = [s.get("name","?") for s in t.get("senders",{}).get("data",[])]
        snippet = (t.get("snippet") or "")[:80]
        p(f"     {', '.join(senders)}: {snippet} | {t.get('updated_time','')}")
        results["messenger"].append(t)
    if not convos and "error" in resp:
        p(f"   Error: {resp['error'].get('message','')}")

    # IG DMs
    if ig_id:
        p(f"   --- Instagram DMs ---")
        r = requests.get(f"{BASE}/{page_id}/conversations?platform=instagram&fields=id,updated_time,senders{{id,name,username}}&limit=25", params={"access_token": page_token}, timeout=15)
        resp = r.json()
        if "data" in resp:
            ig_threads = resp["data"]
            p(f"   {len(ig_threads)} IG DM threads")
            for t in ig_threads:
                senders = [s.get("username", s.get("name","?")) for s in t.get("senders",{}).get("data",[])]
                p(f"     {', '.join(senders)} | {t.get('updated_time','')}")
                results["ig_dm"].append(t)
        else:
            err = resp.get("error", {})
            p(f"   IG DM Error: {err.get('code')}/{err.get('error_subcode')}: {err.get('message','')[:120]}")

    # FB Posts & Comments
    p(f"   --- FB Posts & Comments ---")
    r = requests.get(f"{BASE}/{page_id}/feed?fields=id,message,created_time,comments.limit(30){{id,message,from{{id,name}},created_time}}&limit=25", params={"access_token": page_token}, timeout=15)
    resp = r.json()
    posts = resp.get("data", [])
    p(f"   {len(posts)} posts")
    total_fb = 0
    for post in posts:
        comments = post.get("comments", {}).get("data", [])
        total_fb += len(comments)
        msg = (post.get("message") or "(no text)")[:70]
        p(f"   [{post.get('created_time','')}] {msg} ({len(comments)} comments)")
        results["fb_posts"].append({"id": post.get("id"), "message": post.get("message"), "created_time": post.get("created_time"), "comments_count": len(comments)})
        for c in comments:
            c_from = c.get("from", {}).get("name", "?")
            c_msg = (c.get("message") or "")[:70]
            p(f"      {c_from}: {c_msg} | {c.get('created_time','')}")
            results["fb_comments"].append(c)
    p(f"   Total FB comments: {total_fb}")

    # IG Posts & Comments
    if ig_id:
        p(f"   --- IG Posts & Comments ---")
        r = requests.get(f"{BASE}/{ig_id}/media?fields=id,caption,timestamp,permalink,comments_count,comments.limit(25){{id,text,username,timestamp}}&limit=25", params={"access_token": page_token}, timeout=15)
        resp = r.json()
        media = resp.get("data", [])
        p(f"   {len(media)} IG posts")
        total_ig = 0
        for m in media:
            comments = m.get("comments", {}).get("data", [])
            total_ig += len(comments)
            caption = (m.get("caption") or "(no caption)")[:70]
            p(f"   [{m.get('timestamp','')}] {caption} ({len(comments)} comments)")
            results["ig_posts"].append({"id": m.get("id"), "caption": m.get("caption"), "timestamp": m.get("timestamp"), "permalink": m.get("permalink"), "comments_count": len(comments)})
            for c in comments:
                c_text = (c.get("text") or "")[:70]
                p(f"      @{c.get('username','?')}: {c_text} | {c.get('timestamp','')}")
                results["ig_comments"].append(c)
        p(f"   Total IG comments: {total_ig}")

# Save
with open("meta_data_dump.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

p("")
p("=" * 60)
p(f"SUMMARY:")
p(f"  Pages: {len(results['pages'])}")
p(f"  Messenger threads: {len(results['messenger'])}")
p(f"  IG DM threads: {len(results['ig_dm'])}")
p(f"  FB posts: {len(results['fb_posts'])}")
p(f"  FB comments: {len(results['fb_comments'])}")
p(f"  IG posts: {len(results['ig_posts'])}")
p(f"  IG comments: {len(results['ig_comments'])}")
p("=" * 60)

with open("meta_results.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))
p("Saved to meta_results.txt and meta_data_dump.json")
