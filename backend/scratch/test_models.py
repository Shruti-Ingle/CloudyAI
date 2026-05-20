import urllib.request
import json

raw_key = "e8c955b188ca4d95808f1168b0283b4f.iETov7wv3lyf9IXV49xDihwT"

keys = [
    raw_key,
    f"sk-{raw_key}"
]

for key in keys:
    print(f"Testing SiliconFlow CN models with key: {key[:10]}...")
    req = urllib.request.Request(
        "https://api.siliconflow.cn/v1/models",
        headers={
            "Authorization": f"Bearer {key}"
        },
        method="GET"
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res = response.read().decode('utf-8')
            print(f"-> Success! Models response: {res[:200]}")
    except Exception as e:
        print(f"-> Failed: {e}")
        if hasattr(e, 'read'):
            print("Error body:", e.read().decode('utf-8'))
