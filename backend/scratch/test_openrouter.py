import sys
sys.path.append("/Users/patelmaitry/Documents/CloudDaddy/backend")

from app.services.openrouter_service import OpenRouterService

service = OpenRouterService()
print("Testing architecture generation via OpenRouterService...")
result = service.generate_architecture("A simple static website with CloudFront and S3", "AWS")
print("Architecture Result:", result)

print("\nTesting chat response via OpenRouterService...")
chat = service.generate_chat_response("I want to use Postgres on AWS", [])
print("Chat Result:", chat)
