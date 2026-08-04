# TEST_INFRA.md — E2E Testing Track Infrastructure Specification
**Meta AI Social Moderator**
**Version:** 2.0.0
**Target Environment:** Offline E2E Automated Test Suite (`unittest`)

---

## 1. Feature Inventory

The Meta AI Social Moderator is an automated multi-channel moderation engine and Web Dashboard designed for Meta platform social interactions (Facebook & Instagram). The following feature inventory lists all system capabilities requiring E2E test coverage:

### 1.1 Webhook & Multi-Channel Event Parser
- **Verification (`GET /webhook`)**: Challenge-response handshake verifying `hub.verify_token` against server `VERIFY_TOKEN` and returning `hub.challenge`.
- **HMAC Signature Validation (`X-Hub-Signature-256`)**: Validates SHA256 HMAC payload signatures when `APP_SECRET` is configured.
- **Facebook Messenger DM (`object: "page"`, `messaging`)**: Parses direct messages, increments stats, routes query to rule/RAG/AI engine, and posts reply via Graph API (`POST /me/messages`).
- **Facebook Feed Comment (`object: "page"`, `changes`)**: Parses public post comments, checks trigger rules for comment + private DM responses, posts public reply (`POST /{comment_id}/comments`), and logs activity.
- **Instagram DM (`object: "instagram"`, `messaging`)**: Parses Instagram inbox DMs, routes queries, and dispatches direct messages.
- **Instagram Comment (`object: "instagram"`, `changes`)**: Parses Instagram post comments (`field: "comments"`), extracts author and text, and dispatches public and private comment replies.
- **Comment-to-DM Private Reply Dispatch**: Automatically triggers private inbox message (`POST /{comment_id}/private_replies`) when a comment matches a rule configured with a `private_response`.

### 1.2 Supabase & RAG Engine
- **Supabase REST Storage Key CRUD**: Manages dynamic system state across three keys (`meta_ai_kb`, `meta_ai_rules`, `meta_ai_system_prompt`) using Supabase REST API (`/rest/v1/app_settings`).
- **Keyword & TF-IDF RAG Engine**: Computes search score across knowledge base entries for query terms, returning top matching Q&A pairs for prompt augmentation.
- **Local JSON Fallback**: Automatically falls back to reading `knowledge_base.json` or `DEFAULT_KB` when Supabase is unreachable or unconfigured.
- **Multi-Provider AI Fallback**:
  1. **Groq API**: Primary LLM (`llama-3.3-70b-versatile`).
  2. **OpenRouter API**: Secondary LLM (`meta-llama/llama-3.3-70b-instruct`).
  3. **Local RAG / Smart Offline Mock**: Fallback direct answer generation when cloud AI providers are unconfigured or unavailable.

### 1.3 Web Dashboard & REST APIs
- **Frontend UI (`GET /`)**: Renders main HTML dashboard (`index.html`).
- **SSE Live Log Stream (`GET /api/logs/stream`)**: Server-Sent Events endpoint streaming real-time interaction logs to connected clients.
- **Interactive Simulator (`POST /api/simulate`)**: Tests message input against rules, RAG, and AI providers, returning response content and attribution metadata (`source`: `rule`, `rag`, `llm_groq`, `llm_openrouter`, `fallback`).
- **Knowledge Base REST API (`GET/POST/PUT/DELETE /api/kb`)**: Complete CRUD operations for knowledge base entries.
- **Rules REST API (`GET/POST/PUT/DELETE /api/rules`)**: Complete CRUD operations for trigger rules (trigger word, public response, private response, match type).
- **System Prompt REST API (`GET/POST/PUT /api/prompt`)**: Retrieves and updates system prompt configuration.
- **System Statistics (`GET /api/stats`)**: Returns live activity counters (DMs, comments, AI calls, KB count, rules count, Supabase status).

---

## 2. 4-Tier Test Strategy

To guarantee zero regression, total offline execution, and robust validation, the test suite implements a 4-Tier Testing Architecture:

```
+-------------------------------------------------------------------+
|                   TIER 4: Real-World Scenarios                    |
|       (Multi-user workflow, Supabase outage fallback)            |
+-------------------------------------------------------------------+
|              TIER 3: Cross-Feature Interactions                    |
|    (Webhook comment -> Rule -> DM autoresponder -> SSE log)       |
+-------------------------------------------------------------------+
|               TIER 2: Boundary & Edge Cases                       |
|   (Malformed payloads, unicode, SQL/XSS injection, 404 routes)   |
+-------------------------------------------------------------------+
|              TIER 1: Feature Coverage (Unit & REST)               |
|  (Webhook GET/POST 4 channels, Supabase CRUD, RAG, AI, REST APIs) |
+-------------------------------------------------------------------+
```

---

### Tier 1: Feature Coverage (Unit & REST Interface Tests)
Validates that every individual component and API endpoint produces correct outputs for expected inputs.

1. **Webhook GET Verification**:
   - `test_webhook_verification_success`: Valid token returns 200 OK with challenge string.
   - `test_webhook_verification_invalid_token`: Incorrect token returns 403 Forbidden.
   - `test_webhook_verification_missing_params`: Missing mode/token returns 403 Forbidden.

2. **Webhook POST across 4 Channels**:
   - `test_webhook_post_facebook_dm`: FB Messenger DM payload triggers DM reply dispatch.
   - `test_webhook_post_facebook_comment`: FB Comment payload triggers comment reply dispatch.
   - `test_webhook_post_instagram_dm`: IG DM payload (`object: instagram`) triggers DM reply dispatch.
   - `test_webhook_post_instagram_comment`: IG Comment payload (`field: comments`) triggers comment reply dispatch.

3. **Comment-to-DM Private Reply Dispatch**:
   - `test_comment_to_dm_private_reply`: Comment matching a rule with `private_response` triggers both public comment reply and private DM reply (`POST /{comment_id}/private_replies`).

4. **Supabase Storage Key CRUD**:
   - `test_supabase_get_set_setting`: `get_setting` and `set_setting` helper functions interact properly with headers and endpoints.

5. **RAG Engine Matching & Local Fallback**:
   - `test_rag_search_matching`: Query matching KB question returns context snippet.
   - `test_rag_search_no_match`: Unrelated query returns empty string.
   - `test_rag_local_json_fallback`: RAG engine reads from `knowledge_base.json` when Supabase is disabled.

6. **AI Provider Pipeline**:
   - `test_ai_provider_groq_success`: Groq API returns formatted completion when key is set.
   - `test_ai_provider_openrouter_fallback`: OpenRouter API is called when Groq fails or is unconfigured.
   - `test_ai_provider_offline_fallback`: Offline mock fallback works cleanly when no LLM key is present.

7. **Dashboard REST APIs**:
   - `test_dashboard_index`: `GET /` returns HTML status 200.
   - `test_api_stats`: `GET /api/stats` returns metrics JSON.
   - `test_api_logs_stream`: `GET /api/logs/stream` returns SSE content stream (`text/event-stream`).
   - `test_api_simulate`: `POST /api/simulate` evaluates query and returns response with attribution metadata.
   - `test_api_kb_crud`: GET, POST, PUT, DELETE operations on `/api/kb`.
   - `test_api_rules_crud`: GET, POST, PUT, DELETE operations on `/api/rules`.
   - `test_api_prompt_crud`: GET, POST, PUT operations on `/api/prompt`.

---

### Tier 2: Boundary & Edge Cases
Examines system resilience against unexpected, malformed, or malicious inputs.

1. **Malformed Payloads & Webhook Edge Cases**:
   - `test_webhook_empty_payload`: Empty JSON `{}` returns 200 OK without crashing.
   - `test_webhook_non_json_body`: Plain text body returns 200 OK / non-500 handled response.
   - `test_webhook_missing_required_fields`: Payload missing `sender.id` or `message.text` handles gracefully.
   - `test_webhook_invalid_hmac_signature`: Incorrect `X-Hub-Signature-256` header returns 403.

2. **RAG & Search Boundary Cases**:
   - `test_rag_search_empty_query`: Empty/spaces string returns empty string.
   - `test_rag_search_special_characters`: Query with regex special characters (`.*+?^${}()|[]\`) handles without crash.
   - `test_rag_search_unicode_arabic`: Complex Arabic text with diacritics processes correctly.

3. **REST API Edge & Security Cases**:
   - `test_api_404_route`: Requesting non-existent endpoint `/api/unknown` returns 404.
   - `test_api_delete_nonexistent_item`: Deleting invalid ID (`/api/kb/99999`) handles gracefully.
   - `test_api_update_nonexistent_rule`: Updating non-existent rule returns 404 error.
   - `test_api_sql_xss_injection`: Script tags `<script>alert(1)</script>` in rule trigger/response sanitize/store safely.

---

### Tier 3: Cross-Feature Interaction Tests
Validates end-to-end integration workflows spanning multiple server modules.

1. **Comment Event to Private Autoresponder & Live SSE Log**:
   - `test_cross_feature_comment_rule_dm_sse`: Incoming comment -> custom rule match -> public comment reply -> private DM inbox message -> activity log entry -> SSE log stream update -> stats counter increment.

2. **Dynamic REST KB Update to RAG Search to Webhook AI Reply**:
   - `test_cross_feature_kb_update_rag_reply`: POST `/api/kb` adds a new service Q&A -> subsequent Webhook DM query matches new KB item -> RAG generates updated answer.

3. **Dynamic System Prompt REST Update to LLM Ingestion**:
   - `test_cross_feature_prompt_update_llm`: POST `/api/prompt` updates system prompt -> AI reply generator incorporates updated prompt in LLM request.

---

### Tier 4: Real-World Scenario Simulations
Simulates actual production operation conditions and disaster recovery flows.

1. **Multi-User Multi-Channel Social Moderation Workflow**:
   - `test_realworld_multi_user_workflow`:
     - User A sends FB Messenger DM inquiring about services -> AI generates response.
     - User B posts FB comment with price keyword -> Custom rule triggers public reply + private DM reply.
     - User C posts IG comment -> RAG matches answer.
     - Dashboard stats reflect 2 DMs, 2 Comments, and accurate log history.

2. **Cloud Network Outage & Supabase Resilience**:
   - `test_realworld_network_outage_resilience`:
     - Supabase REST returns 500 error / connection timeout.
     - Groq / OpenRouter API calls raise ConnectionError.
     - Server gracefully falls back to local `knowledge_base.json` and standard offline fallback message without raising unhandled exceptions or returning 500.

---

## 3. Mocking & Isolation Architecture

To ensure all unit and E2E tests run **100% offline** without real network dependencies:

1. **Graph API Calls (`requests.post`)**: Mocked with `unittest.mock.patch('requests.post')` to return synthetic HTTP 200 responses for `/me/messages`, `/{comment_id}/comments`, and `/{comment_id}/private_replies`.
2. **Supabase REST Calls (`requests.get` / `requests.post`)**: Mocked or intercepted via `patch('server.get_setting')` and `patch('server.set_setting')` to prevent external database connections during testing.
3. **Groq & OpenRouter AI APIs**: Mocked using `patch('server._call_groq')` and `patch('server._call_openrouter')` to return realistic text completions.
4. **Flask Client Isolation**: Standard `app.test_client()` used in `setUp()` to isolate HTTP requests within the test runner process.

---
*Document maintained by Worker 1 (Milestone 2 - E2E Testing Track Infrastructure)*
