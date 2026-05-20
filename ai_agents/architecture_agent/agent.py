import os
import json
from ai_agents.bedrock_client import BedrockOllamaClient

class ArchitectureAgent:
    def __init__(self, client: BedrockOllamaClient = None):
        self.client = client or BedrockOllamaClient()
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "prompts",
            "architecture.txt"
        )

    def _read_prompt(self) -> str:
        with open(self.prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    def run(self, state: dict) -> dict:
        system_prompt = self._read_prompt()
        query = state.get("user_query", "")
        reqs = state.get("requirements") or {}
        config = state.get("parsed_config") or {}
        
        user_prompt = f"Requirements: {json.dumps(reqs)}\nConfig: {json.dumps(config)}\nUser Query: {query}"
        
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response_text = self.client.invoke_model("anthropic.claude-3-sonnet", full_prompt)
        
        try:
            output = json.loads(response_text)
        except Exception:
            import re
            json_match = re.search(r"({.*})", response_text, re.DOTALL)
            if json_match:
                try:
                    output = json.loads(json_match.group(1))
                except Exception:
                    output = self._fallback_output(query)
            else:
                output = self._fallback_output(query)
                
        return {"architecture_output": output}

    def _fallback_output(self, query: str) -> dict:
        return {
            "diagram_json": {
                "nodes": [
                    {"id": "dns", "position": {"x": 250, "y": 50}, "data": {"label": "Route 53"}},
                    {"id": "alb", "position": {"x": 250, "y": 150}, "data": {"label": "Application Load Balancer"}},
                    {"id": "app", "position": {"x": 250, "y": 250}, "data": {"label": "EC2 / ECS App Server"}},
                    {"id": "db", "position": {"x": 250, "y": 350}, "data": {"label": "RDS Database"}}
                ],
                "edges": [
                    {"id": "e-dns-alb", "source": "dns", "target": "alb"},
                    {"id": "e-alb-app", "source": "alb", "target": "app"},
                    {"id": "e-app-db", "source": "app", "target": "db"}
                ]
            },
            "explanation": f"Fallback architecture generated for query: {query}",
            "tradeoffs": "Standard reliability configuration, moderate overhead.",
            "cost_estimate_rough": "$150.00/month"
        }
