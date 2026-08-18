import os
import requests
import json

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

# Smart Trigger Rules with Comment Public Reply + Private Inbox Reply
custom_rules = [
    {
        "id": 1,
        "trigger": "سعر",
        "match_type": "contains",
        "response": "تم الرد في الخاص! 📩",
        "private_response": "أهلاً بك! تبدأ باقات إدارة الصفحات والتسويق لدينا من 3000 جنيه مصري شهرياً. ابعتلنا تفاصيل نشاطك وهنحددلك الباقة المناسبة فوراً! 🚀",
        "is_active": True
    },
    {
        "id": 2,
        "trigger": "أسعار",
        "match_type": "contains",
        "response": "تم الرد في الخاص بالتفاصيل! 📩",
        "private_response": "أهلاً بك! نوفر باقات متنوعة لتناسب كافة الأنشطة تجارية. الباقة الاقتصادية (3000ج)، الاحترافية (6000ج)، والمؤسسات (12000ج). يسعدنا خدمتك! 💼",
        "is_active": True
    },
    {
        "id": 3,
        "trigger": "بكم",
        "match_type": "contains",
        "response": "بعتنالك التفاصيل في الخاص 📩",
        "private_response": "أهلاً بك! يمكنك التعرف على أسعار خدماتنا وباقات التسويق عبر التواصل المباشر في الخاص معنا، يسعدنا خدمتك! 😊",
        "is_active": True
    },
    {
        "id": 4,
        "trigger": "تفاصيل",
        "match_type": "contains",
        "response": "بعتنالك كافة التفاصيل في الإنبوكس! 📩",
        "private_response": "أهلاً بك! تقدم وكالة دوميا للتسويق الرقمي خدمات التسويق وإدارة الحملات الممولة وصناعة المحتوى وتطوير الـ AI Bots. كيف يمكننا مساعدتك اليوم؟ 🚀",
        "is_active": True
    }
]

url = f"{SUPABASE_URL}/rest/v1/app_settings"
p = {"key": "meta_ai_rules", "value": json.dumps(custom_rules, ensure_ascii=False)}

r = requests.post(url, headers=headers, json=p)
print(f"Synced Rules with Private Inbox Reply to Supabase: Status {r.status_code}")
