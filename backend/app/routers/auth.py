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

@router.post("/login")
def login(req: LoginRequest):
    # Mock authentication
    if req.email and req.password:
        return {
            "access_token": "mock_jwt_token_12345",
            "token_type": "bearer",
            "user": {"id": 1, "name": "Demo Company", "email": req.email}
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/register")
def register(req: RegisterRequest):
    return {"message": "User registered successfully"}

@router.post("/refresh")
def refresh():
    return {"access_token": "mock_jwt_token_67890"}

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
