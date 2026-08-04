"""
Adversarial Verification Suite for server.py (Meta AI Social Moderator)
Empirical tests targeting:
1. Rule Match Types, Conflicting Rules, Disabled Rules, Non-string Triggers, Arabic Normalization
2. RAG Scoring, Short Words, Stop Words, Prefix False Positives, Out-of-Domain Queries
3. AI Provider Failover (Groq, OpenRouter, Mock Fallback under HTTP errors/timeouts)
4. Simulator Endpoint POST /api/simulate Output Attribution Metadata
"""

import unittest
import json
import os
from unittest.mock import patch, MagicMock
import requests

import server
from server import (
    app, search_kb, check_custom_rules, generate_reply,
    _call_groq, _call_openrouter, activity_log, stats
)


class TestAdversarialSuite(unittest.TestCase):

    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

        # Default Mock Database
        self.mock_db = {
            "meta_ai_kb": [
                {
                    "id": 1,
                    "question": "ما هي خدمات وكالة دوميا؟",
                    "answer": "نقدم خدمات التسويق الرقمي الشامل، إعلانات ممولة، وبوتات الذكاء الاصطناعي AI."
                },
                {
                    "id": 2,
                    "question": "كم أسعار الباقات؟",
                    "answer": "أسعارنا تختلف حسب حجم الخدمة والمشروع."
                }
            ],
            "meta_ai_rules": [
                {
                    "id": 101,
                    "trigger": "سعر",
                    "response": "أهلاً بك! تم الرد في الخاص 📩",
                    "private_response": "أسعارنا تبدأ من 1000 جنيه.",
                    "match_type": "contains",
                    "is_active": True
                }
            ],
            "meta_ai_system_prompt": "أنت مساعد خدمة عملاء ذكي لوكالة دوميا."
        }

        # Reset global flags
        server.GROQ_API_KEY = ""
        server.OPENROUTER_API_KEY = ""
        server.APP_SECRET = ""
        server.cache["bot_enabled"] = True
        server.cache["approval_mode"] = "auto"
        server.pending_approvals.clear()
        stats["pending"] = 0
        activity_log.clear()

        # Patch requests.get for get_setting
        self.patch_get = patch('requests.get', side_effect=self.fake_get)
        self.mock_get = self.patch_get.start()

    def tearDown(self):
        patch.stopall()

    def fake_get(self, url, *args, **kwargs):
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
            val = json.dumps(self.mock_db.get("meta_ai_bot_enabled", True))
            mock_res.json.return_value = [{"value": val}]
        elif "key=eq.meta_ai_approval_mode" in url:
            val = json.dumps(self.mock_db.get("meta_ai_approval_mode", "auto"))
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

    # =========================================================================
    # SECTION 1: CUSTOM RULE MATCHING ADVERSARIAL TESTS
    # =========================================================================

    def test_adv_rule_match_types(self):
        """Test exact, contains, startswith match types explicitly."""
        self.mock_db["meta_ai_rules"] = [
            {"id": 1, "trigger": "أسعار", "match_type": "exact", "response": "EXACT_MATCH"},
            {"id": 2, "trigger": "خدمة", "match_type": "contains", "response": "CONTAINS_MATCH"},
            {"id": 3, "trigger": "مرحبا", "match_type": "startswith", "response": "STARTSWITH_MATCH"},
        ]

        # 1. exact match
        r1 = check_custom_rules("أسعار")
        self.assertIsNotNone(r1)
        self.assertEqual(r1["response"], "EXACT_MATCH")

        r1_fail = check_custom_rules("ما هي أسعاركم؟")
        self.assertIsNone(r1_fail)

        # 2. contains match
        r2 = check_custom_rules("أريد استفسار عن أي خدمة تتيحونها")
        self.assertIsNotNone(r2)
        self.assertEqual(r2["response"], "CONTAINS_MATCH")

        # 3. startswith match
        r3 = check_custom_rules("مرحبا بك يا أخي")
        self.assertIsNotNone(r3)
        self.assertEqual(r3["response"], "STARTSWITH_MATCH")

        r3_fail = check_custom_rules("أهلاً ومرحبا بك")
        self.assertIsNone(r3_fail)

    def test_adv_rule_overlapping_and_shadowing(self):
        """Test rule precedence when general rule comes before specific rule."""
        self.mock_db["meta_ai_rules"] = [
            {"id": 1, "trigger": "سعر", "match_type": "contains", "response": "RULE_GENERAL_CONTAINS"},
            {"id": 2, "trigger": "سعر الخدمة", "match_type": "exact", "response": "RULE_SPECIFIC_EXACT"},
        ]

        # Query "سعر الخدمة" will match Rule 1 because Rule 1 is evaluated first
        rule = check_custom_rules("سعر الخدمة")
        self.assertIsNotNone(rule)
        self.assertEqual(rule["id"], 1, "General contains rule shadowed specific exact rule due to array order")

    def test_adv_rule_disabled_flag_ignored(self):
        """Test check_custom_rules correctly ignores rule['is_active'] == False."""
        self.mock_db["meta_ai_rules"] = [
            {"id": 1, "trigger": "خصم", "match_type": "contains", "response": "DISABLED_RULE_RESP", "is_active": False}
        ]

        rule = check_custom_rules("هل يوجد خصم؟")
        self.assertIsNone(rule, "Disabled rule (is_active=False) must be ignored")

    def test_adv_rule_integer_trigger_crash(self):
        """Test integer trigger (e.g. 100) is safely handled without raising AttributeError."""
        self.mock_db["meta_ai_rules"] = [
            {"id": 1, "trigger": 100, "match_type": "exact", "response": "INT_RULE"}
        ]

        rule = check_custom_rules("100")
        self.assertIsNotNone(rule)
        self.assertEqual(rule["response"], "INT_RULE")

    def test_adv_rule_arabic_diacritics_normalization(self):
        """Test Arabic diacritics / tashkeel sensitivity."""
        self.mock_db["meta_ai_rules"] = [
            {"id": 1, "trigger": "سعر", "match_type": "contains", "response": "SARR_RESP"}
        ]

        # "سِعْر" with tashkeel
        rule = check_custom_rules("كم سِعْر الدورة؟")
        # Since 'sِعْr' != 'سعر', contains search fails if diacritics are present
        self.assertIsNone(rule, "Arabic diacritics break exact string substring matching")

    # =========================================================================
    # SECTION 2: RAG SCORING & RETRIEVAL ADVERSARIAL TESTS
    # =========================================================================

    def test_adv_rag_short_words_dropped(self):
        """Test short 2-letter search queries like 'AI' are matched correctly."""
        self.mock_db["meta_ai_kb"] = [
            {"id": 1, "question": "هل تطورون بوتات AI؟", "answer": "نعم نطور بوتات AI ذكية."}
        ]

        res = search_kb("AI")
        self.assertIn("AI", res)

    def test_adv_rag_prefix_matching_false_positives(self):
        """Test search_kb does not produce false positive matches for different words sharing prefixes."""
        self.mock_db["meta_ai_kb"] = [
            {"id": 1, "question": "كم الاسعار؟", "answer": "الباقات تبدأ من 1000 جنيه."}
        ]

        # Query "الاستراتيجية" (strategy) should not match "الاسعار"
        res = search_kb("ما هي الاستراتيجية التسويقية؟")
        self.assertEqual(res, "", "Different word 'الاستراتيجية' should not match 'الاسعار'")

    def test_adv_rag_stop_words_score_inflation(self):
        """EMPIRICAL FINDING: Common 3+ letter Arabic words (هذا, الذي, التي, في) match KB text containing those words."""
        self.mock_db["meta_ai_kb"] = [
            {"id": 1, "question": "ما هذا الشي الذي تبيعونه في الشركه؟", "answer": "نحن وكالة تسويق."}
        ]

        res = search_kb("ما هذا الذي")
        self.assertIn("ما هذا الشي", res)

    def test_adv_rag_out_of_domain_query(self):
        """Test out-of-domain queries like cooking or weather."""
        res = search_kb("طريقة عمل البيتزا بالجبنة في البيت")
        self.assertEqual(res, "")

    def test_adv_rag_empty_and_whitespace_query(self):
        """Test empty, whitespace, and symbol-only queries."""
        self.assertEqual(search_kb(""), "")
        self.assertEqual(search_kb("   \n\t  "), "")
        self.assertEqual(search_kb("!@#$%^&*()"), "")

    # =========================================================================
    # SECTION 3: AI PROVIDER FAILOVER ADVERSARIAL TESTS
    # =========================================================================

    def test_adv_ai_groq_success(self):
        """Test normal Groq API execution when key present and status 200."""
        server.GROQ_API_KEY = "mock_groq_key"

        with patch('requests.post') as mock_post:
            mock_res = MagicMock()
            mock_res.status_code = 200
            mock_res.json.return_value = {
                "choices": [{"message": {"content": "Groq Response Text"}}]
            }
            mock_post.return_value = mock_res

            reply = generate_reply("سؤال عام", platform="test")
            self.assertEqual(reply, "Groq Response Text")

    def test_adv_ai_groq_500_failover_to_openrouter(self):
        """Test Groq API HTTP 500 failure triggering automatic failover to OpenRouter."""
        server.GROQ_API_KEY = "mock_groq_key"
        server.OPENROUTER_API_KEY = "mock_openrouter_key"

        def fake_post(url, *args, **kwargs):
            mock_res = MagicMock()
            if "groq.com" in url:
                mock_res.status_code = 500
                mock_res.text = "Internal Server Error"
            elif "openrouter.ai" in url:
                mock_res.status_code = 200
                mock_res.json.return_value = {
                    "choices": [{"message": {"content": "OpenRouter Fallback Response"}}]
                }
            return mock_res

        with patch('requests.post', side_effect=fake_post):
            reply = generate_reply("سؤال عشوائي جداً لا يطابق قواعد", platform="test")
            self.assertEqual(reply, "OpenRouter Fallback Response")

    def test_adv_ai_groq_timeout_failover_to_openrouter(self):
        """Test Groq timeout exception triggering automatic failover to OpenRouter."""
        server.GROQ_API_KEY = "mock_groq_key"
        server.OPENROUTER_API_KEY = "mock_openrouter_key"

        def fake_post(url, *args, **kwargs):
            if "groq.com" in url:
                raise requests.exceptions.Timeout("Groq connection timed out")
            mock_res = MagicMock()
            mock_res.status_code = 200
            mock_res.json.return_value = {
                "choices": [{"message": {"content": "OpenRouter Response After Groq Timeout"}}]
            }
            return mock_res

        with patch('requests.post', side_effect=fake_post):
            reply = generate_reply("سؤال عشوائي جداً", platform="test")
            self.assertEqual(reply, "OpenRouter Response After Groq Timeout")

    def test_adv_ai_both_providers_fail_rag_fallback(self):
        """Test Groq and OpenRouter both failing -> falls back to Smart RAG Direct Answer."""
        server.GROQ_API_KEY = "mock_groq_key"
        server.OPENROUTER_API_KEY = "mock_openrouter_key"

        with patch('requests.post', side_effect=requests.exceptions.ConnectionError("Network Down")):
            # Message matching KB "ما هي خدمات وكالة دوميا؟"
            reply = generate_reply("ما هي خدمات وكالة دوميا؟", platform="test")
            self.assertIn("نقدم خدمات التسويق الرقمي", reply)
            self.assertTrue(reply.startswith("أهلاً بيك!"))

    def test_adv_ai_both_providers_fail_offline_mock_fallback(self):
        """Test Groq and OpenRouter both failing with no RAG match -> offline fallback message."""
        server.GROQ_API_KEY = "mock_groq_key"
        server.OPENROUTER_API_KEY = "mock_openrouter_key"

        with patch('requests.post', side_effect=requests.exceptions.ConnectionError("Network Down")):
            reply = generate_reply("سؤال غريب ليس له إجابة", platform="test")
            self.assertEqual(reply, "أهلاً بيك في وكالة دوميا للتسويق الرقمي! ابعتلنا رسالة في الخاص وهنرد عليك فوراً!")

    # =========================================================================
    # SECTION 4: SIMULATOR ENDPOINT /api/simulate ATTRIBUTION METADATA TESTS
    # =========================================================================

    def test_adv_simulate_rule_attribution(self):
        """Verify POST /api/simulate attribution when Rule matches."""
        res = self.client.post('/api/simulate', json={"message": "كم سعر الباقة؟"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["source"], "rule")
        self.assertEqual(data["rule_triggered"], "سعر")
        self.assertEqual(data["rag_context"], "")

    def test_adv_simulate_groq_attribution(self):
        """Verify POST /api/simulate attribution when Groq LLM responds."""
        server.GROQ_API_KEY = "mock_groq_key"

        def fake_post(url, *args, **kwargs):
            mock_res = MagicMock()
            if "groq.com" in url:
                mock_res.status_code = 200
                mock_res.json.return_value = {
                    "choices": [{"message": {"content": "Simulated Groq LLM Reply"}}]
                }
            return mock_res

        with patch('requests.post', side_effect=fake_post):
            res = self.client.post('/api/simulate', json={"message": "ما هي خدمات وكالة دوميا؟"})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data["source"], "llm_groq")
            self.assertEqual(data["reply"], "Simulated Groq LLM Reply")
            self.assertIsNone(data["rule_triggered"])
            self.assertIn("خدمات التسويق الرقمي", data["rag_context"])

    def test_adv_simulate_openrouter_attribution(self):
        """Verify POST /api/simulate attribution when Groq fails and OpenRouter responds."""
        server.GROQ_API_KEY = "mock_groq_key"
        server.OPENROUTER_API_KEY = "mock_openrouter_key"

        def fake_post(url, *args, **kwargs):
            mock_res = MagicMock()
            if "groq.com" in url:
                mock_res.status_code = 500
            elif "openrouter.ai" in url:
                mock_res.status_code = 200
                mock_res.json.return_value = {
                    "choices": [{"message": {"content": "Simulated OpenRouter LLM Reply"}}]
                }
            return mock_res

        with patch('requests.post', side_effect=fake_post):
            res = self.client.post('/api/simulate', json={"message": "ما هي خدمات وكالة دوميا؟"})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data["source"], "llm_openrouter")
            self.assertEqual(data["reply"], "Simulated OpenRouter LLM Reply")
            self.assertIsNone(data["rule_triggered"])
            self.assertIn("خدمات التسويق الرقمي", data["rag_context"])

    def test_adv_simulate_rag_attribution(self):
        """Verify POST /api/simulate attribution when no LLM key is configured but RAG matches."""
        server.GROQ_API_KEY = ""
        server.OPENROUTER_API_KEY = ""

        res = self.client.post('/api/simulate', json={"message": "ما هي خدمات وكالة دوميا؟"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["source"], "rag")
        self.assertIsNone(data["rule_triggered"])
        self.assertIn("خدمات التسويق الرقمي", data["reply"])
        self.assertIn("خدمات التسويق الرقمي", data["rag_context"])

    def test_adv_simulate_fallback_attribution(self):
        """Verify POST /api/simulate attribution when no rule, LLM, or RAG match exists."""
        server.GROQ_API_KEY = ""
        server.OPENROUTER_API_KEY = ""

        res = self.client.post('/api/simulate', json={"message": "استفسار غريب غير معروف"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["source"], "fallback")
        self.assertIsNone(data["rule_triggered"])
        self.assertEqual(data["rag_context"], "")
        self.assertIn("ابعتلنا رسالة في الخاص", data["reply"])

    def test_adv_simulate_empty_message_attribution(self):
        """Verify POST /api/simulate attribution on empty message payload."""
        res = self.client.post('/api/simulate', json={"message": ""})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["source"], "fallback")
        self.assertIsNone(data["rule_triggered"])
        self.assertEqual(data["rag_context"], "")
        self.assertEqual(data["reply"], "أهلاً بك! كيف يمكننا مساعدتك؟")


if __name__ == '__main__':
    unittest.main()
