import urllib.request
import json

key_raw = "e8c955b188ca4d95808f1168b0283b4f.iETov7wv3lyf9IXV49xDihwT"
keys_to_test = [
    key_raw,
    f"sk-or-v1-{key_raw}"
]

for key in keys_to_test:
    print(f"\n--- Testing OpenRouter with key: {key[:15]}... ---")
    payload = {
        "model": "google/gemma-2-9b-it",
        "messages": [
            {"role": "user", "content": "Hello! Confirm that this API key is active."}
        ]
    }

    req_post = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
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
        with urllib.request.urlopen(req_post, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print("Success! Chat completion response:")
            print(res_data['choices'][0]['message']['content'].strip()[:200])
            exit(0)
    except Exception as e:
        err_msg = ""
        if hasattr(e, 'read'):
            err_msg = e.read().decode('utf-8')
        print(f"Failed: {e} {err_msg}")
