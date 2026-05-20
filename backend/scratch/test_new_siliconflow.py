import urllib.request
import json

key = "e8c955b188ca4d95808f1168b0283b4f.iETov7wv3lyf9IXV49xDihwT"

keys_to_test = [
    key,
    f"sk-{key}"
]

models_to_test = [
    "google/gemma-2-9b-it",
    "google/gemma-3-27b-it",
    "google/gemma-4-31b-it",
    "deepseek-ai/DeepSeek-V3",
    "Qwen/Qwen2.5-72B-Instruct"
]

for k in keys_to_test:
    print(f"\n--- Testing on .com with key {k[:10]}... ---")
    for m in models_to_test:
        payload = {
            "model": m,
            "messages": [
                {"role": "user", "content": "Hello"}
            ]
        }
        
        req = urllib.request.Request(
            "https://api.siliconflow.com/v1/chat/completions",
            data=json.dumps(payload).encode('utf-8'),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {k}"
            },
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                res = json.loads(response.read().decode('utf-8'))
                print(f"Success on SiliconFlow .com with model {m}!")
                print(res['choices'][0]['message']['content'].strip()[:150])
                exit(0)
        except Exception as e:
            err_msg = ""
            if hasattr(e, 'read'):
                err_msg = e.read().decode('utf-8')
            print(f"Failed with model {m}: {e} {err_msg}")
