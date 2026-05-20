import urllib.request
import json

raw_key = "ae9185cb5675464b9566360907995454.5XQlA7RzVKZ0-_xHp5Ttj_-c"

keys = [
    raw_key,
    f"sk-{raw_key}"
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
                exit(0)
        except Exception as e:
            pass

print("All simple GET info checks failed.")
