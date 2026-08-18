import re

with open('api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace KB_ITEMS_CACHE
kb_clean = '''KB_ITEMS_CACHE = [
    {"id": "kb-1", "topic": "باقة إدارة الفيس والانستجرام (البرونزية)", "content": "3000 جنيه شهرياً: شاملة كتابة وتصميم 12 منشور + 4 ريلز + ردود تلقائية 24/7.", "category": "أسعار وباقات"},
    {"id": "kb-2", "topic": "الباقة الفضية الشاملة (الذهبية)", "content": "6000 جنيه شهرياً: شاملة 24 منشور + 8 ريلز احترافي + تمويل حملة إعلانية + تقرير أسبوعي.", "category": "أسعار وباقات"},
    {"id": "kb-3", "topic": "رقم التواصل الهاتفي والواتساب", "content": "رقم التواصل المباشر م. محمد سعيد: 01090121000", "category": "تواصل"}
]'''
content = re.sub(r'KB_ITEMS_CACHE = \[.*?\]', kb_clean, content, flags=re.DOTALL)

# Replace RULES_ITEMS_CACHE
rules_clean = '''RULES_ITEMS_CACHE = [
    {"id": "rule-1", "trigger": "بكام", "match_type": "contains", "public_reply": "أهلاً بحضرتك! باقاتنا تبدأ من 3000 ج.م شهرياً. التفاصيل أرسلت لك في الخاص", "private_reply": "أهلاً بك! باقة الإدارة المتميزة 3000ج والذهبية 6000ج. كيف يمكننا مساعدتك اليوم؟"},
    {"id": "rule-2", "trigger": "سعر", "match_type": "contains", "public_reply": "تم إرسال كافة التفاصيل والباقات في الرسائل الخاصة", "private_reply": "أهلاً بك! تفاصيل أسعار إدارة الصفحات تظهر في الباقات المعتمدة (3000ج / 6000ج)."}
]'''
content = re.sub(r'RULES_ITEMS_CACHE = \[.*?\]', rules_clean, content, flags=re.DOTALL)

# Replace line 3708 and 3710
content = re.sub(r'reply = "Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ! Ø¨Ø§Ù.*?3000.*?6000.*?"', 'reply = "أهلاً بك! باقات إدارة الصفحات لدينا: الباقة البرونزية بـ 3000 جنيه شهرياً (12 منشور + 4 ريلز) والذهبية بـ 6000 جنيه شهرياً. للتواصل الفوري: 01090121000 م.محمد سعيد."', content)
content = re.sub(r'reply = "Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ Ù ÙŠ ÙˆÙƒØ§Ù„Ø©.*?دوميا.*?"', 'reply = "أهلاً بك في وكالة دوميا للتسويق الرقمي! نحن متخصصون في إدارة الصفحات والإعلانات المموّلة. كيف يمكننا مساعدتك اليوم؟"', content)

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(content)
