import re

with open('api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any HTML_TEMPLATE block up to DEFAULT_SYSTEM_PROMPT or app = Flask(__name__)
content = re.sub(r'HTML_TEMPLATE = base64\.b64decode\(.*?\)\.decode\("utf-8"\)\n?', '', content, flags=re.DOTALL)
content = re.sub(r'HTML_TEMPLATE = base64\.b64decode\(.*?\)\n?', '', content, flags=re.DOTALL)

# Now insert single line placeholder before DEFAULT_SYSTEM_PROMPT
content = content.replace('DEFAULT_SYSTEM_PROMPT =', 'HTML_TEMPLATE = base64.b64decode("").decode("utf-8")\n\nDEFAULT_SYSTEM_PROMPT =')

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned HTML_TEMPLATE block.")
