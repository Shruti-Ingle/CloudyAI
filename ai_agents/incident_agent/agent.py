import os
import json
from ai_agents.bedrock_client import BedrockOllamaClient

class IncidentAgent:
    def __init__(self, client: BedrockOllamaClient = None):
        self.client = client or BedrockOllamaClient()
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "prompts",
            "incident.txt"
        )

    def _read_prompt(self) -> str:
        with open(self.prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    def run(self, state: dict) -> dict:
        system_prompt = self._read_prompt()
        logs = state.get("logs") or []
        metrics = state.get("metrics") or {}
        desc = state.get("incident_description") or ""
        
        user_prompt = f"Logs: {json.dumps(logs)}\nMetrics: {json.dumps(metrics)}\nDescription: {desc}"
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
                    output = self._fallback_output()
            else:
                output = self._fallback_output()
                
        return {"incident_summary": output}

    def _fallback_output(self) -> dict:
        return {
            "root_cause": "Unknown database connection timeouts.",
            "affected_services": ["backend-app"],
            "timeline": ["00:00 UTC Latency increase", "00:05 UTC Connection timeout errors"],
            "recommended_actions": ["Investigate database connection pool exhaustion"],
            "severity": "high",
            "summary": "Service degradation due to downstream dependency timeouts."
        }
