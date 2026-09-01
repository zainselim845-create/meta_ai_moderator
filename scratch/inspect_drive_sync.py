import sys, json, os, urllib.request, urllib.parse
sys.path.insert(0, r'C:\Users\mhmd\meta_ai_moderator')
from api.index import (
    get_google_oauth_access_token,
    CLIENTS_ROOT_FOLDER_ID,
    EMPLOYEES_ROOT_FOLDER_ID,
    _ensure_employee_folder,
    _ensure_client_folder,
    _ensure_client_month_folder,
    hr_config,
    _gsheet_rows
)

token = get_google_oauth_access_token()
print("=" * 70)
print("GOOGLE DRIVE LIVE STRUCTURE INSPECTION")
print("=" * 70)
print(f"Token present: {bool(token)}")
print(f"CLIENTS_ROOT_FOLDER_ID: {CLIENTS_ROOT_FOLDER_ID}")
print(f"EMPLOYEES_ROOT_FOLDER_ID: {EMPLOYEES_ROOT_FOLDER_ID}")

# 1. Employees Root Folders
eq = f"'{EMPLOYEES_ROOT_FOLDER_ID}' in parents and trashed = false"
eurl = f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(eq)}&fields=files(id,name,mimeType)"
ereq = urllib.request.Request(eurl, headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(ereq, timeout=15) as resp:
    efolders = json.loads(resp.read().decode()).get('files', [])

print(f"\n1. EMPLOYEE FOLDERS UNDER EMPLOYEES ROOT ({len(efolders)} folders):")
for f in efolders:
    # Check subfolders inside each employee folder
    sq = f"'{f['id']}' in parents and trashed = false"
    surl = f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(sq)}&fields=files(id,name,mimeType)"
    sreq = urllib.request.Request(surl, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(sreq, timeout=15) as sresp:
        subitems = json.loads(sresp.read().decode()).get('files', [])
    print(f"  👤 {f['name']} ({f['id']}) -> {len(subitems)} items/subfolders inside")
    for si in subitems[:5]:
        print(f"     └─ 📁 {si['name']} ({si['mimeType']})")

# 2. Clients Root Folders
cq = f"'{CLIENTS_ROOT_FOLDER_ID}' in parents and trashed = false"
curl = f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(cq)}&fields=files(id,name,mimeType)"
creq = urllib.request.Request(curl, headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(creq, timeout=15) as resp:
    c_folders = json.loads(resp.read().decode()).get('files', [])

print(f"\n2. CLIENT FOLDERS UNDER CLIENTS ROOT ({len(c_folders)} folders):")
for cf in c_folders:
    sq = f"'{cf['id']}' in parents and trashed = false"
    surl = f"https://www.googleapis.com/drive/v3/files?q={urllib.parse.quote(sq)}&fields=files(id,name,mimeType)"
    sreq = urllib.request.Request(surl, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(sreq, timeout=15) as sresp:
        subitems = json.loads(sresp.read().decode()).get('files', [])
    print(f"  🏢 {cf['name']} ({cf['id']}) -> {len(subitems)} items/subfolders inside")
    for si in subitems[:5]:
        print(f"     └─ 📁 {si['name']} ({si['mimeType']})")

print("\n" + "=" * 70)
