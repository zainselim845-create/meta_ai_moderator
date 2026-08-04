## 2026-07-23T19:36:27Z
You are Worker 2 tasked with finalizing and hardening Meta AI Social Moderator codebase based on Reviewer and Challenger feedback.

Working Directory: C:\Users\mhmd\meta_ai_moderator\.agents\teamwork_preview_worker_m35_2
Project Root: C:\Users\mhmd\meta_ai_moderator
Scope File: C:\Users\mhmd\meta_ai_moderator\.agents\orchestrator\PROJECT.md

Mandatory Integrity Warning:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. Update `server.py`:
   - In `POST /webhook`, add defensive check: `if not isinstance(data, dict): return jsonify({"status": "invalid payload"}), 200`.
   - In FB feed webhook handling (`field == "feed"`), check that `value.get("item", "comment") == "comment"` to avoid non-comment feed updates.
   - In comment processing, when AI/RAG generates a reply for a comment, also trigger `send_private_comment_reply(comment_id, reply)` to complete the comment-to-DM autoresponder requirement across all comment handlers.
   - In `check_custom_rules`, ignore inactive rules (`if not rule.get("is_active", True): continue`).
   - In `search_kb`, update query word filter to `len(w) >= 2` so 2-character keywords ("AI", "UI", "DM", "كم", "اي") are scored properly in RAG lookup.
   - In `api_stats`, update `supabase_active` calculation to dynamically evaluate Supabase client/REST availability instead of hardcoded True.
2. Update `templates/index.html`:
   - Update simulator fetch endpoint from `/api/test` to `/api/simulate` and render source attribution metadata (`d.source`, `d.rule_triggered`).
   - Replace `d.log.reverse()` with `d.log.slice().reverse()` to prevent in-place array mutation during polling.
3. Update `test_server.py`:
   - Add unit/integration tests covering AI/RAG comment private DM reply dispatch, non-dict webhook body, inactive rule filtering, and 2-letter RAG queries.
4. Execute `python -m unittest test_server.py` and ensure 100% passing tests.
5. Document all changes in C:\Users\mhmd\meta_ai_moderator\.agents\teamwork_preview_worker_m35_2\handoff.md and report completion.
