import os
import json
import pickle
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
from datetime import datetime, timedelta

try:
    from prophet import Prophet
except Exception:
    Prophet = None

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense
except Exception:
    tf = None

def generate_mock_timeseries():
    np.random.seed(42)
    start_time = datetime(2026, 1, 1)
    timestamps = [start_time + timedelta(hours=i) for i in range(24 * 30)]
    
    cpu_vals = []
    base_load = 40.0
    for i, ts in enumerate(timestamps):
        daily_cycle = 15.0 * np.sin(2.0 * np.pi * ts.hour / 24.0)
        weekly_cycle = 5.0 * np.sin(2.0 * np.pi * ts.weekday() / 7.0)
        noise = np.random.normal(0, 3.0)
        trend = i * 0.015
        cpu_vals.append(base_load + daily_cycle + weekly_cycle + trend + noise)
        
    df = pd.DataFrame({
        "timestamp": timestamps,
        "cpu_utilization": cpu_vals,
        "memory_utilization": [v * 0.9 + np.random.normal(0, 1.0) for v in cpu_vals],
        "storage_used_gb": [100.0 + i * 0.05 for i in range(len(timestamps))]
    })
    return df

def train_prophet(df: pd.DataFrame, model_dir: str):
    if Prophet is None:
        return None
    pdf = df[["timestamp", "cpu_utilization"]].rename(columns={"timestamp": "ds", "cpu_utilization": "y"})
    train_size = int(len(pdf) * 0.9)
    train_df, val_df = pdf.iloc[:train_size], pdf.iloc[train_size:]
    
    m = Prophet(daily_seasonality=True, weekly_seasonality=True)
    m.fit(train_df)
    
    future = val_df[["ds"]]
    forecast = m.predict(future)
    
    y_true = val_df["y"].values
    y_pred = forecast["yhat"].values
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    
    mlflow.log_metric("prophet_mape", mape)
    mlflow.log_metric("prophet_rmse", rmse)
    
    with open(os.path.join(model_dir, "prophet_model.pkl"), "wb") as f:
        pickle.dump(m, f)
        
    return m

def train_lstm(df: pd.DataFrame, model_dir: str):
    if tf is None:
        return None
        
    vals = df["cpu_utilization"].values
    mean, std = np.mean(vals), np.std(vals)
    scaled = (vals - mean) / std
    
    seq_len = 24
    X, y = [], []
    for i in range(len(scaled) - seq_len):
        X.append(scaled[i:i+seq_len])
        y.append(scaled[i+seq_len])
    X, y = np.array(X), np.array(y)
    
    X = np.expand_dims(X, axis=-1)
    
    train_size = int(len(X) * 0.9)
    X_train, X_val = X[:train_size], X[train_size:]
    y_train, y_val = y[:train_size], y[train_size:]
    
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(seq_len, 1)),
        LSTM(32),
        Dense(1)
    ])
    model.compile(optimizer="adam", loss="mse")
    model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=5, batch_size=32, verbose=0)
    
    preds = model.predict(X_val).flatten()
    preds_orig = preds * std + mean
    y_val_orig = y_val * std + mean
    
    mape = np.mean(np.abs((y_val_orig - preds_orig) / y_val_orig)) * 100
    rmse = np.sqrt(np.mean((y_val_orig - preds_orig) ** 2))
    
    mlflow.log_metric("lstm_mape", mape)
    mlflow.log_metric("lstm_rmse", rmse)
    
    model.save(os.path.join(model_dir, "lstm_model.keras"))
    
    stats = {"mean": float(mean), "std": float(std)}
    with open(os.path.join(model_dir, "lstm_stats.json"), "w") as f:
        json.dump(stats, f)
        
    return model

def train_and_evaluate():
    mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlruns.db"))
    mlflow.set_experiment("clouddaddy-capacity-forecasting")
    
    data_dir = "/opt/ml/input/data/train/"
    if os.path.exists(data_dir) and os.listdir(data_dir):
        files = [os.path.join(data_dir, f) for f in os.listdir(data_dir) if f.endswith(".csv")]
        df = pd.concat([pd.read_csv(f) for f in files])
        df["timestamp"] = pd.to_datetime(df["timestamp"])
    else:
        df = generate_mock_timeseries()
        
    model_dir = "/opt/ml/model/"
    if not os.path.exists(model_dir):
        model_dir = os.path.dirname(__file__)
        
    with mlflow.start_run():
        m_prophet = train_prophet(df, model_dir)
        m_lstm = train_lstm(df, model_dir)
        
        meta = {
            "prophet_trained": m_prophet is not None,
            "lstm_trained": m_lstm is not None,
            "features": ["cpu_utilization"]
        }
        with open(os.path.join(model_dir, "metadata.json"), "w") as f:
            json.dump(meta, f)

if __name__ == "__main__":
    train_and_evaluate()
