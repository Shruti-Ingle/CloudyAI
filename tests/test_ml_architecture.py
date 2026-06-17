import os
import pytest
from ml_models.architecture_generation.train import generate_training_data, train_classifier
from ml_models.architecture_generation.inference import ArchitectureInference

def test_generate_training_data():
    df = generate_training_data()
    assert len(df) > 50
    assert "prompt" in df.columns
    assert "labels" in df.columns

def test_architecture_training_and_inference_executes():
    # Run training locally on a subset of data or generated dataset
    df = generate_training_data().head(10)
    model_dir = os.path.join("ml_models", "architecture_generation")
    
    train_classifier(df, model_dir)
    
    # Assert models were saved
    assert os.path.exists(os.path.join(model_dir, "classifier.joblib"))
    assert os.path.exists(os.path.join(model_dir, "vectorizer.joblib"))
    
    # Perform test inference
    inference = ArchitectureInference()
    result = inference.generate_architecture("Deploy a serverless app with RDS SQL database", "AWS")
    
    assert "nodes" in result
    assert "edges" in result
    assert "cost" in result
    assert len(result["nodes"]) > 0
