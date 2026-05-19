import os
import json
import urllib.request
import urllib.error

class GeminiService:
    def __init__(self):
        # We read GEMINI_API_KEY from environment variables
        self.api_key = os.environ.get("GEMINI_API_KEY")

    def generate_architecture(self, prompt: str):
        if not self.api_key:
            return {"error": "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable."}

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
        
        system_prompt = (
            "You are an expert cloud architect. Your task is to design a cost-optimized cloud architecture "
            "based on the user's request. You must output ONLY a valid JSON object containing 'nodes' and "
            "'edges' arrays compatible with React Flow. Do not include any explanations, markdown code blocks, "
            "or text outside the JSON.\n\n"
            "Example structure:\n"
            "{\n"
            "  \"nodes\": [\n"
            "    {\"id\": \"1\", \"data\": {\"label\": \"React Frontend\"}, \"position\": {\"x\": 250, \"y\": 50}},\n"
            "    {\"id\": \"2\", \"data\": {\"label\": \"API Gateway\"}, \"position\": {\"x\": 250, \"y\": 150}},\n"
            "    {\"id\": \"3\", \"data\": {\"label\": \"Lambda Function\"}, \"position\": {\"x\": 250, \"y\": 250}},\n"
            "    {\"id\": \"4\", \"data\": {\"label\": \"DynamoDB Table\"}, \"position\": {\"x\": 250, \"y\": 350}}\n"
            "  ],\n"
            "  \"edges\": [\n"
            "    {\"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\"},\n"
            "    {\"id\": \"e2-3\", \"source\": \"2\", \"target\": \"3\"},\n"
            "    {\"id\": \"e3-4\", \"source\": \"3\", \"target\": \"4\"}\n"
            "  ]\n"
            "}"
        )

        payload = {
            "contents": [{
                "parts": [{"text": f"Design a highly available and cost-optimized architecture for: {prompt}"}]
            }],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(req) as response:
                res_body = response.read().decode('utf-8')
                res_json = json.loads(res_body)
                
                # Gemini returns content nested in candidates -> content -> parts -> text
                text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                return json.loads(text_response.strip())
                
        except urllib.error.HTTPError as e:
            error_msg = e.read().decode('utf-8')
            print(f"Gemini HTTP Error: {error_msg}")
            return {"error": f"HTTP Error {e.code}: {error_msg}"}
        except Exception as e:
            print(f"Error invoking Gemini: {e}")
            return {"error": str(e)}

    def analyse_architecture(self, architecture_data: str):
        if not self.api_key:
            return {"error": "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable."}

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
        
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

        try:
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
            print(f"Gemini HTTP Error: {error_msg}")
            return {"error": f"HTTP Error {e.code}: {error_msg}"}
        except Exception as e:
            print(f"Error invoking Gemini: {e}")
            return {"error": str(e)}
