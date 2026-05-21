import sys
import os

# Add backend dir to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.openrouter_service import OpenRouterService

try:
    print("Initializing OpenRouterService...")
    service = OpenRouterService()
    print(f"Service API Key configured: {service.api_key[:10]}...")
    
    print("\nCalling generate_chat_response...")
    result = service.generate_chat_response(
        user_message="I want an app that helps students track study time and stay focused using a timer and rewards system.",
        history=[],
        platform="AWS"
    )
    print("\nResult:")
    print(result)
except Exception as e:
    print(f"\nFailed with error: {e}")
