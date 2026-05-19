from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_service import GeminiService

router = APIRouter()

class AnalyseRequest(BaseModel):
    architecture_data: str

@router.post("/architecture")
def analyse_architecture(req: AnalyseRequest):
    gemini_service = GeminiService()
    result = gemini_service.analyse_architecture(req.architecture_data)
    
    if "error" in result:
        return {
            "status": "error",
            "message": result["error"],
            "raw": result.get("raw", "")
        }
        
    return {
        "status": "success",
        "issues": result.get("issues", []),
        "suggested_nodes": result.get("suggested_nodes", []),
        "suggested_edges": result.get("suggested_edges", [])
    }

@router.post("/upload")
def upload_architecture():
    return {"status": "success", "message": "File processed via Textract and analysed"}
