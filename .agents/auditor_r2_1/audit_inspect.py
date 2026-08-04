import os
import re

def inspect_file(filepath):
    print(f"=== Inspecting {filepath} ===")
    if not os.path.exists(filepath):
        print(f"File {filepath} does not exist.")
        return
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Graph API
    graph_matches = set(re.findall(r'graph\.facebook\.com/v\d+\.\d+', content))
    print(f"Graph API URLs: {graph_matches}")

    # instagrapi
    instagrapi_matches = re.findall(r'instagrapi', content, re.IGNORECASE)
    print(f"Instagrapi occurrences: {len(instagrapi_matches)}")

    # Privacy route
    privacy_matches = re.findall(r'/privacy', content)
    print(f"/privacy route references: {len(privacy_matches)}")

    # Masking
    mask_matches = [line.strip() for line in content.splitlines() if 'mask' in line.lower()]
    print(f"Masking lines count: {len(mask_matches)}")
    for line in mask_matches[:5]:
        print("  -", line)

if __name__ == '__main__':
    inspect_file('api/index.py')
    inspect_file('server.py')
    inspect_file('facebook_free_connector.py')
    inspect_file('insta_gateway.py')
    inspect_file('insta_session_bridge.py')
