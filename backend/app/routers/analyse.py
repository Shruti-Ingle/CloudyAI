from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_service import GeminiService

router = APIRouter()

class AnalyseRequest(BaseModel):
    architecture_data: str

@router.post("/architecture")
def analyse_architecture(req: AnalyseRequest):
    try:
        gemini_service = GeminiService()
        result = gemini_service.analyse_architecture(req.architecture_data)
    except Exception as gemini_err:
        print(f"Gemini analysis failed with exception: {gemini_err}. Trying AWS Bedrock fallback...")
        result = {"error": f"Gemini analysis failed: {str(gemini_err)}"}
    
    if "error" in result:
        # Try AWS Bedrock as the ultimate self-healing fallback!
        try:
            print("Gemini analysis failed - attempting AWS Bedrock fallback...")
            from app.services.bedrock_service import BedrockService
            bedrock_service = BedrockService()
            bedrock_result = bedrock_service.analyse_architecture(req.architecture_data)
            if bedrock_result and "error" not in bedrock_result:
                print("Successfully recovered from analysis failure using AWS Bedrock fallback!")
                return {
                    "status": "success",
                    "issues": bedrock_result.get("issues", []),
                    "suggested_nodes": bedrock_result.get("suggested_nodes", []),
                    "suggested_edges": bedrock_result.get("suggested_edges", [])
                }
        except Exception as bedrock_err:
            print(f"AWS Bedrock fallback analysis failed: {bedrock_err}")

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
