import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=== INSTAGRAPI IN AUDIT_REPORT.JSON ===")
with open('audit_report.json', 'r', encoding='utf-8') as f:
    for line in f:
        if 'instagrapi' in line:
            print("  ", line.strip())

print("\n=== INSTAGRAPI IN TEST_SERVER.PY ===")
with open('test_server.py', 'r', encoding='utf-8') as f:
    for line in f:
        if 'instagrapi' in line:
            print("  ", line.strip())
