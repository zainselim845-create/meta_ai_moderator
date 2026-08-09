"""
Fix 1: Add client_id to all KB and Rules entries in Supabase
Fix 2: Verify and fix api_kb_add embedding code
"""
import sys, json, requests
sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://skbzowznafnifxnwiedj.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYnpvd3puYWZuaWZ4bndpZWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyODU3NywiZXhwIjoyMTAxNTA0NTc3fQ.LhJuk419DupunENHdF_vJ0-WVzM-yZ0aAh0HuEUu9dE'

def supa_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }

# --- Step 1: Get the default client ID ---
r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_clients&select=value", headers=supa_headers(), timeout=5)
clients = json.loads(r.json()[0]['value'])
if isinstance(clients, str):
    clients = json.loads(clients)
default_cid = clients[0]['id'] if clients else 'client_default'
print(f"Default client_id: {default_cid}")

# --- Step 2: Fix KB entries ---
print("\n--- Fixing KB entries ---")
r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_kb&select=value", headers=supa_headers(), timeout=5)
kb_data = json.loads(r.json()[0]['value'])
if isinstance(kb_data, str):
    kb_data = json.loads(kb_data)

changed_kb = 0
for item in kb_data:
    if not item.get('client_id'):
        item['client_id'] = default_cid
        changed_kb += 1
        print(f"  ✅ Added client_id to KB: {item.get('question', '?')[:50]}...")

if changed_kb > 0:
    payload = {'key': 'meta_ai_kb', 'value': json.dumps(kb_data, ensure_ascii=False)}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/app_settings?on_conflict=key", headers=supa_headers(), json=payload, timeout=5)
    print(f"  📤 Saved KB: HTTP {r.status_code} ({changed_kb} items fixed)")
else:
    print("  ✅ All KB items already have client_id")

# --- Step 3: Fix Rules entries ---
print("\n--- Fixing Rules entries ---")
r = requests.get(f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_rules&select=value", headers=supa_headers(), timeout=5)
rules_data = json.loads(r.json()[0]['value'])
if isinstance(rules_data, str):
    rules_data = json.loads(rules_data)

changed_rules = 0
for item in rules_data:
    if not item.get('client_id'):
        item['client_id'] = default_cid
        changed_rules += 1
        print(f"  ✅ Added client_id to Rule: {item.get('trigger', '?')[:50]}...")

if changed_rules > 0:
    payload = {'key': 'meta_ai_rules', 'value': json.dumps(rules_data, ensure_ascii=False)}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/app_settings?on_conflict=key", headers=supa_headers(), json=payload, timeout=5)
    print(f"  📤 Saved Rules: HTTP {r.status_code} ({changed_rules} items fixed)")
else:
    print("  ✅ All Rules already have client_id")

print("\n✅ KB and Rules migration complete!")
