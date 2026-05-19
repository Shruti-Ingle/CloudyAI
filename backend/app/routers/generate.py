from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services.gemini_service import GeminiService

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    platform: str = "AWS"
    history: Optional[List[Dict]] = None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict]] = None
    platform: str = "AWS"

@router.post("/architecture")
def generate_architecture(req: GenerateRequest):
    gemini_service = GeminiService()
    result = gemini_service.generate_architecture(req.prompt, req.platform, req.history)
    
    if "error" in result:
        return {
            "status": "error",
            "message": result["error"],
            "raw": result.get("raw", "")
        }
        
    return {
        "status": "success",
        "platform": req.platform,
        "nodes": result.get("nodes", []),
        "edges": result.get("edges", []),
        "cost": result.get("cost", {})
    }

@router.post("/chat")
def chat_with_assistant(req: ChatRequest):
    gemini_service = GeminiService()
    result = gemini_service.generate_chat_response(req.message, req.history, req.platform)
    
    return {
        "status": "success",
        "reply": result.get("reply", "I had a temporary connection issue. How else can I help?")
    }

@router.get("/history")
def get_history():
    return [
        {"id": 1, "prompt": "E-commerce Backend", "platform": "AWS", "date": "2026-05-18"}
    ]
