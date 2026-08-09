import requests
import json
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://skbzowznafnifxnwiedj.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYnpvd3puYWZuaWZ4bndpZWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkyODU3NywiZXhwIjoyMTAxNTA0NTc3fQ.LhJuk419DupunENHdF_vJ0-WVzM-yZ0aAh0HuEUu9dE'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
}

r = requests.get(f'{SUPABASE_URL}/rest/v1/app_settings?key=eq.meta_ai_activity', headers=headers)
if r.status_code == 200:
    data = r.json()
    if data:
        logs = json.loads(data[0]['value'])
        for log in logs[-5:]:
            print(f"[{log.get('time')}] {log.get('type')}: {log.get('message', '')} -> {log.get('reply', '')} | client: {log.get('client_id')}")
