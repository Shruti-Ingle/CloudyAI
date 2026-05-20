# CloudDaddy ML Models Module

This module contains training and local inference code for the platform's custom machine learning models.

## Models

### 1. Cost Prediction
- **Files**: `cost_prediction/train.py`, `cost_prediction/inference.py`
- **Features**: `instance_type`, `vcpu_count`, `memory_gb`, `storage_gb`, `request_volume_daily`, `bandwidth_gb`.
- **Target**: `monthly_cost_usd`.
- **Models Trained**: XGBoost Regressor, Random Forest Regressor.
- **Metrics**: RMSE, MAE, R² (logged to MLflow).

### 2. Anomaly Detection
- **Files**: `anomaly_detection/train.py`, `anomaly_detection/inference.py`
- **Features**: `cpu_utilization`, `memory_utilization`, `request_rate`, `error_rate`, `latency_p99`.
- **Models Trained**: Isolation Forest, One-Class SVM.
- **Metrics**: Precision, Recall, F1 score.

### 3. Capacity Forecasting
- **Files**: `capacity_forecasting/train.py`, `capacity_forecasting/inference.py`
- **Features**: `timestamp`, `cpu_utilization`, `memory_utilization`, `storage_used_gb`.
- **Models Trained**: Facebook Prophet (seasonality trends), Keras LSTM Neural Network.
- **Metrics**: MAPE, RMSE.

## Execution

Scripts are designed with dual support:
- Standard SageMaker environment mappings (`/opt/ml/input/data/train/`, `/opt/ml/model/`).
- Local file system pathways and fallback heuristics for offline execution.
