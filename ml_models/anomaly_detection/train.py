import os
import json
import joblib
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.metrics import precision_recall_fscore_support

def generate_mock_metrics():
    np.random.seed(42)
    n_normal = 500
    n_anom = 25
    
    norm_data = {
        "cpu_utilization": np.random.normal(45, 10, n_normal),
        "memory_utilization": np.random.normal(55, 8, n_normal),
        "request_rate": np.random.normal(150, 20, n_normal),
        "error_rate": np.random.normal(0.5, 0.2, n_normal),
        "latency_p99": np.random.normal(200, 30, n_normal),
        "is_anomaly": [0] * n_normal
    }
    
    anom_data = {
        "cpu_utilization": np.random.normal(92, 5, n_anom),
        "memory_utilization": np.random.normal(90, 5, n_anom),
        "request_rate": np.random.normal(400, 50, n_anom),
        "error_rate": np.random.normal(8.5, 2.0, n_anom),
        "latency_p99": np.random.normal(1200, 200, n_anom),
        "is_anomaly": [1] * n_anom
    }
    
    df_norm = pd.DataFrame(norm_data)
    df_anom = pd.DataFrame(anom_data)
    return pd.concat([df_norm, df_anom]).reset_index(drop=True)

def train_and_evaluate():
    mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlruns.db"))
    mlflow.set_experiment("clouddaddy-anomaly-detection")
    
    data_dir = "/opt/ml/input/data/train/"
    if os.path.exists(data_dir) and os.listdir(data_dir):
        files = [os.path.join(data_dir, f) for f in os.listdir(data_dir) if f.endswith(".csv")]
        df = pd.concat([pd.read_csv(f) for f in files])
    else:
        df = generate_mock_metrics()
        
    features = ["cpu_utilization", "memory_utilization", "request_rate", "error_rate", "latency_p99"]
    X = df[features].values
    y = df["is_anomaly"].values
    
    X_train = X[y == 0]
    
    with mlflow.start_run():
        iforest = IsolationForest(contamination=0.05, random_state=42)
        iforest.fit(X_train)
        
        iforest_preds = iforest.predict(X)
        iforest_binary = np.where(iforest_preds == -1, 1, 0)
        
        ocsvm = OneClassSVM(nu=0.05, kernel="rbf")
        ocsvm.fit(X_train)
        
        ocsvm_preds = ocsvm.predict(X)
        ocsvm_binary = np.where(ocsvm_preds == -1, 1, 0)
        
        if_p, if_r, if_f1, _ = precision_recall_fscore_support(y, iforest_binary, average="binary")
        oc_p, oc_r, oc_f1, _ = precision_recall_fscore_support(y, ocsvm_binary, average="binary")
        
        mlflow.log_metric("iforest_precision", if_p)
        mlflow.log_metric("iforest_recall", if_r)
        mlflow.log_metric("iforest_f1", if_f1)
        
        mlflow.log_metric("ocsvm_precision", oc_p)
        mlflow.log_metric("ocsvm_recall", oc_r)
        mlflow.log_metric("ocsvm_f1", oc_f1)
        
        if if_f1 >= oc_f1:
            best_model = iforest
            mlflow.sklearn.log_model(best_model, "best_anomaly_model", registered_model_name="CloudDaddyAnomalyIF")
            best_type = "iforest"
        else:
            best_model = ocsvm
            mlflow.sklearn.log_model(best_model, "best_anomaly_model", registered_model_name="CloudDaddyAnomalyOC")
            best_type = "ocsvm"
            
        model_dir = "/opt/ml/model/"
        if not os.path.exists(model_dir):
            model_dir = os.path.dirname(__file__)
            
        joblib.dump(best_model, os.path.join(model_dir, "model.joblib"))
        
        meta = {"model_type": best_type, "features": features}
        with open(os.path.join(model_dir, "metadata.json"), "w") as f:
            json.dump(meta, f)
            
        metrics = {
            "precision": float(if_p if best_type == "iforest" else oc_p),
            "recall": float(if_r if best_type == "iforest" else oc_r),
            "f1": float(if_f1 if best_type == "iforest" else oc_f1)
        }
        
        metrics_dir = "/opt/ml/output/metrics/"
        if os.path.exists(metrics_dir):
            with open(os.path.join(metrics_dir, "evaluation.json"), "w") as f:
                json.dump(metrics, f)

if __name__ == "__main__":
    train_and_evaluate()
