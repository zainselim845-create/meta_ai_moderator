"""
Empirical Stress Test Runner for Challenger Subagent (m35_1)
Target: server.py
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
import unittest
import json
import time

from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch, MagicMock

import server
from server import (
    app, stats, activity_log, pending_approvals, cache, processed_events,
    extract_post_id_from_url, check_custom_rules, generate_reply
)

class TestEmpiricalChallengerM35(unittest.TestCase):

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
                    "private_response": "سعر الباقة 3000ج.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 102,
                    "trigger": "خصم",
                    "post_id": "987654",
                    "response": "تم الرد بخصوص الرابط 987654! 📩",
                    "private_response": "خصم 20%.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 103,
                    "trigger": "فيديو",
                    "post_id": "112233",
                    "response": "تم الرد بخصوص الفيديو! 📹",
                    "private_response": "تفاصيل الفيديو.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 104,
                    "trigger": "صورة",
                    "post_id": "554433",
                    "response": "تم الرد بخصوص الصورة! 📷",
                    "private_response": "تفاصيل الصورة.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 105,
                    "trigger": "انستا",
                    "post_id": "Cx123",
                    "response": "تم الرد بخصوص بوست انستجرام! 📸",
                    "private_response": "تفاصيل انستجرام.",
                    "match_type": "contains",
                    "is_active": True
                },
                {
                    "id": 106,
                    "trigger": "ريلز",
                    "post_id": "Ry456",
                    "response": "تم الرد بخصوص ريلز انستجرام! 🎬",
                    "private_response": "تفاصيل ريلز.",
                    "match_type": "contains",
                    "is_active": True
                }
            ],
            "meta_ai_system_prompt": "أنت مساعد خدمة عملاء ذكي لوكالة دوميا للتسويق الرقمي."
        }

        # Reset state
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

    # -------------------------------------------------------------------------
    # 1. Deduplication Cache Stress (Concurrent execution)
    # -------------------------------------------------------------------------
    def test_concurrent_deduplication_stress(self):
        print("\n[STRESS TEST 1] Running Concurrent Deduplication Stress Test...")
        dm_event_id = "mid_concurrent_stress_1001"
        dm_payload = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "concurrent_user_1"},
                    "message": {"mid": dm_event_id, "text": "مرحباً، رسالة مكررة بالتزامن"}
                }]
            }]
        }

        # Send 50 concurrent requests with exact same DM mid
        responses_dm = []
        def send_dm():
            return self.client.post('/webhook', json=dm_payload)

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(send_dm) for _ in range(50)]
            responses_dm = [f.result() for f in futures]

        processed_count_dm = sum(1 for r in responses_dm if r.data.decode('utf-8') == "EVENT_RECEIVED")
        already_processed_count_dm = sum(1 for r in responses_dm if r.get_json() == {"status": "already_processed"})

        print(f"DM Concurrent Results: EVENT_RECEIVED={processed_count_dm}, already_processed={already_processed_count_dm}, stats['dms']={stats['dms']}")
        self.assertEqual(processed_count_dm, 1)
        self.assertEqual(already_processed_count_dm, 49)
        self.assertEqual(stats["dms"], 1)

        # Send 50 concurrent requests with exact same Comment comment_id
        comment_id = "comment_concurrent_stress_2002"
        comment_payload = {
            "object": "page",
            "entry": [{
                "changes": [{
                    "field": "feed",
                    "value": {
                        "item": "comment",
                        "verb": "add",
                        "comment_id": comment_id,
                        "sender_name": "مستخدم مكرر",
                        "message": "تعليق مكرر بالتزامن"
                    }
                }]
            }]
        }

        def send_comment():
            return self.client.post('/webhook', json=comment_payload)

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(send_comment) for _ in range(50)]
            responses_comment = [f.result() for f in futures]

        processed_count_c = sum(1 for r in responses_comment if r.data.decode('utf-8') == "EVENT_RECEIVED")
        already_processed_count_c = sum(1 for r in responses_comment if r.get_json() == {"status": "already_processed"})

        print(f"Comment Concurrent Results: EVENT_RECEIVED={processed_count_c}, already_processed={already_processed_count_c}, stats['comments']={stats['comments']}")
        self.assertEqual(processed_count_c, 1)
        self.assertEqual(already_processed_count_c, 49)
        self.assertEqual(stats["comments"], 1)

    # -------------------------------------------------------------------------
    # 2. Direct URL Link Extraction (All 6 Patterns)
    # -------------------------------------------------------------------------
    def test_direct_url_link_extraction_all_6_patterns(self):
        print("\n[STRESS TEST 2] Testing Direct URL Extraction across all 6 patterns...")
        patterns_test_cases = [
            ("posts/", "https://facebook.com/myagency/posts/123456", "سعر الخدمة على المنشور", "123456", "تم الرد بخصوص منشور فيسبوك! 📩"),
            ("permalink.php", "https://facebook.com/permalink.php?story_fbid=987654", "هل يوجد خصم في هذا الرابط", "987654", "تم الرد بخصوص الرابط 987654! 📩"),
            ("watch/", "https://facebook.com/watch/?v=112233", "فيديو توضيحي للخدمة", "112233", "تم الرد بخصوص الفيديو! 📹"),
            ("photo.php", "https://facebook.com/photo.php?fbid=554433", "صورة العمل السابقة", "554433", "تم الرد بخصوص الصورة! 📷"),
            ("/p/", "https://instagram.com/p/Cx123/", "بوست انستا مميز", "Cx123", "تم الرد بخصوص بوست انستجرام! 📸"),
            ("/reel/", "https://instagram.com/reel/Ry456/", "ريلز انستجرام جديد", "Ry456", "تم الرد بخصوص ريلز انستجرام! 🎬")
        ]

        for pattern_name, url, msg_text, expected_id, expected_rule_resp in patterns_test_cases:
            extracted_id = extract_post_id_from_url(url)
            self.assertEqual(extracted_id, expected_id, f"Failed pattern extraction for pattern '{pattern_name}': expected {expected_id}, got {extracted_id}")
            print(f"✓ Pattern '{pattern_name}': URL '{url}' -> Extracted ID '{extracted_id}'")

            full_msg = f"{msg_text} {url}"
            matched_rule = check_custom_rules(full_msg)
            self.assertIsNotNone(matched_rule, f"Rule matching failed for pattern '{pattern_name}' with full message '{full_msg}'")
            self.assertEqual(matched_rule["response"], expected_rule_resp)
            print(f"  ✓ Matched rule ID {matched_rule['id']} with response '{expected_rule_resp}'")

    # -------------------------------------------------------------------------
    # 3. Tone Regeneration Test
    # -------------------------------------------------------------------------
    def test_tone_regeneration_variations(self):
        print("\n[STRESS TEST 3] Testing Tone Regeneration Endpoint...")
        tones = ["concise", "friendly", "detailed", "مختصر", "ودي", "تفصيلي"]

        for tone in tones:
            res = self.client.post('/api/regenerate_draft', json={
                "message": "كيف استطيع الاستفادة من خدمات التسويق لدى وكالة دوميا؟",
                "tone": tone,
                "platform": "facebook"
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data["status"], "success")
            self.assertEqual(data["tone"], tone)
            self.assertTrue(len(data["draft"]) > 0)
            print(f"✓ Tone '{tone}': Draft response length = {len(data['draft'])} chars -> '{data['draft'][:40]}...'")

    # -------------------------------------------------------------------------
    # 4. Control Matrix State Transitions Stress
    # -------------------------------------------------------------------------
    def test_control_matrix_state_transitions(self):
        print("\n[STRESS TEST 4] Testing Control Matrix State Transitions...")
        
        # Matrix Step 1: bot_enabled=False, approval_mode=auto
        self.client.post('/api/toggle', json={"enabled": False, "approval_mode": "auto"})
        self.assertFalse(cache["bot_enabled"])
        
        res1 = self.client.post('/webhook', json={
            "object": "page",
            "entry": [{"messaging": [{"sender": {"id": "ctrl_user_1"}, "message": {"mid": "m_c1", "text": "test"}}]}]
        })
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.data.decode('utf-8'), "BOT_PAUSED")
        print("✓ Matrix (bot_enabled=False): Returned BOT_PAUSED")

        # Matrix Step 2: bot_enabled=True, approval_mode=manual
        self.client.post('/api/toggle', json={"enabled": True, "approval_mode": "manual"})
        self.assertTrue(cache["bot_enabled"])
        self.assertEqual(cache["approval_mode"], "manual")

        res2 = self.client.post('/webhook', json={
            "object": "page",
            "entry": [{"messaging": [{"sender": {"id": "ctrl_user_2"}, "message": {"mid": "m_c2", "text": "أريد حجز باقة"}}]}]
        })
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.data.decode('utf-8'), "EVENT_RECEIVED")
        self.assertEqual(len(pending_approvals), 1)
        draft = pending_approvals[0]
        self.assertEqual(draft["sender"], "ctrl_user_2")
        print("✓ Matrix (approval_mode=manual): Item successfully queued to pending_approvals")

        # Matrix Step 3: Approve pending draft
        res_approve = self.client.post(f"/api/approve/{draft['id']}", json={})
        self.assertEqual(res_approve.status_code, 200)
        self.assertEqual(draft["status"], "approved")
        print("✓ Matrix (api_approve): Draft status updated to approved")

        # Matrix Step 4: Reject invalid draft ID (404 test)
        res_reject_404 = self.client.post("/api/reject/99999999", json={})
        self.assertEqual(res_reject_404.status_code, 404)
        print("✓ Matrix (api_reject 404): Returned status 404 for non-existent draft ID")

if __name__ == '__main__':
    unittest.main()
