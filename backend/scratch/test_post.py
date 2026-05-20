import urllib.request
import json

url = "https://openrouter.ai/api/v1/chat/completions"
key = "e8c955b188ca4d95808f1168b0283b4f.iETov7wv3lyf9IXV49xDihwT"

payload = {
    "model": "google/gemma-2-9b-it",
    "messages": [{"role": "user", "content": "hi"}]
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {key}"
}

print("Running raw OpenRouter POST request...")
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(req) as response:
        print("Success! Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Failed:", e)
    if hasattr(e, 'read'):
        print("Error details:", e.read().decode('utf-8'))
