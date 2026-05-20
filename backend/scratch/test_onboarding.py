import urllib.request
import json

url = "https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod/generate/chat"

payload = {
    "message": "I want to build a serverless cloud web application on AWS",
    "history": [
        { "text": "Hi! I'm Cloudy. Select your preferred Cloud Platform above, tell me what kind of app you want to build, and I will guide you with architecture recommendations!", "isBot": True }
    ],
    "platform": "AWS"
}

headers = {
    "Content-Type": "application/json"
}

print("Running Live AWS API Gateway chat onboarding test...")
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(req, timeout=15) as response:
        print("Success! Status:", response.status)
        res_data = json.loads(response.read().decode('utf-8'))
        print("Response payload:")
        print(json.dumps(res_data, indent=2))
except Exception as e:
    print("Failed:", e)
    if hasattr(e, 'read'):
        print("Error details:", e.read().decode('utf-8'))
