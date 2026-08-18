import requests
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. Target Endpoints
N8N_LOCAL_TEST = "http://localhost:5678/webhook-test/webhook"
N8N_TUNNEL_TEST = "https://social-hornets-stick.loca.lt/webhook-test/webhook"
LIVE_META_WEBHOOK = "https://metaaimoderator.vercel.app/webhook"

# 2. Mock Instagram Direct Message Payload
ig_dm_payload = {
    "object": "instagram",
    "entry": [{
        "id": "17841413562796856",
        "time": int(time.time()),
        "messaging": [{
            "sender": {"id": "INSTAGRAM_USER_MHMD4SAEED"},
            "recipient": {"id": "17841413562796856"},
            "timestamp": int(time.time() * 1000),
            "message": {
                "mid": f"mid_ig_test_{int(time.time())}",
                "text": "سلام عليكم، تجربة إرسال داتا مباشرة لـ n8n من منصة دوميا! 🚀"
            }
        }]
    }]
}

# 3. Mock Instagram Comment Payload
ig_comment_payload = {
    "object": "instagram",
    "entry": [{
        "id": "17841413562796856",
        "time": int(time.time()),
        "changes": [{
            "field": "comments",
            "value": {
                "id": f"comment_ig_{int(time.time())}",
                "text": "كام سعر الباقة الاحترافية لإدارة الصفحات؟",
                "from": {"id": "IG_USER_12345", "username": "mhmd4saeed"},
                "media": {"id": "17841413562799999"}
            }
        }]
    }]
}

def dispatch_all():
    print("=" * 60)
    print("🚀 DISPATCHING TEST PAYLOADS TO N8N WEBHOOK ENDPOINTS")
    print("=" * 60)

    # Dispatch to local n8n directly
    try:
        r1 = requests.post(N8N_LOCAL_TEST, json=ig_dm_payload, timeout=5)
        print(f"1. Local n8n (http://localhost:5678/webhook-test/webhook) -> Status: {r1.status_code}, Response: {r1.text[:100]}")
    except Exception as e:
        print(f"1. Local n8n -> Error: {e}")

    # Dispatch to public tunnel
    try:
        r2 = requests.post(N8N_TUNNEL_TEST, json=ig_dm_payload, timeout=5)
        print(f"2. n8n Tunnel ({N8N_TUNNEL_TEST}) -> Status: {r2.status_code}, Response: {r2.text[:100]}")
    except Exception as e:
        print(f"2. n8n Tunnel -> Error: {e}")

    # Dispatch to Live Meta Webhook (which forwards to n8n)
    try:
        r3 = requests.post(LIVE_META_WEBHOOK, json=ig_comment_payload, timeout=5)
        print(f"3. Live Meta Webhook ({LIVE_META_WEBHOOK}) -> Status: {r3.status_code}, Response: {r3.text[:100]}")
    except Exception as e:
        print(f"3. Live Meta Webhook -> Error: {e}")

    print("=" * 60)
    print("✅ TEST PAYLOAD DISPATCH COMPLETED!")

if __name__ == "__main__":
    dispatch_all()
