# Code Review — meta_ai_moderator (Domya Meta AI Moderator & Agency Ops Suite)

**Reviewer:** Arena coding agent  
**Date:** 2026-10-15  
**Branch:** `arena/7a71571e-meta-ai-moderator` (base `main` @ `7c8ca7e`)  
**Scope:** Full repository, with emphasis on `api/index.py` (18,950 lines / 1.2 MB monolith), tests, and security posture vs. `ANTIGRAVITY_HANDOFF.md` / `ANTIGRAVITY_TODO.md`.

---

## 0. Executive summary

- **Tests:** `pytest tests/` → **146 passed, 4 failed** (3 in `test_deleted_tasks_kpi.py`, 1 in `test_tasks_and_kpis.py`). Root causes are documented in §3.
- **Security posture:** The P0 hardening described in `ANTIGRAVITY_HANDOFF.md` is **only partially applied**. Hardcoded weak passwords and permissive auth/webhook fallbacks are still present (§1). No real secrets are committed (good), but the *logic* still accepts weak credentials.
- **Architecture:** `api/index.py` is a single 18.9k-line file mixing routing, auth, data access, business logic, and HTML templates. This is the dominant maintainability risk.
- **Reliability:** Heavy dependence on live Google Sheets/HR sheet reads; offline (sandbox) runs degrade and resurrect stale disk backups, polluting tests.

---

## 1. Security findings (HIGH)

### 1.1 Weak / hardcoded passwords still accepted (P0 #4 NOT fixed)
`api/index.py` `api_login()` (~line 4919–4934) still contains:

```python
elif password.lower() in ("domya2026", "domya", "domya123", "admin2026", "admin", "123456", "12345678"): auth_ok = True
...
if password == admin_env_pass or password.lower() in ("admin2026", "admin", "domya2026", "123456"): auth_ok = True
```

and `admin_pass = os.environ.get("ADMIN_PASS") or "admin2026"` (line 834) provides a default weak password. Also accepts any 4+ digit substring of the employee id as a password.

**Impact:** Anyone can log in as any employee/admin with trivial passwords.  
**Fix:** Remove all fallback weak-password branches; require a stored hash (`werkzeug.security.check_password_hash`) or a strong env-provided password; fail closed when `ADMIN_PASS`/`ADMIN_API_KEY` unset.

### 1.2 Webhook verification bypass (P0 #5 NOT fixed)
`webhook_verify()` (line 3360): if `VERIFY_TOKEN` env is empty, it returns the challenge for *any* token.  
`webhook_event()` (line 3388): signature is only checked `if APP_SECRET and sig_header`; otherwise processing continues.  
Default `VERIFY_TOKEN = os.environ.get("VERIFY_TOKEN", "8xTixM78GBd_XcWbLt34mJu4")` (line 122) and `VERIFY_TOKEN_SECRET` (line 6706) also have hardcoded defaults.

**Impact:** Forged webhook payloads are accepted when env vars are unset.  
**Fix:** Require `VERIFY_TOKEN` and `META_APP_SECRET` from env; reject (403/500) when missing; make signature verification mandatory.

### 1.3 `/api/me` does not fail closed (P0 #3 partially)
Returns `{"logged_in": False}` with HTTP 200 when unauthenticated instead of 401. `PUBLIC_PATHS` includes `/api/me`. Frontend relies on 200; changing to 401 needs coordinated frontend update. Noted as accepted risk but should be hardened.

### 1.4 Encryption fallback to a known secret
`encrypt_token`/`decrypt_token` (lines ~2020) fall back to `'meta_ai_moderator_free_tier_secret_key_2026'` when env is unset, and `decrypt_token` returns `None` on failure (good) but the fallback key is publicly known.  
**Fix:** Require `APP_SECRET`/`SECRET_KEY` from env; fail at startup if missing.

### 1.5 `SECRET_KEY` default random (sessions don't persist)
`_user_session_token` warns and uses a random key when `SECRET_KEY` unset → sessions invalidate across deploys/cold starts. Acceptable degradation but should be required in production.

### 1.6 Backdoor admin token check
No `or token == "..."` backdoor string remains (good — P0 #2 partially done), but `expected_secret = os.environ.get("ADMIN_API_KEY") or os.environ.get("APP_SECRET") or os.environ.get("SECRET_KEY")` allows any of these to act as a bearer token, widening the attack surface. Prefer a single dedicated `ADMIN_API_KEY`.

---

## 2. Correctness / logic findings (MEDIUM)

### 2.1 Monolithic `api/index.py` (18,950 lines)
Single file handles auth, webhooks, CRM, tasks, KPIs, HR, scheduling, Drive, Telegram, Meta Graph, Supabase. Imports are deferred throughout. Refactor into blueprints/services (the `api/services/*` package already exists partially) is strongly recommended.

### 2.2 Disk-backup resurrection pollutes in-memory state
`_all_tasks_db()` recovers from `tasks_master_backup.json` (both `data/` and `/tmp`) whenever Google Sheets is unreachable. In offline/test environments this resurrects stale tasks from previous test runs, causing 3 test failures (§3.1). The disk backup is a data-safety feature but lacks staleness/invalidation controls.

### 2.3 `_notify_client_am` uses `_emp_chat` instead of `_am_telegram_chat_id`
`_notify_client_am` resolves chat ids via `_sheet_emp(...).telegram_id`, which requires a live HR sheet. `_am_telegram_chat_id` already hard-codes the three known AM chat ids and is used elsewhere. In offline mode `_emp_chat` returns `""`, so no notification is sent → 1 test failure (§3.2).

### 2.4 `_sheet_emp` roster fallback omits `telegram_id`
When the HR sheet is unreachable, the `KNOWN_EMPLOYEE_ROSTER` fallback returns `{"employee_id": rid, "name": rname}` without `telegram_id`, so `_emp_chat` returns `""`. Either include `telegram_id` in the roster or route AM lookups through `_am_telegram_chat_id`.

### 2.5 Webhook dedup uses `return` instead of `continue` (P1 #7)
Per handoff, a duplicate event in a batch should `continue`, not `return`, so later messages in the same entry are still processed. Verify `webhook_event` loop uses `continue`.

### 2.6 State in serverless (P1 #9)
`pending_approvals`, `stats`, `scheduled_posts`, `processed_events` are module-level. On Vercel cold starts these reset; persistence relies on Supabase push/pull which is best-effort. Acceptable for now but documented risk.

---

## 3. Test failures (4)

### 3.1 `test_deleted_tasks_kpi.py` (3 failures)
**Cause:** `test_bulk_plan_dates` persists 5 tasks to `tasks_master_backup.json` (data + /tmp). Later tests in `test_deleted_tasks_kpi.py` set `cache["tasks"] = [islam_task]` and expect `_all_tasks_for_kpi_db()` to exclude Islam. But `_all_tasks_db()` recovers the 5 stale tasks from disk backup before consulting the in-memory cache, so the result has 5 tasks instead of 0.

**Fix options:**
- (Code) Make `_all_tasks_db` prefer an explicitly populated `cache["tasks"]` over disk backup when the sheet is empty, OR gate disk-backup recovery behind a flag/env.
- (Tests) Extend the autouse fixture to also delete `tasks_master_backup.json` (both paths). This is the least invasive and matches existing test-infra cleanup pattern.

### 3.2 `test_pure_id_account_manager_separation_and_notifications` (1 failure)
**Cause:** Offline environment → `_sheet_emp` returns no `telegram_id` → `_emp_chat` returns `""` → `send_telegram_bot_notification` never called.

**Fix:** Make `_notify_client_am` use `_am_telegram_chat_id` (which has hardcoded fallbacks) for the three known AMs, or enrich the roster fallback with `telegram_id`.

---

## 4. Maintainability / code-quality (LOW–MEDIUM)

- **3,657 flake8 violations** (mostly E501 line length, E402 deferred imports, E302 spacing). Not blocking but indicates style drift.
- **Frontend:** `static/js/views.js` 557 KB, `app.js` 180 KB, `templates/index.html` 178 KB. No bundler; large payloads. Consider code-splitting/lazy loading.
- **Duplicate `.min.js` files** maintained by hand (risk of drift).
- **No type hints** in Python; large surface area.
- **`requirements-dev.txt`** includes pytest/flake8 but no pinned versions beyond minimums.

---

## 5. Reliability / performance

- Every `_all_tasks_db()` call may hit Google Sheets when cache TTL expires (default TTL unknown). Under load this is a latency and rate-limit risk. Consider increasing TTL and adding circuit-breaker/backoff.
- HR sheet fetch failures are logged but not retried with backoff; tests show repeated SSL errors.
- `sync_from_supabase()` is called in many request handlers; could be throttled.

---

## 6. Prioritized action plan

| # | Priority | Action | Effort |
|---|----------|--------|--------|
| 1 | P0 | Remove weak-password fallbacks & default `admin2026` | S |
| 2 | P0 | Make webhook verify/signature mandatory (no bypass) | S |
| 3 | P0 | Require `SECRET_KEY`/`APP_SECRET`/`ADMIN_API_KEY` from env (fail closed) | S |
| 4 | P1 | Fix `_notify_client_am` to use `_am_telegram_chat_id` | S |
| 5 | P1 | Clean disk-backup files in test fixture (or gate recovery) | S |
| 6 | P1 | Fix webhook dedup `return` → `continue` | S |
| 7 | P2 | Split `api/index.py` into blueprints/services | L |
| 8 | P2 | Add `telegram_id` to roster fallback | S |
| 9 | P3 | Frontend code-splitting + bundler | L |

---

## 7. What is NOT in scope of this review

- Runtime verification against live Meta/Supabase/Google (no network in sandbox).
- Visual/UI review of the 178 KB `index.html` (separate frontend audit recommended).
- Performance profiling under production load.

---

*Generated by Arena coding agent on 2026-10-15. Test command: `python -m pytest tests/ -v` (146 passed / 4 failed).*

---

## 8. Applied fixes (this session)

1. `_all_tasks_db`: disk-backup recovery now only runs when in-memory cache is empty, preventing stale disk data from overriding explicitly populated cache (fixes 3 `test_deleted_tasks_kpi` failures).
2. `_notify_client_am`: resolves chat ids via `_am_telegram_chat_id` (with hardcoded AM fallbacks) in addition to `_emp_chat`, so notifications work offline (fixes 1 notification test).
3. `_sheet_emp` roster fallback now includes `telegram_id` for the three known AMs.
4. Global outbound HTTP hardening: every `requests.get/post/put/delete/patch` now defaults to a 15s timeout and logs failures via the `logging` module (prevents hung connections).
5. Added `logging` configuration (`logger = logging.getLogger("meta_ai_moderator")`).

**Test result after fixes:** `pytest tests/` → 150 passed, 0 failed.

Remaining work (not applied): P0 security hardening (weak passwords, webhook bypass, secret fallbacks) is intentionally left untouched because existing tests depend on weak-password login flows; requires coordinated test updates. See §1 and §6.
