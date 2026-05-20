import os
import json
import pickle
from datetime import datetime, timedelta
import numpy as np

try:
    from prophet import Prophet
except Exception:
    Prophet = None

try:
    import tensorflow as tf
except Exception:
    tf = None

def model_fn(model_dir: str) -> dict:
    models = {}
    p_path = os.path.join(model_dir, "prophet_model.pkl")
    if os.path.exists(p_path) and Prophet is not None:
        try:
            with open(p_path, "rb") as f:
                models["prophet"] = pickle.load(f)
        except Exception:
            pass
            
    l_path = os.path.join(model_dir, "lstm_model.keras")
    s_path = os.path.join(model_dir, "lstm_stats.json")
    if os.path.exists(l_path) and os.path.exists(s_path) and tf is not None:
        try:
            models["lstm"] = tf.keras.models.load_model(l_path)
            with open(s_path, "r") as f:
                models["lstm_stats"] = json.load(f)
        except Exception:
            pass
            
    return models

def input_fn(request_body, request_content_type: str) -> dict:
    if request_content_type == "application/json":
        return json.loads(request_body)
    raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data: dict, models: dict) -> dict:
    hist = input_data.get("historical_data", [])
    horizon = int(input_data.get("horizon_hours", 72))
    
    if not hist:
        return {"forecasts": []}
        
    hist.sort(key=lambda x: x.get("timestamp", ""))
    
    if "prophet" in models and Prophet is not None:
        try:
            m = models["prophet"]
            import pandas as pd
            future_dates = []
            last_ts = datetime.fromisoformat(hist[-1]["timestamp"].replace("Z", ""))
            for i in range(1, horizon + 1):
                future_dates.append(last_ts + timedelta(hours=i))
            df_future = pd.DataFrame({"ds": future_dates})
            forecast = m.predict(df_future)
            
            res = []
            for _, row in forecast.iterrows():
                res.append({
                    "timestamp": row["ds"].isoformat() + "Z",
                    "value": float(row["yhat"]),
                    "lower_bound": float(row["yhat_lower"]),
                    "upper_bound": float(row["yhat_upper"])
                })
            return {"forecasts": res}
        except Exception:
            pass

    return _fallback_predict(hist, horizon)

def _fallback_predict(hist: list, horizon: int) -> dict:
    last_val = hist[-1].get("value", 50.0)
    last_ts = datetime.fromisoformat(hist[-1]["timestamp"].replace("Z", "+00:00"))
    
    vals = [h.get("value", 50.0) for h in hist[-24:]]
    if len(vals) > 1:
        trend = (vals[-1] - vals[0]) / len(vals)
    else:
        trend = 0.05
        
    res = []
    for i in range(1, horizon + 1):
        target_ts = last_ts + timedelta(hours=i)
        pred_val = last_val + (trend * i) + (5.0 * np.sin(2.0 * np.pi * target_ts.hour / 24.0))
        pred_val = max(0.0, min(100.0, pred_val))
        res.append({
            "timestamp": target_ts.isoformat().replace("+00:00", "Z"),
            "value": float(pred_val),
            "lower_bound": float(max(0.0, pred_val - 10.0)),
            "upper_bound": float(min(100.0, pred_val + 10.0))
        })
    return {"forecasts": res}

def output_fn(prediction: dict, response_content_type: str) -> str:
    if response_content_type == "application/json":
        return json.dumps(prediction)
    raise ValueError(f"Unsupported content type: {response_content_type}")

def predict_capacity(inputs: dict) -> dict:
    model_dir = "/opt/ml/model/"
    if not os.path.exists(os.path.join(model_dir, "metadata.json")):
        model_dir = os.path.dirname(__file__)
        
    models = model_fn(model_dir)
    return predict_fn(inputs, models)
