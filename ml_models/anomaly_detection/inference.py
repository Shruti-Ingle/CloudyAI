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

def predict_fn(input_data: dict, model) -> dict:
    features = [
        float(input_data.get("cpu_utilization", 45.0)),
        float(input_data.get("memory_utilization", 55.0)),
        float(input_data.get("request_rate", 150.0)),
        float(input_data.get("error_rate", 0.5)),
        float(input_data.get("latency_p99", 200.0))
    ]
    
    if model is None:
        is_anom = features[0] > 80.0 or features[3] > 5.0
        score = 0.8 if is_anom else 0.2
    else:
        x = np.array([features])
        pred = model.predict(x)[0]
        is_anom = bool(pred == -1)
        if hasattr(model, "score_samples"):
            score = float(-model.score_samples(x)[0])
        else:
            score = 0.8 if is_anom else 0.2
            
    contrib = []
    if features[0] > 80.0:
        contrib.append("cpu_utilization")
    if features[1] > 80.0:
        contrib.append("memory_utilization")
    if features[2] > 300.0:
        contrib.append("request_rate")
    if features[3] > 5.0:
        contrib.append("error_rate")
    if features[4] > 500.0:
        contrib.append("latency_p99")
        
    return {
        "is_anomaly": is_anom,
        "anomaly_score": score,
        "contributing_features": contrib
    }

def output_fn(prediction: dict, response_content_type: str) -> str:
    if response_content_type == "application/json":
        return json.dumps(prediction)
    raise ValueError(f"Unsupported content type: {response_content_type}")

def predict_anomaly(inputs: dict) -> dict:
    model_dir = "/opt/ml/model/"
    if not os.path.exists(os.path.join(model_dir, "model.joblib")):
        model_dir = os.path.dirname(__file__)
        
    model = model_fn(model_dir)
    return predict_fn(inputs, model)
