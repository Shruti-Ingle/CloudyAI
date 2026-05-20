import os
import json
import joblib
import numpy as np

def model_fn(model_dir: str):
    model_path = os.path.join(model_dir, "model.joblib")
    if os.path.exists(model_path):
        return joblib.load(model_path)
    return None

def input_fn(request_body, request_content_type: str) -> dict:
    if request_content_type == "application/json":
        return json.loads(request_body)
    raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data: dict, model) -> float:
    if model is None:
        return 120.0
    
    type_map = {"t3.micro": 0, "t3.medium": 1, "m5.large": 2, "c5.xlarge": 3, "r5.2xlarge": 4}
    instance_type = input_data.get("instance_type", "m5.large")
    instance_type_enc = type_map.get(instance_type, 2)
    
    features = [
        float(instance_type_enc),
        float(input_data.get("vcpu_count", 2)),
        float(input_data.get("memory_gb", 8)),
        float(input_data.get("storage_gb", 100)),
        float(input_data.get("request_volume_daily", 50000)),
        float(input_data.get("bandwidth_gb", 10))
    ]
    
    x = np.array([features])
    prediction = model.predict(x)
    return float(prediction[0])

def output_fn(prediction: float, response_content_type: str) -> str:
    if response_content_type == "application/json":
        return json.dumps({"forecasted_cost": prediction})
    raise ValueError(f"Unsupported content type: {response_content_type}")

def predict_cost(inputs: dict) -> float:
    model_dir = "/opt/ml/model/"
    if not os.path.exists(os.path.join(model_dir, "model.joblib")):
        model_dir = os.path.dirname(__file__)
        
    model = model_fn(model_dir)
    if model is None:
        type_map = {"t3.micro": 0, "t3.medium": 1, "m5.large": 2, "c5.xlarge": 3, "r5.2xlarge": 4}
        instance_type_enc = type_map.get(inputs.get("instance_type", "m5.large"), 2)
        h_cost = (
            instance_type_enc * 30.0 +
            inputs.get("vcpu_count", 2) * 15.0 +
            inputs.get("memory_gb", 8) * 4.0 +
            inputs.get("storage_gb", 100) * 0.1 +
            inputs.get("request_volume_daily", 50000) * 0.0001 +
            inputs.get("bandwidth_gb", 10) * 0.05
        )
        return float(h_cost)
        
    return predict_fn(inputs, model)
