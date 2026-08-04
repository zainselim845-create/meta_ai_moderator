# Antigravity — المطلوب بالظبط (محدّث)

> الكود اتظبط ونُشر، والأسرار اتشالت من الكود ومن الـ git history بالكامل.
> `api/index.py` هو الـ entrypoint الوحيد. متبنيش من الأول — كمّل على الموجود.
> الملفات اللي اتغيّرت آخر مرة: `api/index.py`, `templates/index.html`, `static/js/{app,inbox,views}.js`.

---

## 0) خلفية سريعة (اللي خلص — متعملوش تاني)
- ✅ أمان: كل التوكنز/الباك دور اتشالت من الكود؛ الـ git history اتنضّف (filter-repo + force push).
- ✅ عزل لكل عميل: KB/rules/prompt بتتفلتر بـ `client_id`؛ تبديل العميل بيغيّر كل الداتا.
- ✅ تحكم AI منفصل لكل أكونت: `dm_mode`/`comment_mode` على كل أكونت + `POST /api/accounts/<id>/mode` + أزرار UI.
- ✅ نشر مجدول: `POST /api/scheduler` (drive_link/caption/target/date/time) + `publish_scheduled_post()` + cron `/api/cron/process_scheduled`.
- ✅ webhook آمن: `VERIFY_TOKEN` لازم يطابق، والتوقيع إجباري لما `APP_SECRET` متظبط.

---

## 1) Vercel — Environment Variables (أهم خطوة)
حُط المتغيرات دي في **Vercel → Project → Settings → Environment Variables (Production)**.
القيم موجودة في ملف `.env.local` على جهاز المالك (متجاهل في git). **الأسرار الحقيقية يحطها المالك بنفسه.**

مطلوب عشان التطبيق يشتغل:
```
PAGE_ACCESS_TOKEN      (من Meta — بعد rotate)
META_APP_SECRET        (من Meta — بعد rotate)
SUPABASE_URL           (موجود في .env.local)
SUPABASE_KEY           (من Supabase — بعد reset)
GROQ_API_KEY           (console.groq.com — مجاني)
APP_SECRET             (متولّد في .env.local)
SECRET_KEY             (متولّد)
ADMIN_USER=admin
ADMIN_PASS             (متولّد — ده اللي بيسجّل بيه دخول)
ADMIN_API_KEY          (متولّد)
CRON_SECRET            (متولّد)
VERIFY_TOKEN           (متولّد — نفسه في Meta webhook)
```
اختياري (Chatwoot لو هيتستخدم): `CHATWOOT_URL`, `CHATWOOT_API_KEY`, `CHATWOOT_ACCOUNT_ID`, `CHATWOOT_WEBHOOK_SECRET`.

**بعد الحفظ: أعد النشر** (`vercel --prod`) عشان الـ env يسري.

---

## 2) Meta App / Business — إعداد الويب هوك
1. developers.facebook.com → التطبيق → **Webhooks**:
   - Callback URL: `https://metaaimoderator.vercel.app/webhook`
   - Verify Token: **نفس قيمة `VERIFY_TOKEN`** بالظبط.
   - Subscribe fields: `messages`, `messaging_postbacks`, `feed` (للكومنتات), و Instagram: `comments`, `messages`.
2. اربط الصفحة (Domya) + Instagram Business في الـ App.
3. **App Review / Permissions**: `pages_messaging`, `pages_read_engagement`, `pages_manage_metadata`, `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`.
4. لو التطبيق في وضع Development → حوّله **Live** بعد الاختبار.

**معيار القبول:** GET `/webhook?hub.mode=subscribe&hub.verify_token=<VERIFY_TOKEN>&hub.challenge=123` يرجّع `123`. توكن غلط يرجّع 403.

---

## 3) اختبار end-to-end (بعد الـ env)
- ابعت DM للصفحة → يظهر في الإنبوكس، والرد يشتغل حسب `dm_mode` بتاع الأكونت (auto = يرد فوراً / manual = مسودة تنتظر موافقة).
- اكتب كومنت على بوست → حسب `comment_mode`.
- بدّل العميل من الهيدر → لازم الإنبوكس + KB + القواعد كلها تتغيّر.
- جرّب النشر المجدول: لينك درايف (مشاركة "أي شخص لديه الرابط") + كابشن + وقت → اتأكد إنه اتنشر عند تشغيل الكرون.

---

## 4) متبقّي بسيط في الفرونت (اختياري)
- `#accounts-list` و badge `#pending-count` في `index.html` مش بيتحدّثوا من أي JS — اربطهم بـ `/api/accounts` و عدد `pending_approvals`.

---

## 5) ملاحظات مهمة
- **Rotate إجباري:** الأسرار القديمة كانت مكشوفة علناً — المالك لازم يغيّرها من Meta و Supabase (مش شغل كود).
- **جدولة Vercel Hobby = كرون يومي كحد أقصى.** للنشر بالدقيقة: خطة Pro + غيّر `vercel.json` لـ `*/15 * * * *`.
- متعملش commit لأي سر. `.env*` متجاهل — سيبه كده.
- بعد أي تعديل: `python -c "import ast; ast.parse(open('api/index.py',encoding='utf-8').read())"` لازم يعدّي.
