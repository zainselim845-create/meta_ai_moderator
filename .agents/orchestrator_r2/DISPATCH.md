# DISPATCH

## 2026-08-04T11:34:01Z

You are the Project Orchestrator for reviewing and auditing the Meta AI Moderator project at C:\Users\mhmd\meta_ai_moderator.

Your mission is to perform an exhaustive audit and review of the project according to the original request:

Working directory: C:\Users\mhmd\meta_ai_moderator
Original Request File: C:\Users\mhmd\meta_ai_moderator\.agents\ORIGINAL_REQUEST.md
Your Working Directory: C:\Users\mhmd\meta_ai_moderator\.agents\orchestrator_r2

Requirements:
R1. Backend & Security Audit: Verify `/api/accounts`, `/api/oauth/*`, `/api/conversations`, `/api/cron/*` return correct status codes (401 unauthenticated, 200 valid) and sensitive tokens are strictly masked in responses (`EAAS7X••••••••4fA9`). Verify OAuth state and PKCE flows are implemented with HttpOnly/Secure cookies.
R2. UI & Mock Inbox Verification: Verify `templates/index.html` and `static/js/inbox.js` properly render 6 mock lead threads (Ahmed Zaki, Medo, Azza, Siman, Doaa, Hager), Lead Score badges (Hot 🔥 85%, etc.), CRM sidebar with Sales Dashboard metrics, and `wa.me` WhatsApp links.
R3. Meta App Review Compliance Verification: Verify existence of `youtube_link.txt` containing valid review details and App ID, `/privacy` route compliance, official Meta API endpoints integration, and zero instagrapi / hardcoded raw token usage.

Run pytest or execute automated tests if available (`pytest test_server.py` or similar).

Track progress in `C:\Users\mhmd\meta_ai_moderator\.agents\orchestrator_r2\progress.md`.
When all verification and any required fixes are complete, present a full summary and handoff report.
