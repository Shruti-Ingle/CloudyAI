# Cloudy ai - Cloud Architecture Intelligence Platform
### Master Project Brief & Developer Prompts

---

## Table of Contents

1. [What is CloudDaddy?](#1-what-is-clouddaddy)
2. [Core Features](#2-core-features)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Tech Stack at a Glance](#4-tech-stack-at-a-glance)
5. [Team Structure & Ownership](#5-team-structure--ownership)
6. [Repository & Folder Structure](#6-repository--folder-structure)
7. [Master Prompt — All Developers](#7-master-prompt--all-developers)
8. [Developer 1 — AWS & DevOps Engineer](#8-developer-1--aws--devops-engineer)
9. [Developer 2 — Frontend Engineer](#9-developer-2--frontend-engineer)
10. [Developer 3 — Backend Engineer](#10-developer-3--backend-engineer)
11. [Developer 4 — AI/ML Engineer](#11-developer-4--aiml-engineer)
12. [GitHub Workflow & Branching Strategy](#12-github-workflow--branching-strategy)
13. [MVP Build Order](#13-mvp-build-order)

---

## 1. What is CloudDaddy?

**CloudDaddy** is an enterprise-grade AI Cloud Architecture Intelligence Platform that helps organizations design, optimize, secure, and monitor cloud infrastructure — automatically — using Agentic AI, LLM reasoning, and custom-trained ML models.

It is not a chatbot. It is a full-stack intelligent platform where users describe their cloud requirements or upload existing infrastructure configs (Terraform, CloudFormation, YAML, Kubernetes), and the system runs a multi-agent AI pipeline that:

- Designs or analyzes cloud architecture
- Predicts infrastructure costs using ML
- Detects security vulnerabilities
- Forecasts traffic and capacity needs
- Diagnoses incidents and suggests root cause fixes
- Recommends and optionally executes self-healing automations

The platform targets cloud architects, DevOps teams, and engineering leads inside mid-to-large companies who need intelligent cloud decision support beyond what standard monitoring tools provide.

**Target users:** Cloud architects, DevOps engineers, CTOs, infrastructure leads at tech companies.

**Positioning:** AI-native cloud intelligence — think "an AI cloud advisor that runs 24/7 inside your infrastructure."

---

## 2. Core Features

### 2.1 AI Architecture Designer
Users input business requirements such as expected traffic, budget, latency constraints, compliance needs, storage type, and workload characteristics. The AI agent designs a full cloud architecture recommendation including compute layer, database selection, networking, autoscaling, caching, CDN, and VPC layout. Output includes an architecture diagram, cost estimate, tradeoff analysis, and a written explanation.

### 2.2 AI Infra Analyzer
Users upload Terraform HCL files, CloudFormation templates, Kubernetes YAML, or architecture documents. The AI parses and analyzes these configs to detect overprovisioned resources, public storage buckets, missing WAF, absent autoscaling, weak IAM policies, insecure security groups, and redundant or wasteful services. Output is a structured risk and optimization report.

### 2.3 Cost Optimization Engine (ML)
ML models trained on infrastructure and billing data predict monthly AWS spend, traffic growth, and future cost trends. The AI layer then recommends Reserved Instances, Spot Instance usage, right-sizing candidates, serverless alternatives, and cache layers. Models used: XGBoost, Random Forest for prediction; Prophet for time-series cost forecasting.

### 2.4 Security Risk Intelligence
An AI security audit agent checks IAM policies, open ports, exposed APIs, public S3 buckets, missing KMS encryption, weak security group rules, and secret leaks. An ML anomaly detection model (Isolation Forest) flags unusual infrastructure access patterns and configuration deviations.

### 2.5 Incident Response Agent
A fully agentic AI feature. When an outage or degradation occurs, the Incident Agent reads CloudWatch logs and metrics, performs root cause analysis, generates a structured incident summary, recommends immediate fixes, and can alert the team via Slack or PagerDuty. Example output: "High CPU caused by traffic spike. Recommend scaling from 4 to 12 instances via autoscaling group."

### 2.6 Architecture Q&A Copilot
A RAG-based (Retrieval-Augmented Generation) chat assistant trained on AWS documentation, architecture best practices, and internal knowledge bases. Users ask questions like "Why use ECS over EKS?" or "What DB should I use for a real-time chat app?" and get grounded, cited answers.

### 2.7 Predictive Capacity Planning
ML models predict traffic spikes, CPU exhaustion, memory overflow, and storage limits before they happen. Models used: LSTM for sequence prediction, XGBoost for regression, Prophet for seasonal forecasting. Output is a dashboard with future capacity projections and recommended pre-scaling actions.

### 2.8 Self-Healing Automation Agent
The most advanced agentic feature. When triggered, this agent can automatically restart unhealthy services, scale EC2 instances, rotate credentials, trigger deployment rollbacks, and open Jira tickets. Human approval mode can be toggled on or off per action type.

---

## 3. System Architecture Overview

```
User (Browser)
     │
     ▼
CloudFront + Route53
     │
     ▼
API Gateway
     │
     ▼
Application Load Balancer
     │
     ▼
ECS / EKS (Backend Services)
     │
  ┌──┴───────────────────────┐
  │                          │
FastAPI (Core API)      Celery Workers (Async)
  │                          │
  │                     Redis (Task Queue)
  │
  ├── AWS Bedrock (LLM — Claude / Llama / Titan)
  ├── LangGraph Agents (Multi-Agent Orchestration)
  ├── SageMaker Endpoints (Custom ML Models)
  ├── OpenSearch (Vector DB for RAG)
  ├── DynamoDB (Users, Sessions, Chat History)
  ├── S3 (Uploaded Files, Reports, Diagrams)
  ├── CloudWatch + X-Ray (Monitoring)
  └── Cognito (Authentication & RBAC)
```

---

## 4. Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Frontend | React.js, Next.js 14, TypeScript, TailwindCSS, shadcn/ui, React Flow, Recharts, Framer Motion |
| Backend | FastAPI, Python 3.11, Celery, Redis, WebSockets |
| Auth | AWS Cognito (SSO, MFA, RBAC) |
| AI — LLM | AWS Bedrock (Claude, Llama, Titan) |
| AI — Agents | LangGraph |
| AI — RAG | OpenSearch (vector engine), Bedrock Embeddings |
| ML Models | XGBoost, Random Forest, Prophet, LSTM, Isolation Forest |
| ML Platform | AWS SageMaker, MLflow |
| Database | AWS DynamoDB (primary), AWS RDS PostgreSQL (analytics) |
| Storage | AWS S3 |
| Cache | Redis (ElastiCache) |
| Monitoring | CloudWatch, X-Ray, Prometheus, Grafana |
| Infrastructure | Terraform, Docker, Kubernetes (EKS) |
| CI/CD | GitHub Actions, AWS CodePipeline, CodeBuild, ECR |
| Security | IAM, KMS, WAF, Secrets Manager, AWS Shield |
| Messaging | SQS, SNS |
| Networking | VPC, API Gateway, Route53, CloudFront, ELB |

---

## 5. Team Structure & Ownership

| Developer | Role | Primary Ownership |
|---|---|---|
| Dev 1 | AWS & DevOps Engineer | All AWS infra, Terraform, EKS/ECS, CI/CD, MLOps, Monitoring |
| Dev 2 | Frontend Engineer | Next.js app, all UI modules, API integration, auth flow |
| Dev 3 | Backend Engineer | FastAPI, all API endpoints, auth integration, file processing, Celery |
| Dev 4 | AI/ML Engineer | LangGraph agents, RAG pipeline, Bedrock, SageMaker ML models |

---

## 6. Repository & Folder Structure

```
clouddaddy/
├── frontend/
│   ├── app/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── architect-builder/
│   │   ├── chat-copilot/
│   │   └── analytics/
│   ├── lib/
│   ├── hooks/
│   └── public/
│
├── backend/
│   ├── api/
│   │   └── routes/
│   ├── auth/
│   ├── services/
│   ├── workers/
│   └── core/
│
├── ai_agents/
│   ├── architecture_agent/
│   ├── security_agent/
│   ├── cost_agent/
│   ├── incident_agent/
│   ├── automation_agent/
│   ├── documentation_agent/
│   └── orchestrator/
│
├── ml_models/
│   ├── cost_prediction/
│   ├── anomaly_detection/
│   └── capacity_forecasting/
│
├── rag_pipeline/
│   ├── ingestion/
│   ├── embeddings/
│   └── retrieval/
│
├── infra/
│   ├── terraform/
│   │   ├── modules/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   └── prod/
│   │   └── main.tf
│   └── kubernetes/
│       ├── deployments/
│       ├── services/
│       └── ingress/
│
├── monitoring/
│   ├── grafana/
│   └── prometheus/
│
├── .github/
│   └── workflows/
│
└── docs/
```

---

## 7. Master Prompt — All Developers

> This prompt is identical for all four developers. Paste it at the start of every coding session with your AI assistant.

---

```
You are building CloudDaddy — an enterprise-grade AI Cloud Architecture Intelligence Platform.

CloudDaddy is a production-ready, full-stack AI platform that helps organizations design, analyze, optimize, secure, and monitor AWS cloud infrastructure using Agentic AI, LLM reasoning via AWS Bedrock, RAG-based knowledge retrieval via OpenSearch, and custom-trained ML models deployed on AWS SageMaker.

The platform is not a chatbot. It is a multi-module AI system with the following core capabilities:
- AI-powered cloud architecture design from business requirements
- Infrastructure config analysis (Terraform, CloudFormation, YAML, Kubernetes)
- ML-based cost prediction and optimization
- AI security auditing and anomaly detection
- Predictive capacity planning using LSTM, XGBoost, and Prophet
- Agentic incident response and root cause analysis
- RAG-based architecture Q&A copilot
- Self-healing automation agents

TECH STACK:
- Frontend: Next.js 14, TypeScript, TailwindCSS, shadcn/ui, React Flow, Recharts, Framer Motion
- Backend: FastAPI (Python 3.11), Celery, Redis
- Auth: AWS Cognito (SSO, MFA, RBAC)
- LLM: AWS Bedrock (Claude 3 / Llama / Titan)
- Agents: LangGraph
- RAG: OpenSearch vector engine + Bedrock Embeddings
- ML: XGBoost, Random Forest, Prophet, LSTM, Isolation Forest trained and deployed via SageMaker
- DB: DynamoDB (primary), RDS PostgreSQL (analytics)
- Storage: S3
- Cache: Redis (ElastiCache)
- IaC: Terraform
- Containers: Docker, Kubernetes (EKS)
- CI/CD: GitHub Actions + AWS CodePipeline + ECR
- Monitoring: CloudWatch, Prometheus, Grafana

STANDARDS:
- All code must be production-grade, modular, and clean
- Never include comments in any code
- Use environment variables for all secrets and config values
- Write typed, linted code at all times (TypeScript strict mode, Python type hints)
- Every module must have a corresponding README.md
- Push only to your assigned branch, never directly to main
- Follow conventional commits: feat:, fix:, refactor:, docs:, chore:
- Write unit tests for all business logic

This is a resume-worthy, AI/ML company-level project. Every piece of code you write should reflect production engineering standards.
```

---

## 8. Developer 1 — AWS & DevOps Engineer

### Role Summary
You own everything infrastructure. No service runs in production without going through your Terraform configs, your Docker images, your Kubernetes manifests, and your CI/CD pipelines. You are also responsible for the MLOps layer that serves ML models via SageMaker.

### Tech Ownership
- Terraform (all AWS resources)
- ECS / EKS cluster setup and management
- VPC, subnets, security groups, NACLs
- API Gateway, Load Balancer, Route53, CloudFront
- IAM roles, KMS keys, WAF, Secrets Manager, Shield
- AWS Cognito (infrastructure setup, not app integration)
- DynamoDB, RDS, S3, ElastiCache (Redis), SQS, SNS — provisioning only
- OpenSearch cluster (vector engine enabled)
- AWS SageMaker infrastructure (training jobs, endpoints)
- MLflow tracking server
- ECR repositories for Docker images
- GitHub Actions CI/CD workflows
- AWS CodePipeline, CodeBuild
- CloudWatch dashboards, alarms, log groups
- X-Ray tracing setup
- Prometheus + Grafana deployment on EKS
- Docker and Kubernetes configs for all services

### Your Branch
`dev/devops`

### Personalized Prompt

```
You are the AWS & DevOps Engineer for CloudDaddy.

Your job is to build and maintain all infrastructure that CloudDaddy runs on. You do not write application code — you write the infrastructure that hosts it.

YOUR DELIVERABLES:

1. TERRAFORM MODULES
Write modular Terraform in infra/terraform/modules/ covering:
- vpc/ — VPC, public/private subnets, NAT gateway, Internet gateway, route tables
- ecs/ — ECS cluster, task definitions, service, ECR
- eks/ — EKS cluster, node groups, IAM roles for service accounts (IRSA)
- rds/ — RDS PostgreSQL with Multi-AZ, parameter groups, subnet groups
- dynamodb/ — tables for users, sessions, chat_history, recommendations
- s3/ — buckets for uploads, reports, model artifacts, logs with versioning and encryption
- elasticache/ — Redis cluster for Celery and session cache
- opensearch/ — domain with vector engine enabled, fine-grained access control
- sagemaker/ — SageMaker domain, execution roles, S3 integration, endpoint configs
- cognito/ — user pool, app client, identity pool, hosted UI
- api_gateway/ — REST API Gateway with Lambda authorizer or Cognito authorizer
- alb/ — Application Load Balancer, target groups, listeners, HTTPS
- cloudfront/ — distribution pointing to ALB and S3, WAF association
- route53/ — hosted zone, A/AAAA alias records
- iam/ — least privilege roles for each service (ECS task role, SageMaker role, Lambda role)
- secrets/ — Secrets Manager entries for DB credentials, API keys, Bedrock config
- kms/ — customer-managed keys for S3, DynamoDB, RDS encryption
- waf/ — WAF WebACL with managed rules attached to CloudFront and ALB
- sqs_sns/ — queues for async jobs, topics for incident alerts
- monitoring/ — CloudWatch log groups, metric alarms, dashboards, X-Ray groups

Use environments: infra/terraform/environments/dev/ and infra/terraform/environments/prod/ with separate .tfvars files.

2. KUBERNETES MANIFESTS (infra/kubernetes/)
Write manifests for:
- Deployments for: backend-api, celery-worker, rag-service, agent-service
- Services (ClusterIP for internal, LoadBalancer or Ingress for external)
- Ingress with ALB ingress controller annotations
- ConfigMaps for environment configs
- HorizontalPodAutoscaler for each deployment
- PodDisruptionBudgets
- Namespace: clouddaddy

3. DOCKER
Write Dockerfiles for:
- backend/ — multi-stage Python FastAPI image
- ai_agents/ — multi-stage Python LangGraph image
- ml_models/ — SageMaker-compatible inference container

All images use non-root users. No secrets in images.

4. CI/CD — GITHUB ACTIONS (.github/workflows/)
Write workflows:
- ci.yml — runs on PR to main: lint, type check, unit tests for frontend and backend
- deploy-backend.yml — on push to main: build Docker image, push to ECR, update ECS/EKS service
- deploy-frontend.yml — on push to main: build Next.js, deploy to S3 + invalidate CloudFront
- deploy-infra.yml — on push to main with changes in infra/: terraform plan and apply
- deploy-ml.yml — triggered manually or on changes to ml_models/: package and push SageMaker model

5. MLOPS
In infra/terraform/modules/sagemaker/ and a monitoring/mlflow/ directory:
- Set up SageMaker Pipelines for training (preprocessing → training → evaluation → registration)
- Set up MLflow tracking server backed by S3 and RDS
- Configure SageMaker Model Monitor for drift detection on deployed endpoints
- Write a SageMaker endpoint config for each model: cost-prediction, anomaly-detection, capacity-forecasting

6. MONITORING
- CloudWatch dashboard covering: ECS CPU/memory, DynamoDB read/write units, Redis memory, API Gateway 4xx/5xx, SageMaker endpoint latency
- Prometheus scrape configs for EKS pods
- Grafana dashboards for: API performance, ML model latency, infra health, cost trends
- CloudWatch alarms for: high CPU, 5xx spike, DB connection exhaustion, Redis eviction

RULES:
- Never hardcode secrets — use Secrets Manager and pass via environment variables
- All S3 buckets: versioning enabled, server-side encryption with KMS, public access blocked
- All DynamoDB tables: encryption at rest, point-in-time recovery enabled
- All IAM roles: least privilege, no wildcard actions unless explicitly necessary
- Terraform state must be stored in S3 with DynamoDB locking
- Tag every resource: Project=CloudDaddy, Environment=dev/prod, ManagedBy=Terraform

Push all work to branch: dev/devops
Follow conventional commits: chore: for infra, feat: for new modules
```

---

## 9. Developer 2 — Frontend Engineer

### Role Summary
You own the entire user-facing application. Users interact with CloudDaddy through your UI. You build the dashboard, the drag-and-drop architecture builder, the chat copilot interface, the analytics views, and all auth flows. You consume backend APIs and make the AI feel like magic to the user.

### Tech Ownership
- Next.js 14 App Router application
- TypeScript strict mode throughout
- TailwindCSS + shadcn/ui component system
- React Flow (architecture drag-and-drop builder)
- Recharts (cost, capacity, anomaly charts)
- Framer Motion (animations and transitions)
- AWS Cognito auth integration (Amplify or cognito-identity-js)
- All API calls to backend (using React Query / SWR)
- WebSocket integration for real-time agent status
- File upload (Terraform, YAML, JSON configs)
- Responsive and accessible UI

### Your Branch
`dev/frontend`

### Personalized Prompt

```
You are the Frontend Engineer for CloudDaddy.

You build the Next.js 14 application that is the face of the platform. Every interaction a user has with CloudDaddy goes through your UI. Make it feel like a serious enterprise AI product, not a student project.

YOUR DELIVERABLES:

1. PROJECT SETUP (frontend/)
- Next.js 14 with App Router, TypeScript strict mode
- TailwindCSS configured with a custom design system (dark mode primary)
- shadcn/ui installed and configured
- ESLint + Prettier configured
- Absolute imports with @ alias
- Environment variables via .env.local (NEXT_PUBLIC_ prefix for client-safe vars)

2. AUTH FLOW
Integrate AWS Cognito using the `amazon-cognito-identity-js` package or AWS Amplify Auth.
Build:
- /login — email + password login form
- /signup — registration with email verification
- /mfa — MFA challenge screen (Cognito TOTP/SMS)
- Protected route HOC or middleware that redirects unauthenticated users
- useAuth() hook that exposes: user, login(), logout(), isAuthenticated, getToken()
- Token refresh logic (Cognito refresh token)
- Store tokens in httpOnly cookie via a Next.js API route, never in localStorage

3. DASHBOARD (app/dashboard/)
The main landing page after login. Show:
- Infra health score card (circular gauge using Recharts RadialBarChart)
- Latest AI recommendations list (severity badge, description, action button)
- Cost this month vs last month (bar chart)
- Active incidents count with severity breakdown
- Security risk score card
- Recent activity feed
- Sidebar navigation to all modules

4. ARCHITECTURE BUILDER (app/builder/)
The most impressive UI module. Use React Flow.
- Canvas with drag-and-drop AWS service nodes (EC2, ECS, RDS, S3, Lambda, API Gateway, CloudFront, VPC, etc.)
- Each node has an icon, label, and config panel on click
- AI Suggestion Panel on the right side — shows LLM recommendations as the user builds
- "Analyze Architecture" button — sends the current diagram JSON to POST /api/analyze-architecture
- "Generate Architecture" button opens a modal where user inputs requirements (form with: user traffic, budget, latency, storage, compliance) and calls POST /api/generate-design
- Display returned architecture as React Flow nodes automatically
- Export diagram as PNG (use react-flow's built-in getViewport + html-to-image)

5. INFRA ANALYZER (app/analyzer/)
- File upload dropzone (react-dropzone) accepting .tf, .yaml, .yml, .json, .json5 files
- Upload calls POST /api/upload-config
- Show upload progress
- After analysis completes (poll GET /api/job/{job_id} or WebSocket), display:
  - Risk findings table (severity: critical/high/medium/low, description, resource, recommendation)
  - Filter by severity
  - Export report as PDF (call GET /api/report/{job_id})

6. CHAT COPILOT (app/copilot/)
- Chat interface with message history
- Markdown rendering for AI responses (react-markdown + rehype-highlight for code blocks)
- File attachment button (upload context docs, Terraform files)
- Streaming response (use fetch with ReadableStream or EventSource for SSE from backend)
- Suggested questions as clickable chips
- Clear conversation button

7. COST & ANALYTICS DASHBOARD (app/analytics/)
Show using Recharts:
- Monthly cost trend (LineChart, last 12 months)
- Cost by service (PieChart or TreeMap)
- Predicted cost next 3 months (AreaChart with confidence band)
- Capacity forecasting (CPU, RAM, Storage — LineChart with forecast line in different color)
- Anomaly alerts timeline (scatter plot with highlighted anomaly points)
All data from GET /api/predict-cost and GET /api/capacity-forecast.

8. SECURITY MODULE (app/security/)
- Security score gauge
- Findings table: IAM issues, open ports, exposed resources, missing encryption
- Each finding expandable with full detail and remediation steps
- "Run Security Scan" button → POST /api/security-scan → poll for result

9. INCIDENT CENTER (app/incidents/)
- Active and historical incidents list
- Incident detail view: timeline, root cause, affected services, AI recommendation
- Status badge: open, investigating, resolved
- Trigger manual incident analysis: POST /api/incident-analysis

10. SHARED COMPONENTS (components/)
Build these reusable components:
- <SeverityBadge level="critical|high|medium|low" />
- <MetricCard title value trend icon />
- <LoadingOverlay message />
- <ConfirmModal title message onConfirm onCancel />
- <FileUploadDropzone onUpload accept />
- <StreamingMessage content isStreaming />
- <ArchitectureNode type label /> (React Flow custom node)

11. API LAYER (lib/api/)
- Centralized axios or fetch wrapper with base URL from env
- Attach Cognito JWT to every request via Authorization header
- Handle 401 → trigger logout
- Handle 429 → show rate limit toast
- Typed request/response interfaces for every endpoint

12. STATE MANAGEMENT
Use Zustand for global state:
- authStore: user, tokens, isAuthenticated
- incidentStore: active incidents count
- recommendationStore: latest recommendations
Use React Query (TanStack Query) for all server data: fetching, caching, refetching.

DESIGN SYSTEM:
- Primary color: indigo-600
- Background: slate-950 (dark mode default)
- Surface: slate-900
- Border: slate-700
- Typography: Inter font
- Spacing: 4px base grid via Tailwind
- All interactive elements must have focus rings for accessibility

Push all work to branch: dev/frontend
Follow conventional commits: feat: for new pages/components, fix: for bugs, refactor: for cleanup
```

---

## 10. Developer 3 — Backend Engineer

### Role Summary
You own the FastAPI application, all API endpoints, authentication middleware, file parsing services, and the async task system. You are the bridge between the frontend, the AI/ML layer, and AWS services. Every AI feature is triggered through your API.

### Tech Ownership
- FastAPI application (Python 3.11)
- All API routes and request/response schemas (Pydantic)
- AWS Cognito JWT verification middleware
- RBAC middleware
- File processing service (HCL, YAML, JSON, logs)
- Celery workers for async AI/ML jobs
- Redis (task queue, session cache)
- DynamoDB integration (users, sessions, chat history, jobs)
- S3 integration (file uploads, report storage)
- SQS (job dispatch), SNS (incident alerts)
- WebSocket endpoint for real-time job status
- Integration contracts with AI/ML layer (calls to LangGraph agents and SageMaker endpoints)

### Your Branch
`dev/backend`

### Personalized Prompt

```
You are the Backend Engineer for CloudDaddy.

You build the FastAPI application that powers the entire platform. The frontend calls your APIs. Your APIs call the AI agents and ML models. You own the request lifecycle, auth, data layer, and async job system.

YOUR DELIVERABLES:

1. PROJECT SETUP (backend/)
- FastAPI 0.111+ with Python 3.11
- Project structure:
  backend/
  ├── api/
  │   └── routes/
  ├── auth/
  ├── services/
  ├── workers/
  ├── core/
  │   ├── config.py
  │   └── dependencies.py
  ├── models/
  ├── schemas/
  └── main.py
- Use pydantic-settings for config loaded from environment variables
- Use `uvicorn` with `gunicorn` as the process manager
- CORS configured to allow only the frontend origin
- All secrets via environment variables, never hardcoded

2. AUTHENTICATION MIDDLEWARE (auth/)
Implement JWT verification using the Cognito JWKS endpoint:
- Fetch and cache Cognito JWKS on startup
- Verify RS256 JWT signature, expiry, iss, aud claims on every protected route
- FastAPI Depends() decorator: get_current_user(token: str) → UserContext
- UserContext dataclass: user_id, email, roles, cognito_groups
- RBAC: role-based permission check Depends(require_role("admin")) for sensitive routes
- Refresh token endpoint: POST /auth/refresh — validates Cognito refresh token and returns new access token

3. API ROUTES (api/routes/)
Implement every route with full Pydantic request/response schemas and proper HTTP status codes:

POST /api/upload-config
- Accept multipart file upload (.tf, .yaml, .yml, .json)
- Validate file type and size (max 10MB)
- Save file to S3 (uploads/{user_id}/{job_id}/filename)
- Create job record in DynamoDB (status: queued)
- Dispatch Celery task: analyze_infrastructure_task(job_id, s3_key, user_id)
- Return: { job_id, status: "queued" }

POST /api/generate-design
- Body: { traffic, budget, latency, storage, compliance, workload_type }
- Dispatch Celery task: generate_architecture_task(job_id, requirements, user_id)
- Return: { job_id, status: "queued" }

POST /api/analyze-architecture
- Body: { diagram_json } (React Flow JSON from frontend)
- Dispatch Celery task: analyze_diagram_task(job_id, diagram_json, user_id)
- Return: { job_id, status: "queued" }

GET /api/job/{job_id}
- Fetch job from DynamoDB
- Return: { job_id, status, result, error, created_at, updated_at }

POST /api/chat
- Body: { message, conversation_id, attachments: [] }
- Fetch conversation history from DynamoDB
- Forward to RAG copilot agent (call ai_agents service via HTTP or direct import)
- Stream response back as Server-Sent Events (SSE)
- Save updated conversation to DynamoDB

POST /api/predict-cost
- Body: { instance_types, request_volume, storage_gb, bandwidth_gb }
- Call SageMaker cost-prediction endpoint via boto3
- Return: { predicted_monthly_cost, confidence_interval, breakdown }

GET /api/capacity-forecast
- Query params: metric (cpu|memory|storage), horizon_days
- Call SageMaker capacity-forecasting endpoint
- Return: { forecasts: [{ timestamp, value, lower_bound, upper_bound }] }

POST /api/security-scan
- Dispatch Celery task: security_scan_task(job_id, user_id)
- Calls security agent in ai_agents service
- Return: { job_id, status: "queued" }

POST /api/incident-analysis
- Body: { log_group, start_time, end_time, description }
- Dispatch Celery task: incident_analysis_task(job_id, params, user_id)
- Return: { job_id, status: "queued" }

GET /api/recommendations
- Query params: limit, severity, status
- Fetch from DynamoDB recommendations table for current user
- Return: paginated list of recommendations

GET /api/report/{job_id}
- Fetch completed job result from DynamoDB
- Generate PDF report using ReportLab or WeasyPrint
- Upload to S3 reports/{user_id}/{job_id}.pdf
- Return pre-signed S3 URL (valid 15 minutes)

4. FILE PROCESSING SERVICE (services/file_processor.py)
Parse uploaded infrastructure files:
- Terraform HCL: use python-hcl2 library
- YAML/CloudFormation: use PyYAML
- JSON: stdlib json
- Extract: resource types, instance types, storage configs, network configs, IAM policies
- Return structured dict that agents can consume
- Handle parse errors gracefully with descriptive error messages

5. CELERY WORKERS (workers/)
Configure Celery with Redis broker and Redis result backend.
Write task functions in workers/tasks.py:
- analyze_infrastructure_task(job_id, s3_key, user_id)
  Downloads file from S3 → processes → calls Architecture Agent → saves result to DynamoDB
- generate_architecture_task(job_id, requirements, user_id)
  Calls Architecture Agent → saves diagram JSON + explanation to DynamoDB
- security_scan_task(job_id, user_id)
  Fetches user's recent configs from DynamoDB → calls Security Agent → saves findings
- incident_analysis_task(job_id, params, user_id)
  Fetches CloudWatch logs via boto3 → calls Incident Agent → saves report
- Update job status in DynamoDB at each step: queued → running → completed/failed

6. WEBSOCKET ENDPOINT
GET /ws/job/{job_id}
- WebSocket endpoint using FastAPI WebSocket
- Poll DynamoDB every 2 seconds for job status updates
- Push status updates to connected client
- Close connection when job reaches terminal state (completed/failed)

7. DYNAMO DB SCHEMAS
Define table structures:
- users: PK=user_id, SK=profile | Attributes: email, roles, created_at
- jobs: PK=user_id, SK=job_id | Attributes: status, type, result, error, created_at, updated_at | GSI: job_id-index
- conversations: PK=user_id, SK=conversation_id | Attributes: messages (list), created_at
- recommendations: PK=user_id, SK=rec_id | Attributes: severity, type, description, resource, status
- Use DynamoDB single-table design where practical

8. AWS INTEGRATIONS (services/)
Write boto3 wrapper services:
- s3_service.py: upload_file(), download_file(), generate_presigned_url(), delete_file()
- dynamo_service.py: put_item(), get_item(), query(), update_status()
- sagemaker_service.py: invoke_endpoint(endpoint_name, payload) with retry logic
- cloudwatch_service.py: get_log_events(log_group, start_time, end_time), get_metric_data()
- sns_service.py: publish_incident_alert(topic_arn, message)

9. ERROR HANDLING
- Global exception handler in main.py
- Custom exception classes: AuthenticationError, AuthorizationError, JobNotFoundError, FileTooLargeError, UnsupportedFileTypeError
- All errors return: { error_code, message, details } with appropriate HTTP status
- Log all 5xx errors to CloudWatch Logs via Python logging with structlog

10. TESTS (tests/)
Write pytest tests:
- tests/test_auth.py — JWT verification, RBAC
- tests/test_upload.py — file validation, S3 mock with moto
- tests/test_jobs.py — job creation, status polling
- tests/test_file_processor.py — HCL, YAML, JSON parsing
Use pytest-asyncio for async test support. Use moto for AWS mocking.

Push all work to branch: dev/backend
Follow conventional commits: feat: for new endpoints, fix: for bugs, refactor: for restructuring
```

---

## 11. Developer 4 — AI/ML Engineer

### Role Summary
You own the intelligence layer of CloudDaddy. The multi-agent LangGraph system, the RAG pipeline, AWS Bedrock LLM calls, and all custom ML models trained and deployed via SageMaker — that is your domain. You make CloudDaddy smart.

### Tech Ownership
- LangGraph multi-agent orchestration system
- All 7 AI agents (Architecture, Security, Cost, Monitoring, Incident, Automation, Documentation)
- RAG pipeline: ingestion, embedding, retrieval via OpenSearch
- AWS Bedrock integration (Claude 3 / Llama 3 / Titan)
- Custom ML models: cost prediction, anomaly detection, capacity forecasting
- SageMaker training pipelines and inference endpoints
- MLflow experiment tracking
- Prompt engineering and chain construction

### Your Branch
`dev/ai-ml`

### Personalized Prompt

```
You are the AI/ML Engineer for CloudDaddy.

You build the brain of the platform. The multi-agent AI system, the RAG knowledge retrieval pipeline, the AWS Bedrock LLM integration, and the custom ML models trained on SageMaker. This is the part of the project that makes CloudDaddy resume-worthy for AI/ML companies.

YOUR DELIVERABLES:

1. PROJECT SETUP
Two main directories:
- ai_agents/ — LangGraph agentic system
- ml_models/ — SageMaker ML models
- rag_pipeline/ — RAG ingestion, embedding, retrieval

Dependencies: langchain, langgraph, langchain-aws, boto3, opensearch-py, scikit-learn, xgboost, prophet, tensorflow (for LSTM), mlflow, pandas, numpy, pydantic

2. AWS BEDROCK INTEGRATION (ai_agents/bedrock_client.py)
Create a reusable Bedrock client:
- Use boto3 bedrock-runtime client
- Support model switching: anthropic.claude-3-sonnet, meta.llama3-70b-instruct, amazon.titan-text-express
- implement invoke_model(model_id, prompt, max_tokens, temperature) → str
- implement invoke_model_streaming(model_id, prompt) → AsyncGenerator[str]
- Wrap with retry logic (exponential backoff on ThrottlingException)
- Log token usage to CloudWatch custom metrics

3. LANGGRAPH MULTI-AGENT SYSTEM (ai_agents/)

Build the agent orchestrator in ai_agents/orchestrator/graph.py using LangGraph StateGraph.

Define shared AgentState (TypedDict):
- user_query: str
- requirements: dict
- parsed_config: dict
- architecture_output: dict
- security_findings: list
- cost_analysis: dict
- capacity_forecast: dict
- incident_summary: dict
- automation_actions: list
- final_report: str
- messages: list[BaseMessage]

AGENT 1 — Architecture Agent (ai_agents/architecture_agent/)
Input: requirements dict or parsed_config dict
Tasks:
- Given requirements: select compute (EC2/ECS/EKS/Lambda), DB (DynamoDB/RDS/Aurora), storage, networking, CDN, caching strategy
- Given parsed_config: identify architecture pattern and classify components
- Use AWS Well-Architected Framework principles in system prompt
- Output: { diagram_json (React Flow format), explanation, tradeoffs, cost_estimate_rough }
Tool: call Bedrock Claude with structured output via LangChain's with_structured_output

AGENT 2 — Security Agent (ai_agents/security_agent/)
Input: parsed_config dict or architecture_output dict
Tasks:
- Check for: public S3 buckets, open port 22/3389 to 0.0.0.0/0, missing SSL, no WAF, root account usage, wildcard IAM, no MFA, missing encryption, exposed secrets in config
- Score each finding: critical/high/medium/low
- Generate remediation steps for each finding
- Output: { findings: [{ severity, resource, issue, remediation }], overall_risk_score }

AGENT 3 — Cost Agent (ai_agents/cost_agent/)
Input: architecture_output dict or parsed_config dict
Tasks:
- Estimate monthly cost per service from architecture
- Recommend: Reserved Instances for steady-state compute, Spot Instances for batch jobs, right-sizing (if overprovisioned), Savings Plans
- Call SageMaker cost-prediction endpoint to get ML-based cost forecast
- Output: { current_estimated_cost, optimized_estimated_cost, savings_potential, recommendations: [] }

AGENT 4 — Monitoring Agent (ai_agents/monitoring_agent/)
Input: cloudwatch_data dict (passed from backend)
Tasks:
- Analyze CloudWatch metrics: CPU, memory, request count, error rate, latency
- Detect anomalies by comparing against historical baseline
- Flag: CPU > 80%, error rate > 5%, latency p99 > threshold
- Output: { health_status, alerts: [], summary }

AGENT 5 — Incident Agent (ai_agents/incident_agent/)
Input: logs (list of log lines), metrics dict, incident_description str
Tasks:
- Parse log lines to extract error patterns, stack traces, exception types
- Correlate with metric anomalies (CPU spike, memory spike, connection errors)
- Use chain-of-thought prompting to reason through root cause
- Output: { root_cause, affected_services, timeline, recommended_actions, severity, summary }

AGENT 6 — Automation Agent (ai_agents/automation_agent/)
Input: incident_summary dict or recommendation list
Tasks:
- Decide which actions are safe to automate vs require human approval
- Generate action plan: { action_type, resource, parameters, requires_approval }
- Action types: scale_up, restart_service, rotate_credentials, rollback_deployment, create_jira_ticket, send_slack_alert
- DO NOT execute actions directly — return action plan to backend which executes via boto3
- Output: { action_plan: [], human_approval_required: bool }

AGENT 7 — Documentation Agent (ai_agents/documentation_agent/)
Input: all agent outputs from AgentState
Tasks:
- Synthesize all agent outputs into a single structured report
- Sections: Executive Summary, Architecture Analysis, Security Findings, Cost Analysis, Capacity Forecast, Incident Report, Recommended Actions
- Format as markdown
- Output: { report_markdown, key_findings: [], priority_actions: [] }

ORCHESTRATOR (ai_agents/orchestrator/graph.py)
Build a LangGraph StateGraph that:
- Routes to the correct agent(s) based on task_type in AgentState
- For "full_analysis": runs Architecture → Security → Cost → Documentation agents in sequence
- For "incident": runs Monitoring → Incident → Automation → Documentation agents
- For "design": runs Architecture → Cost → Documentation agents
- For "security_scan": runs Security → Documentation agents
- Uses conditional edges to skip agents that are not needed
- Returns final AgentState with all outputs populated

Expose a single function: async def run_agent_pipeline(task_type, input_data) → dict

4. RAG PIPELINE (rag_pipeline/)

INGESTION (rag_pipeline/ingestion/)
Script: ingest.py
- Load documents from: AWS docs (scraped or downloaded), architecture best practices PDFs, internal markdown files from docs/
- Use LangChain document loaders: WebBaseLoader, PyPDFLoader, TextLoader
- Chunk documents: RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
- Add metadata: source, category (security|cost|architecture|networking), timestamp

EMBEDDINGS (rag_pipeline/embeddings/)
- Use AWS Bedrock Embeddings: amazon.titan-embed-text-v1
- Embed each chunk via BedrockEmbeddings from langchain-aws
- Store vectors in OpenSearch index: clouddaddy-knowledge with knn_vector field (1536 dims)
- OpenSearch index mapping: { vector: knn_vector, text: text, metadata: keyword }
- Script: embed_and_index.py — reads chunks, generates embeddings, bulk-indexes to OpenSearch

RETRIEVAL (rag_pipeline/retrieval/)
- retriever.py: similarity_search(query, k=5, filter=None) → list[Document]
- Use OpenSearch k-NN query with the query embedding
- Support metadata filtering: filter by category
- rag_chain.py: build LangChain RAG chain:
  query → embed → retrieve top-k → build prompt with context → Bedrock LLM → answer
- Expose: async def answer_question(query, conversation_history, category_filter) → str

5. ML MODELS (ml_models/)

COST PREDICTION MODEL (ml_models/cost_prediction/)
- train.py: 
  - Features: instance_type (encoded), vcpu_count, memory_gb, storage_gb, request_volume_daily, bandwidth_gb
  - Target: monthly_cost_usd
  - Models: XGBoost Regressor and Random Forest Regressor
  - Cross-validation with 5-fold CV
  - Log metrics to MLflow: RMSE, MAE, R²
  - Register best model in MLflow Model Registry
- inference.py:
  - SageMaker-compatible: model_fn(), input_fn(), predict_fn(), output_fn()
  - Load model from /opt/ml/model
  - Accept JSON input, return JSON output

ANOMALY DETECTION MODEL (ml_models/anomaly_detection/)
- train.py:
  - Features: cpu_utilization, memory_utilization, request_rate, error_rate, latency_p99
  - Model: Isolation Forest (contamination=0.05), One-Class SVM
  - Train on normal traffic windows from CloudWatch metric history
  - Log: precision, recall, F1 on labeled anomaly test set
  - Register in MLflow
- inference.py:
  - SageMaker-compatible inference handlers
  - Output: { is_anomaly: bool, anomaly_score: float, contributing_features: [] }

CAPACITY FORECASTING MODEL (ml_models/capacity_forecasting/)
- train.py:
  - Features: timestamp, cpu_utilization, memory_utilization, storage_used_gb
  - Models:
    - Prophet: fit on time series with weekly and daily seasonality
    - LSTM: build with Keras — 2 LSTM layers, 1 Dense output layer, sequence length 24 (hourly data)
  - Log to MLflow: MAPE, RMSE on held-out forecast window
  - Save Prophet model as pickle, LSTM as SavedModel format
- inference.py:
  - SageMaker-compatible
  - Input: { metric, historical_data: [], horizon_hours: 72 }
  - Output: { forecasts: [{ timestamp, value, lower_bound, upper_bound }] }

SAGEMAKER TRAINING SCRIPT PATTERN:
Each train.py must:
- Read training data from /opt/ml/input/data/train/
- Save model artifacts to /opt/ml/model/
- Log hyperparameters from /opt/ml/input/config/hyperparameters.json
- Write evaluation metrics to /opt/ml/output/metrics/

6. EXPOSED SERVICE (ai_agents/service.py)
FastAPI micro-service (or importable module) that the backend calls:
- POST /agents/run { task_type, input_data } → { result }
- POST /rag/query { query, conversation_history, category } → { answer }
These can be either a separate FastAPI service or Python functions imported directly by the backend workers — coordinate with the Backend Engineer.

7. PROMPT ENGINEERING STANDARDS
- All system prompts stored in ai_agents/prompts/ as .txt files, loaded at runtime
- Use f-strings or LangChain PromptTemplate for dynamic content
- Every agent system prompt includes: role definition, output format specification, constraints, examples
- Use structured output (Pydantic schemas) with LangChain's with_structured_output() to enforce JSON output

8. TESTS (tests/)
- tests/test_agents.py — test each agent with mock Bedrock responses
- tests/test_rag.py — test retrieval with mock OpenSearch responses
- tests/test_ml_cost.py — test cost model inference
- tests/test_ml_anomaly.py — test anomaly detection
Use pytest-asyncio for async agent tests. Use unittest.mock to mock boto3 calls.

Push all work to branch: dev/ai-ml
Follow conventional commits: feat: for new agents/models, fix: for bugs, experiment: for model experiments
```

---

## 12. GitHub Workflow & Branching Strategy

```
main
├── dev/devops      ← Dev 1 (AWS & DevOps)
├── dev/frontend    ← Dev 2 (Frontend)
├── dev/backend     ← Dev 3 (Backend)
└── dev/ai-ml       ← Dev 4 (AI/ML)
```

**Rules:**
- Nobody pushes directly to `main`
- Each developer works exclusively on their branch
- PRs to `main` require at least one reviewer approval
- CI must pass before merge (lint, type check, tests)
- Merge strategy: Squash and merge for feature branches

**Commit Format (Conventional Commits):**
```
feat: add architecture agent LangGraph node
fix: correct JWT expiry check in auth middleware
refactor: extract S3 upload logic into service class
chore: add Terraform module for OpenSearch
docs: update RAG pipeline README
```

**Environment Variables:**
Each developer must maintain a `.env.example` file in their module directory with all required variable names (no values). The actual `.env` file is never committed.

---

## 13. MVP Build Order

| Phase | What Gets Built | Who |
|---|---|---|
| Phase 1 | Terraform base infra (VPC, ECS, DynamoDB, S3, Cognito), Backend auth + upload endpoint, Frontend auth flow + basic dashboard shell | Dev 1 + Dev 3 + Dev 2 |
| Phase 2 | RAG pipeline ingestion + Bedrock integration, Architecture Agent + Cost Agent, Backend chat endpoint with SSE, Frontend Chat Copilot | Dev 4 + Dev 3 + Dev 2 |
| Phase 3 | Full multi-agent LangGraph orchestrator, Security Agent + Incident Agent, Frontend Architecture Builder + Infra Analyzer | Dev 4 + Dev 2 |
| Phase 4 | ML model training + SageMaker deployment (cost prediction + anomaly detection + capacity forecasting), Frontend Analytics Dashboard | Dev 4 + Dev 1 + Dev 2 |
| Phase 5 | Automation Agent + self-healing workflows, Monitoring (Prometheus + Grafana), Full CI/CD pipelines, Security hardening | Dev 1 + Dev 4 |

---

*CloudDaddy — Built by engineers, for engineers. AI-native cloud intelligence.*
