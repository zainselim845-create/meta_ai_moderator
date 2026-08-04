import os

def clean_api_index():
    with open('api/index.py', 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = [
        ('domya_meta_ai_secret_key_2026_super_secure', 'meta_ai_secret_key_2026_super_secure'),
        ('domya_webhook_verify_token_2026', 'meta_ai_webhook_verify_token_2026'),
        ('"domya_ai_token_2026", "domya", ', ''),
        ('"domya": {"password": "domya2026", "role": "admin"}', 'os.environ.get("ADMIN_USER", "admin"): {"password": os.environ.get("ADMIN_PASS", "admin2026"), "role": "admin"}'),
        ("'domya'", 'os.environ.get("ADMIN_USER", "admin")'),
        ('client_domya', 'client_default'),
        ('privacy@domya.com', 'privacy@agency.com'),
        ('https://domya.com', 'https://agency.com'),
        ('Domya Marketing Agency', 'Marketing Agency'),
        ('Domya Agency Ltd', 'Agency Ltd'),
        ('Domya AI Moderator', 'AI Moderator'),
        ('Domya AI', 'AI Moderator'),
        ('Domya Instagram', 'Instagram'),
        ('@domya_marketing', '@marketing_agency'),
        ('# Domya Scheduler', '# Scheduler')
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    with open('api/index.py', 'w', encoding='utf-8') as f:
        f.write(content)

    print('api/index.py updated successfully!')

if __name__ == '__main__':
    clean_api_index()
