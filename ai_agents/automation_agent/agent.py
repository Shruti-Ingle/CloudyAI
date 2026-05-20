import os
import json
from ai_agents.bedrock_client import BedrockOllamaClient

class AutomationAgent:
    def __init__(self, client: BedrockOllamaClient = None):
        self.client = client or BedrockOllamaClient()
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "prompts",
            "automation.txt"
        )

    def _read_prompt(self) -> str:
        with open(self.prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    def run(self, state: dict) -> dict:
        system_prompt = self._read_prompt()
        summary = state.get("incident_summary") or {}
        
        user_prompt = f"Incident Summary: {json.dumps(summary)}"
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        response_text = self.client.invoke_model("amazon.titan-text-express", full_prompt)
        
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
                
        return {"automation_actions": output.get("action_plan", [])}

    def _fallback_output(self) -> dict:
        return {
            "action_plan": [
                {
                    "action_type": "send_slack_alert",
                    "resource": "slack_channel_ops",
                    "parameters": {"message": "Incident detected and logged"},
                    "requires_approval": False
                }
            ],
            "human_approval_required": False
        }
