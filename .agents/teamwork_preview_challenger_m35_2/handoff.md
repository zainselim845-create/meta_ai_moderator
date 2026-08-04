# Adversarial Validation Report: AI & RAG Engine (`server.py`)

## 1. Observation

### Codebase Inspection & Empirical Test Runs
- Executed `python -m unittest test_server.py` on `C:\Users\mhmd\meta_ai_moderator\test_server.py`. Result: `Ran 40 tests in 0.162s - OK`.
- Created and executed empirical adversarial test suite `C:\Users\mhmd\meta_ai_moderator\test_adversarial.py` containing 21 targeted stress tests.
- Executed combined test command: `python -m unittest test_server.py test_adversarial.py`. Result: `Ran 61 tests in 0.243s - OK`.

### Specific Code & Behavior Observations
1. **Rule Matching (`check_custom_rules`, `server.py:128-149`)**:
   - `check_custom_rules` implementation:
     ```python
     def check_custom_rules(message):
         rules = get_setting("meta_ai_rules", [])
         if not rules or not message or not isinstance(message, str):
             return None
         msg_lower = message.lower().strip()
         for rule in rules:
             trigger = (rule.get("trigger") or "").lower().strip()
             if not trigger:
                 continue
             match_type = rule.get("match_type", "contains")
             matched = False
             if match_type == "exact" and msg_lower == trigger:
                 matched = True
             elif match_type == "contains" and trigger in msg_lower:
                 matched = True
             elif match_type == "startswith" and msg_lower.startswith(trigger):
                 matched = True

             if matched:
                 return rule
         return None
     ```
   - **Observed Bug A (Disabled Rules Ignored)**: `check_custom_rules` does NOT check `rule.get("is_active", True)`. When a rule has `"is_active": False`, it still matches and executes. Empirically confirmed in `test_adv_rule_disabled_flag_ignored`.
   - **Observed Bug B (Non-string Trigger Crash)**: If `rule.get("trigger")` is an integer (e.g., `100`), `(rule.get("trigger") or "").lower()` raises `AttributeError: 'int' object has no attribute 'lower'`. Empirically confirmed in `test_adv_rule_integer_trigger_crash`.
   - **Observed Bug C (Rule Shadowing & Ordering)**: Rules are evaluated in strict linear list order. A broad `contains` rule (e.g. trigger `"سعر"`) placed before a specific `exact` rule (e.g. trigger `"سعر الخدمة"`) will always shadow the specific rule.
   - **Observed Limitation D (No Arabic Diacritics Normalization)**: Standard `.lower().strip()` does not normalize Arabic alef variants (`أ`, `إ`, `آ`, `ا`) or diacritics (tashkeel like `سِعْر`), causing string comparisons to miss matches when user input contains diacritics.

2. **RAG Vector & Semantic Search (`search_kb`, `server.py:110-126`)**:
   - `search_kb` implementation:
     ```python
     def search_kb(query):
         items = get_kb_data()
         if not items or not query or not str(query).strip():
             return ""
         words = [w for w in re.split(r'\s+', str(query).lower()) if len(w) > 2]
         scored = []
         for item in items:
             text = (item.get("question","") + " " + item.get("answer","")).lower()
             score = sum(1 for w in words if w in text or (len(w) >= 4 and w[:4] in text))
             if score > 0:
                 scored.append((score, item))
         scored.sort(key=lambda x: x[0], reverse=True)
         if not scored:
             return ""
         top = scored[:2]
         return "\n".join([f"- {i['question']}: {i['answer']}" for _, i in top])
     ```
   - **Observed Bug E (Short Word Filtering `len(w) > 2`)**: Queries with words of length <= 2 (e.g. `"AI"`, `"UI"`, `"FB"`, `"DM"`, `"IG"`, `"كم"`) are completely discarded (`words = []`), resulting in zero RAG score even when KB explicitly answers them. Empirically confirmed in `test_adv_rag_short_words_dropped`.
   - **Observed Bug F (4-Char Prefix Match False Positives `w[:4] in text`)**: For words with length >= 4, checking `w[:4] in text` causes false positive matches for any Arabic words sharing the common 4-char prefix `"الاس"` (e.g., query word `"الاستراتيجية"` has prefix `"الاس"` which matches KB text containing `"الاسعار"` or `"الاسئلة"`). Empirically confirmed in `test_adv_rag_prefix_matching_false_positives`.
   - **Observed Flaw G (Stop Word Score Inflation)**: Unfiltered 3+ letter Arabic stop words (e.g. `"هذا"`, `"الذي"`, `"التي"`) match KB entries containing those words and inflate RAG scores.

3. **AI Provider Failover Logic (`generate_reply`, `_call_groq`, `_call_openrouter`, `server.py:154-247`)**:
   - Fallback chain sequence: `Custom Rules -> Groq API -> OpenRouter API -> Smart RAG Direct Answer -> Offline Mock Message`.
   - Empirically tested Groq API returning HTTP 500 error, HTTP 429 rate limit error, and `requests.exceptions.Timeout`.
   - Confirmed that `_call_groq` catches all exceptions/errors, logs them, and returns `None`. `generate_reply` cleanly moves to OpenRouter.
   - Empirically tested scenario where both Groq and OpenRouter fail (e.g., connection error or missing keys). `generate_reply` falls back to `search_kb` direct answer (if context found) or default offline message ("أهلاً بيك في وكالة دوميا للتسويق الرقمي..."). Zero uncaught exceptions.

4. **Simulator Endpoint Metadata Attribution (`POST /api/simulate`, `server.py:470-532`)**:
   - Empirically verified metadata attribution across all paths in `api_simulate`:
     - Rule match: `"source": "rule"`, `"rule_triggered": <trigger>`, `"rag_context": ""`
     - Groq LLM: `"source": "llm_groq"`, `"rule_triggered": None`, `"rag_context": <retrieved_kb_text>`
     - OpenRouter LLM: `"source": "llm_openrouter"`, `"rule_triggered": None`, `"rag_context": <retrieved_kb_text>`
     - RAG direct fallback: `"source": "rag"`, `"rule_triggered": None`, `"rag_context": <retrieved_kb_text>`
     - Hardcoded offline fallback: `"source": "fallback"`, `"rule_triggered": None`, `"rag_context": ""`
     - Empty message: `"source": "fallback"`, `"rule_triggered": None`, `"rag_context": ""`

---

## 2. Logic Chain

1. **Rule Engine Validation**:
   - *Observation*: `check_custom_rules` iterates through `rules` without checking `rule.get("is_active")` and calls `trigger.lower()` without type checking.
   - *Logic*: An inactive rule created in the database or UI should not fire, yet code processes it because `is_active` is ignored. If trigger is numeric (e.g. `100`), `.lower()` throws an unhandled `AttributeError`. Furthermore, linear array evaluation causes the first matching rule to fire regardless of specificity, shadowing specific exact matches.

2. **RAG Keyword Scoring Validation**:
   - *Observation*: `search_kb` splits query by whitespace, discards tokens with `len(w) <= 2`, and performs substring search `w[:4] in text` for tokens with `len(w) >= 4`.
   - *Logic*: Short technical or domain terms like `"AI"`, `"UI"`, `"FB"`, `"DM"` are 2 characters long, so `len("AI") <= 2` discards them, resulting in empty keyword lists and failed RAG retrieval. Conversely, 4-character prefix matching on Arabic words starting with `"الاس"` matches any KB entry containing `"الاسعار"`, creating false-positive matches for unrelated questions like `"ما هي الاستراتيجية؟"`.

3. **Provider Failover & Simulator Attribution Validation**:
   - *Observation*: `_call_groq` and `_call_openrouter` wrap HTTP requests in `try...except` blocks and check `res.status_code == 200`. `POST /api/simulate` constructs response dictionaries specifying `"source"`, `"rule_triggered"`, and `"rag_context"`.
   - *Logic*: When Groq API errors out (500, 429, timeout), returning `None` allows `if reply:` checks in `generate_reply` and `api_simulate` to fall through to OpenRouter, then RAG, then offline fallback cleanly. Simulator attribution accurately records each source stage.

---

## 3. Caveats

- Tests were conducted using unit test stubs and mock HTTP handlers simulating Groq/OpenRouter responses and failures, which is standard for offline E2E and adversarial testing environments. Live network calls to external API endpoints were not performed due to offline environment mode.
- Supabase REST calls were mocked in memory using `fake_requests_get` / `fake_requests_post` matching `test_server.py` behavior.

---

## 4. Conclusion

- **Overall Risk Assessment**: **MEDIUM**
- **Core Summary**:
  - **AI Provider Failover**: **PASS / ROBUST** (100% failover resilience across Groq, OpenRouter, RAG fallback, and offline mock).
  - **Simulator Metadata Attribution**: **PASS / ACCURATE** (100% accurate attribution for `"rule"`, `"llm_groq"`, `"llm_openrouter"`, `"rag"`, and `"fallback"`).
  - **Rule Matching**: **FAIL / VULNERABILITIES IDENTIFIED**:
    1. Disabled rules (`is_active: False`) are not filtered and continue to fire.
    2. Non-string rule triggers cause `AttributeError` crashes.
    3. Broad `contains` rules shadow specific `exact` rules due to strict list ordering.
    4. Absence of Arabic alef & diacritics normalization causes missed rule triggers.
  - **RAG Engine Scoring**: **FAIL / VULNERABILITIES IDENTIFIED**:
    1. 2-letter queries (`"AI"`, `"UI"`, `"DM"`, `"كم"`) are dropped by `len(w) > 2` filter.
    2. 4-character prefix matching (`w[:4] in text`) causes false positive matches for Arabic words sharing prefix `"الاس"`.
    3. Unfiltered stop words inflate scores for unrelated queries.

### Actionable Mitigations Recommended
1. In `check_custom_rules`:
   - Add check: `if not rule.get("is_active", True): continue`
   - Cast trigger safely: `trigger = str(rule.get("trigger") or "").lower().strip()`
   - Sort rules by match specificity (`exact` before `startswith` before `contains`) or trigger length descending before matching.
2. In `search_kb`:
   - Change word length filter to `len(w) >= 2` (or allow known 2-letter tech terms like `"AI"`, `"UI"`).
   - Replace naive `w[:4] in text` prefix search with whole-word matching or token-overlap after stripping standard Arabic prefixes (`ال`, `و`, `ب`).

---

## 5. Verification Method

To independently verify these empirical findings and run the full 61-test test suite:

### Execution Commands
```bash
cd C:\Users\mhmd\meta_ai_moderator
python -m unittest test_server.py test_adversarial.py
```

### Inspected Files
- `server.py` (lines 110-149 for rule and RAG logic, 154-247 for provider fallback, 470-532 for simulator endpoint)
- `test_server.py` (baseline 40 tests)
- `test_adversarial.py` (adversarial 21 tests)

### Invalidation Conditions
- If `python -m unittest test_server.py test_adversarial.py` yields any failing test or exception, the verification is invalidated.
