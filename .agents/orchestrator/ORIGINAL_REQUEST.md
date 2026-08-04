# Original User Request

## 2026-07-27T07:26:16Z
You are the Project Orchestrator for the Meta AI Social Moderator system.
Working directory: C:\Users\mhmd\meta_ai_moderator
User request file: C:\Users\mhmd\meta_ai_moderator\.agents\ORIGINAL_REQUEST.md (Focus on the latest follow-up request dated 2026-07-27T07:26:16Z).

Your role and responsibility:
Orchestrate the full implementation, thorough code review, challenger validation, empirical test execution, and comprehensive verification of all requirements:

R1. Meta Webhook & Multi-Channel Multi-Post Event Parser
- Verify 100% correctness of Facebook Messenger DMs, Instagram DMs, Facebook Comments, and Instagram Comments handling in `/webhook`.
- Verify event deduplication cache (`processed_events`) prevents duplicate processing of identical `message_id` or `comment_id`.
- Verify comment-to-DM autoresponder (`/private_replies`) and post-specific rules (`post_id` matching with direct URL link extraction) function seamlessly.

R2. AI Engine & RAG Quality Verification
- Audit `generate_reply`, `_call_groq`, and `_call_openrouter` for natural Egyptian Arabic tone, empathy, and strict adherence to the RAG Knowledge Base (`meta_ai_kb`).
- Verify AI re-generate draft endpoint (`/api/regenerate_draft`) works for concise and friendly response tones.
- Verify zero hallucination and proper fallback handling when context is missing.

R3. Web Inbox & CRM UI/UX Verification
- Audit the Social Inbox multi-tab filter bar (`الكل`, `مراجعة الردود`, `فيسبوك`, `إنستجرام`, `كومنتات`).
- Verify customer sentiment badges (`💰 استفسار أسعار`, `💼 طلب خدمة`, `😃 استفسار عام`).
- Verify the CRM Customer Profile Card renders customer avatar, active badge, channel tag, and direct FB/IG profile links correctly.
- Test the Human Approval Review panel (`approveDraft` / `rejectDraft`).

R4. System Control & Pause Mode Audit
- Verify that when `bot_enabled` is set to `False`, the system pauses all automated replies and returns `BOT_PAUSED`.
- Verify that when `approval_mode` is set to `manual`, all incoming messages/comments are directed to the `pending_approvals` queue without auto-replying.

Acceptance Criteria:
- `GET /webhook` returns `hub.challenge` with status 200 OK.
- `POST /webhook` processes events correctly for all 4 channels without throwing exceptions.
- Post-link matching extracts IDs correctly from direct Facebook & Instagram URLs.
- Groq Llama 3.3 70B responds in polite, natural Egyptian Arabic within 2-3 sentences using Supabase RAG context.
- Re-generate AI draft endpoint returns custom-toned responses on demand.
- Web dashboard at `https://metaaimoderator.vercel.app` loads cleanly with status 200 OK.
- Inbox tabs filter messages accurately by channel and pending status.
- Bot ON/OFF switch and Manual Approval Mode operate with 100% strict control.
- Full test suite (84/84 tests) passes with 0 failures.

Store your metadata, plan.md, and progress.md in C:\Users\mhmd\meta_ai_moderator\.agents\orchestrator.
When all work and verification are complete, send a completion report claiming victory.

## Follow-up — 2026-08-03T13:08:33Z

You are the Project Orchestrator for the Meta AI Social Moderator application.
Your mission is to execute a strict 5-role Team Workflow (Frontend Lead, Backend Lead, Integration Lead, Functionality Lead, QA Lead) to refactor, secure, and finalize the application in C:\Users\mhmd\meta_ai_moderator.

Refer to C:\Users\mhmd\meta_ai_moderator\.agents\ORIGINAL_REQUEST.md for all detailed requirements (R1 through R5) and Acceptance Criteria.

Key tasks:
1. R1: Frontend Refactoring (3 colors: #2563eb, Gray, #10b981; 5 font sizes: 12px, 13px, 14px, 16px, 20px - NO 9px; 3 border radius: 8px, 12px, 16px; 1 shadow; 2 button styles: Primary, Ghost; 2 grids; Lucide icons only, 0 emojis; white cards only; < 20 inline styles total across codebase).
2. R2: Backend Security & Free Tier (100% free-tier, LRU Cache instead of Redis, Web Crypto AES-256-GCM encryption, State+PKCE for OAuth, protect endpoints with 401 Unauthorized, 0 instagrapi, 0 hardcoded credentials like 'domya').
3. R3: Chatwoot Free Integration (Chatwoot MIT free connector logic FacebookFreeConnector.getLoginUrl(), UI button 'ربط من Chatwoot - فري').
4. R4: Core Functionality (Dynamic lead scoring, real tel: and whatsapp:// links, Sales Dashboard real metrics 14 leads, 30k, 5 hot, all 10 panes fully functional, working Scheduler with backend cron logic).
5. R5: Git Version Control & Backup (Initialize Git, 5 separate branches for leads, PR review process, commit baseline state).

Master Verification / Acceptance Criteria:
- Size < 30KB per page
- Inline styles < 20
- 0 emojis (only Lucide icons)
- No 9px fonts, no broken radius values, no dark transparent cards
- loginFromChatwoot exists & triggers free Chatwoot flow
- calculateLeadScore is dynamic and functional
- All 10 views (v-inbox, v-dash, etc.) fully populated and functional
- Security endpoints return 401, compliance endpoints return 200 OK
- 0 instagrapi & 0 hardcoded value='domya' credentials
- Git repository contains the 5 team branches and is backed up

