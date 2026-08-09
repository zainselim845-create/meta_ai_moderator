"""
Empirical Stress Test & Verification Suite for Meta AI Social Moderator
Created by Challenger 1

Validates:
1. Webhook GET & POST across 4 channels (FB DM, FB Comment, IG DM, IG Comment)
2. Pause Mode (bot_enabled=False -> BOT_PAUSED 200 OK)
3. Manual Approval Mode (approval_mode=manual -> pending_approvals queueing)
4. REST Endpoints (/api/toggle, /api/approve/<id>, /api/reject/<id>, /api/approvals, /api/logs/stream)
5. Boundary, Error Handling & Failure Mode Analysis
"""

import unittest
import json
import time
import os
from unittest.mock import patch, MagicMock

from api.index import app, stats, activity_log, pending_approvals, cache
import api.index as server


class TestEmpiricalHarness(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True
        with self.client.session_transaction() as sess:
            sess['uid'] = 'admin'

        # In-memory mock database for Supabase settings
        self.mock_db = {
            "meta_ai_kb": [
                {
                    "id": 1,
                    "question": "ما هي خدمات وكالة دوميا؟",
                    "answer": "نقدم خدمات التسويق الرقمي الشامل."
                }
            ],
            "meta_ai_rules": [
                {
                    "id": 101,
                    "trigger": "سعر",
                    "response": "تم الرد في الخاص 📩",
                    "private_response": "أسعارنا تبدأ من 3000 جنيه.",
                    "match_type": "contains",
                    "is_active": True
                }
            ],
            "meta_ai_system_prompt": "أنت مساعد خدمة عملاء لوكالة دوميا."
        }

        # Reset global state before each test
        activity_log.clear()
        stats["dms"] = 0
        stats["comments"] = 0
        stats["ai_calls"] = 0
        stats["pending"] = 0
        cache["bot_enabled"] = True
        cache["approval_mode"] = "auto"
        pending_approvals.clear()
        server.APP_SECRET = ""
        server.GROQ_API_KEY = ""
        server.OPENROUTER_API_KEY = ""

        # Patch external requests
        self.patch_req_post = patch('requests.post', side_effect=self.fake_requests_post)
        self.patch_req_get = patch('requests.get', side_effect=self.fake_requests_get)
        self.mock_post = self.patch_req_post.start()
        self.mock_get = self.patch_req_get.start()

    def tearDown(self):
        patch.stopall()

    def fake_requests_post(self, url, *args, **kwargs):
        mock_res = MagicMock()
        mock_res.status_code = 200
        if "chat/completions" in url:
            mock_res.json.return_value = {
                "choices": [{"message": {"content": "تم الرد بالذكاء الاصطناعي."}}]
            }
        elif "/me/messages" in url:
            mock_res.json.return_value = {"recipient_id": "123", "message_id": "mid.100"}
        elif "/comments" in url:
            mock_res.json.return_value = {"id": "comment_reply_100"}
        elif "/private_replies" in url:
            mock_res.json.return_value = {"id": "private_reply_100"}
        elif "app_settings" in url:
            mock_res.status_code = 201
            mock_res.json.return_value = {}
        else:
            mock_res.json.return_value = {}
        return mock_res

    def fake_requests_get(self, url, *args, **kwargs):
        mock_res = MagicMock()
        mock_res.status_code = 200
        if "key=eq.meta_ai_kb" in url:
            val = json.dumps(self.mock_db.get("meta_ai_kb", []))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq.meta_ai_rules" in url:
            val = json.dumps(self.mock_db.get("meta_ai_rules", []))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq.meta_ai_system_prompt" in url:
            val = json.dumps(self.mock_db.get("meta_ai_system_prompt", ""))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq.meta_ai_bot_enabled" in url:
            val = json.dumps(cache.get("bot_enabled", True))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq.meta_ai_approval_mode" in url:
            val = json.dumps(cache.get("approval_mode", "auto"))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq." in url:
            mock_res.json.return_value = []
        else:
            mock_res.json.return_value = []
        return mock_res

    # =========================================================================
    # 1. WEBHOOK VERIFICATION & 4-CHANNEL POST TESTS
    # =========================================================================
    def test_01_webhook_verification_get(self):
        """Test GET /webhook with valid, invalid, and missing parameters."""
        os.environ['VERIFY_TOKEN'] = 'GET'
        # Valid token 'GET'
        res1 = self.client.get('/webhook?hub.mode=subscribe&hub.verify_token=GET&hub.challenge=CHALLENGE_123')
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.data.decode('utf-8'), 'CHALLENGE_123')

        # Invalid verify token
        res_bad = self.client.get('/webhook?hub.mode=subscribe&hub.verify_token=INVALID_TOKEN&hub.challenge=X')
        self.assertEqual(res_bad.status_code, 403)
        self.assertIn('Forbidden', res_bad.data.decode('utf-8'))

        # Missing params
        res_missing = self.client.get('/webhook')
        self.assertEqual(res_missing.status_code, 403)

    def test_02_webhook_post_4_channels(self):
        """Test POST /webhook across FB DM, FB Comment, IG DM, and IG Comment."""
        # 1. FB Messenger DM
        fb_dm_payload = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "fb_user_101"},
                    "message": {"text": "السلام عليكم، ما هي خدماتكم؟"}
                }]
            }]
        }
        r_fb_dm = self.client.post('/webhook', json=fb_dm_payload)
        self.assertEqual(r_fb_dm.status_code, 200)
        self.assertEqual(r_fb_dm.data.decode('utf-8'), "EVENT_RECEIVED")
        self.assertEqual(stats["dms"], 1)

        # 2. FB Feed Comment
        fb_comment_payload = {
            "object": "page",
            "entry": [{
                "changes": [{
                    "field": "feed",
                    "value": {
                        "item": "comment",
                        "verb": "add",
                        "comment_id": "fb_comment_202",
                        "sender_name": "أحمد علي",
                        "message": "كم سعر الخدمة؟"
                    }
                }]
            }]
        }
        r_fb_comment = self.client.post('/webhook', json=fb_comment_payload)
        self.assertEqual(r_fb_comment.status_code, 200)
        self.assertEqual(stats["comments"], 1)

        # 3. IG Direct Message
        ig_dm_payload = {
            "object": "instagram",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "ig_user_303"},
                    "message": {"text": "أريد معلومات عن التسويق"}
                }]
            }]
        }
        r_ig_dm = self.client.post('/webhook', json=ig_dm_payload)
        self.assertEqual(r_ig_dm.status_code, 200)
        self.assertEqual(stats["dms"], 2)

        # 4. IG Feed Comment
        ig_comment_payload = {
            "object": "instagram",
            "entry": [{
                "changes": [{
                    "field": "comments",
                    "value": {
                        "id": "ig_comment_404",
                        "text": "ما هي أسعار الباقات؟",
                        "from": {"id": "ig_user_404", "username": "sara_design"}
                    }
                }]
            }]
        }
        r_ig_comment = self.client.post('/webhook', json=ig_comment_payload)
        self.assertEqual(r_ig_comment.status_code, 200)
        self.assertEqual(stats["comments"], 2)

        # Total counters validation
        self.assertEqual(stats["dms"], 2)
        self.assertEqual(stats["comments"], 2)
        self.assertEqual(stats["ai_calls"], 4)

    # =========================================================================
    # 2. PAUSE MODE TESTS (bot_enabled=False)
    # =========================================================================
    def test_03_pause_mode_behavior(self):
        """Test bot_enabled=False returns BOT_PAUSED 200 OK and does not process events."""
        # Toggle bot off
        r_toggle = self.client.post('/api/toggle', json={"enabled": False})
        self.assertEqual(r_toggle.status_code, 200)
        self.assertFalse(cache["bot_enabled"])

        # Send FB DM during pause
        fb_dm_payload = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "paused_user_1"},
                    "message": {"text": "مرحباً هل أنتم متاحون؟"}
                }]
            }]
        }
        r_paused_dm = self.client.post('/webhook', json=fb_dm_payload)
        self.assertEqual(r_paused_dm.status_code, 200)
        self.assertEqual(r_paused_dm.data.decode('utf-8'), "BOT_PAUSED")

        # Send IG Comment during pause
        ig_comment_payload = {
            "object": "instagram",
            "entry": [{
                "changes": [{
                    "field": "comments",
                    "value": {
                        "id": "paused_comment_1",
                        "text": "بكم السعر؟",
                        "from": {"id": "user_p", "username": "paused_user"}
                    }
                }]
            }]
        }
        r_paused_comment = self.client.post('/webhook', json=ig_comment_payload)
        self.assertEqual(r_paused_comment.status_code, 200)
        self.assertEqual(r_paused_comment.data.decode('utf-8'), "BOT_PAUSED")

        # Verify stats were NOT incremented
        self.assertEqual(stats["dms"], 0)
        self.assertEqual(stats["comments"], 0)
        self.assertEqual(stats["ai_calls"], 0)

        # Unpause and verify recovery
        self.client.post('/api/toggle', json={"enabled": True})
        self.assertTrue(cache["bot_enabled"])
        r_active = self.client.post('/webhook', json=fb_dm_payload)
        self.assertEqual(r_active.status_code, 200)
        self.assertEqual(r_active.data.decode('utf-8'), "EVENT_RECEIVED")
        self.assertEqual(stats["dms"], 1)

    # =========================================================================
    # 3. MANUAL APPROVAL MODE TESTS (approval_mode=manual)
    # =========================================================================
    def test_04_manual_approval_mode_queueing(self):
        """Test approval_mode=manual queues incoming messages to pending_approvals."""
        # Enable manual approval mode
        r_toggle = self.client.post('/api/toggle', json={"approval_mode": "manual"})
        self.assertEqual(r_toggle.status_code, 200)
        self.assertEqual(cache["approval_mode"], "manual")

        # Send DM payload
        dm_payload = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "manual_user_101"},
                    "message": {"text": "السلام عليكم، ما هي خدماتكم؟"}
                }]
            }]
        }
        r_dm = self.client.post('/webhook', json=dm_payload)
        self.assertEqual(r_dm.status_code, 200)

        # Send Comment payload with price trigger
        comment_payload = {
            "object": "page",
            "entry": [{
                "changes": [{
                    "field": "feed",
                    "value": {
                        "item": "comment",
                        "verb": "add",
                        "comment_id": "manual_comment_202",
                        "sender_name": "خالد عمر",
                        "message": "كم سعر باقة التسويق؟"
                    }
                }]
            }]
        }
        r_comment = self.client.post('/webhook', json=comment_payload)
        self.assertEqual(r_comment.status_code, 200)

        # Verify pending_approvals list
        self.assertEqual(len(pending_approvals), 2)
        self.assertEqual(stats["pending"], 2)

        # Verify DM Draft entry
        draft_dm = pending_approvals[0]
        self.assertEqual(draft_dm["type"], "dm")
        self.assertEqual(draft_dm["sender"], "manual_user_101")
        self.assertEqual(draft_dm["target_id"], "manual_user_101")
        self.assertEqual(draft_dm["status"], "pending")
        self.assertIsNotNone(draft_dm["reply"])

        # Verify Comment Draft entry
        draft_comment = pending_approvals[1]
        self.assertEqual(draft_comment["type"], "comment")
        self.assertEqual(draft_comment["sender"], "خالد عمر")
        self.assertEqual(draft_comment["target_id"], "manual_comment_202")
        self.assertEqual(draft_comment["status"], "pending")
        self.assertIsNotNone(draft_comment["reply"])
        self.assertTrue("3000" in draft_comment["private_reply"])

    # =========================================================================
    # 4. REST ENDPOINTS TESTING (/api/toggle, /api/approve, /api/reject, etc.)
    # =========================================================================
    def test_05_rest_api_toggle(self):
        """Test POST /api/toggle for bot_enabled and approval_mode."""
        # Toggle bot off
        res1 = self.client.post('/api/toggle', json={"enabled": False})
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        self.assertTrue(data1["ok"])
        self.assertFalse(data1["bot_enabled"])

        # Toggle approval mode
        res2 = self.client.post('/api/toggle', json={"approval_mode": "manual"})
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertEqual(data2["approval_mode"], "manual")

        # Empty body toggle defaults safely
        res3 = self.client.post('/api/toggle', json={})
        self.assertEqual(res3.status_code, 200)

    def test_06_rest_api_approvals_get_and_approve(self):
        """Test GET /api/approvals and POST /api/approve/<id>."""
        # Queue a draft manually
        draft = {
            "id": 99001,
            "type": "dm",
            "sender": "user_app_1",
            "target_id": "target_app_1",
            "message": "تفاصيل الخدمات",
            "reply": "أهلاً بك! نقدم خدمات التسويق.",
            "private_reply": None,
            "status": "pending",
            "time": "12:00:00"
        }
        pending_approvals.append(draft)

        # GET /api/approvals
        res_get = self.client.get('/api/approvals')
        self.assertEqual(res_get.status_code, 200)
        approvals_list = res_get.get_json()
        self.assertEqual(len(approvals_list), 1)
        self.assertEqual(approvals_list[0]["id"], 99001)

        # POST /api/approve/99001
        res_app = self.client.post('/api/approve/99001', json={})
        self.assertEqual(res_app.status_code, 200)
        data_app = res_app.get_json()
        self.assertTrue(data_app["ok"])
        self.assertEqual(data_app["status"], "approved")

        # Verify draft status in memory updated to approved
        self.assertEqual(draft["status"], "approved")

        # POST /api/approve/ non-existent ID -> 404 Not Found
        res_404 = self.client.post('/api/approve/999999', json={})
        self.assertEqual(res_404.status_code, 404)
        self.assertEqual(res_404.get_json()["error"], "Draft not found")

    def test_07_rest_api_reject(self):
        """Test POST /api/reject/<id>."""
        draft = {
            "id": 88001,
            "type": "comment",
            "sender": "user_rej_1",
            "target_id": "target_rej_1",
            "message": "هل الإعلانات مجانا؟",
            "reply": "لا، ليست مجانية.",
            "private_reply": None,
            "status": "pending",
            "time": "12:05:00"
        }
        pending_approvals.append(draft)

        # Reject draft
        res_rej = self.client.post('/api/reject/88001', json={})
        self.assertEqual(res_rej.status_code, 200)
        data_rej = res_rej.get_json()
        self.assertTrue(data_rej["ok"])
        self.assertEqual(data_rej["status"], "rejected")

        # Verify draft status updated to rejected
        self.assertEqual(draft["status"], "rejected")

    def test_08_rest_api_logs_stream(self):
        """Test GET /api/logs/stream SSE log endpoint."""
        # Add log entry
        server.log_event("dm", "sender_stream", "Hello", "Hi there")

        res_stream = self.client.get('/api/logs/stream')
        self.assertEqual(res_stream.status_code, 200)
        self.assertEqual(res_stream.mimetype, "text/event-stream")

        stream_data = res_stream.data.decode('utf-8')
        self.assertTrue(stream_data.startswith("data: "))
        self.assertIn("sender_stream", stream_data)

    # =========================================================================
    # 5. ADVERSARIAL & FAILURE MODE BOUNDARY TESTS
    # =========================================================================
    def test_09_reject_nonexistent_draft_behavior(self):
        """Rejecting a non-existent draft ID returns HTTP 404 Not Found."""
        res_rej_nonexistent = self.client.post('/api/reject/7777777', json={})
        self.assertEqual(res_rej_nonexistent.status_code, 404)
        self.assertEqual(res_rej_nonexistent.get_json(), {"error": "Draft not found"})

    def test_10_approve_with_custom_override(self):
        """Test overriding reply and private_reply during POST /api/approve/<id>."""
        draft = {
            "id": 55001,
            "type": "comment",
            "sender": "user_override",
            "target_id": "comment_override_id",
            "message": "كم سعر؟",
            "reply": "Original Reply",
            "private_reply": "Original Private Reply",
            "status": "pending",
            "time": "12:10:00"
        }
        pending_approvals.append(draft)

        res_app_override = self.client.post('/api/approve/55001', json={
            "reply": "Custom Approved Public Reply",
            "private_reply": "Custom Approved Private Reply"
        })
        self.assertEqual(res_app_override.status_code, 200)
        self.assertEqual(draft["status"], "approved")


if __name__ == "__main__":
    unittest.main()
