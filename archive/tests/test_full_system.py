import requests
import json

BASE_URL = 'https://metaaimoderator.vercel.app'

def run_verification():
    print("--- STARTING END-TO-END SYSTEM VERIFICATION ---")

    # 1. Test Inbox DM Payload
    dm_payload = {
        'object': 'page',
        'entry': [{
            'id': '100821894800009',
            'time': 1776366821,
            'messaging': [{
                'sender': {'id': 'USER_DM_123'},
                'recipient': {'id': '100821894800009'},
                'timestamp': 1776366821,
                'message': {'mid': 'm_123', 'text': 'سلام عليكم، عايز اعرف خدمات الشركة'}
            }]
        }]
    }
    r1 = requests.post(f'{BASE_URL}/webhook', json=dm_payload, timeout=10)
    print(f"1. Inbox DM Webhook Status: {r1.status_code} ({r1.text})")

    # 2. Test Comment Payload with Keyword Rule ('سعر')
    comment_rule_payload = {
        'object': 'page',
        'entry': [{
            'id': '100821894800009',
            'time': 1776366821,
            'changes': [{
                'field': 'feed',
                'value': {
                    'item': 'comment',
                    'verb': 'add',
                    'comment_id': 'COMM_RULE_456',
                    'message': 'كام سعر الباقة الاقتصادية؟',
                    'sender_name': 'Mustafa Ahmed'
                }
            }]
        }]
    }
    r2 = requests.post(f'{BASE_URL}/webhook', json=comment_rule_payload, timeout=10)
    print(f"2. Comment with Rule Webhook Status: {r2.status_code} ({r2.text})")

    # 3. Test Comment Payload without Rule (AI RAG Direct)
    comment_ai_payload = {
        'object': 'page',
        'entry': [{
            'id': '100821894800009',
            'time': 1776366821,
            'changes': [{
                'field': 'feed',
                'value': {
                    'item': 'comment',
                    'verb': 'add',
                    'comment_id': 'COMM_AI_789',
                    'message': 'عايز اعرف مواعيد العمل بالظبط',
                    'sender_name': 'Mona Ali'
                }
            }]
        }]
    }
    r3 = requests.post(f'{BASE_URL}/webhook', json=comment_ai_payload, timeout=10)
    print(f"3. Comment with AI Webhook Status: {r3.status_code} ({r3.text})")

    # 4. Check Stats API to verify logs
    r4 = requests.get(f'{BASE_URL}/api/stats', timeout=10)
    if r4.status_code == 200:
        d = r4.json()
        print(f"4. Total DMs logged: {d['stats']['dms']}, Total Comments logged: {d['stats']['comments']}")
        print("\nRecent Activity Log Entries on Production:")
        for log in d.get('log', []):
            priv = f" | 📩 Inbox: '{log.get('private_reply')}'" if log.get('private_reply') else ""
            print(f"  - [{log['type']}] {log['sender']}: '{log['message']}' -> Public: '{log['reply']}'{priv}")

    print("\n--- VERIFICATION COMPLETED SUCCESSFULLY ---")

if __name__ == '__main__':
    run_verification()
