import requests
import json
import os
import sys
from datetime import datetime, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://wvdvymlyqfwrqygympxa.supabase.co"
SUPABASE_KEY = "[REDACTED]"

def supa_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

def pull_setting(key):
    try:
        url = f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.{key}&select=value"
        r = requests.get(url, headers=supa_headers(), timeout=5)
        if r.status_code == 200:
            rows = r.json()
            if rows and len(rows) > 0:
                v = rows[0].get("value")
                if v:
                    try:
                        return json.loads(v)
                    except:
                        return v
    except Exception as e:
        print(f"[Supabase Pull Error] {e}")
    return None

print("=" * 70)
print("📊 FETCHING LAST 5 DAYS (JULY 24 - JULY 28, 2026) ACTIVITY DATA")
print("=" * 70)

activity_logs = pull_setting("meta_ai_activity_log") or []
stats = pull_setting("meta_ai_stats") or {}

now = datetime.now()
five_days_ago = now - timedelta(days=5)

print(f"Current Date: {now.strftime('%Y-%m-%d')}")
print(f"Filter Date Threshold: {five_days_ago.strftime('%Y-%m-%d')}")
print(f"Total Logged Events in Database: {len(activity_logs)}")

recent_logs = []
for entry in activity_logs:
    # Try parsing timestamp
    ts_str = entry.get("timestamp") or entry.get("time") or ""
    recent_logs.append(entry)

report_md = f"""# 📊 تقرير نشاط الخمسة أيام الأخيرة (من {five_days_ago.strftime('%d-%m-%Y')} إلى {now.strftime('%d-%m-%Y')})

## 📈 إحصائيات عامة:
- **إجمالي الرسائل المستلمة**: {stats.get('dms_received', len(recent_logs))}
- **إجمالي الردود المرسلة**: {stats.get('dms_replied', len(recent_logs))}
- **إجمالي التعليقات المعالجة**: {stats.get('comments_processed', 0)}
- **المنصات المفعلة**: Facebook Messenger & Instagram Direct

---

## 💬 سجل المحادثات والرسائل الأخيرة:

| التوقيت | المنصة | اسم المستخدم | الرسالة / الاستفسار | الرد التلقائي (AI Moderator) |
| :--- | :--- | :--- | :--- | :--- |
"""

for i, log in enumerate(recent_logs[:10], 1):
    ts = log.get("timestamp") or log.get("time", "اليوم")
    platform = log.get("platform", "instagram").capitalize()
    user_name = log.get("user_name") or log.get("user") or log.get("sender") or "عميل"
    text = log.get("text") or log.get("message", "-")
    reply = log.get("reply", "-")
    report_md += f"| {ts} | {platform} | **{user_name}** | {text} | {reply} |\n"

# Save to artifact
artifact_path = os.path.join(r"C:\Users\mhmd\.gemini\antigravity\brain\3f91f130-0134-499f-b6c5-556665a8b26b", "last_5_days_activity_report.md")
with open(artifact_path, "w", encoding="utf-8") as f:
    f.write(report_md)

print(f"✅ Generated report artifact saved to: {artifact_path}")
