import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

js_dir = 'static/js'
api_file = 'api/index.py'

# 1. Collect all API routes defined in api/index.py
with open(api_file, 'r', encoding='utf-8') as f:
    api_code = f.read()

backend_routes = re.findall(r'@app\.route\s*\(\s*[\'"]([^\'"]+)[\'"](?:\s*,\s*methods\s*=\s*(\[[^\]]+\]))?', api_code)
route_map = {}
for r, m in backend_routes:
    methods = m if m else "['GET']"
    route_map[r] = methods

print("=" * 70)
print("  BACKEND ROUTES FOUND IN api/index.py")
print("=" * 70)
for r in sorted(route_map.keys()):
    print(f"  📌 {r:45} {route_map[r]}")

# 2. Collect all fetch / API calls from Frontend JS files
frontend_calls = []
for root, dirs, files in os.walk(js_dir):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
            # Find fetch('/api/...') or fetch("/api/...")
            matches = re.findall(r'fetch\s*\(\s*[\'"`](/api/[^\'"?`]+)[\'"?`]', code)
            for m in matches:
                # Clean parameterized routes like /api/kb/${id} -> /api/kb/<id>
                clean_m = re.sub(r'/[0-9]+', '/<id>', m)
                clean_m = re.sub(r'/\${[^}]+}', '/<id>', clean_m)
                frontend_calls.append({'file': file, 'raw': m, 'clean': clean_m})

print("\n" + "=" * 70)
print("  FRONTEND API CALLS FOUND IN static/js/*.js")
print("=" * 70)
unique_calls = {}
for call in frontend_calls:
    key = (call['file'], call['clean'])
    unique_calls[key] = call['raw']

for (file, route), raw in sorted(unique_calls.items()):
    # Check match against backend
    # Exact match or param match
    matched = False
    for b_route in route_map.keys():
        b_clean = re.sub(r'<[^>]+>', '<id>', b_route)
        if route == b_clean or route.rstrip('/') == b_clean.rstrip('/'):
            matched = True
            break
        # prefix match for things like /api/approve
        if route.startswith('/api/approve') and b_route.startswith('/api/approve'):
            matched = True
            break
        if route.startswith('/api/reject') and b_route.startswith('/api/reject'):
            matched = True
            break

    status = "✅ MATCH" if matched else "❌ UNMATCHED"
    print(f"  [{status}] {file:15} → {raw:35} (clean: {route})")

