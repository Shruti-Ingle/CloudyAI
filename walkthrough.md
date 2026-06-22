# Walkthrough: Custom Model Training & Local Ollama Integration

We have successfully implemented the custom model training pipeline for cloud architecture generation and integrated it with the local Ollama service. All changes have been verified and pushed to the Git repository.

## Changes Made

### 1. Machine Learning Component
- **Created [train.py](file:///Users/patelmaitry/Documents/CloudDaddy/ml_models/architecture_generation/train.py)**:
  - Synthesizes 80+ diverse architecture generation requirements.
  - Trains a local TF-IDF + Random Forest multi-label classifier to map user requirements to required node categories (DNS, CDN, API, Compute, DB, Caching, etc.).
  - Saves the trained model to `classifier.joblib`.
  - Generates a customized Ollama `Modelfile` containing advanced system instructions and few-shot JSON design examples.
  - Registers the custom model as `clouddaddy-architecture` using the local Ollama CLI (with API fallback).
- **Created [inference.py](file:///Users/patelmaitry/Documents/CloudDaddy/ml_models/architecture_generation/inference.py)**:
  - Invokes the trained Random Forest classifier to predict resource requirements.
  - Connects to local Ollama with the custom model to generate the architecture JSON diagram layout.

### 2. Node.js Backend
- **Updated [ollama.ts](file:///Users/patelmaitry/Documents/CloudDaddy/backend-node/src/services/ollama.ts)**:
  - Enhanced `_getActiveModel()` to check if the custom-trained model `clouddaddy-architecture` exists in Ollama's active tags. If present, it uses it by default for local generation tasks.
- **Updated [generate.ts](file:///Users/patelmaitry/Documents/CloudDaddy/backend-node/src/routes/generate.ts)**:
  - Added `POST /generate/train-architecture` to spawn the Python training script as a child process.
  - Added `GET /generate/train-status` to poll training progress (epochs, logs, status) in real-time.

### 3. React Frontend
- **Updated [ChatInterface.jsx](file:///Users/patelmaitry/Documents/CloudDaddy/frontend/src/components/cloudy/ChatInterface.jsx)**:
  - Added a premium **Fine-Tune / Train Architecture Model** card under the local settings modal.
  - Provided dropdowns for base model selection, epochs input, and progress updates.
  - Connected the training status API with polling and auto-scroll logic.
  - Implemented a scrolling console terminal log block rendering stdout updates directly.
  - Automatically refreshes the local model list and selects `clouddaddy-architecture` upon training completion.

## Verification & Tests Passed
1. Created new unit test file **[test_ml_architecture.py](file:///Users/patelmaitry/Documents/CloudDaddy/tests/test_ml_architecture.py)**.
2. Ran tests inside isolated python virtual environment `venv`:
   ```bash
   PYTHONPATH=. venv/bin/pytest tests/test_ml_architecture.py
   ```
   **Result**: `2 passed in 1.52s`
3. Successfully compiled and built backend typescript:
   ```bash
   npm --prefix backend-node run build
   ```
   **Result**: Successful build.
4. Manually executed the training script to verify model creation:
   ```bash
   PYTHONPATH=. venv/bin/python ml_models/architecture_generation/train.py --epochs 2
   ```
   **Result**: Successful Random Forest training and custom model registration `clouddaddy-architecture` in local Ollama via CLI.

## Repository Sync
1. Staged and committed all changes.
2. Pulled remote updates and successfully pushed branches to origin:
   ```bash
   git push origin main
   ```
   **Result**: Pushed successfully to `https://github.com/Shruti-Ingle/CloudDaddy.git`.

## Rate Limit Fallback Fix
- The Gemini API rate-limiting response (`"I am temporarily experiencing high demand..."`) previously blocked the user from completing the onboarding questions when the Gemini API keys hit their quotas.
- We implemented a multi-tiered fallback and heuristic question progression in `backend-node/src/routes/generate.ts` and `backend-node/src/services/gemini.ts`.
- When rate limits or quota errors are hit, the backend will attempt an OpenAI failover; if that fails or is offline, it will fall back to a local heuristic that determines the next onboarding question based on the user's progress and cloud platform, allowing onboarding to continue smoothly.
- These fixes have been committed and pushed to the remote repository (`main` branch) to trigger the live deployment update.

## AWS Lambda Node.js Deployment & Groq Integration

We have successfully migrated the production AWS Lambda backend from the old Python FastAPI implementation to the new Node.js TypeScript Express codebase, making the Groq integration live and fully accessible from the deployed staging/production environment.

### 1. Code Integration & Lambda Wrapper
- **Modified [app.ts](file:///Users/patelmaitry/Documents/CloudDaddy/backend-node/src/app.ts)**:
  - Exported the `app` instance and an initialization promise (`initPromise`).
  - Wrapped `app.listen()` inside a check for non-Lambda environments (`!process.env.AWS_LAMBDA_FUNCTION_NAME`) to prevent local server startups during Lambda instantiation.
- **Created [lambda.ts](file:///Users/patelmaitry/Documents/CloudDaddy/backend-node/src/lambda.ts)**:
  - Created an entrypoint handler that wraps the Express app using `serverless-http`.
  - Added logic to await `initPromise` to fetch configurations and load Secrets Manager values before processing any proxy API Gateway events.

### 2. S3 Packaging & Deployment (eu-west-2)
- Built the Node.js TypeScript project (`npm run build`).
- Packaged compiled JavaScript files (`dist/`) and production dependencies into a clean `9.5MB` ZIP file (`backend-node.zip`).
- Uploaded the package to the SAM-managed regional S3 bucket in `eu-west-2` (`s3://aws-sam-cli-managed-default-samclisourcebucket-guwc3rchuidw/backend-node.zip`).
- Updated the Lambda function (`CloudyAI-Backend-CloudyAIFunction-mrOAyDMwrVA5`) code source to point to the uploaded S3 object.
- Configured function settings:
  - Changed Runtime to `nodejs20.x`.
  - Set Handler to `dist/lambda.handler`.
  - Injected AWS Lambda environment variables (`GROQ_API_KEY` and `GORQ_API_KEY`) with the user's Groq token (`gsk_XxLi93kOwN...`).

### 3. Deployed Verification
We successfully tested the production endpoint:
- **Health Check**:
  - Request: `GET https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod/`
  - Response: `{"status":"ok","message":"CloudyAI API is running"}`
- **Groq Architecture Generation**:
  - Request: `POST https://9j3oe7izwh.execute-api.eu-west-2.amazonaws.com/Prod/generate/architecture` with prompt `"Single EC2 instance with S3 bucket"`
  - Response: A successful diagram payload (DNS, CDN, EC2, S3 nodes and edges) with total cost forecasted (`$143.11/mo`) generated directly by **Groq**.

