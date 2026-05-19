import os
import json
import urllib.request
import urllib.error

class GeminiService:
    def __init__(self):
        # We read GEMINI_API_KEY from environment variables
        self.api_key = os.environ.get("GEMINI_API_KEY")

    def generate_architecture(self, prompt: str, platform: str = "AWS"):
        if not self.api_key:
            return {"error": "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable."}

        system_prompt = (
            f"You are an expert cloud architect specialized in {platform}. Your task is to design a cost-optimized, "
            f"highly available cloud architecture on {platform} based on the user's request. You must output ONLY a valid "
            "JSON object containing 'nodes', 'edges', and 'cost' details. Do not include any explanations, markdown code blocks, "
            "or text outside the JSON.\n\n"
            "Layout Rules (CRITICAL to prevent overlap and make it readable):\n"
            "1. Space the nodes out generously! Give them at least 250px vertical spacing and 300px horizontal spacing.\n"
            "2. Establish a clear top-to-bottom layout:\n"
            "   - Clients, Users, or DNS (Route 53, Cloud DNS, Azure DNS) at y: 50\n"
            "   - Gateways or CDNs (CloudFront, API Gateway, Load Balancer) at y: 200\n"
            "   - Compute, Logic, or Containers (Lambda, EC2, ECS, Cloud Run, Azure Functions) at y: 350\n"
            "   - Storage, Queues, or Databases (DynamoDB, RDS, S3, Cloud Storage, Azure Blob) at y: 500\n"
            "3. If there are multiple nodes at the same tier, space them horizontally (e.g. x: 100, x: 400, x: 700).\n\n"
            "Cost Estimation rules:\n"
            "Provide a realistic estimated monthly cost breakdown for the services you designed.\n\n"
            "Example structure:\n"
            "{\n"
            "  \"nodes\": [\n"
            "    {\"id\": \"1\", \"data\": {\"label\": \"React Frontend\"}, \"position\": {\"x\": 400, \"y\": 50}},\n"
            "    {\"id\": \"2\", \"data\": {\"label\": \"API Gateway\"}, \"position\": {\"x\": 400, \"y\": 200}},\n"
            "    {\"id\": \"3\", \"data\": {\"label\": \"Lambda Function\"}, \"position\": {\"x\": 400, \"y\": 350}},\n"
            "    {\"id\": \"4\", \"data\": {\"label\": \"DynamoDB Table\"}, \"position\": {\"x\": 400, \"y\": 500}}\n"
            "  ],\n"
            "  \"edges\": [\n"
            "    {\"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\"},\n"
            "    {\"id\": \"e2-3\", \"source\": \"2\", \"target\": \"3\"},\n"
            "    {\"id\": \"e3-4\", \"source\": \"3\", \"target\": \"4\"}\n"
            "  ],\n"
            "  \"cost\": {\n"
            "    \"total_monthly_cost\": \"$15.20\",\n"
            "    \"services\": [\n"
            "      {\"name\": \"API Gateway\", \"monthly_cost\": \"$3.50\", \"breakdown\": \"Based on 1M requests per month ($3.50/million)\"},\n"
            "      {\"name\": \"AWS Lambda\", \"monthly_cost\": \"$0.20\", \"breakdown\": \"1M executions with free tier covering most compute time\"},\n"
            "      {\"name\": \"Amazon DynamoDB\", \"monthly_cost\": \"$11.50\", \"breakdown\": \"25 GB storage and provisioned capacity\"}\n"
            "    ]\n"
            "  }\n"
            "}"
        )

        payload = {
            "contents": [{
                "parts": [{"text": f"Design a highly available and cost-optimized {platform} architecture for: {prompt}"}]
            }],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # Multi-model fallback list to handle temporary high demand (503s) of preview/new models
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
        last_error = None

        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                print(f"Attempting to generate architecture using model: {model}...")
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req) as response:
                    res_body = response.read().decode('utf-8')
                    res_json = json.loads(res_body)
                    
                    text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                    return json.loads(text_response.strip())
            except urllib.error.HTTPError as e:
                error_msg = e.read().decode('utf-8')
                print(f"Model {model} failed with HTTP Error {e.code}: {error_msg}")
                last_error = f"Model {model} failed (HTTP {e.code}): {error_msg}"
            except Exception as e:
                print(f"Model {model} failed with general error: {e}")
                last_error = f"Model {model} failed: {str(e)}"

        return {"error": f"Failed to generate architecture after trying all available Gemini models. Last error: {last_error}"}

    def analyse_architecture(self, architecture_data: str):
        if not self.api_key:
            return {"error": "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable."}

        system_prompt = (
            "You are an expert cloud architect. Analyze the provided architecture and return a JSON object with "
            "'issues' (a list of objects with 'severity', 'title', 'description', and 'suggestion') and "
            "'suggested_nodes' and 'suggested_edges' arrays for React Flow representing the improved architecture. "
            "Do not include any explanations, markdown code blocks, or text outside the JSON.\n\n"
            "Example structure:\n"
            "{\n"
            "  \"issues\": [\n"
            "    {\n"
            "      \"severity\": \"high\",\n"
            "      \"title\": \"Single Point of Failure\",\n"
            "      \"description\": \"The database is deployed in a single availability zone without replication.\",\n"
            "      \"suggestion\": \"Enable multi-AZ deployment for high availability.\"\n"
            "    }\n"
            "  ],\n"
            "  \"suggested_nodes\": [],\n"
            "  \"suggested_edges\": []\n"
            "}"
        )

        payload = {
            "contents": [{
                "parts": [{"text": f"Analyze this architecture and suggest improvements: {architecture_data}"}]
            }],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # Multi-model fallback list to handle temporary high demand (503s) of preview/new models
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
        last_error = None

        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                print(f"Attempting to analyze architecture using model: {model}...")
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req) as response:
                    res_body = response.read().decode('utf-8')
                    res_json = json.loads(res_body)
                    
                    text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                    return json.loads(text_response.strip())
            except urllib.error.HTTPError as e:
                error_msg = e.read().decode('utf-8')
                print(f"Model {model} failed with HTTP Error {e.code}: {error_msg}")
                last_error = f"Model {model} failed (HTTP {e.code}): {error_msg}"
            except Exception as e:
                print(f"Model {model} failed with general error: {e}")
                last_error = f"Model {model} failed: {str(e)}"

        return {"error": f"Failed to analyze architecture after trying all available Gemini models. Last error: {last_error}"}
