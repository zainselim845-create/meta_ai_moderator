## 2026-08-03T10:14:19Z
You are Worker R1 (Frontend Lead). Your working directory is C:\Users\mhmd\meta_ai_moderator\.agents\teamwork_preview_worker_r1_1.

Your task is to execute R1 Frontend Refactoring on C:\Users\mhmd\meta_ai_moderator\templates\index.html and any related frontend assets:

1. Refactor templates/index.html strictly adhering to the design system:
   - 3 colors only: #2563eb (primary blue), Gray (#6b7280, #f3f4f6, #e5e7eb), #10b981 (emerald green).
   - 5 font sizes only: 12px (text-xs), 13px, 14px (text-sm), 16px (text-base), 20px (text-xl). Absolutely NO 9px font sizes! Normalize/remove all unallowed sizes (10px, 14.5px, 15px, 18px, 22px, 28px).
   - 3 border radius values: 8px (rounded-lg), 12px (rounded-xl), 16px (rounded-2xl).
   - 1 shadow style (shadow-sm or shadow).
   - 2 button styles: Primary (bg-blue-600 text-white), Ghost (bg-transparent text-slate-600 hover:bg-slate-100).
   - 2 grids (responsive grid layouts).
   - Lucide icons ONLY (0 emojis! Replace all 258 Unicode emojis across the HTML with Lucide SVG icons <i data-lucide="..."></i>).
   - White cards ONLY (no dark transparent cards, replace dark slate buttons bg-slate-900 with blue or gray ghost buttons).
   - Convert inline styles to Tailwind CSS classes so total inline styles across the codebase is < 20 total.
   - Refactor/decompose stylesheet/scripts so page size is < 30KB per page.
   - Ensure all 10 view pane IDs exist and match: id="v-inbox", id="v-dash", id="v-rules", id="v-kb", id="v-crm", id="v-settings", id="v-logs", id="v-scheduler", id="v-chatwoot", id="v-analytics".
   - Ensure Chatwoot button contains exact text 'ربط من Chatwoot - فري' and calls loginFromChatwoot().
   - Ensure contact links use real tel: and whatsapp:// (whatsapp://send?phone=...) protocols with 0 JS alert() popups (replace native alert() calls with a non-blocking toast function showToast()).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Run verification (e.g. check inline style count, emoji count, line/file sizes) and document all changes and test outputs in C:\Users\mhmd\meta_ai_moderator\.agents\teamwork_preview_worker_r1_1\handoff.md. Report back via send_message when complete.
