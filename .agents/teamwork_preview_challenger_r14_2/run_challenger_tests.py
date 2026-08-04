"""
Challenger 2 Empirical Verification Suite
Location: .agents/teamwork_preview_challenger_r14_2/run_challenger_tests.py
"""

import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock
import requests

# Ensure project root is in path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import server
from server import (
    app, search_kb, check_custom_rules, generate_reply,
    _call_groq, _call_openrouter, verify_signature,
    activity_log, stats
)


class Challenger2EmpiricalTests(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

        # Default Mock Database
        self.mock_db = {
            "meta_ai_kb": [
                {
                    "id": 1,
                    "question": "ما هي خدمات وكالة دوميا للتسويق الرقمي؟",
                    "answer": "تقدم وكالة دوميا خدمات تسويق رقمي شاملة: إدارة صفحات التواصل، إعلانات ممولة، صناعة المحتوى، وتطوير بوتات الذكاء الاصطناعي AI."
                },
                {
                    "id": 2,
                    "question": "كم سعر باقات التسويق وإدارة الصفحات؟",
                    "answer": "تبدأ باقات إدارة الصفحات من 3000 ج.م/شهرياً، الباقة الاحترافية 6000 ج.م/شهرياً."
                },
                {
                    "id": 3,
                    "question": "خدمات تصميم واجهات المستخدم UI والغرافيك؟",
                    "answer": "نوفر خدمات تصميم واجهات المستخدم UI وهويات البصرية وتصميمات الميديا."
                },
                {
                    "id": 4,
                    "question": "تواصل معنا عبر DM الرسائل المباشرة؟",
                    "answer": "يمكنكم إرسال رسالة مباشرة DM عبر فيسبوك أو إنستجرام للرد الفوري."
                }
            ],
            "meta_ai_rules": [
                {
                    "id": 1,
                    "trigger": "سعر",
                    "match_type": "contains",
                    "response": "تم الرد في الخاص! 📩",
                    "private_response": "تبدأ باقاتنا من 3000 جنيه مصري شهرياً.",
                    "is_active": True
                }
            ],
            "meta_ai_system_prompt": "أنت مساعد خدمة عملاء ذكي لوكالة دوميا للتسويق الرقمي."
        }

        # Reset server cache & state
        server.cache["kb"] = list(self.mock_db["meta_ai_kb"])
        server.cache["rules"] = list(self.mock_db["meta_ai_rules"])
        server.cache["prompt"] = self.mock_db["meta_ai_system_prompt"]
        server.cache["bot_enabled"] = True
        server.cache["approval_mode"] = "auto"

        server.GROQ_API_KEY = "dummy_groq_key"
        server.OPENROUTER_API_KEY = "dummy_openrouter_key"
        server.APP_SECRET = ""
        server.pending_approvals.clear()
        stats["dms"] = 0
        stats["comments"] = 0
        stats["ai_calls"] = 0
        stats["pending"] = 0
        activity_log.clear()

        # Mock Supabase get_setting calls
        self.patch_get = patch('requests.get', side_effect=self.fake_get)
        self.patch_post = patch('requests.post', side_effect=self.fake_post)
        self.mock_get = self.patch_get.start()
        self.mock_post = self.patch_post.start()

    def tearDown(self):
        patch.stopall()

    def fake_get(self, url, *args, **kwargs):
        mock_res = MagicMock()
        mock_res.status_code = 200
        if "key=eq.meta_ai_kb" in url:
            val = json.dumps(server.cache.get("kb", []))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq.meta_ai_rules" in url:
            val = json.dumps(server.cache.get("rules", []))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq.meta_ai_system_prompt" in url:
            val = json.dumps(server.cache.get("prompt", ""))
            mock_res.json.return_value = [{"value": val}]
        else:
            mock_res.json.return_value = []
        return mock_res

    def fake_post(self, url, *args, **kwargs):
        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {"ok": True}
        return mock_res

    # =========================================================================
    # TASK 1: RAG KEYWORD SEARCH WITH SHORT 2-LETTER QUERIES
    # =========================================================================
    def test_task1_rag_short_query_AI(self):
        """Test RAG search for short English query 'AI'"""
        res = search_kb("AI")
        self.assertIn("الذكاء الاصطناعي AI", res, "Should match KB item containing AI token")

    def test_task1_rag_short_query_UI(self):
        """Test RAG search for short English query 'UI'"""
        res = search_kb("UI")
        self.assertIn("واجهات المستخدم UI", res, "Should match KB item containing UI token")

    def test_task1_rag_short_query_DM(self):
        """Test RAG search for short English query 'DM'"""
        res = search_kb("DM")
        self.assertIn("إرسال رسالة مباشرة DM", res, "Should match KB item containing DM token")

    def test_task1_rag_short_query_KM(self):
        """Test RAG search for short Arabic 2-letter query 'كم'"""
        res = search_kb("كم")
        self.assertIn("كم سعر باقات", res, "Should match KB item containing 'كم'")

    def test_task1_rag_short_query_AY(self):
        """Test RAG search for short Arabic 2-letter query 'اي'"""
        res = search_kb("اي")
        self.assertEqual(res, "", "Should return empty string when 'اي' standalone token is not in KB")

    def test_task1_rag_2letter_exact_token_limitation(self):
        """Test 2-letter word exact token matching limitation vs >2 letter substring matching"""
        custom_kb = [{
            "id": 99,
            "question": "بكم تكلفتكم؟",
            "answer": "التكلفة تتحدد حسَب المطلوب."
        }]
        with patch('server.get_kb_data', return_value=custom_kb):
            res_km = search_kb("كم")
            self.assertEqual(res_km, "", "2-letter query 'كم' fails to match 'بكم' due to exact token requirement")

            res_bkm = search_kb("بكم")
            self.assertIn("التكلفة", res_bkm, "3-letter query 'بكم' matches 'بكم' via substring search")

    def test_task1_rag_arabic_stopword_false_positive_bug(self):
        """Empirical Bug: Stop-words 'ما' and 'هي' cause unrelated queries to match KB Item 1 ('ما هي خدمات...')"""
        # Out of domain query starting with 'ما هي'
        res = search_kb("ما هي عاصمة فرنسا؟")
        self.assertIn("خدمات وكالة دوميا", res, "CONFIRMED BUG: Query 'ما هي عاصمة فرنسا؟' matches KB Item 1 due to stop words 'ما' and 'هي'")

    def test_task1_rag_punctuation_strip_limitation(self):
        """Test 2-letter token stripping limitation with hyphenated or slash tokens like 'AI-driven' or 'AI/ML'"""
        custom_kb = [{
            "id": 100,
            "question": "ما هي حلول AI-based لدينا؟",
            "answer": "نقدم حلول ذكاء اصطناعي مخصصة."
        }]
        with patch('server.get_kb_data', return_value=custom_kb):
            res = search_kb("AI")
            self.assertEqual(res, "", "2-letter token 'AI' fails to match 'AI-based' because hyphen is not stripped in text_words")

    # =========================================================================
    # TASK 2: AI ENGINE FAILOVER CHAIN
    # =========================================================================
    def test_task2_failover_groq_500_to_openrouter(self):
        """Test Groq HTTP 500 triggers failover to OpenRouter"""
        def post_side_effect(url, *args, **kwargs):
            mock_res = MagicMock()
            if "groq.com" in url:
                mock_res.status_code = 500
            elif "openrouter.ai" in url:
                mock_res.status_code = 200
                mock_res.json.return_value = {
                    "choices": [{"message": {"content": "رد من أوبن راوتر"}}]
                }
            else:
                mock_res.status_code = 200
                mock_res.json.return_value = {}
            return mock_res

        with patch('requests.post', side_effect=post_side_effect):
            res = self.client.post("/api/simulate", json={"message": "أريد استشارة تسويقية"})
            data = res.get_json()
            self.assertEqual(res.status_code, 200)
            self.assertEqual(data.get("source"), "llm_openrouter")
            self.assertEqual(data.get("reply"), "رد من أوبن راوتر")

    def test_task2_failover_groq_timeout_to_openrouter(self):
        """Test Groq timeout triggers failover to OpenRouter"""
        def post_side_effect(url, *args, **kwargs):
            if "groq.com" in url:
                raise requests.exceptions.Timeout("Groq Connection Timeout")
            elif "openrouter.ai" in url:
                mock_res = MagicMock()
                mock_res.status_code = 200
                mock_res.json.return_value = {
                    "choices": [{"message": {"content": "تعافي بعد انقطاع جروك"}}]
                }
                return mock_res
            mock_res = MagicMock()
            mock_res.status_code = 200
            return mock_res

        with patch('requests.post', side_effect=post_side_effect):
            res = self.client.post("/api/simulate", json={"message": "أريد استشارة تسويقية"})
            data = res.get_json()
            self.assertEqual(res.status_code, 200)
            self.assertEqual(data.get("source"), "llm_openrouter")
            self.assertEqual(data.get("reply"), "تعافي بعد انقطاع جروك")

    def test_task2_failover_groq_and_openrouter_fail_to_rag(self):
        """Test Groq and OpenRouter failure falls back to RAG Direct Answer"""
        def post_side_effect(url, *args, **kwargs):
            mock_res = MagicMock()
            if "groq.com" in url:
                mock_res.status_code = 500
            elif "openrouter.ai" in url:
                mock_res.status_code = 502
            else:
                mock_res.status_code = 200
            return mock_res

        with patch('requests.post', side_effect=post_side_effect):
            res = self.client.post("/api/simulate", json={"message": "خدمات تصميم واجهات المستخدم UI والغرافيك"})
            data = res.get_json()
            self.assertEqual(res.status_code, 200)
            self.assertEqual(data.get("source"), "rag")
            self.assertIn("أهلاً بيك!", data.get("reply"))

    def test_task2_failover_all_ai_and_rag_fail_to_mock_fallback(self):
        """Test all AI providers fail and no RAG match -> Mock Fallback string"""
        def post_side_effect(url, *args, **kwargs):
            if "groq.com" in url or "openrouter.ai" in url:
                raise requests.exceptions.ConnectionError("Cloud Outage")
            mock_res = MagicMock()
            mock_res.status_code = 200
            return mock_res

        with patch('requests.post', side_effect=post_side_effect):
            res = self.client.post("/api/simulate", json={"message": "سؤال معقد بدون تطابق في القاعدة"})
            data = res.get_json()
            self.assertEqual(res.status_code, 200)
            self.assertEqual(data.get("source"), "fallback")
            self.assertEqual(data.get("reply"), "أهلاً بيك في وكالة دوميا للتسويق الرقمي! ابعتلنا رسالة في الخاص وهنرد عليك فوراً!")

    # =========================================================================
    # TASK 3: ADVERSARIAL PAYLOADS & SECURITY TESTING
    # =========================================================================
    def test_task3_adversarial_missing_hmac_header_vulnerability(self):
        """VULNERABILITY TEST: Missing X-Hub-Signature-256 header when APP_SECRET is set"""
        server.APP_SECRET = "supersecretkey"

        payload = {
            "object": "page",
            "entry": [{
                "messaging": [{
                    "sender": {"id": "attacker_123"},
                    "message": {"text": "اختبار اختراق بدون توقيع"}
                }]
            }]
        }

        # Request WITH invalid signature header -> 403 Forbidden
        res_invalid = self.client.post(
            "/webhook",
            json=payload,
            headers={"X-Hub-Signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000"}
        )
        self.assertEqual(res_invalid.status_code, 403, "Invalid HMAC signature header must be rejected with 403")

        # Request WITHOUT signature header when APP_SECRET is set -> VULNERABILITY!
        res_missing = self.client.post(
            "/webhook",
            json=payload
        )
        self.assertEqual(res_missing.status_code, 200, "CONFIRMED SECURITY VULNERABILITY: Missing signature header skips validation!")

    def test_task3_adversarial_non_dict_json_bodies(self):
        """Test sending non-dict JSON bodies (list, string, int) to POST/PUT REST endpoints"""
        endpoints_to_test = [
            ("POST", "/api/kb", [1, 2, 3]),
            ("PUT", "/api/kb/1", [1, 2, 3]),
            ("POST", "/api/rules", [1, 2, 3]),
            ("PUT", "/api/rules/1", [1, 2, 3]),
            ("POST", "/api/prompt", [1, 2, 3]),
            ("POST", "/api/simulate", [1, 2, 3]),
            ("POST", "/api/test", [1, 2, 3]),
        ]

        crashes_500 = []
        for method, endpoint, payload in endpoints_to_test:
            if method == "POST":
                res = self.client.post(endpoint, json=payload)
            else:
                res = self.client.put(endpoint, json=payload)
            if res.status_code == 500:
                crashes_500.append((method, endpoint))

        self.assertTrue(len(crashes_500) > 0, "CONFIRMED BUG: Sending JSON list payloads causes unhandled HTTP 500 AttributeError exceptions")

    def test_task3_adversarial_arabic_diacritics_in_rules_and_rag(self):
        """Test Arabic diacritics in rule matching and RAG queries"""
        rule_res = check_custom_rules("كم سِعْرٌ هذا المنتج؟")
        self.assertIsNone(rule_res, "Arabic diacritics in message prevent matching 'contains' trigger written without diacritics")

    def test_task3_adversarial_xss_payloads(self):
        """Test XSS payload handling in webhook DMs, comments, and rules"""
        xss_payload = "<script>alert('XSS_ATTACK')</script>"

        # Add rule with XSS via POST /api/rules
        res_rule = self.client.post("/api/rules", json={
            "trigger": xss_payload,
            "response": "<img src=x onerror=alert(1)>",
            "private_response": ""
        })
        self.assertEqual(res_rule.status_code, 200)

        # Confirm stored raw in server cache
        stored_rule = next((r for r in server.cache["rules"] if r.get("trigger") == xss_payload), None)
        self.assertIsNotNone(stored_rule)
        self.assertEqual(stored_rule["response"], "<img src=x onerror=alert(1)>", "XSS payload stored unescaped in rules DB")

    # =========================================================================
    # TASK 4: ZERO HALLUCINATION UNDER MISSING CONTEXT
    # =========================================================================
    def test_task4_zero_hallucination_out_of_domain_query(self):
        """Verify zero hallucination and proper fallback when query is completely out-of-domain and LLM keys are absent/failing"""
        server.GROQ_API_KEY = ""
        server.OPENROUTER_API_KEY = ""

        # Using out-of-domain query that avoids Arabic stop words ('ما', 'هي') matching Item 1
        query = "أين تقع جبال الألب؟"

        reply = generate_reply(query, platform="test")
        self.assertEqual(
            reply,
            "أهلاً بيك في وكالة دوميا للتسويق الرقمي! ابعتلنا رسالة في الخاص وهنرد عليك فوراً!",
            "Out-of-domain query without matching context returns deterministic fallback"
        )


if __name__ == "__main__":
    unittest.main()
