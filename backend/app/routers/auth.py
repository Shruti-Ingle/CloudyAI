from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

# Simple in-memory user registry to support full personalized names
USERS_DB = {}

@router.post("/register")
def register(req: RegisterRequest):
    email_key = req.email.lower().strip()
    if email_key in USERS_DB:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    USERS_DB[email_key] = {
        "id": len(USERS_DB) + 1,
        "name": req.name.strip(),
        "email": req.email.strip(),
        "password": req.password
    }
    return {"message": "User registered successfully"}

@router.post("/login")
def login(req: LoginRequest):
    email_key = req.email.lower().strip()
    
    # 1. If user is registered in memory, retrieve their authentic name!
    if email_key in USERS_DB:
        user = USERS_DB[email_key]
        if user["password"] == req.password:
            return {
                "access_token": f"mock_jwt_token_{user['id']}",
                "token_type": "bearer",
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"]
                }
            }
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 2. Dynamic fallback logic to parse name cleanly from email if not previously registered
    if req.email and req.password:
        username = req.email.split("@")[0]
        # Replace common separators with spaces and titlecase
        clean_name = username.replace(".", " ").replace("_", " ").title()
        return {
            "access_token": "mock_jwt_token_12345",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "name": clean_name,
                "email": req.email
            }
        }
        
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/refresh")
def refresh():
    return {"access_token": "mock_jwt_token_67890"}

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
