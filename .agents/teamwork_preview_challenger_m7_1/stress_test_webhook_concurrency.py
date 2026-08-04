import os
import sys
import time
import json
import threading
import concurrent.futures
from datetime import datetime

sys.path.insert(0, r"C:\Users\mhmd\meta_ai_moderator")
from server import app

print("=== STRESS TEST 1: CONCURRENT WEBHOOK EVENTS ===")

client = app.test_client()

# Prepare payloads for FB DM, IG DM, FB Comment, IG Comment, Comment-to-DM
def make_fb_dm_payload(msg_id, sender_id, text):
    return {
        "object": "page",
        "entry": [{
            "id": "page_123",
            "time": 1700000000,
            "messaging": [{
                "sender": {"id": sender_id},
                "recipient": {"id": "page_123"},
                "timestamp": 1700000000,
                "message": {
                    "mid": msg_id,
                    "text": text
                }
            }]
        }]
    }

def make_ig_dm_payload(msg_id, sender_id, text):
    return {
        "object": "instagram",
        "entry": [{
            "id": "ig_acc_456",
            "time": 1700000000,
            "messaging": [{
                "sender": {"id": sender_id},
                "recipient": {"id": "ig_acc_456"},
                "timestamp": 1700000000,
                "message": {
                    "mid": msg_id,
                    "text": text
                }
            }]
        }]
    }

def make_fb_comment_payload(comment_id, post_id, sender_id, text):
    return {
        "object": "page",
        "entry": [{
            "id": "page_123",
            "time": 1700000000,
            "changes": [{
                "value": {
                    "item": "comment",
                    "comment_id": comment_id,
                    "post_id": post_id,
                    "from": {"id": sender_id, "name": f"User_{sender_id}"},
                    "message": text,
                    "verb": "add"
                },
                "field": "feed"
            }]
        }]
    }

def make_ig_comment_payload(comment_id, media_id, sender_id, text):
    return {
        "object": "instagram",
        "entry": [{
            "id": "ig_acc_456",
            "time": 1700000000,
            "changes": [{
                "value": {
                    "item": "comment",
                    "id": comment_id,
                    "media": {"id": media_id},
                    "from": {"id": sender_id, "username": f"ig_user_{sender_id}"},
                    "text": text
                },
                "field": "comments"
            }]
        }]
    }

results = {
    "total_requests": 0,
    "successful_200": 0,
    "failed": 0,
    "exceptions": []
}
results_lock = threading.Lock()

def send_webhook_task(payload_info):
    payload_type, payload = payload_info
    try:
        res = client.post("/webhook", data=json.dumps(payload), content_type="application/json")
        with results_lock:
            results["total_requests"] += 1
            if res.status_code == 200:
                results["successful_200"] += 1
            else:
                results["failed"] += 1
    except Exception as e:
        with results_lock:
            results["failed"] += 1
            results["exceptions"].append(str(e))

def run_stress_test(num_requests=100, concurrency=20):
    print(f"[*] Dispatching {num_requests} concurrent webhooks with thread pool size {concurrency}...")
    
    tasks = []
    for i in range(num_requests):
        idx = i % 5
        if idx == 0:
            p = make_fb_dm_payload(f"mid_stress_fb_dm_{i}", f"sender_fb_{i}", f"مرحبا اريد معرفة الاسعار {i}")
            tasks.append(("fb_dm", p))
        elif idx == 1:
            p = make_ig_dm_payload(f"mid_stress_ig_dm_{i}", f"sender_ig_{i}", f"ما هي تفاصيل الباقات؟ {i}")
            tasks.append(("ig_dm", p))
        elif idx == 2:
            p = make_fb_comment_payload(f"comment_fb_{i}", f"post_100", f"sender_fb_{i}", f"بكام الكورس؟ {i}")
            tasks.append(("fb_comment", p))
        elif idx == 3:
            p = make_ig_comment_payload(f"comment_ig_{i}", f"media_200", f"sender_ig_{i}", f"سعر الاشتراك كم؟ {i}")
            tasks.append(("ig_comment", p))
        else:
            p = make_fb_comment_payload(f"comment_priv_{i}", f"post_100", f"sender_priv_{i}", f"اريد التفاصيل عالخاص {i}")
            tasks.append(("comment_to_dm", p))

    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(send_webhook_task, t) for t in tasks]
        concurrent.futures.wait(futures)
    duration = time.time() - start_time

    print(f"[*] Stress Test Finished in {duration:.3f} seconds ({num_requests/duration:.1f} req/sec)")
    print(f"    - Total Requests: {results['total_requests']}")
    print(f"    - Status 200 OK: {results['successful_200']}")
    print(f"    - Failed Requests: {results['failed']}")
    print(f"    - Exceptions: {len(results['exceptions'])}")

    print("\n[*] Testing Webhook Deduplication Race Condition (10 identical requests simultaneously)...")
    dup_payload = make_fb_dm_payload("mid_RACE_CONDITION_123", "sender_race", "رسالة مكررة بنفس الـ ID")
    
    dup_statuses = []
    dup_lock = threading.Lock()
    def send_dup():
        r = client.post("/webhook", data=json.dumps(dup_payload), content_type="application/json")
        with dup_lock:
            dup_statuses.append(r.status_code)

    threads = [threading.Thread(target=send_dup) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    print(f"    - Race condition responses: {dup_statuses}")
    all_200 = all(s == 200 for s in dup_statuses)
    print(f"    - All 10 requests returned 200 OK: {all_200}")

    pass_condition = (results["failed"] == 0 and all_200)
    print(f"\n>>> CONCURRENCY STRESS TEST RESULT: {'PASS' if pass_condition else 'FAIL'}")
    return pass_condition

if __name__ == "__main__":
    success = run_stress_test(100, 20)
    sys.exit(0 if success else 1)
