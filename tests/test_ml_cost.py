import os
import pytest
from ml_models.cost_prediction.train import generate_mock_data, train_and_evaluate
from ml_models.cost_prediction.inference import predict_cost

def test_generate_mock_data():
    df = generate_mock_data()
    assert len(df) == 200
    assert "monthly_cost_usd" in df.columns

def test_cost_inference_heuristic():
    inputs = {
        "instance_type": "t3.medium",
        "vcpu_count": 2,
        "memory_gb": 4,
        "storage_gb": 50,
        "request_volume_daily": 10000,
        "bandwidth_gb": 5
    }
    cost = predict_cost(inputs)
    assert cost > 0.0

def test_cost_training_executes():
    train_and_evaluate()
    model_dir = os.path.join("ml_models", "cost_prediction")
    assert os.path.exists(os.path.join(model_dir, "model.joblib")) or os.path.exists("/opt/ml/model/model.joblib")
