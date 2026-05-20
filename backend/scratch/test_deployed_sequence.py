import urllib.request
import json
import urllib.error

url_register = "https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod/auth/register"
url_login = "https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod/auth/login"

payload_register = {
    "name": "Maitry",
    "email": "maitrypatel2004@gmail.com",
    "password": "testpassword"
}

payload_login = {
    "email": "maitrypatel2004@gmail.com",
    "password": "testpassword"
}

def make_request(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

print("1. Registering user...")
status, body = make_request(url_register, payload_register)
print(f"Register status: {status}, response: {body}")

print("\n2. Logging in user...")
status, body = make_request(url_login, payload_login)
print(f"Login status: {status}, response: {body}")
