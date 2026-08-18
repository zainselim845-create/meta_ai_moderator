import requests, json

SUPABASE_URL = 'https://skbzowznafnifxnwiedj.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYnpvd3puYWZuaWZ4bndpZWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyODU3NywiZXhwIjoyMTAxNTA0NTc3fQ.LhJuk419DupunENHdF_vJ0-WVzM-yZ0aAh0HuEUu9dE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

# Test if documents table can be checked or created
r = requests.get(f"{SUPABASE_URL}/rest/v1/documents?limit=1", headers=headers)
print("Documents table status:", r.status_code, r.text)

# Test if pgvector extension or RPC can be executed
r_rpc = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/match_documents", headers=headers, json={
    "query_embedding": [0.0]*1536,
    "match_threshold": 0.5,
    "match_count": 1,
    "p_client_id": "test"
})
print("RPC status:", r_rpc.status_code, r_rpc.text)
