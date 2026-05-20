import urllib.request
import json

new_key = "e8c955b188ca4d95808f1168b0283b4f.iETov7wv3lyf9IXV49xDihwT"

keys = [
    new_key,
    f"sk-{new_key}"
]

endpoints = [
    ("SiliconFlow USER INFO", "https://api.siliconflow.cn/v1/user/info"),
    ("SiliconFlow MODELS", "https://api.siliconflow.cn/v1/models"),
    ("OpenRouter MODELS", "https://openrouter.ai/api/v1/models")
]

for key in keys:
    for name, url in endpoints:
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {key}"
            },
            method="GET"
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                res = response.read().decode('utf-8')
                print(f"Success on {name} with key {key[:10]}: {res[:150]}")
        except Exception as e:
            print(f"Failed on {name} with key {key[:10]}: {e}")
