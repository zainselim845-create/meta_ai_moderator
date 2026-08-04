# Adversarial AI & Edge Case Testing Analysis Report

**Target Project:** Meta AI Social Moderator (`C:\Users\mhmd\meta_ai_moderator`)  
**Tester:** Challenger 2 (Empirical Challenger)  
**Date:** 2026-07-26  
**Execution Environment:** Windows Python 3.12, Flask 3.x, `unittest` framework  

---

## 1. Executive Summary & Overall Risk Assessment

**Overall Risk Assessment:** **HIGH / CRITICAL**

Empirical adversarial testing of the Meta AI Social Moderator codebase (`server.py`) revealed:
1. **Critical Security Vulnerability (HMAC Bypass)**: Missing `X-Hub-Signature-256` header on POST `/webhook` completely bypasses HMAC signature validation when `APP_SECRET` is configured.
2. **High Severity Denial-of-Service / Server Crash**: Sending JSON non-dict payloads (e.g., `[1, 2, 3]`) to POST/PUT REST endpoints (`/api/kb`, `/api/rules`, `/api/prompt`, `/api/simulate`, `/api/test`) raises unhandled `AttributeError` exceptions, crashing requests with HTTP 500.
3. **Medium Severity RAG Match Quality Bug (Stop-Word False Positives)**: Arabic 2-letter stop words `"ما"` and `"هي"` match KB questions like `"ما هي خدمات..."`, causing unrelated out-of-domain queries (e.g. `"ما هي عاصمة فرنسا؟"`) to falsely return agency services context instead of triggering fallback.
4. **AI Failover Chain**: Fully verified as robust. Handles Groq HTTP 500, Groq timeouts, malformed JSON, and OpenRouter failures with smooth degradation down to RAG Direct Answer and Mock Fallback.
5. **Zero Hallucination**: Guaranteed deterministic fallback text when context is empty and AI providers are unavailable/unconfigured.

---

## 2. Task 1: RAG Keyword Search & Context Scoring (Short 2-Letter Queries)

### 2.1 Empirical Results for Short 2-Letter Queries
Empirical testing was conducted against knowledge base entries using queries: `"AI"`, `"UI"`, `"DM"`, `"كم"`, and `"اي"`.

| Query | Extracted Words | Search Mode (`len == 2`) | Match Result | KB Item Matched | Score | Quality Assessment |
|---|---|---|---|---|---|---|
| `"AI"` | `['ai']` | `w in text_words` | MATCH | Item 1 ("...بوتات الذكاء الاصطناعي AI") | 1 | PASS — Correct standalone token match |
| `"UI"` | `['ui']` | `w in text_words` | MATCH | Item 3 ("...خدمات تصميم واجهات المستخدم UI") | 1 | PASS — Correct standalone token match |
| `"DM"` | `['dm']` | `w in text_words` | MATCH | Item 4 ("...إرسال رسالة مباشرة DM") | 1 | PASS — Correct standalone token match |
| `"كم"` | `['كم']` | `w in text_words` | MATCH | Item 2 ("كم سعر باقات...") | 1 | PASS — Correct Arabic token match |
| `"اي"` | `['اي']` | `w in text_words` | NO MATCH | None | 0 | PASS — Correctly returns empty string when token absent |

### 2.2 Identified RAG Failure Modes & Edge Cases

1. **Exact Token Requirement vs Substring Asymmetry (`len == 2` vs `len > 2`)**:
   - In `search_kb(query)`:
     ```python
     if len(w) == 2:
         if w in text_words:
             score += 1
     else:
         if w in text:
             score += 1
     ```
   - **Behavior**: A 2-letter query like `"كم"` uses `w in text_words` (exact token match), so querying `"كم"` against a KB entry containing `"بكم تكلفتكم؟"` returns `0` matches (`search_kb("كم") == ""`). However, a 3-letter query like `"بكم"` uses `w in text` (substring match), successfully matching `"بكم"`. This creates inconsistent matching behavior for 2-letter vs 3-letter queries.

2. **Incomplete Punctuation Stripping for 2-Letter Tokens**:
   - `text_words` is computed via:
     ```python
     text_words = [tw.strip(".,!?()\"':;") for tw in text.split()]
     ```
   - **Behavior**: Hyphens (`-`), slashes (`/`), and brackets (`[`, `]`) are not stripped. Consequently, the 2-letter query `"AI"` fails to match KB entries containing `"AI-driven"`, `"AI-based"`, or `"AI/ML"` because `"ai-based".strip(...)` remains `"ai-based"` which does not equal `"ai"`.

3. **Arabic Diacritics String Length Increase**:
   - Querying `"كَمْ"` (with Fatha and Sukun diacritics) results in string length 4 in Python (`len("كَمْ") == 4`).
   - The engine executes the `else` branch (`if "كَمْ" in text`). Since KB text is stored without diacritics (`"كم"`), `"كَمْ" in "كم"` evaluates to `False`, causing RAG search to fail completely on diacritized input.

4. **Stop-Word False Positive Matches (CRITICAL RAG BUG)**:
   - Arabic question words `"ما"` (2 chars) and `"هي"` (2 chars) pass the `len(w) >= 2` filter.
   - Any query starting with `"ما هي..."` (e.g. `"ما هي عاصمة فرنسا؟"`, `"ما هي أفضل أكلة؟"`) extracts `['ما', 'هي', ...]`.
   - Both `"ما"` and `"هي"` exist as standalone tokens in KB Item 1 ("**ما** **هي** خدمات وكالة دوميا...").
   - Result: Item 1 receives a score of `2` solely due to common stop words. The out-of-domain question `"ما هي عاصمة فرنسا؟"` falsely matches Item 1 and returns agency services info instead of triggering fallback!

---

## 3. Task 2: AI Engine Failover Chain

### 3.1 Pipeline Execution Flow
The AI response generation follows a strict multi-tier failover order:
`Custom Rule` -> `Groq LLM API` -> `OpenRouter LLM API` -> `RAG Direct Answer` -> `Mock Fallback`.

```
[Incoming User Query]
         │
         ▼
[Check Custom Rules] ── (Match Found) ──► Return Custom Rule Response
         │ (No Rule)
         ▼
[Compute RAG Context]
         │
         ▼
 [Try Groq API] ───── (HTTP 200 & Valid JSON) ──► Return Groq Response
         │ (500 / Timeout / Error / Invalid JSON)
         ▼
[Try OpenRouter API] ─ (HTTP 200 & Valid JSON) ──► Return OpenRouter Response
         │ (500 / Timeout / Error / No Key)
         ▼
[RAG Direct Answer] ── (Context Present) ──────► Return "أهلاً بيك! {first_answer}"
         │ (Context Empty)
         ▼
 [Mock Fallback] ──────────────────────────────► Return "أهلاً بيك في وكالة دوميا..."
```

### 3.2 Empirical Failover Test Harness Results

| Scenario ID | Test Description | Mock Condition | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| `FAILOVER-01` | Groq HTTP 500 Server Error | `Groq 500`, `OpenRouter 200` | OpenRouter handles request | `source: "llm_openrouter"`, reply returned | **PASS** |
| `FAILOVER-02` | Groq Connection Timeout | `Groq TimeoutException`, `OpenRouter 200` | OpenRouter handles request | `source: "llm_openrouter"`, reply returned | **PASS** |
| `FAILOVER-03` | Groq 200 OK Malformed JSON | `Groq 200` (missing `choices`), `OpenRouter 200` | OpenRouter handles request | Exception caught, `source: "llm_openrouter"` | **PASS** |
| `FAILOVER-04` | Groq + OpenRouter Failure with RAG | `Groq 500`, `OpenRouter 502`, RAG context present | RAG Direct Answer formatted | `source: "rag"`, `"أهلاً بيك! {answer}"` | **PASS** |
| `FAILOVER-05` | Groq + OpenRouter Failure without RAG | `Groq Timeout`, `OpenRouter Timeout`, No RAG match | Mock Fallback message | `source: "fallback"`, default agency string | **PASS** |

---

## 4. Task 3: Adversarial Payloads & Security Testing

### 4.1 Missing HMAC Signature Header Bypass (CRITICAL SECURITY VULNERABILITY)
- **Code Inspection** (`server.py` line 716):
  ```python
  sig_header = request.headers.get("X-Hub-Signature-256")
  if APP_SECRET and sig_header:
      if not verify_signature(request.get_data(), sig_header):
          print(f"[Webhook Signature Mismatch]")
          return "Invalid signature", 403
  ```
- **Vulnerability Mechanism**:
  - `if APP_SECRET and sig_header:` requires BOTH `APP_SECRET` to be set AND `sig_header` to be present.
  - When an attacker sends a POST `/webhook` request **without** the `X-Hub-Signature-256` header (`sig_header` is `None`), the `if` condition evaluates to `False`.
  - The signature verification block is completely skipped, and the unauthenticated payload is processed!
- **Empirical Verification**:
  - Sent POST `/webhook` with invalid signature header -> Rejected with `403 Forbidden` (`PASS`).
  - Sent POST `/webhook` with **no signature header** when `APP_SECRET = "supersecretkey"` -> Accepted with `200 OK` (`CONFIRMED VULNERABILITY`).

### 4.2 Non-Dict JSON Body REST Endpoint HTTP 500 Crashes (HIGH SEVERITY)
- **Code Inspection**:
  - In `api_kb_add`: `data = request.get_json() or {}` -> `data.get("q", ...)`
  - In `api_rules_add`: `data = request.get_json() or {}` -> `data.get("trigger", ...)`
  - In `api_prompt_save`: `data = request.get_json() or {}` -> `data.get("prompt", ...)`
  - In `api_simulate`: `data = request.get_json() or {}` -> `msg = data.get("message", ...)`
  - In `api_test`: `data = request.get_json() or {}` -> `msg = data.get("message", ...)`
- **Failure Mechanism**:
  - If a client sends a valid JSON non-dict payload (e.g. JSON list `[1, 2, 3]`), Flask's `request.get_json()` returns `[1, 2, 3]`.
  - Python evaluates `[1, 2, 3] or {}` to `[1, 2, 3]`.
  - Calling `.get()` on a `list` object raises `AttributeError: 'list' object has no attribute 'get'`.
  - The unhandled exception crashes the request with an HTTP 500 error.
- **Empirical Verification**:
  - All 5 POST/PUT endpoints crashed with HTTP 500 when sent `[1, 2, 3]`.

### 4.3 Arabic Diacritics in Custom Rules
- `check_custom_rules` compares `trigger_str in msg_lower`.
- Arabic diacritical marks (Tashkeel) are not removed.
- Message `"كم سِعْرٌ هذا المنتج؟"` fails to match trigger `"سعر"`.

### 4.4 Unsanitized XSS Payload Storage
- REST endpoints `POST /api/rules` and `POST /api/kb` store raw script tags (`<script>alert('XSS')</script>`).
- Payloads are stored unescaped in memory/database cache and serialized directly into JSON responses for `/api/rules`, `/api/kb`, `/api/stats`, and SSE `/api/logs/stream`.

---

## 5. Task 4: Zero Hallucination under Missing Context

### 5.1 Deterministic Fallback Logic
- When LLM provider keys are absent or unreachable, and RAG context is empty:
  `generate_reply` returns:
  `"أهلاً بيك في وكالة دوميا للتسويق الرقمي! ابعتلنا رسالة في الخاص وهنرد عليك فوراً!"`
- This guarantees zero hallucination for out-of-domain queries when LLMs are offline, as no LLM generation occurs.

### 5.2 System Prompt Isolation
- When RAG context is empty (`rag_context == ""`), `_call_groq` and `_call_openrouter` pass the base system prompt without adding the `معلومات الشركة المتاحة:` block.
- The base prompt includes strict instructions: `"لو مش عارف الإجابة، قوله يتواصل معانا مباشرة."`

### 5.3 Interaction with RAG Stop-Word Bug
- When an out-of-domain query contains Arabic stop words like `"ما هي"` (e.g., `"ما هي عاصمة فرنسا؟"`), RAG incorrectly matches KB Item 1 and injects Item 1 context into the system prompt.
- This breaks zero hallucination because the system replies with agency services for unrelated questions due to the false positive context injection.

---

## 6. Recommendations & Mitigations

1. **Fix HMAC Header Verification**:
   ```python
   if APP_SECRET:
       if not sig_header or not verify_signature(request.get_data(), sig_header):
           return "Invalid signature", 403
   ```
2. **Add Payload Type Validation to REST Endpoints**:
   ```python
   data = request.get_json(silent=True)
   if not isinstance(data, dict):
       return jsonify({"error": "Invalid JSON body, expected object"}), 400
   ```
3. **Filter Arabic Stop-Words and Strip Extra Punctuation in RAG**:
   - Add Arabic stop-words list (`["ما", "من", "هل", "في", "عن", "على", "إلى", "هو", "هي"]`) to RAG filter.
   - Expand `strip(".,!?()\"':;-/[]{}")` to strip hyphens and slashes.
   - Implement Arabic text normalization (strip Tashkeel, normalize Alef variants `أ`/`إ`/`آ` -> `ا`).
