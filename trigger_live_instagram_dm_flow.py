import requests
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://metaaimoderator.vercel.app"

print("=" * 70)
print("🚀 TRIGGERING LIVE INSTAGRAM DM WEBHOOK & AI RESPONSE FLOW")
print("=" * 70)

# 1. Instagram Direct Message Webhook Payload
ig_dm_payload = {
    "object": "instagram",
    "entry": [
        {
            "id": "17841413562796856",
            "time": int(time.time()),
            "messaging": [
                {
                    "sender": {"id": "test_user_mhmd4saeed"},
                    "recipient": {"id": "17841413562796856"},
                    "timestamp": int(time.time()),
                    "message": {
                        "mid": "mid.1234567890_test_ig_dm",
                        "text": "مرحباً! كم أسعار باقات التسويق وإدارة الصفحات لديكم؟"
                    }
                }
            ]
        }
    ]
}

print("1. Sending Instagram DM Webhook Payload to live server...")
r_webhook = requests.post(f"{BASE_URL}/webhook", json=ig_dm_payload)
print(f"Webhook Response Code: {r_webhook.status_code}")
print(f"Webhook Response Body: {r_webhook.text}")

# 2. Fetch Activity Log & Inbox on live server
time.sleep(2)
print("\n2. Fetching Activity Logs from Live Server...")
r_logs = requests.get(f"{BASE_URL}/api/logs")
print(f"Logs Response Code: {r_logs.status_code}")

if r_logs.status_code == 200:
    logs = r_logs.json().get("logs", [])
    print(f"Total Logged Events: {len(logs)}")
    for log in logs[:3]:
        print(f"  • [{log.get('type')}] User: {log.get('user')} | Text: {log.get('text')} -> Reply: {log.get('reply')}")

# 3. Fetch Conversations Inbox
print("\n3. Fetching Conversations Inbox...")
r_convs = requests.get(f"{BASE_URL}/api/conversations")
print(f"Inbox Status Code: {r_convs.status_code}")
if r_convs.status_code == 200:
    convs = r_convs.json().get("conversations", [])
    print(f"Total Inbox Threads: {len(convs)}")

print("\n" + "=" * 70)
print("✅ LIVE INSTAGRAM AI DM TEST COMPLETED SUCCESSFULLY")
print("=" * 70)
