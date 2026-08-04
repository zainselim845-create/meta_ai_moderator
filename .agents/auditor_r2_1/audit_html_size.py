import os
import sys
import base64

sys.path.insert(0, os.path.abspath('.'))

def check_html():
    from api.index import app, HTML_B64

    client = app.test_client()
    res = client.get('/')
    html_out = res.get_data(as_text=True)
    size_out = len(res.data)
    print(f"GET / response status: {res.status_code}")
    print(f"GET / response body size: {size_out/1024.0:.2f} KB ({size_out} bytes)")

    decoded_b64 = base64.b64decode(HTML_B64).decode('utf-8')
    print(f"Decoded HTML_B64 size: {len(decoded_b64)/1024.0:.2f} KB ({len(decoded_b64)} bytes)")

    if size_out < 30 * 1024:
        print("PASS: Uncompressed HTML served at / is under 30KB limit!")
    else:
        print("FAIL: HTML response exceeds 30KB limit!")

if __name__ == '__main__':
    check_html()
