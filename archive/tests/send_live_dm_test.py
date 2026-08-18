import requests
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Retrieve secrets from env or live config
ACCESS_TOKEN = os.environ.get("PAGE_ACCESS_TOKEN", "")
IG_ACCOUNT_ID = os.environ.get("INSTAGRAM_ACCOUNT_ID", "17841413562796856")

if not ACCESS_TOKEN:
    # Read from api/index.py or supabase fallback
    try:
        from supabase import create_client
        SUPABASE_URL = "https://wvdvymlyqfwrqygympxa.supabase.co"
        SUPABASE_KEY = "[REDACTED]"
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        res = supabase.table("settings").select("setting_value").eq("setting_key", "PAGE_ACCESS_TOKEN").execute()
        if res.data:
            ACCESS_TOKEN = res.data[0]["setting_value"]
    except Exception as e:
        print(f"Error fetching token: {e}")

print("=" * 60)
print("🚀 TESTING DIRECT INSTAGRAM DM SEND VIA META GRAPH API")
print("=" * 60)
print(f"IG Account ID: {IG_ACCOUNT_ID}")
print(f"Page Access Token present: {'YES' if ACCESS_TOKEN else 'NO'}")

# 1. Attempt sending to recent conversation or test IGSID
url = f"https://graph.facebook.com/v19.0/{IG_ACCOUNT_ID}/messages"
headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}

# Try sending a message payload
payload = {
    "recipient": {"username": "mhmd4saeed"},
    "message": {"text": "مرحباً! هذه رسالة تجريبية من النظام التلقائي لـ Domya AI 🤖✨"}
}

res = requests.post(url, headers=headers, json=payload)
print(f"Response Status: {res.status_code}")
print(f"Response Body: {res.text}")
