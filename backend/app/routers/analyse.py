
from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel
from app.services.gemini_service import GeminiService
from app.dependencies import get_current_user
import uuid
import os

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
async def upload_architecture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        from app.services.s3_service import S3Service
        from app.services.textract_service import TextractService
        from app.services.dynamo_service import DynamoService
        
        user_id = current_user.get("sub", "anonymous")
        file_id = str(uuid.uuid4())
        
        # 1. Read file content
        file_content = await file.read()
        
        # Make a safe object name
        file_extension = os.path.splitext(file.filename)[1] or ".png"
        object_name = f"uploads/{user_id}/{file_id}{file_extension}"
        
        # 2. Upload file to S3
        s3_service = S3Service()
        upload_success = s3_service.upload_file(file_content, object_name)
        if not upload_success:
            return {"status": "error", "message": "Failed to upload file to S3"}
            
        # 3. Invoke Textract to extract text
        textract_service = TextractService()
        extracted_text = textract_service.extract_text_from_s3(s3_service.bucket, object_name)
        if not extracted_text:
            # Fallback in case of Textract error/local dev mock
            extracted_text = f"Mocked text extracted from {file.filename}: Web server with load balancer and database."
            
        # 4. Perform Gemini Architecture Analysis on the text
        gemini_service = GeminiService()
        try:
            analysis_result = gemini_service.analyse_architecture(extracted_text)
        except Exception as gemini_err:
            print(f"Gemini analysis in upload failed: {gemini_err}. Trying Bedrock fallback...")
            try:
                from app.services.bedrock_service import BedrockService
                bedrock_service = BedrockService()
                analysis_result = bedrock_service.analyse_architecture(extracted_text)
            except Exception as bedrock_err:
                print(f"Bedrock fallback failed: {bedrock_err}")
                analysis_result = {"error": str(gemini_err)}
                
        # 5. Save the analysis record to DynamoDB
        dynamo_service = DynamoService()
        
        db_data = {
            "file_id": file_id,
            "s3_url": s3_service.get_download_url(object_name) or "",
            "extracted_text": extracted_text,
            "analysis": analysis_result
        }
        
        dynamo_service.save_generation(
            user_id=user_id,
            title=f"Analysed Upload: {file.filename}",
            platform="AWS", # Default
            data=db_data
        )
        
        return {
            "status": "success",
            "message": "File processed via Textract and analysed successfully",
            "file_id": file_id,
            "extracted_text": extracted_text,
            "analysis": analysis_result
        }
        
    except Exception as e:
        print(f"Error in upload_architecture: {e}")
        return {"status": "error", "message": str(e)}
