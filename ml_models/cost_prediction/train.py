import os
import json
import joblib
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
from sklearn.model_selection import KFold
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from xgboost import XGBRegressor

def load_hyperparameters():
    path = "/opt/ml/input/config/hyperparameters.json"
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {"n_estimators": 100, "max_depth": 6}

def generate_mock_data():
    np.random.seed(42)
    n = 200
    types = ["t3.micro", "t3.medium", "m5.large", "c5.xlarge", "r5.2xlarge"]
    data = {
        "instance_type": np.random.choice(types, n),
        "vcpu_count": np.random.choice([2, 4, 8, 16], n),
        "memory_gb": np.random.choice([4, 8, 16, 32, 64], n),
        "storage_gb": np.random.uniform(20, 1000, n),
        "request_volume_daily": np.random.uniform(1000, 1000000, n),
        "bandwidth_gb": np.random.uniform(5, 500, n)
    }
    df = pd.DataFrame(data)
    type_map = {"t3.micro": 0, "t3.medium": 1, "m5.large": 2, "c5.xlarge": 3, "r5.2xlarge": 4}
    df["instance_type_enc"] = df["instance_type"].map(type_map)
    df["monthly_cost_usd"] = (
        df["instance_type_enc"] * 30.0 +
        df["vcpu_count"] * 15.0 +
        df["memory_gb"] * 4.0 +
        df["storage_gb"] * 0.1 +
        df["request_volume_daily"] * 0.0001 +
        df["bandwidth_gb"] * 0.05 +
        np.random.normal(0, 10, n)
    )
    return df

def train_and_evaluate():
    mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlruns.db"))
    mlflow.set_experiment("clouddaddy-cost-prediction")
    
    hparams = load_hyperparameters()
    
    data_dir = "/opt/ml/input/data/train/"
    if os.path.exists(data_dir) and os.listdir(data_dir):
        files = [os.path.join(data_dir, f) for f in os.listdir(data_dir) if f.endswith(".csv")]
        df = pd.concat([pd.read_csv(f) for f in files])
    else:
        df = generate_mock_data()
        
    features = ["instance_type_enc", "vcpu_count", "memory_gb", "storage_gb", "request_volume_daily", "bandwidth_gb"]
    X = df[features].values
    y = df["monthly_cost_usd"].values
    
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    
    with mlflow.start_run():
        mlflow.log_params(hparams)
        
        xgb_rmse, xgb_mae, xgb_r2 = [], [], []
        rf_rmse, rf_mae, rf_r2 = [], [], []
        
        for train_idx, val_idx in kf.split(X):
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            xgb = XGBRegressor(n_estimators=int(hparams.get("n_estimators", 100)), max_depth=int(hparams.get("max_depth", 6)))
            xgb.fit(X_train, y_train)
            xgb_preds = xgb.predict(X_val)
            xgb_rmse.append(np.sqrt(mean_squared_error(y_val, xgb_preds)))
            xgb_mae.append(mean_absolute_error(y_val, xgb_preds))
            xgb_r2.append(r2_score(y_val, xgb_preds))
            
            rf = RandomForestRegressor(n_estimators=int(hparams.get("n_estimators", 100)), max_depth=int(hparams.get("max_depth", 6)))
            rf.fit(X_train, y_train)
            rf_preds = rf.predict(X_val)
            rf_rmse.append(np.sqrt(mean_squared_error(y_val, rf_preds)))
            rf_mae.append(mean_absolute_error(y_val, rf_preds))
            rf_r2.append(r2_score(y_val, rf_preds))
            
        mean_xgb_rmse = np.mean(xgb_rmse)
        mean_xgb_mae = np.mean(xgb_mae)
        mean_xgb_r2 = np.mean(xgb_r2)
        
        mean_rf_rmse = np.mean(rf_rmse)
        mean_rf_mae = np.mean(rf_mae)
        mean_rf_r2 = np.mean(rf_r2)
        
        mlflow.log_metric("xgb_mean_rmse", mean_xgb_rmse)
        mlflow.log_metric("xgb_mean_mae", mean_xgb_mae)
        mlflow.log_metric("xgb_mean_r2", mean_xgb_r2)
        
        mlflow.log_metric("rf_mean_rmse", mean_rf_rmse)
        mlflow.log_metric("rf_mean_mae", mean_rf_mae)
        mlflow.log_metric("rf_mean_r2", mean_rf_r2)
        
        if mean_xgb_rmse <= mean_rf_rmse:
            best_model = XGBRegressor(n_estimators=int(hparams.get("n_estimators", 100)), max_depth=int(hparams.get("max_depth", 6)))
            best_model.fit(X, y)
            mlflow.sklearn.log_model(best_model, "best_cost_model", registered_model_name="CloudDaddyCostXGB")
            best_type = "xgb"
        else:
            best_model = RandomForestRegressor(n_estimators=int(hparams.get("n_estimators", 100)), max_depth=int(hparams.get("max_depth", 6)))
            best_model.fit(X, y)
            mlflow.sklearn.log_model(best_model, "best_cost_model", registered_model_name="CloudDaddyCostRF")
            best_type = "rf"
            
        model_dir = "/opt/ml/model/"
        if not os.path.exists(model_dir):
            model_dir = os.path.dirname(__file__)
            
        joblib.dump(best_model, os.path.join(model_dir, "model.joblib"))
        
        meta = {"model_type": best_type, "features": features}
        with open(os.path.join(model_dir, "metadata.json"), "w") as f:
            json.dump(meta, f)
            
        metrics = {
            "rmse": float(mean_xgb_rmse if best_type == "xgb" else mean_rf_rmse),
            "mae": float(mean_xgb_mae if best_type == "xgb" else mean_rf_mae),
            "r2": float(mean_xgb_r2 if best_type == "xgb" else mean_rf_r2)
        }
        
        metrics_dir = "/opt/ml/output/metrics/"
        if os.path.exists(metrics_dir):
            with open(os.path.join(metrics_dir, "evaluation.json"), "w") as f:
                json.dump(metrics, f)

if __name__ == "__main__":
    train_and_evaluate()
