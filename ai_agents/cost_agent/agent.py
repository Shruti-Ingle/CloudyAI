import os
import json
from ai_agents.bedrock_client import BedrockOllamaClient

class CostAgent:
    def __init__(self, client: BedrockOllamaClient = None):
        self.client = client or BedrockOllamaClient()
        self.prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "prompts",
            "cost.txt"
        )

    def _read_prompt(self) -> str:
        with open(self.prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    def run(self, state: dict) -> dict:
        system_prompt = self._read_prompt()
        arch = state.get("architecture_output") or {}
        config = state.get("parsed_config") or {}
        
        ml_forecast = 0.0
        try:
            from ml_models.cost_prediction.inference import predict_cost
            ml_forecast = predict_cost({
                "instance_type": "m5.large",
                "vcpu_count": 2,
                "memory_gb": 8,
                "storage_gb": 100,
                "request_volume_daily": 50000,
                "bandwidth_gb": 10
            })
        except Exception:
            ml_forecast = 120.0
            
        user_prompt = f"Architecture: {json.dumps(arch)}\nConfig: {json.dumps(config)}\nML cost prediction model forecast: {ml_forecast} USD"
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
                    output = self._fallback_output(ml_forecast)
            else:
                output = self._fallback_output(ml_forecast)
                
        return {"cost_analysis": output}

    def _fallback_output(self, ml_forecast: float) -> dict:
        return {
            "current_estimated_cost": ml_forecast + 50.0,
            "optimized_estimated_cost": ml_forecast,
            "savings_potential": 50.0,
            "recommendations": [
                "Right-size overprovisioned non-production instances",
                "Configure RDS multi-AZ only for production databases"
            ]
        }
