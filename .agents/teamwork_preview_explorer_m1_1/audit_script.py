import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

filepath = r"C:\Users\mhmd\meta_ai_moderator\templates\index.html"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()

print("=== ALL DIV IDs STARTING WITH v- ===")
for i, line in enumerate(lines, 1):
    matches = re.findall(r'id=["\'](v-[^"\']+)["\']', line)
    if matches:
        print(f"Line {i}: ID='{matches[0]}' -> {line.strip()[:90]}")

print("\n=== VIEW SWITCHING LOGIC IN JS ===")
for i, line in enumerate(lines, 1):
    if "switchView" in line or "showView" in line or "view === " in line or "v-" in line:
        if any(x in line for x in ["function", "switchView", "showView", "classList.add('hidden')", "classList.remove('hidden')"]):
            print(f"Line {i}: {line.strip()[:100]}")

print("\n=== CHECKING ALL 10 REQUIRED VIEW PANES ===")
required_views = [
    "v-inbox",
    "v-dash",
    "v-rules",
    "v-kb",
    "v-crm",
    "v-settings",
    "v-logs",
    "v-scheduler",
    "v-chatwoot",
    "v-analytics"
]

for view_id in required_views:
    has_id = any(f'id="{view_id}"' in l or f"id='{view_id}'" in l for l in lines)
    js_refs = [i for i, l in enumerate(lines, 1) if view_id in l]
    print(f"View Pane '{view_id}': HTML ID Present = {has_id} | Total Line Mentions = {len(js_refs)} (Lines: {js_refs[:5]})")
