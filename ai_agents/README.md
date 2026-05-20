# CloudDaddy AI Agents Module

This module contains the LangGraph multi-agent orchestration engine and individual specialized agents to analyze and manage cloud architectures.

## Structure

- `bedrock_client.py`: Handles connections, retries, and token tracking for AWS Bedrock and local Ollama integrations.
- `prompts/`: Standard system prompts loaded at runtime for each agent.
- `orchestrator/graph.py`: Implements the LangGraph StateGraph, managing routing logic and conditional edges.
- `service.py`: Exposes FastAPI HTTP endpoints for the main backend application to call agent pipelines.
- Specialized Agents:
  - `architecture_agent`: Formulates React Flow layouts matching architectural best practices.
  - `security_agent`: Analyzes cloud configurations for exposed ports, public S3 buckets, and compliance issues.
  - `cost_agent`: Synthesizes costs and triggers right-sizing recommendations.
  - `monitoring_agent`: Assesses baseline CloudWatch metrics to determine infrastructure health.
  - `incident_agent`: Uses chain-of-thought to correlate logs and metrics to identify incident root causes.
  - `automation_agent`: Designs automated action plans and separates safe fixes from human approvals.
  - `documentation_agent`: Generates final consolidated markdown dossiers.

## Pipelines

1. **full_analysis**: `Architecture → Security → Cost → Documentation`
2. **incident**: `Monitoring → Incident → Automation → Documentation`
3. **design**: `Architecture → Cost → Documentation`
4. **security_scan**: `Security → Documentation`
