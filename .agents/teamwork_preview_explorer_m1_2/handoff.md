# Audit Report & Handoff — Backend Security, Chatwoot & Git Audit (Explorer 2)

## 1. Observation

Direct observations from codebase inspection across `C:\Users\mhmd\meta_ai_moderator`:

### R2 / R3 / R4 / R5 Audit Matrix

| Item # | Audit Category | Exact File Path & Line Numbers | Observed Code / Findings | Status vs Target |
|---|---|---|---|---|
| **1** | **`instagrapi` Deprecation Search** | `server.py` (0 matches)<br>`add_insta_bridge_route.py`:5,18,39,52,56<br>`insta_session_bridge.py`:3,19,21,74<br>`api/index_old_git.py`:1155,1168,1189,1202,1206<br>`api/index.py`:2249 (`"instagrapi_count": 0`) | `server.py` contains **0** `instagrapi` references (Passed for core server). However, standalone legacy bridge scripts (`add_insta_bridge_route.py`, `insta_session_bridge.py`, `api/index_old_git.py`) still import `from instagrapi import Client`. | ⚠️ Partial Pass (`server.py` clean; legacy files contain `instagrapi`) |
| **2** | **Hardcoded Credentials Search** | `server.py`:22-29 (`PAGE_ACCESS_TOKEN`, `GROQ_API_KEY`, `SUPABASE_KEY`) <br>`templates/index.html`:351, 2417, 2430-2439, 2464 | `templates/index.html` contains hardcoded demo credentials `domya` / `domya2026` in `quickDemoLogin()` and auth inputs. `server.py` has fallback tokens hardcoded in variables instead of environment-only resolution. | ❌ Action Required (Target: 0 hardcoded credentials) |
| **3** | **LRU Cache Implementation** | `server.py`:98-105, 130-170, 200-220 | In-memory cache uses a standard Python `dict` (`cache = {"kb": ..., "rules": ...}`) with background Supabase sync. Does not use `functools.lru_cache` or `collections.OrderedDict` LRU eviction pattern. | ⚠️ Needs Refactoring to LRU Data Structure |
| **4** | **Web Crypto AES-256-GCM & State+PKCE OAuth** | `templates/index.html`:303-308, 936 | `loginFromChatwoot()` sets `&state=free` in OAuth query string, but does NOT include PKCE `code_challenge` / `code_challenge_method`. Line 936 contains UI text `Token: EAAS7X ... 4fA9 (AES-GCM)` but Web Crypto API (`window.crypto.subtle`) is not wired up for client-side encryption. | ❌ Action Required (Missing PKCE parameters & Web Crypto implementation) |
| **5** | **Endpoint Authentication & Compliance Status** | `server.py`:515-888 (`/api/stats`, `/api/toggle`, `/api/approve`, `/api/upload_doc`) <br>`server.py`:891-915 (`/webhook`) | Admin API endpoints (`/api/*`) are currently public without auth guard headers (return `200 OK` unauthenticated). `/webhook` GET returns `403` on token mismatch and `200` on valid `hub.verify_token` check. | ❌ Action Required (Security endpoints must return `401 Unauthorized` when unauthenticated) |
| **6** | **Chatwoot Connector Implementation** | `templates/index.html`:303-308 | Function is named standalone `loginFromChatwoot()`, rather than modular object method `FacebookFreeConnector.getLoginUrl()`. | ⚠️ Signature Refactoring Required |
| **7** | **Dynamic Lead Scoring Logic** | `templates/index.html`:310-318 | `calculateLeadScore(message, historyCount)` exists in JS (Base 25 + keyword weights for prices/intent/budget/history, max 100). | ✅ Functional in Frontend |
| **8** | **Sales Dashboard Metrics & Backend Cron Scheduler** | `templates/index.html`:649, 660, 671<br>`server.py` | UI displays static cards for `14` leads, `5 🔥` hot, `30k EG` expected revenue. `server.py` lacks a backend cron/scheduler thread (e.g. `APScheduler` or timer loop) for executing scheduled post actions. | ⚠️ Needs Backend Cron Loop Integration |
| **9** | **Git Repository State & Baseline Commit** | Current Branch: `main`<br>Baseline Commit: `2d69fd2 Initial: Last known good effective form - 25KB 5 views verification white 8 controls - Before trash`<br>Latest Commit: `712d0c7 feat(master-v4)...` | Existing local git branches:<br>- `backend/secure-free`<br>- `feature/chatwoot-free-integration`<br>- `feature/lead-generation-effective`<br>- `frontend/clean-ui`<br>- `main` (active)<br>- `qa/final-verification` | ✅ Identified Baseline & Branch Topography |

---

## 2. Logic Chain

1. **`instagrapi` Verification**: Executing pattern matching across all `.py` files confirmed `server.py` is 100% free of `instagrapi`. However, `add_insta_bridge_route.py`, `insta_session_bridge.py`, and `api/index_old_git.py` retain imports. To ensure 0 `instagrapi` risk, legacy bridge scripts should be purged or replaced with Meta Graph API endpoints.
2. **Hardcoded Credentials**: `templates/index.html` contains direct plaintext authentication defaults `username: 'domya', password: 'domya2026'` in `quickDemoLogin()`. In production/audit compliance, these values must be injected via dynamic state or environment configuration rather than inline JavaScript string literals.
3. **Caching Layer**: `server.py` relies on standard `dict` lookups. To guarantee memory safety under heavy request volume on free-tier compute without Redis, wrapping dynamic lookups using `functools.lru_cache(maxsize=128)` or a bounded LRU structure is required.
4. **OAuth Security (State + PKCE + Web Crypto)**: Meta OAuth redirection currently passes `&state=free`. Adding `code_challenge` generation via SHA-256 Digest (PKCE) ensures resistance against authorization code interception attacks. Token storage in browser session memory needs active `crypto.subtle.encrypt` calls using AES-GCM.
5. **Endpoint Authorization Matrix**: Admin `/api/*` endpoints currently lack request authorization headers (e.g., Bearer tokens or session validation). Decorator `@require_auth` returning `401 Unauthorized` for missing/invalid tokens is necessary for R4 compliance.
6. **Chatwoot Connector Namespace**: Structuring the login helper under `const FacebookFreeConnector = { getLoginUrl: () => ... }` aligns the code with modular JS connector design patterns.
7. **Cron Scheduler**: For post scheduling (Domya Scheduler), `server.py` needs a background thread or `APScheduler` daemon to poll pending scheduled items and publish them asynchronously.

---

## 3. Caveats

- **Read-Only Scope**: This audit was strictly read-only. No code modifications were executed in target project files during this inspection.
- **Frontend vs Backend Split**: Lead scoring calculation (`calculateLeadScore`) currently executes on the client-side JavaScript layer. Moving or duplicating this scoring engine into `server.py` will allow automated backend lead classification during webhook payload processing.
- **Supabase Connectivity**: `server.py` includes fallback keys for Supabase API calls. In restricted production environments, these should strictly originate from environment variables (`os.environ`).

---

## 4. Conclusion & Actionable Recommendations

### Key Findings Summary:
1. `server.py` is clean of `instagrapi`, but legacy helper Python scripts should be cleaned up.
2. Hardcoded frontend credentials (`domya2026`) in `templates/index.html` need removal.
3. `/api/*` management routes require a `@require_auth` guard returning `401 Unauthorized`.
4. Chatwoot OAuth flow needs PKCE (`code_verifier` / `code_challenge`) and namespace wrapping (`FacebookFreeConnector.getLoginUrl()`).
5. Web Crypto AES-256-GCM encryption helper needs to be connected to token storage in JavaScript.
6. Backend cron scheduler loop should be added to `server.py` for automated scheduling execution.

---

## 5. Verification Method

To verify these findings independently:

```powershell
# 1. Verify instagrapi in server.py
Select-String -Path "C:\Users\mhmd\meta_ai_moderator\server.py" -Pattern "instagrapi"

# 2. Check hardcoded credentials in index.html
Select-String -Path "C:\Users\mhmd\meta_ai_moderator\templates\index.html" -Pattern "domya2026"

# 3. Inspect endpoints auth in server.py
Select-String -Path "C:\Users\mhmd\meta_ai_moderator\server.py" -Pattern "@app.route"

# 4. Check Git status and baseline commit
git status
git log -n 5 --oneline
```
