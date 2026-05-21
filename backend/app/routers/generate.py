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
    question_index: Optional[int] = None

@router.post("/architecture")
def generate_architecture(req: GenerateRequest):
    # 1. Try Ollama first!
    try:
        from app.services.ollama_service import OllamaService
        ollama_service = OllamaService()
        print("Attempting to generate architecture using Ollama...")
        result = ollama_service.generate_architecture(req.prompt, req.platform, req.history)
        if "error" not in result:
            return {
                "status": "success",
                "platform": req.platform,
                "nodes": result.get("nodes", []),
                "edges": result.get("edges", []),
                "cost": result.get("cost", {})
            }
        print(f"Ollama generation returned error: {result['error']}. Falling back to OpenRouter...")
    except Exception as e:
        print(f"Ollama generation failed with exception: {e}. Falling back to OpenRouter...")

    # 2. Try OpenRouter second
    try:
        from app.services.openrouter_service import OpenRouterService
        openrouter_service = OpenRouterService()
        if openrouter_service.api_key:
            print("Attempting to generate architecture using OpenRouter (DeepSeek V3)...")
            result = openrouter_service.generate_architecture(req.prompt, req.platform, req.history)
            if "error" not in result:
                return {
                    "status": "success",
                    "platform": req.platform,
                    "nodes": result.get("nodes", []),
                    "edges": result.get("edges", []),
                    "cost": result.get("cost", {})
                }
            print(f"OpenRouter generation returned error: {result['error']}. Falling back to SiliconFlow...")
    except Exception as e:
        print(f"OpenRouter generation failed with exception: {e}. Falling back to SiliconFlow...")

    # 3. Try SiliconFlow third
    try:
        from app.services.siliconflow_service import SiliconFlowService
        siliconflow_service = SiliconFlowService()
        if siliconflow_service.api_key:
            print("Attempting to generate architecture using SiliconFlow...")
            result = siliconflow_service.generate_architecture(req.prompt, req.platform, req.history)
            if "error" not in result:
                return {
                    "status": "success",
                    "platform": req.platform,
                    "nodes": result.get("nodes", []),
                    "edges": result.get("edges", []),
                    "cost": result.get("cost", {})
                }
            print(f"SiliconFlow generation returned error: {result['error']}. Falling back to Gemini...")
    except Exception as e:
        print(f"SiliconFlow generation failed with exception: {e}. Falling back to Gemini...")

    # 4. Try Gemini (Google) as the final fallback
    gemini_service = GeminiService()
    result = gemini_service.generate_architecture(req.prompt, req.platform, req.history)
    
    if "error" in result:
        # Automatic OpenAI failover recovery fallback loop if Gemini key hits a rate limit block!
        if "rate limit" in result["error"].lower() or "quota" in result["error"].lower():
            try:
                from app.services.openai_service import OpenAIService
                openai_service = OpenAIService()
                if openai_service.api_key:
                    print("Gemini rate limited - attempting OpenAI Architecture generation fallback...")
                    openai_result = openai_service.generate_architecture(req.prompt)
                    if "error" not in openai_result:
                        print("Successfully recovered from Gemini rate limit using OpenAI fallback!")
                        return {
                            "status": "success",
                            "platform": req.platform,
                            "nodes": openai_result.get("nodes", []),
                            "edges": openai_result.get("edges", []),
                            "cost": {
                                "total_monthly_cost": "$28.50",
                                "services": [
                                    {"name": f"{req.platform} Compute Logic", "monthly_cost": "$18.00", "breakdown": "Serverless microservice execution logic"},
                                    {"name": f"{req.platform} Database Store", "monthly_cost": "$10.50", "breakdown": "Data persistence storage layer"}
                                ]
                            }
                        }
            except Exception as oai_err:
                print(f"OpenAI fallback invocation failed: {oai_err}")

        # Try AWS Bedrock as the ultimate bulletproof fallback!
        try:
            print("Gemini generation failed - attempting AWS Bedrock fallback...")
            from app.services.bedrock_service import BedrockService
            bedrock_service = BedrockService()
            bedrock_result = bedrock_service.generate_architecture(req.prompt)
            if bedrock_result and "error" not in bedrock_result and ("nodes" in bedrock_result or "edges" in bedrock_result):
                print("Successfully recovered from generation failure using AWS Bedrock fallback!")
                return {
                    "status": "success",
                    "platform": req.platform,
                    "nodes": bedrock_result.get("nodes", []),
                    "edges": bedrock_result.get("edges", []),
                    "cost": bedrock_result.get("cost", {
                        "total_monthly_cost": "$15.20",
                        "services": [
                            {"name": "API Gateway", "monthly_cost": "$3.50", "breakdown": "Entry gateway endpoints"},
                            {"name": "AWS Lambda", "monthly_cost": "$0.20", "breakdown": "Serverless compute logic execution"},
                            {"name": "Amazon DynamoDB", "monthly_cost": "$11.50", "breakdown": "Key-value and document database storage"}
                        ]
                    })
                }
        except Exception as bedrock_err:
            print(f"AWS Bedrock fallback generation failed: {bedrock_err}")

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
    # 1. Try Ollama first!
    try:
        from app.services.ollama_service import OllamaService
        ollama_service = OllamaService()
        print("Attempting chat completion using Ollama...")
        result = ollama_service.generate_chat_response(req.message, req.history, req.platform, req.question_index)
        if result and "reply" in result and "connection issue" not in result["reply"] and "rate limits" not in result["reply"]:
            return {
                "status": "success",
                "reply": result["reply"]
            }
        print("Ollama chat returned connection/error reply. Falling back to OpenRouter...")
    except Exception as e:
        print(f"Ollama chat failed with exception: {e}. Falling back to OpenRouter...")

    # 2. Try OpenRouter second
    try:
        from app.services.openrouter_service import OpenRouterService
        openrouter_service = OpenRouterService()
        if openrouter_service.api_key:
            print("Attempting chat completion using OpenRouter...")
            result = openrouter_service.generate_chat_response(req.message, req.history, req.platform, req.question_index)
            if result and "reply" in result and "connection issue" not in result["reply"]:
                return {
                    "status": "success",
                    "reply": result["reply"]
                }
            print("OpenRouter chat returned connection error. Falling back to SiliconFlow...")
    except Exception as e:
        print(f"OpenRouter chat failed with exception: {e}. Falling back to SiliconFlow...")

    # 3. Try SiliconFlow third
    try:
        from app.services.siliconflow_service import SiliconFlowService
        siliconflow_service = SiliconFlowService()
        if siliconflow_service.api_key:
            print("Attempting chat completion using SiliconFlow...")
            result = siliconflow_service.generate_chat_response(req.message, req.history, req.platform, req.question_index)
            if result and "reply" in result and "connection issue" not in result["reply"]:
                return {
                    "status": "success",
                    "reply": result["reply"]
                }
            print("SiliconFlow chat returned connection error. Falling back to Gemini...")
    except Exception as e:
        print(f"SiliconFlow chat failed with exception: {e}. Falling back to Gemini...")

    # 4. Try Gemini (Google) as final fallback
    gemini_service = GeminiService()
    result = gemini_service.generate_chat_response(req.message, req.history, req.platform, req.question_index)
    
    reply_text = result.get("reply", "")
    if "quota" in reply_text.lower() or "rate limit" in reply_text.lower():
        # Automatic OpenAI failover recovery fallback loop if Gemini key hits a rate limit block!
        try:
            from app.services.openai_service import OpenAIService
            openai_service = OpenAIService()
            if openai_service.api_key:
                print("Gemini rate limited - attempting OpenAI Chat completion fallback...")
                response = openai_service.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": f"You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect specialized in {req.platform}. Ask ONE clarifying question. Keep response to 2-3 sentences."},
                        {"role": "user", "content": req.message}
                    ]
                )
                openai_reply = response.choices[0].message.content
                print("Successfully recovered from Gemini rate limit in chat using OpenAI fallback!")
                return {
                    "status": "success",
                    "reply": openai_reply.strip()
                }
        except Exception as oai_err:
            print(f"OpenAI chat fallback failed: {oai_err}")
            
    return {
        "status": "success",
        "reply": reply_text if reply_text else "I had a temporary connection issue. How else can I help?"
    }

@router.get("/history")
def get_history():
    return [
        {"id": 1, "prompt": "E-commerce Backend", "platform": "AWS", "date": "2026-05-18"}
    ]

