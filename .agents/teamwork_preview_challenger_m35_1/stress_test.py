"""
Empirical Stress & Property Test Suite for Meta AI Social Moderator
Location: .agents/teamwork_preview_challenger_m35_1/stress_test.py
"""

import unittest
import json
import os
import sys
import hmac
import hashlib
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch, MagicMock

# Force root directory into sys.path
PROJECT_ROOT = r"C:\Users\mhmd\meta_ai_moderator"
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import requests
import server
from server import (
    app, VERIFY_TOKEN, generate_reply, search_kb, check_custom_rules,
    send_dm_reply, send_comment_reply, send_private_comment_reply,
    get_kb_data, _call_groq, _call_openrouter,
    verify_signature, activity_log, stats
)


class BaseStressTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

        self.mock_db = {
            "meta_ai_kb": [
                {
                    "id": 1,
                    "question": "ما هي خدمات وكالة دوميا؟",
                    "answer": "نقدم خدمات التسويق الرقمي الشامل وإدارة الحملات."
                }
            ],
            "meta_ai_rules": [
                {
                    "id": 101,
                    "trigger": "سعر",
                    "response": "أهلاً بك! تم الرد في الخاص 📩",
                    "private_response": "أسعار باقاتنا تبدأ من 1000 جنيه مصرية.",
                    "match_type": "contains",
                    "is_active": True
                }
            ],
            "meta_ai_system_prompt": "أنت مساعد خدمة عملاء ذكي لوكالة دوميا للتسويق الرقمي."
        }

        activity_log.clear()
        stats["dms"] = 0
        stats["comments"] = 0
        stats["ai_calls"] = 0
        server.APP_SECRET = ""
        server.GROQ_API_KEY = ""
        server.OPENROUTER_API_KEY = ""

        self.patch_req_post = patch('requests.post', side_effect=self.fake_requests_post)
        self.patch_req_get = patch('requests.get', side_effect=self.fake_requests_get)

        self.mock_post = self.patch_req_post.start()
        self.mock_get = self.patch_req_get.start()

    def tearDown(self):
        patch.stopall()

    def fake_requests_post(self, url, *args, **kwargs):
        mock_res = MagicMock()
        mock_res.status_code = 200
        if "app_settings" in url:
            json_body = kwargs.get("json", {})
            k = json_body.get("key")
            v = json_body.get("value")
            if k:
                try:
                    self.mock_db[k] = json.loads(v)
                except Exception:
                    self.mock_db[k] = v
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
        elif "key=eq." in url:
            key = url.split("key=eq.")[1]
            val = self.mock_db.get(key)
            if val is not None:
                val_str = json.dumps(val) if isinstance(val, (dict, list)) else str(val)
                mock_res.json.return_value = [{"value": val_str}]
            else:
                mock_res.json.return_value = []
        else:
            mock_res.json.return_value = []
        return mock_res


# ==============================================================================
# CATEGORY 1: MALFORMED WEBHOOK PAYLOADS & UNEXPECTED TYPES
# ==============================================================================
class TestMalformedWebhooksAndTypes(BaseStressTestCase):

    def test_fb_messenger_sender_is_string(self):
        """Stress: sender is string instead of dict. Target line 570: msg_event.get('sender', {}).get('id')"""
        payload = {
            "object": "page",
            "entry": [
                {
                    "messaging": [
                        {
                            "sender": "user_id_string_not_dict",
                            "message": {"text": "مرحبا"}
                        }
                    ]
                }
            ]
        }
        # Expecting server not to crash with 500 AttributeError
        response = self.client.post('/webhook', json=payload)
        self.assertEqual(response.status_code, 200, "Server crashed with 500 when sender is string")

    def test_fb_messenger_sender_is_int(self):
        """Stress: sender is int instead of dict."""
        payload = {
            "object": "page",
            "entry": [
                {
                    "messaging": [
                        {
                            "sender": 123456789,
                            "message": {"text": "مرحبا"}
                        }
                    ]
                }
            ]
        }
        response = self.client.post('/webhook', json=payload)
        self.assertEqual(response.status_code, 200, "Server crashed with 500 when sender is int")

    def test_fb_comment_from_is_string(self):
        """Stress: from in comment change is string instead of dict. Target line 597: val.get('from', {}).get('name')"""
        payload = {
            "object": "page",
            "entry": [
                {
                    "changes": [
                        {
                            "field": "feed",
                            "value": {
                                "item": "comment",
                                "verb": "add",
                                "comment_id": "c_123",
                                "message": "تعليق تجريبي",
                                "from": "sender_name_as_string_not_dict"
                            }
                        }
                    ]
                }
            ]
        }
        response = self.client.post('/webhook', json=payload)
        self.assertEqual(response.status_code, 200, "Server crashed with 500 when from is string")

    def test_fb_comment_from_is_int(self):
        """Stress: from in comment change is int instead of dict."""
        payload = {
            "object": "page",
            "entry": [
                {
                    "changes": [
                        {
                            "field": "feed",
                            "value": {
                                "item": "comment",
                                "verb": "add",
                                "comment_id": "c_123",
                                "message": "تعليق تجريبي",
                                "from": 987654
                            }
                        }
                    ]
                }
            ]
        }
        response = self.client.post('/webhook', json=payload)
        self.assertEqual(response.status_code, 200, "Server crashed with 500 when from is int")

    def test_ig_dm_messaging_not_list(self):
        """Stress: messaging field is string or dict instead of list."""
        payload = {
            "object": "instagram",
            "entry": [{"messaging": "not_a_list"}]
        }
        response = self.client.post('/webhook', json=payload)
        self.assertEqual(response.status_code, 200)

    def test_ig_comment_changes_not_list(self):
        """Stress: changes field is dict instead of list."""
        payload = {
            "object": "instagram",
            "entry": [{"changes": {"field": "comments"}}]
        }
        response = self.client.post('/webhook', json=payload)
        self.assertEqual(response.status_code, 200)

    def test_webhook_non_dict_json_primitives(self):
        """Stress: JSON body is integer 42, string, boolean, list, null."""
        for val in [42, "just_a_string", True, False, [1, 2, 3], None]:
            response = self.client.post('/webhook', data=json.dumps(val), content_type='application/json')
            self.assertEqual(response.status_code, 200, f"Failed on JSON primitive: {val}")

    def test_webhook_nested_nulls(self):
        """Stress: Deeply nested null values."""
        payload = {
            "object": None,
            "entry": [
                None,
                {
                    "messaging": [None, {"sender": None, "message": None}],
                    "changes": [None, {"field": None, "value": None}]
                }
            ]
        }
        response = self.client.post('/webhook', json=payload)
        self.assertEqual(response.status_code, 200)

    def test_webhook_missing_headers_and_invalid_signatures(self):
        """Stress: Header variations."""
        server.APP_SECRET = "secret"
        res1 = self.client.post('/webhook', data=b'{}', headers={"X-Hub-Signature-256": "sha256="})
        self.assertEqual(res1.status_code, 403)

        res2 = self.client.post('/webhook', data=b'{}', headers={"X-Hub-Signature-256": "invalid_format"})
        self.assertEqual(res2.status_code, 403)


# ==============================================================================
# CATEGORY 2: API ENDPOINTS NON-DICT PRIMITIVES & DB CORRUPTION
# ==============================================================================
class TestApiPrimitivesAndDbCorruption(BaseStressTestCase):

    def test_api_kb_post_primitive_int(self):
        """Stress: POST /api/kb with JSON integer 42. Target line: data or {} where 42 is truthy!"""
        response = self.client.post('/api/kb', data=json.dumps(42), content_type='application/json')
        self.assertEqual(response.status_code, 200, "POST /api/kb crashed with 500 when payload is integer 42")

    def test_api_rules_post_primitive_int(self):
        """Stress: POST /api/rules with JSON integer 100."""
        response = self.client.post('/api/rules', data=json.dumps(100), content_type='application/json')
        self.assertEqual(response.status_code, 200, "POST /api/rules crashed with 500 when payload is integer 100")

    def test_api_prompt_post_primitive_int(self):
        """Stress: POST /api/prompt with JSON integer 999."""
        response = self.client.post('/api/prompt', data=json.dumps(999), content_type='application/json')
        self.assertEqual(response.status_code, 200, "POST /api/prompt crashed with 500 when payload is integer 999")

    def test_api_kb_put_primitive_int(self):
        """Stress: PUT /api/kb/1 with JSON integer 123."""
        response = self.client.put('/api/kb/1', data=json.dumps(123), content_type='application/json')
        self.assertIn(response.status_code, [200, 400, 404], "PUT /api/kb/1 crashed with 500 when payload is int")

    def test_api_rules_put_primitive_int(self):
        """Stress: PUT /api/rules/101 with JSON list [1, 2]."""
        response = self.client.put('/api/rules/101', data=json.dumps([1, 2]), content_type='application/json')
        self.assertIn(response.status_code, [200, 400, 404], "PUT /api/rules/101 crashed with 500 when payload is list")

    def test_kb_item_with_none_fields(self):
        """Stress: Search KB when KB item has question=None or answer=None. Target line 118: NoneType + str"""
        self.mock_db["meta_ai_kb"] = [
            {"id": 10, "question": None, "answer": "إجابة فقط"},
            {"id": 11, "question": "سؤال فقط", "answer": None},
            {"id": 12, "question": 12345, "answer": 67890}
        ]
        try:
            res = search_kb("سؤال")
            self.assertTrue(isinstance(res, str))
        except TypeError as e:
            self.fail(f"search_kb raised TypeError on None/int KB fields: {e}")

    def test_rules_with_non_dict_rule(self):
        """Stress: Rule list in DB contains non-dict elements (None, 123, 'str'). Target line 134"""
        self.mock_db["meta_ai_rules"] = [
            None,
            123,
            "rule_string",
            {"id": 1, "trigger": "سعر", "response": "OK"}
        ]
        try:
            res = check_custom_rules("كم سعر الخدمة؟")
            self.assertIsNotNone(res)
        except AttributeError as e:
            self.fail(f"check_custom_rules raised AttributeError on non-dict rules: {e}")


# ==============================================================================
# CATEGORY 3: CONCURRENCY & RACES
# ==============================================================================
class TestConcurrencyAndRaces(BaseStressTestCase):

    def test_rapid_concurrent_api_updates(self):
        """Stress: Concurrent updates to /api/rules, /api/kb, and /api/prompt across multiple threads."""
        success_count = [0]
        errors = []

        def worker(i):
            client = app.test_client()
            try:
                # 1. POST Rule
                r1 = client.post('/api/rules', json={"trigger": f"trig_{i}", "response": f"resp_{i}"})
                # 2. POST KB
                r2 = client.post('/api/kb', json={"q": f"q_{i}", "a": f"a_{i}"})
                # 3. POST Prompt
                r3 = client.post('/api/prompt', json={"prompt": f"prompt_{i}"})
                if r1.status_code == 200 and r2.status_code == 200 and r3.status_code == 200:
                    success_count[0] += 1
            except Exception as e:
                errors.append(str(e))

        threads = []
        for i in range(20):
            t = threading.Thread(target=worker, args=(i,))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Thread errors encountered: {errors}")
        self.assertEqual(success_count[0], 20, f"Expected 20 successful concurrent updates, got {success_count[0]}")

    def test_rapid_concurrent_webhook_events(self):
        """Stress: 30 concurrent webhook requests logging activity and updating stats."""
        errors = []

        def worker(i):
            client = app.test_client()
            payload = {
                "object": "page",
                "entry": [
                    {
                        "messaging": [
                            {
                                "sender": {"id": f"user_concurrent_{i}"},
                                "message": {"text": f"رسالة {i}"}
                            }
                        ]
                    }
                ]
            }
            try:
                res = client.post('/webhook', json=payload)
                if res.status_code != 200:
                    errors.append(f"Status {res.status_code}")
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(30)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Concurrent webhook errors: {errors}")
        self.assertEqual(stats["dms"], 30)
        self.assertTrue(len(activity_log) <= 50)


# ==============================================================================
# CATEGORY 4: SSE STREAM LIFECYCLE & UTF-8 ENCODING
# ==============================================================================
class TestSseStreamLifecycle(BaseStressTestCase):

    def test_sse_stream_utf8_and_formatting(self):
        """Stress: GET /api/logs/stream with complex UTF-8 characters and emojis in activity log."""
        server.log_event("dm", "مستخدم_عربي_🔥", "سؤال مع إيموجي 🤖✨", "رد عربي رائع!")

        response = self.client.get('/api/logs/stream')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'text/event-stream')

        data_str = response.data.decode('utf-8')
        self.assertTrue(data_str.startswith("data: "))
        self.assertIn("مستخدم_عربي_🔥", data_str)
        self.assertIn("🤖✨", data_str)

        # Parse SSE JSON
        json_payload = data_str.replace("data: ", "").strip()
        parsed = json.loads(json_payload)
        self.assertEqual(parsed["type"], "init")
        self.assertTrue(isinstance(parsed["log"], list))


# ==============================================================================
# CATEGORY 5: EMOJIS, SPECIAL CHARACTERS & ADVERSARIAL PAYLOADS
# ==============================================================================
class TestEmojisAndAdversarialPayloads(BaseStressTestCase):

    def test_emojis_and_non_ascii_comments_and_dms(self):
        """Stress: Emojis, Arabic diacritics, CJK, RTL in DM and comment payloads."""
        complex_texts = [
            "🔥🚀🤖 مرحبا بك في وكالة دوميا!",
            "خِدْمَاتُ التَّسْوِيقِ الرَّقَمِيِّ",
            "日本語のテストコメント",
            "العربية \u200f (RTL mark) and mixed ENGLISH 123",
            "Emoji combinations 👨‍👩‍👧‍👦 🏳️‍🌈 🇺🇸 🇸🇦"
        ]

        for text in complex_texts:
            # Test in simulator
            sim_res = self.client.post('/api/simulate', json={"message": text})
            self.assertEqual(sim_res.status_code, 200)
            self.assertIn("reply", sim_res.get_json())

            # Test in FB DM
            dm_payload = {
                "object": "page",
                "entry": [{"messaging": [{"sender": {"id": "u1"}, "message": {"text": text}}]}]
            }
            res_dm = self.client.post('/webhook', json=dm_payload)
            self.assertEqual(res_dm.status_code, 200)

    def test_adversarial_injection_and_huge_payloads(self):
        """Stress: SQL Injection, XSS, Control Characters, Large Strings (100KB)."""
        adversarial_inputs = [
            "' OR '1'='1' -- DROP TABLE users;",
            "<script>alert('xss');</script><iframe src='javascript:alert(1)'></iframe>",
            "Null Byte test \x00 middle of string",
            "Control chars \x01\x02\x03\x04\x05\x06\x07\x08\x0b\x0c\x0e\x0f",
            "A" * 100000  # 100 KB text
        ]

        for text in adversarial_inputs:
            sim_res = self.client.post('/api/simulate', json={"message": text})
            self.assertEqual(sim_res.status_code, 200)
            self.assertIn("reply", sim_res.get_json())


if __name__ == '__main__':
    unittest.main()
