import os
import pytest
from ml_models.anomaly_detection.train import generate_mock_metrics, train_and_evaluate
from ml_models.anomaly_detection.inference import predict_anomaly

def test_generate_mock_metrics():
    df = generate_mock_metrics()
    assert len(df) == 525
    assert "is_anomaly" in df.columns

def test_anomaly_inference_heuristic():
    inputs = {
        "cpu_utilization": 90.0,
        "memory_utilization": 85.0,
        "request_rate": 500.0,
        "error_rate": 10.0,
        "latency_p99": 1000.0
    }
    result = predict_anomaly(inputs)
    assert result["is_anomaly"] is True
    assert "cpu_utilization" in result["contributing_features"]

def test_anomaly_training_executes():
    train_and_evaluate()
    model_dir = os.path.join("ml_models", "anomaly_detection")
    assert os.path.exists(os.path.join(model_dir, "model.joblib")) or os.path.exists("/opt/ml/model/model.joblib")
