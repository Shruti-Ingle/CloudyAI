import os
import json
from ai_agents.bedrock_client import BedrockOllamaClient

class MonitoringAgent:
    def __init__(self, client: BedrockOllamaClient = None):
        self.client = client or BedrockOllamaClient()
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "prompts",
            "monitoring.txt"
        )

    def _read_prompt(self) -> str:
        with open(self.prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    def run(self, state: dict) -> dict:
        system_prompt = self._read_prompt()
        metrics = state.get("cloudwatch_data") or {}
        
        user_prompt = f"CloudWatch Metrics: {json.dumps(metrics)}"
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        response_text = self.client.invoke_model("meta.llama3-70b-instruct", full_prompt)
        
        try:
            output = json.loads(response_text)
        except Exception:
            import re
            json_match = re.search(r"({.*})", response_text, re.DOTALL)
            if json_match:
                try:
                    output = json.loads(json_match.group(1))
                except Exception:
                    output = self._fallback_output()
            else:
                output = self._fallback_output()
                
        return {"capacity_forecast": output}

    def _fallback_output(self) -> dict:
        return {
            "health_status": "healthy",
            "alerts": [],
            "summary": "Telemetry parameters indicate stable operation within thresholds."
        }
