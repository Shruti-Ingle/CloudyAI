import os
import json
from ai_agents.bedrock_client import BedrockOllamaClient

class DocumentationAgent:
    def __init__(self, client: BedrockOllamaClient = None):
        self.client = client or BedrockOllamaClient()
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "prompts",
            "documentation.txt"
        )

    def _read_prompt(self) -> str:
        with open(self.prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    def run(self, state: dict) -> dict:
        system_prompt = self._read_prompt()
        
        state_subset = {
            "requirements": state.get("requirements"),
            "architecture_output": state.get("architecture_output"),
            "security_findings": state.get("security_findings"),
            "cost_analysis": state.get("cost_analysis"),
            "capacity_forecast": state.get("capacity_forecast"),
            "incident_summary": state.get("incident_summary"),
            "automation_actions": state.get("automation_actions")
        }
        
        user_prompt = f"Agent States Outputs: {json.dumps(state_subset)}"
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
                
        return {"final_report": output.get("report_markdown", "")}

    def _fallback_output(self) -> dict:
        return {
            "report_markdown": "# Executive Summary\nCloudDaddy system generated report fallback.",
            "key_findings": [],
            "priority_actions": []
        }
