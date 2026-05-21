import os
import json
from openai import OpenAI
from app.utils.prompt_builder import get_system_prompt

class OpenAIService:
    def __init__(self):
        # We read OPENAI_API_KEY from environment variables
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def generate_architecture(self, prompt: str, platform: str = "AWS", history: list = None):
        if not self.client:
            return {"error": "OpenAI API Key is not set. Please set the OPENAI_API_KEY environment variable."}
            
        context_str = ""
        if history and len(history) > 0:
            context_str = "Conversation Context:\n"
            for msg in history:
                role = "User" if not msg.get("isBot") else "Assistant (Cloudy AI)"
                context_str += f"- {role}: {msg.get('text')}\n"
            context_str += "\nNew requirement based on history:\n"

        full_user_prompt = f"{context_str}Design a highly available and cost-optimized {platform} architecture for: {prompt}"
        system_prompt = get_system_prompt(platform)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_user_prompt}
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
