from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    platform: str = "AWS"

@router.post("/architecture")
def generate_architecture(req: GenerateRequest):
    # Mocking Bedrock Claude generation
    return {
        "status": "success",
        "platform": req.platform,
        "nodes": [
            {"id": "client", "type": "WebClient"},
            {"id": "api", "type": "APIGateway"},
            {"id": "lambda", "type": "Compute"}
        ]
    }

@router.get("/history")
def get_history():
    return [
        {"id": 1, "prompt": "E-commerce Backend", "platform": "AWS", "date": "2026-05-18"}
    ]
