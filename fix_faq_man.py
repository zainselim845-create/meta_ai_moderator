with open('api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

faq_start = content.find('_DEFAULT_FAQ_DATA = [')
if faq_start != -1:
    faq_end = content.find(']', faq_start)
    old_faq = content[faq_start:faq_end+1]
    new_faq = '''_DEFAULT_FAQ_DATA = [
    {"id": 1, "question": "ما هي خدمات وكالة دوميا للتسويق الرقمي؟", "answer": "تقدم وكالة دوميا خدمات تسويق رقمي شاملة: إدارة صفحات التواصل الاجتماعي، إعلانات ممولة، تصميم جرافيك، وإدارة حسابات العيادات والشركات."},
    {"id": 2, "question": "ما هي أسعار وباقات إدارة الصفحات؟", "answer": "لدينا باقتان: الباقة البرونزية بـ 3000 جنيه شهرياً (12 منشور + 4 ريلز) والباقة الذهبية بـ 6000 جنيه شهرياً. للتفاصيل: 01090121000 م.محمد سعيد."},
    {"id": 3, "question": "كيف يمكنني التواصل لحجز خدمة؟", "answer": "يمكنك التواصل عبر رسائل الصفحة أو الاتصال/واتساب على الرقم: 01090121000"}
]'''
    content = content.replace(old_faq, new_faq)
    with open('api/index.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('FAQ FIXED!')
else:
    print('FAQ NOT FOUND')
