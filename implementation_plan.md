# Custom Model Training and Ollama Integration for Architecture Generation

This plan details the implementation of a custom training pipeline for cloud architecture generation. It creates a new Python ML component to train a resource-requirement classifier, builds a specialized Ollama Modelfile loaded with few-shot training examples, registers the model locally with Ollama, and exposes training controls and log streaming via the UI.

## User Review Required

> [!IMPORTANT]
> The custom model registration relies on having a running local Ollama instance (`http://localhost:11434`) and requires Ollama's API connection to be available. If Ollama is not active or set up, the training script will save the model files locally and complete with a warning, but won't be able to register the model in Ollama.

## Proposed Changes

---

### Machine Learning Component

#### [NEW] [train.py](file:///Users/patelmaitry/Documents/CloudDaddy/ml_models/architecture_generation/train.py)
A Python training script that:
1. Prepares a synthetic dataset containing 60+ samples of varying architecture prompt requests (e.g. Serverless, Containerized, High Availability) mapped to target React Flow nodes, edges, and estimated costs.
2. Trains a Scikit-Learn TF-IDF vectorizer and `RandomForestClassifier` (Multi-Label) to predict required cloud resources (e.g. S3, RDS, Lambda) based on input text prompts.
3. Saves the trained model to `ml_models/architecture_generation/classifier.joblib`.
4. Assembles a custom Ollama `Modelfile` containing:
   - Base model specification (e.g., `gemma3` or `llama3`).
   - Temperature parameters.
   - A specialized System Prompt enforcing precise React Flow JSON schemas.
   - Few-shot conversation messages mapping specific training prompts to their target architecture JSON layouts.
5. Communicates with local Ollama service (`http://localhost:11434/api/create`) to register the custom model as `clouddaddy-architecture`.

#### [NEW] [inference.py](file:///Users/patelmaitry/Documents/CloudDaddy/ml_models/architecture_generation/inference.py)
A Python test inference script to:
1. Load the trained `classifier.joblib` to predict the structural resource requirements of a user prompt.
2. Query the custom local Ollama model to generate the diagram nodes, edges, and estimated costs.

---

### Node.js Backend

#### [MODIFY] [ollama.ts](file:///Users/patelmaitry/Documents/CloudDaddy/backend-node/src/services/ollama.ts)
Update `_getActiveModel()` to query Ollama's tags and check if `clouddaddy-architecture` is registered. If it exists, prefer it as the active model for backend architecture generation.

#### [MODIFY] [generate.ts](file:///Users/patelmaitry/Documents/CloudDaddy/backend-node/src/routes/generate.ts)
Add endpoints for model training:
1. `POST /generate/train-architecture`:
   - Spawns the python training script (`ml_models/architecture_generation/train.py`) in the background.
   - Stores logs in `ml_models/architecture_generation/training.log`.
   - Maintains training status in `ml_models/architecture_generation/training_status.json` (e.g., status, progress percentage).
2. `GET /generate/train-status`:
   - Returns current training status (idle, running, completed, error) and parses the latest logs from the log file.

---

### React Frontend

#### [MODIFY] [ChatInterface.jsx](file:///Users/patelmaitry/Documents/CloudDaddy/frontend/src/components/cloudy/ChatInterface.jsx)
Enhance the settings panel when `Routing Mode` is set to `Local Ollama`:
1. Add a **Custom Model Training** section.
2. Provide input parameters:
   - **Base Model**: Dropdown list of models detected on the user's Ollama instance.
   - **Training Epochs**: Number of iterations (default: 5).
   - **Sample size**: Number of dataset instances (default: 50).
3. Add a "Train Custom Architect Model" button.
4. Implement a terminal console log box that pulls updates from `GET /generate/train-status` every 1.5 seconds, scrolling output automatically.
5. Provide a progress bar and completion states, automatically refreshing the model list to select `clouddaddy-architecture` when done.

---

## Verification Plan

### Automated Tests
1. Run test suite:
   ```bash
   pytest tests/test_ml_cost.py
   pytest tests/test_ml_anomaly.py
   ```
2. Create and run a new test `tests/test_ml_architecture.py` checking that `train.py` executes successfully.

### Manual Verification
1. Start local backend:
   ```bash
   cd backend-node && npm run dev
   ```
2. Open Frontend, open Settings, switch to Local Ollama.
3. Click "Train Custom Architect Model", monitor logs streaming, and check for successful creation of `clouddaddy-architecture`.
4. Perform architecture generation with the custom model.
