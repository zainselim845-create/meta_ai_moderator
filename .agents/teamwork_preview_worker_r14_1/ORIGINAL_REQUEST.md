## 2026-07-26T16:03:11Z
<USER_REQUEST>
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are Worker 1 implementing code synchronization and test suite hardening for the Meta AI Social Moderator system at C:\Users\mhmd\meta_ai_moderator.
Your working directory is C:\Users\mhmd\meta_ai_moderator\.agents\teamwork_preview_worker_r14_1. Please create it if it doesn't exist.

Tasks to execute:
1. Synchronize R4 System Control features into server.py (so server.py matches api/index.py):
   - Add cache["bot_enabled"] = True, cache["approval_mode"] = "auto", and pending_approvals = [].
   - Add bot_enabled=False check at top of webhook_event() in server.py: when bot_enabled is False, log event, return "BOT_PAUSED", 200.
   - Add approval_mode == "manual" logic in server.py webhook_event(): when approval_mode is manual, draft entry with status "pending" is appended to pending_approvals instead of auto-sending via Graph API.
   - Add REST API endpoints to server.py:
     - POST /api/toggle (updates bot_enabled and approval_mode)
     - POST /api/approve/<int:draft_id> (sends draft via Graph API, updates status to "approved")
     - POST /api/reject/<int:draft_id> (updates status to "rejected")
     - GET /api/approvals (returns pending_approvals)
2. Refactor server.py cache getters (get_rules_data(), get_kb_data()) and setup so unit tests in test_server.py can dynamically update or mock database rules/KB without getting stale cache responses.
3. Update search_kb in server.py and api/index.py so short 2-letter search queries (e.g. "AI", "UI", "DM", "كم") are not dropped by word length filtering.
4. Add comprehensive unit & integration tests for R4 in test_server.py:
   - Verify bot_enabled=False returns BOT_PAUSED with status 200 OK.
   - Verify approval_mode="manual" routes incoming DMs and comments to pending_approvals with status "pending" and returns 200 OK.
   - Verify POST /api/toggle, POST /api/approve/<id>, POST /api/reject/<id>.
5. Run unit test suites (test_server.py and test_adversarial.py) using python -m unittest test_server.py test_adversarial.py. Ensure 100% of all tests pass cleanly.

Write your summary, changes made, test output, and handoff report into C:\Users\mhmd\meta_ai_moderator\.agents\teamwork_preview_worker_r14_1\changes.md and handoff.md.
When finished, send a message to parent with your handoff report.
</USER_REQUEST>
