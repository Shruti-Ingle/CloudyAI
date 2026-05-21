import urllib.request
import json

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyCbY9zUV6DMN0A_BZD-Gxh2cFSeMkeiuBI"

payload = {
    "contents": [{
        "parts": [{"text": "Hello"}]
    }]
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        print("Success! Gemini response:")
        print(response.read().decode('utf-8'))
except Exception as e:
    print("Failed:", e)
    if hasattr(e, 'read'):
        print("Body:", e.read().decode('utf-8'))
