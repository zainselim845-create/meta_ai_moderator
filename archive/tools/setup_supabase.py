import os
import requests

SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_KEY", "")

headers = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Step 1: Test connection
r = requests.get(f"{SUPA_URL}/rest/v1/", headers=headers)
print(f"Connection test: {r.status_code}")

# Step 2: Try creating tables via Supabase Management API (pg-meta)
# Use the SQL query endpoint
sql = (
    "CREATE TABLE IF NOT EXISTS knowledge_base ("
    "id BIGSERIAL PRIMARY KEY, "
    "question TEXT NOT NULL, "
    "answer TEXT NOT NULL, "
    "created_at TIMESTAMPTZ DEFAULT NOW()"
    "); "
    "CREATE TABLE IF NOT EXISTS custom_rules ("
    "id BIGSERIAL PRIMARY KEY, "
    "trigger TEXT NOT NULL, "
    "response TEXT NOT NULL, "
    "match_type TEXT DEFAULT 'contains', "
    "is_active BOOLEAN DEFAULT TRUE, "
    "created_at TIMESTAMPTZ DEFAULT NOW()"
    "); "
    "CREATE TABLE IF NOT EXISTS bot_settings ("
    "id BIGSERIAL PRIMARY KEY, "
    "key TEXT UNIQUE NOT NULL, "
    "value TEXT NOT NULL, "
    "updated_at TIMESTAMPTZ DEFAULT NOW()"
    ");"
)

# Try multiple SQL execution endpoints
endpoints = [
    f"{SUPA_URL}/pg/query",
    f"{SUPA_URL}/rest/v1/rpc/exec_sql",
]

for ep in endpoints:
    try:
        r = requests.post(ep, headers=headers, json={"query": sql}, timeout=10)
        print(f"{ep}: {r.status_code} {r.text[:150]}")
    except Exception as e:
        print(f"{ep}: ERROR {e}")

# Step 3: Check if tables already exist
for table in ["knowledge_base", "custom_rules", "bot_settings"]:
    r = requests.get(f"{SUPA_URL}/rest/v1/{table}?select=*&limit=1", headers=headers)
    print(f"Table '{table}': {r.status_code}")
