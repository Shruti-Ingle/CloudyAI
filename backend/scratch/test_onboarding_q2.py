import urllib.request
import json

url = "https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod/generate/chat"

payload = {
    "message": "We expect around 50,000 monthly active users with small peaks on weekends.",
    "history": [
        { "text": "Hi! I'm Cloudy. Select your preferred Cloud Platform above, tell me what kind of app you want to build, and I will guide you with architecture recommendations!", "isBot": True },
        { "text": "I want to build a serverless cloud web application on AWS", "isBot": False },
        { "text": "That's a fantastic choice; building a serverless web app using AWS Lambda, Amazon API Gateway, and DynamoDB will give you an incredibly resilient, auto-scaling architecture with zero idle-compute costs. What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)", "isBot": True }
    ],
    "platform": "AWS"
}

headers = {
    "Content-Type": "application/json"
}

print("Running Live AWS API Gateway Q2 onboarding test...")
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
