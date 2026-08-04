# HANDOFF → Antigravity — meta_ai_moderator

> **الهدف:** تأمين التطبيق وإكمال تكامل Chatwoot وتنظيف التكرار.
> **الملف الرسمي المنشور على Vercel هو `api/index.py`** (مش `server.py`). كل الإصلاحات تتم فيه.
> نفّذ المهام بالترتيب. لكل مهمة: التغيير المطلوب + معيار القبول. متعملش أي حاجة خارج النطاق ده من غير إذن.

---

## P0 — أمني حرج (لازم الأول)

### 1. Rotate الأسرار المكشوفة (فعل بشري + كود)
الأسرار دي مرفوعة في git ولازم **تتغيّر من المصدر** ثم تتشال من الكود:
- Facebook Page Access Token (`REMOVED_SECRET...`) — `api/index.py:42`
- Instagram Token (`REMOVED_SECRET...`) — `api/index.py:43`
- Supabase `service_role` key — `api/index.py:48-49`
- Meta App Secret (`d8efb7a2...`) — `api/index.py:1881`

**الكود:** شيل كل قيمة default حقيقية. اجعلها تقرأ من الـ env فقط، وتفشل بوضوح لو ناقصة:
```python
PAGE_ACCESS_TOKEN = os.environ["PAGE_ACCESS_TOKEN"]        # بدون default
IG_USER_TOKEN     = os.environ.get("IG_USER_TOKEN", "")    # فاضي، مش توكن حقيقي
META_APP_SECRET   = os.environ["META_APP_SECRET"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
```
**القبول:** `grep -rE "EAAS|IGAAX|service_role|d8efb7a2" api/index.py` يرجّع صفر نتائج. التطبيق بيشتغل بالـ env فقط. الأسرار القديمة مبطّلة من لوحة Meta/Supabase.

### 2. شيل الباب الخلفي في الـ Auth
- `api/index.py:2062` و `:2064` — امسح `or token == "[REDACTED]"` (المكانين).
- `api/index.py:2059` — امسح الـ fallback `"secure_meta_ai_admin_token"`؛ لو `ADMIN_API_KEY` مش متظبط، ارفض كل الطلبات (fail closed).
- استخدم `hmac.compare_digest` في مقارنة التوكن بدل `==`.

**القبول:** طلب بـ `Authorization: Bearer [REDACTED]` يرجّع 401. بدون `ADMIN_API_KEY` في الـ env، كل `/api/*` المحمي يرجّع 401.

### 3. صلّح `/api/me` — بيدي أدمن لأي زائر
- `api/index.py:~2135` — امسح السطر اللي بيعمل `session['uid'] = 'admin'`. لو مفيش session، رجّع `401` بدل ما تنشئ واحدة.

**القبول:** `GET /api/me` بدون تسجيل دخول يرجّع 401، مش جلسة أدمن.

### 4. شيل الباسوردات الثابتة/الضعيفة
- `api/index.py:2031-2032` — امسح `alshamm/alshamm2026`؛ الأدمن من الـ env فقط (بدون default `admin2026`).
- `api/index.py:2114` — امسح قبول الباسوردات `("", "admin", "admin2026", "demo", "123456")`. استخدم تحقق مقابل hash مخزّن (`werkzeug.security` أو `hashlib` + salt).

**القبول:** تسجيل دخول بباسورد فاضي/`demo`/`123456` يفشل. مفيش أي credential نصّي في الكود.

### 5. فعّل التحقق الإجباري من توقيع webhook ميتا
- `api/index.py:1573` و `1557` — لو `META_APP_SECRET` فاضي: ارفض (500/401)، متعملش bypass.
- شيل قبول verify tokens الثابتة `"GET"` و `"123"` (`:1557`). اقبل بس `os.environ["VERIFY_TOKEN"]`.

**القبول:** payload من غير توقيع صحيح يترفض 403. الـ GET verification بيقبل بس التوكن الصح من الـ env.

### 6. Flask secret_key + مفتاح التشفير — بدون default
- `api/index.py:344` — `app.secret_key = os.environ["SECRET_KEY"]` بدون default.
- `api/index.py:522,532` — مفتاح تشفير التوكنز من env إجباري، بدون الـ fallback الثابت.
- `decrypt_token` (`:336-337`) — لو فشل الفك، **ارفع استثناء / رجّع None**، متـرجّعش النص المشفّر كأنه توكن.

**القبول:** بدون `SECRET_KEY` التطبيق يفشل عند الإقلاع بوضوح، مش بمفتاح معروف.

---

## P1 — أخطاء صحّة (Correctness)

### 7. Bug: dedup بيرمي باقي الـ batch
- في `webhook_event` (حوالي `api/index.py` نظير `server.py:1477,1525`) — عند اكتشاف event مكرر بيعمل `return`. غيّرها لـ `continue` عشان باقي الرسائل في نفس الـ entry تتعالج.

**القبول:** batch فيه رسالة مكررة + رسالة جديدة → الجديدة بتتعالج.

### 8. Bug: `processed_events.clear()` بيمسح كل الذاكرة
- بدل `set` + `.clear()` عند 10000، استخدم `collections.deque(maxlen=10000)` أو LRU للطرد التدريجي.

**القبول:** بعد 10001 event، أحدث الـ IDs لسه محفوظة ومفيش ردود مكررة.

### 9. State في serverless
- `pending_approvals`, `processed_events`, `stats`, `scheduled_posts` module-level مش بتفضل بين الاستدعاءات على Vercel.
- انقلها لـ Supabase (المفتاح موجود). للـ scheduler: استخدم Vercel Cron يضرب `/api/cron/*` (موجودة) بدل `threading.Thread(while True)`.

**القبول:** dedup والموافقات والـ stats تفضل بعد cold start. البوستات المجدولة بتتنشر فعلاً عبر cron.

### 10. Timeouts على requests
- `facebook_free_connector.py` — كل `requests.get/post` تاخد `timeout=8`.

**القبول:** مفيش استدعاء HTTP بدون timeout.

---

## P2 — Chatwoot (القطعة الأساسية اتعملت — محتاجة ربط واختبار)

> ✅ **تم بالفعل:** أُضيف `/api/chatwoot/webhook` + `send_private_note_via_chatwoot` في `api/index.py`
> (كومنت عام → رد تلقائي، DM → private note، dedup، تحقق اختياري بـ `CHATWOOT_WEBHOOK_SECRET`).

المتبقّي لـ Antigravity:
### 11. Env + ربط الويب هوك
ظبّط على Vercel: `CHATWOOT_URL`, `CHATWOOT_API_KEY`, `CHATWOOT_ACCOUNT_ID`, `GROQ_API_KEY`, `CHATWOOT_WEBHOOK_SECRET`.
في Chatwoot → Integrations → Webhooks: `https://<domain>/api/chatwoot/webhook?secret=<السر>`، حدث `message_created` فقط.

### 12. اختبار end-to-end
- ابعت رسالة اختبار في inbox (DM) → لازم يظهر private note باقتراح الـ AI، **ومايتبعتش تلقائي**.
- كومنت على بوست → رد تلقائي.
- تأكد إن ردودنا الصادرة (`message_type=outgoing`) بتتجاهل (مفيش loop).
- تأكد إن رسالة مكررة (نفس الـ id) بتتجاهل.

**القبول:** السلوكين شغّالين، مفيش loop، مفيش رد مكرر.

---

## P3 — تنظيف التكرار

### 13. توحيد الكود
- `server.py` نسخة قديمة شبه مكررة من `api/index.py`. قرّر: احذف `server.py` (والملفات المرتبطة اللي مش بتستخدمها Vercel) بعد نقل أي منطق فريد. حدّث `test_server.py` ليختبر `api/index.py`.
- `lib/cache-free.py`, `lib/queue-free.py` — لو مش مستوردة في `api/index.py`، احذفها.
- `insta_gateway.py`, `insta_session_bridge.py` — سكربتات `while True` مش بتشتغل على Vercel؛ انقلها لمجلد `scripts/` وشيل التوكنز منها.

**القبول:** entrypoint واحد. `grep` للأسرار في كل الريبو = صفر. التستات بتعدّي.

---

## قواعد التنفيذ لـ Antigravity
1. اشتغل على branch جديد، مش `main` مباشرة.
2. بعد كل مهمة: `python -c "import ast; ast.parse(open('api/index.py',encoding='utf-8').read())"` لازم يعدّي.
3. شغّل `python -m pytest` قبل أي commit.
4. متعملش commit لأي سر — تأكد إن `.env*` في `.gitignore` (موجود).
5. لو لقيت سر مكشوف تاني مش مذكور هنا — بلّغ، متـتجاهلوش.

---

## P4 — إعادة تحديد النطاق (المالك طلب: بلا سيلز؛ ٤ فيتشرز؛ ظبّط الموجود متبنيش من الأول)

### ✅ اتعمل بالفعل (Claude) — محتاج push + اختبار
- **شيل السيلز الوهمي** من لوحة النشاط (`templates/index.html`).
- **إصلاح باگ الإنبوكس الحرج** (`sName`/`sTime` ReferenceError) — المحادثة كانت متفتحش. + خانة الرد + CRM.
- **أبواب `/api/settings`, `/api/settings/mode`** الناقصة اتضافت.
- **تحكم AI منفصل لكل أكونت:** كل أكونت عنده `dm_mode` و `comment_mode` (auto/manual). الـ webhook بيقراهم لكل صفحة. Endpoint: `POST /api/accounts/<id>/mode` بـ `{dm_mode, comment_mode}`.
- **النشر المجدول (كامل backend):** `POST /api/scheduler` بياخد `{caption, target(fb/ig/both), drive_link, date, time}`؛ `drive_to_direct()` بيحوّل لينك درايف لتحميل مباشر؛ `publish_scheduled_post()` بينشر على FB (`/photos` أو `/feed`) و IG (media→media_publish)؛ الكرون `/api/cron/process_scheduled` بينشر البوستات المستحقة. `DELETE /api/scheduler/<id>`. الفرونت: أُضيفت خانة `post-drive-link` + `saveScheduledPost` بيبعت الـ target والدرايف. النسخ المكسورة في `views.js` (كانت بتدوّر على `sch-*`) اتشالت.

### المتبقّي لـ Antigravity (frontend فقط)
14. **UI تحكم لكل أكونت:** في صفحة الحسابات (`v-accounts`)، لكل أكونت زرّين toggle (كومنتات auto/manual + رسائل auto/manual) بينادوا `POST /api/accounts/<id>/mode`. اقرأ الحالة من `/api/accounts` (رجّع `dm_mode`/`comment_mode` في الـ payload).
15. **مبدّل الأكونتات:** `#active-client-dropdown` (`index.html`) options ثابتة → املأها من `/api/clients` أو `/api/accounts`، والإنبوكس يفلتر حسب الأكونت النشط (`/api/settings/active-client` موجود). وحّد المبدّلات التلاتة في واحد.
16. **قايمة الحسابات + عدّاد pending:** `#accounts-list` و badge `#pending-count` مش بيتحدّثوا من أي JS.

**القبول:** كل أكونت يقدر يتحكم في auto/manual لوحده، والتبديل بين الأكونتات بيفلتر الإنبوكس.

---

## P5 — Vercel (المالك طلب صراحةً إن Antigravity يتصرف مع Vercel)

1. **انشر** آخر كود على Vercel production.
2. **ظبّط Environment Variables** (بعد ما Claude شال كل الـ defaults، لازم تتحط وإلا التطبيق مش هيشتغل صح):
   `PAGE_ACCESS_TOKEN`, `META_APP_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY`, `APP_SECRET`, `SECRET_KEY`, `ADMIN_USER`, `ADMIN_PASS`, `ADMIN_API_KEY`, `CRON_SECRET`, `VERIFY_TOKEN`, `CHATWOOT_URL`, `CHATWOOT_API_KEY`, `CHATWOOT_ACCOUNT_ID`, `CHATWOOT_WEBHOOK_SECRET`.
   > الأسرار الحقيقية يحطها **المالك بنفسه** في Vercel — متكتبهاش في أي ملف.
3. **الكرون:** `vercel.json` فيه `/api/cron/process_scheduled` يومي (`0 0 * * *`). ⚠️ خطة Vercel Hobby بتسمح بكرون **يومي** كحد أقصى — يعني البوست المجدول هيتنشر عند أقرب تشغيل يومي مش بالدقيقة. لو المالك عايز دقّة بالدقيقة، لازم Vercel **Pro** + غيّر الجدول لـ `*/15 * * * *`. بلّغ المالك بالنقطة دي.
4. **git history:** لسه فيه أسرار قديمة (٢٨ موضع). نظّفها بـ `git filter-repo` قبل أي push عام، أو خلي الريبو private، والمالك يعمل rotate للأسرار.

**القبول:** الموقع لايف، الـ env متظبط، الكرون شغّال، مفيش أسرار في آخر نسخة.
