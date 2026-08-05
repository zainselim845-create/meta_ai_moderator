# Antigravity — ربط حسابات العميل بالـ OAuth (المطلوب بالظبط)

> الهدف: المالك يضيف عميل → يسجّل دخول بفيسبوك → صفحة العميل + إنستجرامها يترطوا **تحت العميل ده بالظبط**، من غير حسابات وهمية ومن غير ما "يخرّف".
> `api/index.py` هو الـ entrypoint. متبنيش من الأول — كمّل على الموجود. متعملش commit لأي توكن (`scripts/` متجاهل).

---

## ✅ اللي Claude عمله بالفعل (متعملوش تاني — بس اختبره)
- `api/clients` POST بقى **مايعملش حسابات FB/IG وهمية**. العميل يبدأ فاضي (`fb_connected=false`, `page_id=null`) ويرجّع `needs_connect:true`.
- `/api/oauth/start?client_id=<cid>` بيحفظ `session['oauth_client_id']` + cookie `oauth_client_id`.
- `/api/oauth/attach_page` بيربط الصفحة + `instagram_business_account` بالـ `oauth_client_id` الصح.
- الفرونت: **+ إضافة عميل** يطلب الاسم بس → يعمل العميل → يسأل يربط → يوجّه لـ `/api/oauth/start?client_id=<cid>`.
- مبدّل الهيدر (`#header-account-select`) = workspaces العملاء (🔵FB+🟣IG مجمّعين) + "🌐 الكل".

---

## 1) Meta App Dashboard — إعدادات إجبارية (السبب الأول لفشل الربط)
1. **Facebook Login → Settings → Valid OAuth Redirect URIs** لازم يحتوي بالظبط:
   `https://metaaimoderator.vercel.app/api/oauth/callback`
2. **App Domains**: `metaaimoderator.vercel.app`
3. **Products**: أضف **Facebook Login** و **Instagram** (Instagram Graph API) و **Messenger**.
4. **Permissions** (App Review → Advanced Access): `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging`, `pages_read_user_content`, `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`, `business_management`.
5. لو التطبيق **Development mode**: أضف المالك/العميل كـ **Tester/Admin**؛ أو حوّله **Live** بعد App Review.

**القبول:** الضغط على "ربط فيسبوك" يفتح شاشة فيسبوك، وبعد الموافقة يرجّع لـ `/?oauth=select_page` من غير `oauth=error`.

## 2) Vercel Env (إجباري للـ token exchange)
تأكد إن دول متظبطين: `META_APP_SECRET`, `META_APP_ID`, `SECRET_KEY` (للـ session/cookies), `APP_SECRET`, `VERIFY_TOKEN`, `PAGE_ACCESS_TOKEN`.
> لو `META_APP_SECRET` ناقص → `oauth=error&reason=token_exchange_failed`. لو `SECRET_KEY` ناقص → الـ session بتضيع فالـ `oauth_client_id` مايوصلش لـ attach_page.

**القبول:** `/api/health` 200، والـ callback بيكمّل من غير أخطاء token exchange.

## 3) شاشة اختيار الصفحة (page picker) — لازم تكون موجودة وشغّالة
بعد الـ callback بيعمل redirect لـ `/?oauth=select_page`. لازم الفرونت:
1. يقرأ `?oauth=select_page` عند تحميل الصفحة (في `app.js` DOMContentLoaded/checkAuth).
2. ينده `/api/oauth/pending_pages` ويعرض الصفحات في مودال.
3. عند الاختيار: `POST /api/oauth/attach_page` بـ `{page_id}` (والـ client من الكوكي/السيشن).
4. بعد النجاح: `loadClients()` + `populateAccountSwitcher()` + `loadAccounts()` + امسح `?oauth` من الـ URL.

**تأكد:** لو الدالة اللي بتعرض المودال مش موجودة/مكسورة، اعملها. ده أكتر جزء بـ"يخرّف" (الربط بينجح بس المودال مايظهرش فالصفحة متترطش).
**القبول:** بعد تسجيل الدخول، مودال بصفحات العميل يظهر، واختيار صفحة يربطها تحت العميل ويحدّث المبدّل.

## 4) السحب لكل عميل (عشان الفلترة "تظبط ومتخرّفش")
دلوقتي `/api/conversations` بيسحب من صفحة واحدة والـ threads **مالهاش `client_id`**، فالتبديل بين العملاء مابيفلترش فعلاً.
المطلوب: لكل عميل مربوط، اسحب من **توكن صفحته هو** (المخزّن في `ACCOUNTS_STORE` بـ `client_id`)، و**اوسم كل thread بـ `client_id` بتاع العميل**. كده:
- تبديل العميل في الهيدر → يعرض محادثات صفحته هو بس.
- "🌐 الكل" → يعرض الكل.

**القبول:** عميلين مربوطين بصفحتين مختلفتين → كل واحد يشوف محادثات صفحته بس، و"الكل" يعرض الاتنين.

## 5) منع "الخرفنة" — قواعد صارمة
- **ممنوع** إنشاء أي صفحة/حساب بـ ID مخترع أو `fb_connected:true` من غير توكن حقيقي.
- `fb_connected/ig_connected` = `true` **فقط** لما يبقى فيه `access_token` حقيقي متخزّن.
- لو الربط فشل، رجّع رسالة خطأ واضحة للمستخدم — متعملش fallback بحساب وهمي.
- الحسابات الوهمية القديمة في Supabase (`meta_ai_accounts`) اللي `id` بتاعها بيبدأ بـ `100821894800` بأرقام متسلسلة أو توكن فاضي — **امسحها**.

**القبول:** صفحة الحسابات ومبدّل العملاء مايعرضوش أي حساب مالوش توكن حقيقي.

---

## قواعد التنفيذ
1. Branch جديد، مش main مباشرة.
2. بعد كل تعديل: `python -c "import ast; ast.parse(open('api/index.py',encoding='utf-8').read())"` لازم يعدّي.
3. متعملش commit لأي توكن. `scripts/` و `.env*` متجاهلين — سيبهم.
4. اختبر end-to-end فعلياً (سجّل دخول بفيسبوك، اربط صفحة، بدّل عميل) قبل ما تقول "تم".
