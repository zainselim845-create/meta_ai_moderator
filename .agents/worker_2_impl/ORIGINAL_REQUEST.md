## 2026-07-27T07:31:36Z

You are Worker 2 (Implementer) assigned to implement and fix Requirements R1, R2, R3, R4 in Meta AI Social Moderator (`C:\Users\mhmd\meta_ai_moderator`).
Working directory: C:\Users\mhmd\meta_ai_moderator\.agents\worker_2_impl

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed Instructions:
1. Read `C:\Users\mhmd\meta_ai_moderator\server.py`, `C:\Users\mhmd\meta_ai_moderator\templates\index.html`, `C:\Users\mhmd\meta_ai_moderator\.agents\explorer_1_m1\handoff.md`, and `C:\Users\mhmd\meta_ai_moderator\.agents\explorer_1_m1\analysis.md`.
2. Implement the following in `server.py`:
   a. **R1 Deduplication Cache**:
      - Add `processed_events = set()` in `server.py`.
      - In `POST /webhook`, extract unique event identifier (`message_id` or `comment_id`). If event ID is in `processed_events`, skip auto-replying/processing and return `jsonify({"status": "already_processed"}), 200`. Otherwise, add ID to `processed_events`.
   b. **R1 Post-Specific Rules & URL Link Extraction**:
      - In `api_rules_add()`, capture `"post_id"` from incoming json payload (`data.get("post_id")`) and store it in `new_rule["post_id"]`.
      - In `check_custom_rules(message, post_id=None)`:
        - Add regex helpers to extract post IDs from Facebook direct URLs (e.g., `facebook.com/.../posts/(\d+)`, `facebook.com/permalink.php\?story_fbid=(\d+)`, `facebook.com/watch/?v=(\d+)`, `facebook.com/photo.php\?fbid=(\d+)`) and Instagram direct URLs (e.g., `instagram.com/p/([A-Za-z0-9_-]+)`, `instagram.com/reel/([A-Za-z0-9_-]+)`).
        - Compare rule's `post_id` against passed `post_id` or extracted post ID from URL. Match rule if keywords match and post_id matches (or if rule has no post_id restriction).
   c. **R2 AI Re-Generate Draft Endpoint**:
      - Add `@app.route("/api/regenerate_draft", methods=["POST"])` endpoint.
      - Handle tone parameters ("concise", "friendly", "detailed", "مختصر", "ودي") to adjust AI tone and return `jsonify({"status": "success", "draft": regenerated_reply, "tone": tone}), 200`.
   d. **R3 Conversations Endpoint & Reject Draft 404**:
      - Add `@app.route("/api/conversations", methods=["GET"])` endpoint returning structured list of conversations/threads for the frontend inbox.
      - Update `api_reject_draft(draft_id)`: check if `draft_id` exists in `pending_approvals`. If not found, return `jsonify({"error": "Draft not found"}), 404`.
3. Update unit/integration tests in `test_server.py` to add tests for these new features and endpoints without breaking any existing tests.
4. Execute `pytest -v` to ensure the entire test suite passes (all 84+ tests passing with 0 failures).
5. Document changes in `C:\Users\mhmd\meta_ai_moderator\.agents\worker_2_impl\changes.md` and deliver `C:\Users\mhmd\meta_ai_moderator\.agents\worker_2_impl\handoff.md`.
6. Send completion message back to parent via `send_message`.
