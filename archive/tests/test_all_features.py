import requests
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "https://metaaimoderator.vercel.app"

def run_comprehensive_tests():
    print("=" * 60)
    print("🚀 STARTING COMPREHENSIVE END-TO-END FEATURE AUDIT")
    print("=" * 60)

    passed = 0
    failed = 0

    def assert_status(name, res, expected_code=200):
        nonlocal passed, failed
        if res.status_code == expected_code:
            print(f"✅ [{name}] Passed (HTTP {res.status_code})")
            passed += 1
            return True
        else:
            print(f"❌ [{name}] Failed (HTTP {res.status_code}) - {res.text[:150]}")
            failed += 1
            return False

    # 1. Dashboard UI
    r = requests.get(f"{BASE_URL}/")
    assert_status("1. Dashboard UI (GET /)", r)

    # 2. Stats API
    r = requests.get(f"{BASE_URL}/api/stats")
    assert_status("2. System Stats (GET /api/stats)", r)

    # 3. Conversations Inbox
    r = requests.get(f"{BASE_URL}/api/conversations")
    assert_status("3. Social Inbox Threads (GET /api/conversations)", r)

    # 4. KB Get
    r = requests.get(f"{BASE_URL}/api/kb")
    assert_status("4. KB List (GET /api/kb)", r)

    # 5. KB Add
    r = requests.post(f"{BASE_URL}/api/kb", json={"q": "ما هي خصومات الموسم؟", "a": "خصومات تصل إلى 30% على الباقة الاحترافية."})
    if assert_status("5. Add KB Item (POST /api/kb)", r):
        # 6. Delete KB item
        kb_list = requests.get(f"{BASE_URL}/api/kb").json()
        added_item = next((item for item in kb_list if item.get("question") == "ما هي خصومات الموسم؟"), None)
        if added_item:
            r_del = requests.delete(f"{BASE_URL}/api/kb/{added_item['id']}")
            assert_status("6. Delete KB Item (DELETE /api/kb/<id>)", r_del)

    # 7. Upload Doc RAG
    doc_text = """تأسست وكالة دوميا للتسويق الرقمي في عام 2020 وتعتبر من الشركات الرائدة في مصر والوطن العربي.
نقدم دعم فني متواصل 24 ساعة طوال أيام الأسبوع لكل العملاء المشتركين في الباقات الشاملة.
خصومات خاصة للشركات الناشئة والمؤسسات عند التعاقد السنوي يصل إلى 25%."""
    r = requests.post(f"{BASE_URL}/api/upload_doc", json={"text": doc_text})
    assert_status("7. RAG Document Ingestion (POST /api/upload_doc)", r)

    # 8. Rules Get
    r = requests.get(f"{BASE_URL}/api/rules")
    assert_status("8. Rules List (GET /api/rules)", r)

    # 9. Rules Add
    rule_payload = {
        "trigger": "تجربة خصم",
        "response": "تم تفعيل كود التجربة بنجاح!",
        "private_response": "كود الخصم التجريبي هو: TEST-2026",
        "match_type": "contains"
    }
    r = requests.post(f"{BASE_URL}/api/rules", json=rule_payload)
    if assert_status("9. Add Smart Rule (POST /api/rules)", r):
        rules_list = requests.get(f"{BASE_URL}/api/rules").json()
        added_rule = next((rule for rule in rules_list if rule.get("trigger") == "تجربة خصم"), None)
        if added_rule:
            r_del_rule = requests.delete(f"{BASE_URL}/api/rules/{added_rule['id']}")
            assert_status("10. Delete Smart Rule (DELETE /api/rules/<id>)", r_del_rule)

    # 11. System Prompt Get & Save
    r = requests.get(f"{BASE_URL}/api/prompt")
    assert_status("11. Get System Prompt (GET /api/prompt)", r)

    # 12. Accounts List
    r = requests.get(f"{BASE_URL}/api/accounts")
    assert_status("12. Accounts List (GET /api/accounts)", r)

    # 13. OAuth URL
    r = requests.get(f"{BASE_URL}/api/oauth_url")
    assert_status("13. OAuth URL Generator (GET /api/oauth_url)", r)

    # 14. Toggle Bot
    r = requests.post(f"{BASE_URL}/api/toggle", json={"enabled": True, "approval_mode": "manual"})
    assert_status("14. Toggle Bot & Approval Mode (POST /api/toggle)", r)

    # 15. AI Simulation Playground
    r = requests.post(f"{BASE_URL}/api/simulate", json={"message": "ما هي خصومات الشركات الناشئة؟"})
    assert_status("15. AI Playground Simulation (POST /api/simulate)", r)
    if r.status_code == 200:
        print(f"   🤖 AI Reply: {r.json().get('reply')[:100]}...")

    # 16. Webhook GET Verification
    r = requests.get(f"{BASE_URL}/webhook?hub.mode=subscribe&hub.verify_token=GET&hub.challenge=test_12345")
    assert_status("16. Webhook Verification (GET /webhook)", r)

    # 17. Webhook POST DM Payload
    dm_payload = {
        "object": "page",
        "entry": [{
            "messaging": [{
                "sender": {"id": "AUDIT_USER_777"},
                "message": {"mid": f"mid_audit_{int(time.time())}", "text": "ازيكم، عايز اعرف تفاصيل الدعم الفني 24 ساعة"}
            }]
        }]
    }
    r = requests.post(f"{BASE_URL}/webhook", json=dm_payload)
    assert_status("17. Incoming Messenger DM Webhook (POST /webhook)", r)

    # 18. Check Pending Approvals
    stats_data = requests.get(f"{BASE_URL}/api/stats").json()
    pending_list = stats_data.get("pending", [])
    if pending_list:
        test_draft = pending_list[-1]
        draft_id = test_draft["id"]
        # Reject draft test
        r_rej = requests.post(f"{BASE_URL}/api/reject/{draft_id}")
        assert_status("18. Reject Pending Approval (POST /api/reject/<id>)", r_rej)

    print("=" * 60)
    print(f"📊 SUMMARY: {passed} PASSED, {failed} FAILED")
    print("=" * 60)

if __name__ == "__main__":
    run_comprehensive_tests()
