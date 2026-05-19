import os
import json
from openai import OpenAI

class OpenAIService:
    def __init__(self):
        # We read OPENAI_API_KEY from environment variables
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def generate_architecture(self, prompt: str):
        if not self.client:
            return {"error": "OpenAI API Key is not set. Please set the OPENAI_API_KEY environment variable."}
            
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
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Design a highly available and cost-optimized architecture for: {prompt}"}
                ],
                response_format={"type": "json_object"}
            )
            
            text_response = response.choices[0].message.content
            return json.loads(text_response.strip())
        except Exception as e:
            print(f"Error invoking OpenAI: {e}")
            return {"error": str(e)}

    def analyse_architecture(self, architecture_data: str):
        if not self.client:
            return {"error": "OpenAI API Key is not set. Please set the OPENAI_API_KEY environment variable."}
            
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
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this architecture and suggest improvements: {architecture_data}"}
                ],
                response_format={"type": "json_object"}
            )
            
            text_response = response.choices[0].message.content
            return json.loads(text_response.strip())
        except Exception as e:
            print(f"Error invoking OpenAI: {e}")
            return {"error": str(e)}
