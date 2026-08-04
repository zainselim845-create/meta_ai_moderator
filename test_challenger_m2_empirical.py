"""
Challenger 1 M2 Empirical Stress & Adversarial Validation Suite
Target: server.py (Meta AI Social Moderator)

Verifies:
1. Deduplication Stress Test (high-volume duplicates across DMs & Comments)
2. Direct URL Link Extraction Test (FB posts, permalinks, watch, IG posts, reels)
3. Re-generate Draft Test (POST /api/regenerate_draft across tones: concise, friendly, detailed, مختصر, ودي)
4. REST 404 Check (POST /api/reject/non_existent_id)
5. System Control Validation (bot_enabled=False -> BOT_PAUSED, approval_mode=manual -> pending_approvals queue)
"""

import unittest
import json
import time
from unittest.mock import patch, MagicMock

import server
from server import (
    app, stats, activity_log, pending_approvals, cache, processed_events,
    extract_post_id_from_url, check_custom_rules, generate_reply
)


class TestChallengerM2Empirical(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

        self.mock_db = {
            "meta_ai_kb": [
                {
                    "id": 1,
                    "question": "ما هي خدمات وكالة دوميا؟",
                    "answer": "نقدم خدمات التسويق الرقمي وإدارة الحملات الإعلانية."
                }
            ],
            "meta_ai_rules": [
                {
                    "id": 101,
                    "trigger": "سعر",
                    "post_id": "123456",
                    "response": "تم الرد بخصوص منشور فيسبوك! 📩",
                    "private_response": "سعر الباقة للمنشور 123456 هو 3000ج.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 102,
                    "trigger": "خصم",
                    "post_id": "987654",
                    "response": "تم الرد بخصوص الرابط 987654! 📩",
                    "private_response": "خصم 20% على هذا الرابط.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 103,
                    "trigger": "فيديو",
                    "post_id": "112233",
                    "response": "تم الرد بخصوص الفيديو! 📹",
                    "private_response": "تفاصيل الفيديو 112233.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 104,
                    "trigger": "انستا",
                    "post_id": "Cx123",
                    "response": "تم الرد بخصوص بوست انستجرام! 📸",
                    "private_response": "تفاصيل بوست انستجرام.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 105,
                    "trigger": "ريلز",
                    "post_id": "Ry456",
                    "response": "تم الرد بخصوص ريلز انستجرام! 🎬",
                    "private_response": "تفاصيل ريلز انستجرام.",
                    "match_type": "contains",
                    "is_active": True
                }
            ],
            "meta_ai_system_prompt": "أنت مساعد خدمة عملاء ذكي لوكالة دوميا للتسويق الرقمي."
        }

        # Reset global state
        activity_log.clear()
        processed_events.clear()
        pending_approvals.clear()
        stats["dms"] = 0
        stats["comments"] = 0
        stats["ai_calls"] = 0
        stats["pending"] = 0
        cache["bot_enabled"] = True
        cache["approval_mode"] = "auto"
        server.APP_SECRET = ""
        server.GROQ_API_KEY = ""
        server.OPENROUTER_API_KEY = ""

        # Patch external HTTP calls
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
                "choices": [{"message": {"content": "تم توليد الرد بالذكاء الاصطناعي."}}]
            }
        elif "/me/messages" in url or "/comments" in url or "/private_replies" in url:
            mock_res.json.return_value = {"id": "mock_meta_id"}
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
        else:
            mock_res.json.return_value = []
        return mock_res

    # =========================================================================
    # 1. DEDUPLICATION STRESS TEST
    # =========================================================================
    def test_deduplication_stress_dm_and_comment(self):
        """
        Send multiple webhooks with identical message_id or comment_id.
        Verify only the first is processed, while subsequent ones return {"status": "already_processed"} with 200 OK.
        """
        dm_event_id = "mid_dup_test_10001"
        dm_payload = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "user_dup_1"},
                    "message": {"mid": dm_event_id, "text": "مرحباً، ما هي خدماتكم؟"}
                }]
            }]
        }

        # First request -> expected processed
        res1 = self.client.post('/webhook', json=dm_payload)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.data.decode('utf-8'), "EVENT_RECEIVED")
        self.assertEqual(stats["dms"], 1)

        # Subsequent 10 duplicate requests -> expected already_processed
        for i in range(10):
            res_dup = self.client.post('/webhook', json=dm_payload)
            self.assertEqual(res_dup.status_code, 200)
            data = res_dup.get_json()
            self.assertEqual(data, {"status": "already_processed"})

        # Verify stats["dms"] remained 1
        self.assertEqual(stats["dms"], 1)

        # Comment deduplication test
        comment_id = "comment_dup_test_20002"
        comment_payload = {
            "object": "page",
            "entry": [{
                "changes": [{
                    "field": "feed",
                    "value": {
                        "item": "comment",
                        "verb": "add",
                        "comment_id": comment_id,
                        "sender_name": "سامي",
                        "message": "كم السعر؟"
                    }
                }]
            }]
        }

        res_c1 = self.client.post('/webhook', json=comment_payload)
        self.assertEqual(res_c1.status_code, 200)
        self.assertEqual(res_c1.data.decode('utf-8'), "EVENT_RECEIVED")
        self.assertEqual(stats["comments"], 1)

        for i in range(10):
            res_c_dup = self.client.post('/webhook', json=comment_payload)
            self.assertEqual(res_c_dup.status_code, 200)
            self.assertEqual(res_c_dup.get_json(), {"status": "already_processed"})

        self.assertEqual(stats["comments"], 1)

    # =========================================================================
    # 2. DIRECT URL LINK EXTRACTION TEST
    # =========================================================================
    def test_direct_url_link_extraction_all_formats(self):
        """
        Send FB post URLs:
          - facebook.com/.../posts/123456
          - facebook.com/permalink.php?story_fbid=987654
          - facebook.com/watch/?v=112233
        And IG URLs:
          - instagram.com/p/Cx123/
          - instagram.com/reel/Ry456/
        Verify post-specific rules trigger accurately.
        """
        urls_and_triggers = [
            ("https://facebook.com/myagency/posts/123456", "سعر الباقة في هذا الرابط", "123456", "تم الرد بخصوص منشور فيسبوك! 📩"),
            ("https://facebook.com/permalink.php?story_fbid=987654", "هل يوجد خصم هنا؟", "987654", "تم الرد بخصوص الرابط 987654! 📩"),
            ("https://facebook.com/watch/?v=112233", "شاهدت فيديو رائع", "112233", "تم الرد بخصوص الفيديو! 📹"),
            ("https://instagram.com/p/Cx123/", "استفسار عن انستا", "Cx123", "تم الرد بخصوص بوست انستجرام! 📸"),
            ("https://instagram.com/reel/Ry456/", "أعجبني هذا ريلز", "Ry456", "تم الرد بخصوص ريلز انستجرام! 🎬")
        ]

        for url, msg_text, expected_post_id, expected_response in urls_and_triggers:
            extracted_id = extract_post_id_from_url(url)
            self.assertEqual(extracted_id, expected_post_id, f"Extraction failed for URL: {url}")

            full_msg = f"{msg_text} {url}"
            rule = check_custom_rules(full_msg)
            self.assertIsNotNone(rule, f"Rule match failed for message with URL: {url}")
            self.assertEqual(rule["response"], expected_response, f"Response mismatch for URL: {url}")

        # Verify mismatched post ID does not trigger post-specific rule
        mismatched_msg = "سعر الخدمة على الرابط https://facebook.com/myagency/posts/999999"
        rule_mismatch = check_custom_rules(mismatched_msg)
        self.assertIsNone(rule_mismatch, "Mismatched post_id should not trigger post-specific rule 101")

    # =========================================================================
    # 3. RE-GENERATE DRAFT TEST
    # =========================================================================
    def test_regenerate_draft_various_tones(self):
        """
        Invoke POST /api/regenerate_draft with various tone parameters:
          "concise", "friendly", "detailed", "مختصر", "ودي"
        Verify prompt adjustment and response formatting.
        """
        tones_to_test = ["concise", "friendly", "detailed", "مختصر", "ودي"]

        for tone in tones_to_test:
            res = self.client.post('/api/regenerate_draft', json={
                "message": "ما هي خدمات وكالة دوميا للتسويق؟",
                "tone": tone,
                "platform": "facebook"
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data["status"], "success")
            self.assertEqual(data["tone"], tone)
            self.assertIn("draft", data)
            self.assertIn("reply", data)
            self.assertTrue(len(data["draft"]) > 0)

        # Test draft regeneration using a pending draft_id
        pending_draft = {
            "id": 77100,
            "type": "dm",
            "sender": "user_regen_1",
            "target_id": "target_regen_1",
            "message": "تفاصيل باقة التسويق",
            "reply": "Draft initial reply",
            "private_reply": None,
            "status": "pending",
            "time": "14:00:00"
        }
        pending_approvals.append(pending_draft)

        res_by_id = self.client.post('/api/regenerate_draft', json={
            "draft_id": 77100,
            "tone": "detailed"
        })
        self.assertEqual(res_by_id.status_code, 200)
        data_by_id = res_by_id.get_json()
        self.assertEqual(data_by_id["status"], "success")
        self.assertEqual(data_by_id["tone"], "detailed")

    # =========================================================================
    # 4. REST 404 CHECK
    # =========================================================================
    def test_rest_reject_non_existent_id_404(self):
        """
        Call POST /api/reject/non_existent_id (e.g. 99999999) and confirm HTTP 404 status.
        """
        res = self.client.post('/api/reject/99999999', json={})
        self.assertEqual(res.status_code, 404)
        data = res.get_json()
        self.assertEqual(data, {"error": "Draft not found"})

        # Also verify approve non-existent ID returns 404
        res_app = self.client.post('/api/approve/99999999', json={})
        self.assertEqual(res_app.status_code, 404)
        self.assertEqual(res_app.get_json(), {"error": "Draft not found"})

    # =========================================================================
    # 5. SYSTEM CONTROL VALIDATION
    # =========================================================================
    def test_system_control_bot_disabled_and_manual_approval(self):
        """
        Verify:
        - bot_enabled=False yields BOT_PAUSED (200 OK)
        - approval_mode=manual routes incoming items to pending_approvals
        """
        # 1. bot_enabled=False
        self.client.post('/api/toggle', json={"enabled": False})
        self.assertFalse(cache["bot_enabled"])

        payload_paused = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "paused_user_99"},
                    "message": {"text": "السلام عليكم"}
                }]
            }]
        }
        res_paused = self.client.post('/webhook', json=payload_paused)
        self.assertEqual(res_paused.status_code, 200)
        self.assertEqual(res_paused.data.decode('utf-8'), "BOT_PAUSED")

        # 2. bot_enabled=True, approval_mode=manual
        self.client.post('/api/toggle', json={"enabled": True, "approval_mode": "manual"})
        self.assertTrue(cache["bot_enabled"])
        self.assertEqual(cache["approval_mode"], "manual")

        payload_manual = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "manual_user_88"},
                    "message": {"text": "أريد حجز استشارة تسويقية"}
                }]
            }]
        }
        res_manual = self.client.post('/webhook', json=payload_manual)
        self.assertEqual(res_manual.status_code, 200)
        self.assertEqual(res_manual.data.decode('utf-8'), "EVENT_RECEIVED")

        # Check pending_approvals list
        self.assertEqual(len(pending_approvals), 1)
        draft = pending_approvals[0]
        self.assertEqual(draft["sender"], "manual_user_88")
        self.assertEqual(draft["status"], "pending")
        self.assertEqual(draft["message"], "أريد حجز استشارة تسويقية")


if __name__ == '__main__':
    unittest.main()
