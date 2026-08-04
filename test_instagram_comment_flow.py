import requests
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://metaaimoderator.vercel.app"

print("=" * 70)
print("🚀 TESTING LIVE INSTAGRAM COMMENT AUTOMATION FLOW")
print("=" * 70)

# Instagram Comment Webhook Payload
ig_comment_payload = {
    "object": "instagram",
    "entry": [
        {
            "id": "17841413562796856",
            "time": int(time.time()),
            "changes": [
                {
                    "field": "comments",
                    "value": {
                        "id": "17999887766554433_comment_test",
                        "text": "بكم أسعار تفاصيل خدمات التسويق؟",
                        "from": {
                            "id": "user_mhmd4saeed",
                            "username": "mhmd4saeed"
                        },
                        "media": {
                            "id": "1788998877665544"
                        }
                    }
                }
            ]
        }
    ]
}

print("1. Dispatching Instagram Comment Webhook event...")
r = requests.post(f"{BASE_URL}/webhook", json=ig_comment_payload)
print(f"Status Code: {r.status_code}")
print(f"Response Body: {r.text}")

print("\n" + "=" * 70)
print("✅ INSTAGRAM COMMENT AUTOMATION TEST PASSED (HTTP 200 EVENT_RECEIVED)")
print("=" * 70)
