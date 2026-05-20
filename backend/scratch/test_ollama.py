import sys
import os
sys.path.append("/Users/patelmaitry/Documents/CloudDaddy/backend")

from app.services.ollama_service import OllamaService

print("--- Testing OllamaService Instantiation ---")
service = OllamaService()
print(f"Base URL configured: {service.base_url}")
print(f"Default model configured: {service.default_model}")

print("\n--- Testing Model Tag Detection ---")
active_model = service._get_active_model()
print(f"Active model detected from Ollama: {active_model}")

print("\n--- Testing Chat Response generation ---")
print("Trying to generate chat response for onboarding step 1...")
try:
    result = service.generate_chat_response(
        user_message="I want to build a highly available cloud architecture on AWS",
        history=[
            {"text": "Hi! I'm Cloudy. Select your preferred Cloud Platform above, tell me what kind of app you want to build, and I will guide you with architecture recommendations!", "isBot": True}
        ],
        platform="AWS"
    )
    print("Chat response result:")
    print(result)
except Exception as e:
    print(f"Chat generation failed (as expected if Ollama is not running locally): {e}")

print("\n--- Testing Architecture generation ---")
print("Trying to generate architecture JSON...")
try:
    arch = service.generate_architecture(
        prompt="A basic serverless app on AWS",
        platform="AWS",
        history=[]
    )
    print("Architecture output:")
    print(arch)
except Exception as e:
    print(f"Architecture generation failed (as expected if Ollama is not running locally): {e}")

print("\n--- Testing Done! ---")
