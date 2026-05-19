from typing import Any

def success_response(data: Any, message: str = "Success"):
    return {
        "status": "success",
        "message": message,
        "data": data
    }

def error_response(message: str, code: int = 400):
    return {
        "status": "error",
        "message": message,
        "code": code
    }
