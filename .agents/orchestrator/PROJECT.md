# Project: Domya AI Moderator QA Audit & Review

## Architecture & Overview
- Target Project: Domya AI Moderator (Social Media AI Moderator Dashboard)
- Live Production URL: `https://metaaimoderator.vercel.app/`
- Local Repository: `C:\Users\mhmd\meta_ai_moderator`
- Stack: Python (Pytest backend/integration tests), HTML/Tailwind CSS/JS frontend template (`templates/index.html`, `static/css/styles.css`, `static/js/...`)

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Codebase Quality & Pytest Verification | `templates/index.html` size (<30KB), zero inline styles, 3 main colors, 5 font sizes, run pytest (118 passing tests) | none | DONE |
| 2 | Live Browser & UI Verification | Audit `https://metaaimoderator.vercel.app/` HTTP 200, size <30KB, `#inbox-search`, `renderInboxList()`, `#v-inbox` grid display, Top Bar button & badge | M1 | DONE |
| 3 | Detailed 37 Buttons & Controls Audit | Check all 37 buttons across Sidebar (10), Inbox, 8-Controls Grid, Scheduler/KB/CRM modals, OAuth redirect `startMetaOAuth()` -> `loginFromChatwoot()` | M2 | DONE |
| 4 | Forensic Integrity Audit & Final Claim | Forensic Auditor integrity verification, final checks, report to parent | M3 | DONE |

## Interface Contracts & Constraints
- `templates/index.html` < 30KB uncompressed size
- Zero inline styles (`style="..."` attributes)
- 3 main colors (`#2563eb`, `#10b981`, slate/gray)
- 5 readable font sizes (`12px`, `13px`, `14px`, `16px`, `20px`)
- All 118 unit and integration tests in `pytest` must pass
