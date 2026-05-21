import urllib.request
import json

url = "https://openrouter.ai/api/v1/chat/completions"
# Test the key without the .iETov7wv3lyf9IXV49xDihwT part, or other combinations
key_combinations = [
    "sk-or-v1-e8c955b188ca4d95808f1168b0283b4f",
    "sk-or-v1-e8c955b188ca4d95808f1168b0283b4f.iETov7wv3lyf9IXV49xDihwT",
    "e8c955b188ca4d95808f1168b0283b4f",
    "sk-e8c955b188ca4d95808f1168b0283b4f"
]

for key in key_combinations:
    print(f"\n--- Testing key: {key[:20]}... ---")
    payload = {
        "model": "google/gemini-flash-1.5",
        "messages": [
            {"role": "user", "content": "Hello"}
        ]
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "CloudDaddy AI Architect"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            print("Success!", response.read().decode('utf-8')[:200])
    except Exception as e:
        print("Failed:", e)
        if hasattr(e, 'read'):
            print("Body:", e.read().decode('utf-8'))
