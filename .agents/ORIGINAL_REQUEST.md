# Original User Request

## Initial Request — 2026-08-03T14:03:05Z

Conduct an exhaustive end-to-end multi-agent review and QA audit of the Domya AI Moderator social media dashboard live at `https://metaaimoderator.vercel.app/` and its local codebase (`C:\Users\mhmd\meta_ai_moderator`). Ensure all 37 interactive buttons, 10 view panes, responsive layouts, text sizes (min 12px/13px), and 3-color design constraints are completely bug-free and functionally verified.

Working directory: `C:\Users\mhmd\meta_ai_moderator`
Integrity mode: `development`

## Requirements

### R1. Live Browser & UI Verification
Audit the live Vercel production URL (`https://metaaimoderator.vercel.app/`) using HTML/DOM inspection. Verify that all 10 sidebar view panes switch properly without layout collapse, that the Top Bar button `"🔗 اربط صفحتك في ثانية"` and dynamic badge `"✅ موثق — متحكم بالكامل 100%"` are displayed, and that no blank/empty state occurs on load.

### R2. Detailed Audit of All 37 Buttons & Controls
Check every button in the Sidebar (10 buttons), Inbox (tabs, search, input, primary Call button, WhatsApp button), 8-Controls Grid (2 primary buttons for Messages and Comments, 6 ghost buttons), and Scheduler/KB/CRM modals. Verify that their `onclick` handlers connect to real functions and APIs without fake alerts.

### R3. Codebase Quality & Size Constraints
Ensure `templates/index.html` remains under 30KB (currently ~27.9KB), contains zero inline styles, uses exactly 3 main colors (`#2563eb`, `#10b981`, slate/gray) and 5 readable font sizes (`12px`, `13px`, `14px`, `16px`, `20px`), and that all 118 unit and integration tests in `pytest` pass.

## Acceptance Criteria

### Live Production Auditing
- [ ] `https://metaaimoderator.vercel.app/` returns HTTP 200 with an uncompressed HTML size < 30KB.
- [ ] `#inbox-search` input exists and `renderInboxList()` executes without throwing `TypeError: Cannot read properties of null`.
- [ ] `#v-inbox.view.show` uses `display: grid !important` in `styles.css`, preserving the 3-column responsive layout without collapsing.
- [ ] Top Bar contains the primary button `"🔗 اربط صفحتك في ثانية"` and dynamic green badge `"✅ موثق — متحكم بالكامل 100%"`.

### Button & Control Functionality
- [ ] The 10 sidebar navigation buttons use `text-[13px] font-bold` and switch between views correctly.
- [ ] Lead Card "اتصل الآن" is styled as a primary blue button (`btn-primary`) and "واتساب" is styled as a ghost button (`btn-ghost`), both linking to real `tel:` and `wa.me` URLs.
- [ ] The 8-Controls Grid in the Accounts pane highlights "Inbox مباشر" and "الكومنتات" as primary buttons (`btn-primary bg-blue-600`), with distinct icons and actions for all 8 buttons.
- [ ] `startMetaOAuth()` safely redirects to `loginFromChatwoot()`, utilizing `FacebookFreeConnector.getLoginUrl()`.

### Automated Verification
- [ ] All 118 unit and integration tests pass cleanly when running `pytest` in `C:\Users\mhmd\meta_ai_moderator`.

## Follow-up — 2026-08-04T08:31:43Z

# Teamwork Project Prompt — Review Meta AI Moderator

Review and audit the Meta AI Moderator project (`C:\Users\mhmd\meta_ai_moderator`) as an autonomous multi-agent team to verify security, compliance, UI aesthetics, and endpoint stability.

Working directory: C:\Users\mhmd\meta_ai_moderator
Integrity mode: development

## Requirements

### R1. Comprehensive Backend & Security Audit
Verify all endpoints (`/api/accounts`, `/api/oauth/*`, `/api/conversations`, `/api/cron/*`) return correct HTTP status codes (e.g. 401 Unauthorized when unauthenticated, 200 OK when valid) and that sensitive access tokens are strictly masked in responses (`EAAS7X••••••••4fA9`).

### R2. UI & Mock Inbox Verification
Verify the unified inbox in `index.html` and `static/js/inbox.js` properly renders 6 mock lead threads (Ahmed Zaki, Medo, Azza, Siman, Doaa, Hager), correct badges (Hot 🔥 85%, etc.), CRM sidebar with Sales Dashboard, and `wa.me` WhatsApp links.

### R3. Meta App Review Compliance Verification
Verify the existence of `youtube_link.txt`, `privacy` route compliance, official Meta API endpoints integration, and zero instagrapi / hardcoded token usage.

## Acceptance Criteria

### Security & Token Masking
- [ ] `/api/accounts` returns `401` without authentication cookies or masked tokens without exposing raw `access_token`
- [ ] OAuth state and PKCE flows are implemented with HttpOnly/Secure cookies

### Inbox & Lead Score UI
- [ ] Inbox renders 6 mock threads with avatars and Lead Score badges
- [ ] CRM sidebar displays valid `wa.me` links and Sales Dashboard metrics

### Meta Compliance
- [ ] Zero unmasked tokens or unofficial instagrapi calls in the codebase
- [ ] `youtube_link.txt` file exists containing valid review details and App ID

