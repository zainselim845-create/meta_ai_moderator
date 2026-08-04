# Project Plan: Meta AI Social Moderator Refactoring & Security Workflow

## Executive Overview
Executing a strict 5-role Team Workflow (Frontend Lead, Backend Lead, Integration Lead, Functionality Lead, QA Lead) to refactor, secure, and finalize the Meta AI Social Moderator system in `C:\Users\mhmd\meta_ai_moderator`.

## Milestones

### Milestone 1: Multi-Explorer Baseline Audit
- **Goal**: Perform comprehensive code analysis of `server.py`, `templates/index.html`, and existing test suites against R1-R5 specifications.
- **Explorers**:
  - `teamwork_preview_explorer` (Explorer 1): Frontend & UI design system analysis (inline styles, emojis, font sizes, card styles, Chatwoot button).
  - `teamwork_preview_explorer` (Explorer 2): Backend security & functionality analysis (LRU cache, Web Crypto, State+PKCE, 401 endpoints, instagrapi audit, hardcoded creds 'domya', lead scoring, tel/whatsapp links, git branches).

### Milestone 2: R1 Frontend Refactoring (Frontend Lead)
- **Goal**: Convert all inline styles to Tailwind CSS (<20 total), replace all emojis with Lucide icons (0 emojis), enforce design system (3 colors: #2563eb, Gray, #10b981; 5 font sizes: 12px, 13px, 14px, 16px, 20px - NO 9px; 3 radii: 8px, 12px, 16px; 1 shadow; 2 button styles: Primary, Ghost; white cards only; page size <30KB).
- **Worker**: `teamwork_preview_worker` (Frontend Lead)

### Milestone 3: R2 Backend Security & Free Tier (Backend Lead)
- **Goal**: Implement LRU cache (replace Redis), Web Crypto AES-256-GCM, State+PKCE for OAuth, protect security endpoints with 401 Unauthorized, remove instagrapi (0 instances), remove hardcoded credentials like 'domya' (0 instances).
- **Worker**: `teamwork_preview_worker` (Backend Lead)

### Milestone 4: R3 Chatwoot Free Integration (Integration Lead)
- **Goal**: Implement Chatwoot MIT free connector logic (`FacebookFreeConnector.getLoginUrl()`), implement `loginFromChatwoot()`, add UI button 'ربط من Chatwoot - فري'.
- **Worker**: `teamwork_preview_worker` (Integration Lead)

### Milestone 5: R4 Core Functionality & Sales Dashboard (Functionality Lead)
- **Goal**: Implement dynamic lead scoring (`calculateLeadScore`), real `tel:` and `whatsapp://` links (0 JS alerts), Sales Dashboard metrics (14 leads, 30k, 5 hot), ensure all 10 panes are fully populated and functional, implement working Scheduler with backend cron logic.
- **Worker**: `teamwork_preview_worker` (Functionality Lead)

### Milestone 6: R5 Git Version Control & Backup (QA Lead)
- **Goal**: Initialize Git repo, create 5 lead branches (`frontend-lead`, `backend-lead`, `integration-lead`, `functionality-lead`, `qa-lead`), commit baseline and feature branches, enforce PR review process.
- **Worker**: `teamwork_preview_worker` (QA Lead)

### Milestone 7: Verification, Challenger Stress Testing & Forensic Audit
- **Goal**: Reviewer code & compliance signoff (`teamwork_preview_reviewer`), Challenger empirical stress testing (`teamwork_preview_challenger`), Forensic Auditor integrity verification (`teamwork_preview_auditor`).
- **Pass Criteria**: Build/tests pass, Reviewer approves, Challenger passes, Forensic Auditor CLEAN verdict.
