import urllib.request
import json

raw_key = "ae9185cb5675464b9566360907995454.5XQlA7RzVKZ0-_xHp5Ttj_-c"

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
