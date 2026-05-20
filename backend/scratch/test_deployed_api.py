import urllib.request
import json

url = "https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod/auth/register"
payload = {
    "name": "Maitry",
    "email": "maitrypatel2004@gmail.com",
    "password": "testpassword"
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    print("Testing deployed register endpoint...")
    with urllib.request.urlopen(req, timeout=10) as response:
        print("Success! Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except Exception as e:
    print("Failed:", e)
    if hasattr(e, 'read'):
        print("Error details:", e.read().decode('utf-8'))
