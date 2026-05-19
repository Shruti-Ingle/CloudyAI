from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_service import GeminiService

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    platform: str = "AWS"

@router.post("/architecture")
def generate_architecture(req: GenerateRequest):
    gemini_service = GeminiService()
    result = gemini_service.generate_architecture(req.prompt, req.platform)
    
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

@router.get("/history")
def get_history():
    return [
        {"id": 1, "prompt": "E-commerce Backend", "platform": "AWS", "date": "2026-05-18"}
    ]
