# Project: Meta AI Moderator Audit (orchestrator_r2)

## Architecture
- Backend: Flask application in `api/index.py` (Vercel serverless) and `server.py` (local server).
- Authentication: Session-based auth, Bearer/X-API-Key middleware, OAuth PKCE flow with HttpOnly/Secure cookies.
- Frontend: Single-Page Application in `templates/index.html`, `static/js/inbox.js`, `app.js`, `views.js`, `clients.js`, and `static/css/styles.css`.
- Integrations: Official Meta Graph API v21.0 endpoints (`graph.facebook.com/v21.0`).

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Security & Auth | Unauthenticated 401 / Auth 200 for `/api/accounts`, `/api/conversations`, OAuth PKCE HttpOnly cookies | M1 | R1 | VERIFIED |
| 2 | Token Masking | Access tokens strictly masked as `EAAS7X••••••••4fA9` in API responses | M1 | R1 | VERIFIED |
| 3 | Automated Tests | 118 unit and integration tests passing in `pytest` | M1 | R1 | VERIFIED |
| 4 | 6 Mock Lead Threads | Render Ahmed Zaki, Medo, Azza, Siman, Doaa, Hager with avatars & status | M2 | R2 | VERIFIED |
| 5 | Lead Score Engine | Dynamic calculation (Hot 🔥 85%, Warm ☀️ 75%, Cold ❄️ 60%) in inbox & CRM | M2 | R2 | VERIFIED |
| 6 | CRM Sidebar & WhatsApp | Sales metrics (14 leads, 30k EGP, 5 hot), `wa.me` links and `tel:` call links | M2 | R2 | VERIFIED |
| 7 | Layout & CSS Grid | 3-column `#v-inbox.view.show` grid layout, font size rules, 37 button handlers | M2 | R2 | VERIFIED |
| 8 | `youtube_link.txt` | File containing App ID, video link, and 7 permission justifications payload | M3 | R3 | VERIFIED |
| 9 | `/privacy` Route | Compliance route returning HTTP 200 HTML & data deletion callbacks | M3 | R3 | VERIFIED |
| 10 | Meta Compliance | Official Graph API v21.0 usage, ZERO `instagrapi` library calls | M3 | R3 | VERIFIED |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend & Security Audit | Endpoints auth status, token masking, OAuth PKCE cookies, test runner | None | DONE |
| M2 | UI & Mock Inbox Audit | 6 mock leads, Lead Score badges, CRM sidebar, wa.me links, CSS grid | M1 | DONE |
| M3 | Meta App Review Compliance | youtube_link.txt, /privacy route, Graph API v21.0, zero instagrapi audit | M1, M2 | DONE |
| M4 | Final Gate Verification | Reviewer, Challenger, and Forensic Auditor gate verification | M1, M2, M3 | DONE |

## Code Layout
- `api/index.py`: Primary production Flask serverless app
- `server.py`: Standalone local Flask app
- `templates/index.html`: Main SPA HTML template
- `static/js/inbox.js`: Inbox rendering, filtering, search, draft approval
- `static/js/app.js`: Core initialization, view navigation, lead score engine
- `static/js/views.js`: Dashboard, accounts grid, RAG KB, rules
- `static/js/clients.js`: CRM sidebar, client switcher, wa.me links
- `static/css/styles.css`: CSS styling & grid overrides
- `youtube_link.txt`: Meta App Review link and App ID
