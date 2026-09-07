# Domya Meta AI Moderator & Agency Operations Suite

منصة سحابية متكاملة لإدارة المحتوى، تفريغ وبناء الخطط التسويقية، متابعة دورة حياة المهام اليومية، وإدارة حسابات وصفحات Meta (Facebook & Instagram) مع منظومة الحضور الذكي وإدارة الموارد البشرية.

---

## 🌟 الميزات والقدرات الأساسية (Core Capabilities)

### 1. منشئ وقالب كتابة الخطط التفاعلي (Interactive Plan Builder & Ingest)
- **اختيار الشهر والتسمية التلقائية**: اختيار شهر الخطة من قائمة منسدلة مسبقة الإعداد (`🗓️ شهر الخطة:`) وسحب اسم الخطة آلياً ومباشرة بصيغة `خطة [اسم العميل] — [الشهر]` (مثل: `خطة دومية — سبتمبر 2026`).
- **محرر النصوص الشبيه بـ Word (`#v-plan`)**: صياغة البوستات، الهوك (Hook)، الفيجوال (Visual Idea)، الكابشن، والريفرانس بروابط Drive أو صور مرفوعة.
- **تفريغ الخطط من Word / DOCX / Drive**: استخراج البوستات، الأعمدة، التاج لاين، والتواريخ تلقائياً وحفظها كمهام مرتبة تسلسلياً بدون أي تكرار.

### 2. محرك إدارة المهام ولوحة Kanban (Task Engine & Team Workflows)
- **الترتيب الطبيعي للبوستات**: فرز تصاعدي دقيق (`بوست #1`, `بوست #2`, ... `بوست #10`) بغض النظر عن ترتيب الإدخال.
- **تخصيص وتوزيع الأدوار**:
  - كاتب المحتوى (Content Creator): إعداد وصياغة النصوص.
  - مصمم الجرافيك والمونتير (Design & Video): تسليم التصاميم وملفات الفيديو.
  - مدير الحساب (Account Manager): المراجعة، الاعتماد، والتسليم للعميل.
- **حفظ وتوزيع الملفات سحابياً على Google Drive**: إنشاء مجلدات مخصصة لكل عميل وموظف وتوزيع الروابط تلقائياً.
- **مزامنة المواعيد**: مطابقة تاريخ النشر وموعد التسليم ثنائياً لمنع التضارب.

### 3. منظومة الحضور الذكي والـ HR (Attendance & Geofencing)
- **إثبات الحضور بالـ GPS والـ Geofence**: تحديد نطاق المقر بدقة مع معالجة الانجراف الداخلي وإتاحة الاعتماد الإداري.
- **تسجيل الحضور والانصراف بضغطة زر (1-Tap)** عبر تليجرام أو واجهة الويب.
- **تقارير الرواتب ومعدلات الإنجاز**: احتساب ساعات العمل، التأخير، وسجلات الحضور الشهرية آلياً.

### 4. الردود الذكية وإدارة صفحات Meta (Facebook & Instagram)
- استقبال الرسائل والتعليقات لحظياً.
- محرك الذكاء الاصطناعي مع Human-in-the-Loop للاعتماد البشري للردود الحساسة.
- استخراج العملاء المحتملين وتصنيفهم (Hot Leads).

---

## 🛠️ المعمارية والتقنيات المستخدمة (Tech Stack)

- **Backend**: Python 3.12, Flask, Vercel Serverless Functions.
- **Frontend**: Vanilla JavaScript (Modern ES6+ Modular), Tailwind CSS, Lucide Icons, Quill.js.
- **Database & Realtime**: Supabase (PostgreSQL) مع تخزين مؤقت ذكي في الذاكرة (In-Memory SWR Cache).
- **Cloud Integrations**: Google Drive API, Telegram Bot API, Meta Graph API (Facebook & Instagram).
- **Quality Assurance**: حزمة اختبارات `pytest` متكاملة تطبق معايير **Test Guard** و **Clean Code Guard**.

---

## 🧪 الاختبارات وضمان الجودة (Quality Assurance)

تشغيل كامل حزمة الاختبارات الآلية:
```bash
python -m pytest tests/ -v
```
- **نسبة النجاح**: 100% عبر كافة سيناريوهات استخراج الخطط، المطابقة العربية، إسناد المهام، والـ Multi-Client Scoping.

---

## 🔗 Meta App Review & Compliance URLs

- **Privacy Policy URL:** `https://metaaimoderator.vercel.app/privacy`
- **Terms of Service URL:** `https://metaaimoderator.vercel.app/terms`
- **Data Deletion Callback URL:** `https://metaaimoderator.vercel.app/api/data-deletion`
- **Data Deletion Status URL:** `https://metaaimoderator.vercel.app/deletion-status`
- **Valid OAuth Redirect URI:** `https://metaaimoderator.vercel.app/api/oauth/callback`

## 📹 Video Review Script & Guidelines
راجع `docs/app-review-video-script.md` لمشاهدة سيناريو مراجعة Meta لصلاحيات التطبيق خطوة بخطوة.
