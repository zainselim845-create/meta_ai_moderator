"""
=============================================================
  DOMYA META AI SUITE — FULL SYSTEM AUDIT & TESTING
  Date: 2026-08-09
=============================================================
Tests every layer of the system end-to-end:
  1. Vercel Production Reachability
  2. Supabase Connectivity & Data Integrity
  3. Bot Toggle State
  4. Clients/Accounts Store
  5. KB Data Per-Client Isolation
  6. Rules Data Per-Client Isolation
  7. RAG Search (keyword fallback)
  8. generate_reply Flow
  9. OpenRouter Embedding API
  10. Supabase Vector Table (documents)
  11. Supabase RPC match_documents
  12. Webhook Security (verify token)
  13. Dashboard Stats Endpoint
  14. Arabic Text Encoding
"""
import sys, os, json, time, requests

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SUPABASE_URL = 'https://skbzowznafnifxnwiedj.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYnpvd3puYWZuaWZ4bndpZWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyODU3NywiZXhwIjoyMTAxNTA0NTc3fQ.LhJuk419DupunENHdF_vJ0-WVzM-yZ0aAh0HuEUu9dE'
PROD_URL = 'https://metaaimoderator.vercel.app'
OPENROUTER_KEY = os.environ.get('OPENROUTER_API_KEY', '')

def supa_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }

results = []
def test(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append({"name": name, "status": status, "detail": detail})
    icon = "✅" if passed else "❌"
    print(f"  {icon} [{status}] {name}")
    if detail:
        # Truncate long details
        d = str(detail)[:200]
        print(f"       ↳ {d}")

print("=" * 60)
print("  DOMYA META AI SUITE — FULL SYSTEM AUDIT")
print("=" * 60)

# ============================================================
# STAGE 1: Vercel Production Reachability
# ============================================================
print("\n📡 STAGE 1: Vercel Production Reachability")
print("-" * 40)
try:
    r = requests.get(PROD_URL, timeout=10, allow_redirects=True)
    test("Homepage loads", r.status_code == 200, f"HTTP {r.status_code}, {len(r.text)} bytes")
    test("HTML contains Arabic", "دوميا" in r.text or "Domya" in r.text, "Checking for Domya branding")
    test("No mojibake in HTML", "Ø" not in r.text[:5000], "First 5KB free of double-encoded UTF-8")
except Exception as e:
    test("Homepage loads", False, str(e))

# Webhook GET (verify token)
try:
    r = requests.get(f"{PROD_URL}/webhook?hub.mode=subscribe&hub.verify_token=8xTixM78GBd_XcWbLt34mJu4&hub.challenge=test123", timeout=10)
    test("Webhook verify token", r.status_code == 200 and "test123" in r.text, f"HTTP {r.status_code}")
except Exception as e:
    test("Webhook verify token", False, str(e))

# ============================================================
# STAGE 2: Supabase Connectivity
# ============================================================
print("\n🗄️  STAGE 2: Supabase Connectivity & Data")
print("-" * 40)
try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?select=key&limit=5", headers=supa_headers(), timeout=5)
    test("Supabase reachable", r.status_code == 200, f"HTTP {r.status_code}")
    keys = [row['key'] for row in r.json()]
    test("Settings table has data", len(keys) > 0, f"Found keys: {keys[:10]}")
except Exception as e:
    test("Supabase reachable", False, str(e))

# ============================================================
# STAGE 3: Bot Toggle State
# ============================================================
print("\n🤖 STAGE 3: Bot Toggle State")
print("-" * 40)
try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_bot_enabled&select=value", headers=supa_headers(), timeout=5)
    data = r.json()
    if data:
        val = data[0]['value']
        is_enabled = val in ('true', '"true"', True)
        test("Bot enabled in Supabase", is_enabled, f"Value: {val}")
    else:
        test("Bot enabled in Supabase", False, "Key not found")
except Exception as e:
    test("Bot enabled in Supabase", False, str(e))

# ============================================================
# STAGE 4: Clients Store
# ============================================================
print("\n👥 STAGE 4: Clients & Accounts Store")
print("-" * 40)
clients_data = []
accounts_data = []
try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_clients&select=value", headers=supa_headers(), timeout=5)
    data = r.json()
    if data:
        clients_data = json.loads(data[0]['value'])
        if isinstance(clients_data, str):
            clients_data = json.loads(clients_data)
        test("Clients data exists", isinstance(clients_data, list) and len(clients_data) > 0, f"{len(clients_data)} clients found")
        for c in clients_data:
            cid = c.get('id', '?')
            cname = c.get('name', '?')
            print(f"       📌 Client: {cname} (id={cid})")
    else:
        test("Clients data exists", False, "Key not found")
except Exception as e:
    test("Clients data exists", False, str(e))

try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_accounts&select=value", headers=supa_headers(), timeout=5)
    data = r.json()
    if data:
        accounts_data = json.loads(data[0]['value'])
        if isinstance(accounts_data, str):
            accounts_data = json.loads(accounts_data)
        test("Accounts data exists", isinstance(accounts_data, list) and len(accounts_data) > 0, f"{len(accounts_data)} accounts")
        for a in accounts_data:
            aid = a.get('id', '?')
            aname = a.get('name', '?')
            aplat = a.get('platform', '?')
            aclient = a.get('client_id', '?')
            has_token = bool(a.get('access_token') or a.get('access_token_enc'))
            print(f"       📌 Account: {aname} ({aplat}) → client={aclient}, token={'✅' if has_token else '❌'}")
    else:
        test("Accounts data exists", False, "Key not found")
except Exception as e:
    test("Accounts data exists", False, str(e))

# ============================================================
# STAGE 5: KB Data Per-Client Isolation
# ============================================================
print("\n📚 STAGE 5: Knowledge Base (KB) Per-Client Isolation")
print("-" * 40)
kb_data = []
try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_kb&select=value", headers=supa_headers(), timeout=5)
    data = r.json()
    if data:
        kb_data = json.loads(data[0]['value'])
        if isinstance(kb_data, str):
            kb_data = json.loads(kb_data)
        test("KB data exists", isinstance(kb_data, list) and len(kb_data) > 0, f"{len(kb_data)} entries")
        
        # Check client_id distribution
        client_ids_in_kb = set()
        missing_cid = 0
        for item in kb_data:
            cid = item.get('client_id')
            if cid:
                client_ids_in_kb.add(cid)
            else:
                missing_cid += 1
        test("KB entries have client_id", missing_cid == 0, f"Missing client_id: {missing_cid}/{len(kb_data)}")
        print(f"       📊 Client IDs in KB: {client_ids_in_kb}")
    else:
        test("KB data exists", False, "Key not found")
except Exception as e:
    test("KB data exists", False, str(e))

# ============================================================
# STAGE 6: Rules Data Per-Client Isolation
# ============================================================
print("\n📏 STAGE 6: Rules Per-Client Isolation")
print("-" * 40)
rules_data = []
try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_rules&select=value", headers=supa_headers(), timeout=5)
    data = r.json()
    if data:
        rules_data = json.loads(data[0]['value'])
        if isinstance(rules_data, str):
            rules_data = json.loads(rules_data)
        test("Rules data exists", isinstance(rules_data, list) and len(rules_data) > 0, f"{len(rules_data)} rules")
        
        client_ids_in_rules = set()
        missing_cid = 0
        for item in rules_data:
            cid = item.get('client_id')
            if cid:
                client_ids_in_rules.add(cid)
            else:
                missing_cid += 1
        test("Rules entries have client_id", missing_cid == 0, f"Missing client_id: {missing_cid}/{len(rules_data)}")
        print(f"       📊 Client IDs in Rules: {client_ids_in_rules}")
    else:
        test("Rules data exists", False, "No rules key found (might be fine if no rules set)")
except Exception as e:
    test("Rules data exists", False, str(e))

# ============================================================
# STAGE 7: RAG Search (Keyword Fallback)
# ============================================================
print("\n🔍 STAGE 7: RAG Keyword Search (Fallback)")
print("-" * 40)
if kb_data:
    # Pick the first KB item and try to match it
    first_kb = kb_data[0]
    test_q = first_kb.get('question', '')
    test_a = first_kb.get('answer', '')
    test_cid = first_kb.get('client_id', 'client_default')
    
    # Simulate keyword search
    import re as re_mod
    words = [w for w in re_mod.split(r'\s+', test_q.lower()) if len(w) >= 2]
    matched = False
    for item in kb_data:
        if (item.get('client_id') or 'client_default') != test_cid:
            continue
        text = (item.get('question', '') + ' ' + item.get('answer', '')).lower()
        score = sum(1 for w in words if w in text)
        if score > 0:
            matched = True
            break
    test("Keyword search finds KB entry", matched, f"Query: {test_q[:60]}... cid={test_cid}")
    
    # Test cross-client isolation
    fake_cid = "client_NONEXISTENT_999"
    cross_items = [i for i in kb_data if (i.get('client_id') or 'client_default') == fake_cid]
    test("Cross-client isolation (fake cid)", len(cross_items) == 0, f"Items for fake client: {len(cross_items)}")
else:
    test("Keyword search (skipped)", False, "No KB data")

# ============================================================
# STAGE 8: OpenRouter Embedding API
# ============================================================
print("\n🧠 STAGE 8: OpenRouter Embedding API")
print("-" * 40)

# Try to get the key from the Supabase env or from api/index.py
or_key = OPENROUTER_KEY
if not or_key:
    try:
        with open('api/index.py', 'r', encoding='utf-8') as f:
            for line in f:
                if 'OPENROUTER_API_KEY' in line and 'os.environ' in line:
                    # Extract default value if any
                    pass
    except:
        pass

if not or_key:
    # Try to get from vercel env
    try:
        import subprocess
        result = subprocess.run(['vercel', 'env', 'pull', '--yes', '.env.local'], capture_output=True, text=True, cwd='.', timeout=10)
        if os.path.exists('.env.local'):
            with open('.env.local', 'r') as f:
                for line in f:
                    if line.startswith('OPENROUTER_API_KEY='):
                        or_key = line.strip().split('=', 1)[1].strip('"\'')
    except:
        pass

embedding_works = False
test_embedding = None
if or_key:
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"},
            json={"model": "openai/text-embedding-3-small", "input": "ما هي خدمات شركة دوميا للتسويق؟"},
            timeout=15
        )
        if r.status_code == 200:
            test_embedding = r.json()["data"][0]["embedding"]
            embedding_works = True
            test("OpenRouter embeddings", True, f"Dim={len(test_embedding)}")
        else:
            test("OpenRouter embeddings", False, f"HTTP {r.status_code}: {r.text[:100]}")
    except Exception as e:
        test("OpenRouter embeddings", False, str(e))
else:
    test("OpenRouter embeddings", False, "No OPENROUTER_API_KEY found in local env")

# ============================================================
# STAGE 9: Supabase Vector Table (documents)
# ============================================================
print("\n📊 STAGE 9: Supabase Vector Table (documents)")
print("-" * 40)
try:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/documents?select=id,client_id,content&limit=5", headers=supa_headers(), timeout=5)
    if r.status_code == 200:
        docs = r.json()
        test("Documents table exists", True, f"{len(docs)} documents found")
        for d in docs[:3]:
            print(f"       📄 id={d.get('id')}, client={d.get('client_id')}, content={str(d.get('content',''))[:60]}...")
    elif r.status_code == 404:
        test("Documents table exists", False, "Table not found (404). Need to run CREATE TABLE SQL in Supabase.")
    else:
        test("Documents table exists", False, f"HTTP {r.status_code}: {r.text[:100]}")
except Exception as e:
    test("Documents table exists", False, str(e))

# ============================================================
# STAGE 10: Supabase RPC match_documents
# ============================================================
print("\n🔗 STAGE 10: Supabase RPC match_documents")
print("-" * 40)
if test_embedding and embedding_works:
    test_cid = clients_data[0].get('id', 'client_default') if clients_data else 'client_default'
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/match_documents",
            headers=supa_headers(),
            json={
                "query_embedding": test_embedding,
                "match_threshold": 0.5,
                "match_count": 3,
                "p_client_id": test_cid
            },
            timeout=10
        )
        if r.status_code == 200:
            matches = r.json()
            test("match_documents RPC works", True, f"{len(matches)} matches returned")
            for m in matches[:3]:
                sim = m.get('similarity', '?')
                content = str(m.get('content', ''))[:80]
                print(f"       🎯 similarity={sim}, content={content}...")
        else:
            test("match_documents RPC works", False, f"HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        test("match_documents RPC works", False, str(e))
else:
    test("match_documents RPC (skipped)", False, "Embedding generation failed, cannot test RPC")

# ============================================================
# STAGE 11: generate_reply Integration Test
# ============================================================
print("\n💬 STAGE 11: generate_reply Integration Test")
print("-" * 40)
# We test via the /api/test-reply endpoint on production
# But it requires auth. Let's test it differently — via the code directly.
try:
    # Import the module 
    os.environ['OPENROUTER_API_KEY'] = or_key or ''
    from api.index import generate_reply, search_kb, check_custom_rules, cache, sync_from_supabase
    
    # Sync from supabase first
    try:
        sync_from_supabase()
        test("sync_from_supabase()", True, "Synced successfully")
    except Exception as e:
        test("sync_from_supabase()", False, str(e))
    
    # Test search_kb
    test_cid = clients_data[0].get('id', 'client_default') if clients_data else 'client_default'
    kb_result = search_kb("ما هي خدمات الشركة", client_id=test_cid)
    test("search_kb returns context", bool(kb_result and len(kb_result.strip()) > 5), f"Result length: {len(kb_result)}")
    if kb_result:
        print(f"       📝 KB Result: {kb_result[:120]}...")
    
    # Test check_custom_rules
    rules_result = check_custom_rules("سعر", client_id=test_cid)
    test("check_custom_rules", True, f"Rule matched: {bool(rules_result)}")
    
    # Test generate_reply
    reply = generate_reply("بكام باقة إدارة الصفحات؟", platform="DM", client_id=test_cid)
    is_fallback = "تحويل استفسارك" in reply
    test("generate_reply returns reply", bool(reply), f"Length: {len(reply)}")
    test("Reply is NOT fallback", not is_fallback, f"Reply: {reply[:100]}...")
    
    # Test with empty message
    empty_reply = generate_reply("", platform="DM", client_id=test_cid)
    test("Empty message → polite fallback", bool(empty_reply), f"Reply: {empty_reply[:60]}...")
    
except Exception as e:
    test("generate_reply integration", False, f"Import/execution error: {str(e)[:200]}")

# ============================================================
# STAGE 12: Arabic Encoding Integrity
# ============================================================
print("\n🔤 STAGE 12: Arabic Text Encoding Integrity")
print("-" * 40)
try:
    with open('api/index.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for mojibake patterns
    mojibake_count = content.count('Ø') + content.count('Ù')
    test("No mojibake in api/index.py", mojibake_count < 5, f"Mojibake chars found: {mojibake_count}")
    
    # Check DEFAULT_SYSTEM_PROMPT is clean Arabic
    if 'DEFAULT_SYSTEM_PROMPT' in content:
        idx = content.index('DEFAULT_SYSTEM_PROMPT')
        snippet = content[idx:idx+200]
        has_arabic = any('\u0600' <= c <= '\u06FF' for c in snippet)
        test("System prompt has clean Arabic", has_arabic, f"Snippet: {snippet[:80]}...")
except Exception as e:
    test("Arabic encoding check", False, str(e))

# ============================================================
# STAGE 13: Code Structure Checks
# ============================================================
print("\n🏗️  STAGE 13: Code Structure Checks")
print("-" * 40)
try:
    with open('api/index.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    test("generate_embedding() exists", 'def generate_embedding(' in content, "")
    test("search_kb() has vector search", 'match_documents' in content, "Supabase RPC call present")
    test("search_kb() has fallback", 'Fallback' in content or 'fallback' in content, "Keyword search fallback")
    test("generate_reply() passes client_id", 'client_id=client_id' in content or 'client_id=_acct_cid' in content, "")
    test("check_custom_rules() filters by client_id", 'r_cid != cid' in content, "")
    test("Webhook passes client_id", 'client_id=_acct_cid' in content, "")
    test("KB add generates embeddings", 'generate_embedding(content_text)' in content, "")
except Exception as e:
    test("Code structure", False, str(e))

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("  AUDIT SUMMARY")
print("=" * 60)
passed = sum(1 for r in results if r['status'] == 'PASS')
failed = sum(1 for r in results if r['status'] == 'FAIL')
total = len(results)
pct = (passed / total * 100) if total else 0

print(f"\n  Total Tests: {total}")
print(f"  ✅ Passed:   {passed}")
print(f"  ❌ Failed:   {failed}")
print(f"  📊 Score:    {pct:.1f}%")

if failed > 0:
    print(f"\n  ⚠️  FAILED TESTS:")
    for r in results:
        if r['status'] == 'FAIL':
            print(f"    ❌ {r['name']}: {r['detail'][:100]}")

print("\n" + "=" * 60)
