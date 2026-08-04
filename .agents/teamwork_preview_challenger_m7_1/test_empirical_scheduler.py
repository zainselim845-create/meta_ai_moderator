import os
import sys
import time

sys.path.insert(0, r"C:\Users\mhmd\meta_ai_moderator")
from server import scheduled_posts, execute_due_scheduled_posts, scheduled_lock, datetime

print("=== STRESS TEST 5: SCHEDULER CRON DAEMON LOOP ===")

# Check initial state
with scheduled_lock:
    print(f"Initial scheduled posts count: {len(scheduled_posts)}")
    print(f"Initial status of post #1001: {scheduled_posts[0].get('status')}")

# Add a test post scheduled in the past / due now
past_time_iso = (datetime.now()).strftime("%Y-%m-%dT%H:%M")
test_post = {
    "id": 9999,
    "caption": "Test Post for Cron Verification",
    "scheduled_at": past_time_iso,
    "status": "مجدول"
}

with scheduled_lock:
    scheduled_posts.append(test_post)

print(f"Added test post #9999 with status '{test_post['status']}' and scheduled_at '{past_time_iso}'")

# Wait up to 10 seconds for the background daemon loop to process it
print("Waiting for background daemon loop to trigger execution...")
start_wait = time.time()
published = False

while time.time() - start_wait < 12:
    with scheduled_lock:
        target = next((p for p in scheduled_posts if p.get("id") == 9999), None)
        if target and target.get("status") == "تم النشر ✅":
            published = True
            break
    time.sleep(1)

if published:
    print("[PASS] Scheduler cron daemon automatically picked up and published post #9999!")
else:
    print(f"[FAIL] Scheduler cron daemon failed to publish post #9999 within timeout. Status: {target.get('status') if target else 'not found'}")

sys.exit(0 if published else 1)
