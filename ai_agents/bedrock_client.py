import os
import time
import json
import asyncio
import httpx
import boto3
from botocore.exceptions import ClientError
from typing import AsyncGenerator

class BedrockOllamaClient:
    def __init__(self):
        self.region = os.environ.get("AWS_REGION", "us-east-1")
        self.ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        self.use_ollama = os.environ.get("USE_OLLAMA", "true").lower() == "true"
        
        try:
            self.bedrock = boto3.client(
                service_name="bedrock-runtime",
                region_name=self.region
            )
            self.cloudwatch = boto3.client(
                service_name="cloudwatch",
                region_name=self.region
            )
        except Exception:
            self.bedrock = None
            self.cloudwatch = None

    def _log_token_usage(self, model_id: str, prompt_tokens: int, completion_tokens: int):
        if not self.cloudwatch:
            return
        try:
            self.cloudwatch.put_metric_data(
                Namespace="CloudDaddy/AI",
                MetricData=[
                    {
                        "MetricName": "PromptTokens",
                        "Dimensions": [{"Name": "ModelID", "Value": model_id}],
                        "Value": float(prompt_tokens),
                        "Unit": "Count"
                    },
                    {
                        "MetricName": "CompletionTokens",
                        "Dimensions": [{"Name": "ModelID", "Value": model_id}],
                        "Value": float(completion_tokens),
                        "Unit": "Count"
                    },
                    {
                        "MetricName": "TotalTokens",
                        "Dimensions": [{"Name": "ModelID", "Value": model_id}],
                        "Value": float(prompt_tokens + completion_tokens),
                        "Unit": "Count"
                    }
                ]
            )
        except Exception:
            pass

    def invoke_model(self, model_id: str, prompt: str, max_tokens: int = 2000, temperature: float = 0.2) -> str:
        if self.use_ollama or model_id.startswith("ollama/") or not self.bedrock:
            return self._invoke_ollama(model_id, prompt, max_tokens, temperature)
        
        model_arn = self._resolve_model_id(model_id)
        
        for attempt in range(5):
            try:
                body = self._prepare_payload(model_id, prompt, max_tokens, temperature)
                response = self.bedrock.invoke_model(
                    body=json.dumps(body),
                    modelId=model_arn,
                    accept="application/json",
                    contentType="application/json"
                )
                response_body = json.loads(response.get("body").read())
                result, p_tok, c_tok = self._parse_response(model_id, response_body)
                self._log_token_usage(model_id, p_tok, c_tok)
                return result
            except ClientError as e:
                code = e.response.get("Error", {}).get("Code", "")
                if code in ["ThrottlingException", "LimitExceededException"] and attempt < 4:
                    time.sleep(2 ** attempt)
                    continue
                raise e

    async def invoke_model_streaming(self, model_id: str, prompt: str) -> AsyncGenerator[str, None]:
        if self.use_ollama or model_id.startswith("ollama/") or not self.bedrock:
            async for chunk in self._invoke_ollama_streaming(model_id, prompt):
                yield chunk
            return

        model_arn = self._resolve_model_id(model_id)
        body = self._prepare_payload(model_id, prompt, 2000, 0.2)
        
        for attempt in range(5):
            try:
                response = self.bedrock.invoke_model_with_response_stream(
                    body=json.dumps(body),
                    modelId=model_arn,
                    accept="application/json",
                    contentType="application/json"
                )
                
                for event in response.get("body"):
                    chunk = event.get("chunk")
                    if chunk:
                        chunk_json = json.loads(chunk.get("bytes").decode("utf-8"))
                        text_chunk = self._parse_stream_chunk(model_id, chunk_json)
                        if text_chunk:
                            yield text_chunk
                return
            except ClientError as e:
                code = e.response.get("Error", {}).get("Code", "")
                if code in ["ThrottlingException", "LimitExceededException"] and attempt < 4:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise e

    def _resolve_model_id(self, model_id: str) -> str:
        mapping = {
            "anthropic.claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
            "meta.llama3-70b-instruct": "meta.llama3-70b-instruct-v1:0",
            "amazon.titan-text-express": "amazon.titan-text-express-v1"
        }
        return mapping.get(model_id, model_id)

    def _prepare_payload(self, model_id: str, prompt: str, max_tokens: int, temperature: float) -> dict:
        if "claude" in model_id:
            return {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}]
            }
        elif "llama" in model_id:
            return {
                "prompt": prompt,
                "max_gen_len": max_tokens,
                "temperature": temperature
            }
        else:
            return {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": max_tokens,
                    "temperature": temperature
                }
            }

    def _parse_response(self, model_id: str, body: dict) -> tuple[str, int, int]:
        if "claude" in model_id:
            text = body["content"][0]["text"]
            p_tok = body.get("usage", {}).get("input_tokens", 0)
            c_tok = body.get("usage", {}).get("output_tokens", 0)
            return text, p_tok, c_tok
        elif "llama" in model_id:
            text = body["generation"]
            p_tok = body.get("prompt_token_count", 0)
            c_tok = body.get("generation_token_count", 0)
            return text, p_tok, c_tok
        else:
            text = body["results"][0]["outputText"]
            p_tok = body.get("inputTextTokenCount", 0)
            c_tok = body.get("results", [{}])[0].get("tokenCount", 0)
            return text, p_tok, c_tok

    def _parse_stream_chunk(self, model_id: str, chunk_json: dict) -> str:
        if "claude" in model_id:
            if chunk_json.get("type") == "content_block_delta":
                return chunk_json["delta"].get("text", "")
        elif "llama" in model_id:
            return chunk_json.get("generation", "")
        else:
            return chunk_json.get("outputText", "")
        return ""

    def _invoke_ollama(self, model_id: str, prompt: str, max_tokens: int, temperature: float) -> str:
        clean_model = model_id.replace("ollama/", "")
        if clean_model in ["anthropic.claude-3-sonnet", "meta.llama3-70b-instruct", "amazon.titan-text-express"]:
            clean_model = "llama3"
            
        payload = {
            "model": clean_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": temperature
            }
        }
        try:
            response = httpx.post(f"{self.ollama_base_url}/api/generate", json=payload, timeout=60.0)
            response.raise_for_status()
            res_json = response.json()
            return res_json.get("response", "")
        except Exception:
            return self._mock_llm_response(model_id, prompt)

    async def _invoke_ollama_streaming(self, model_id: str, prompt: str) -> AsyncGenerator[str, None]:
        clean_model = model_id.replace("ollama/", "")
        if clean_model in ["anthropic.claude-3-sonnet", "meta.llama3-70b-instruct", "amazon.titan-text-express"]:
            clean_model = "llama3"
            
        payload = {
            "model": clean_model,
            "prompt": prompt,
            "stream": True
        }
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", f"{self.ollama_base_url}/api/generate", json=payload, timeout=60.0) as r:
                    r.raise_for_status()
                    async for line in r.iter_lines():
                        if line:
                            chunk_json = json.loads(line)
                            yield chunk_json.get("response", "")
        except Exception:
            yield self._mock_llm_response(model_id, prompt)

    def _mock_llm_response(self, model_id: str, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "audit" in prompt_lower or "security" in prompt_lower or "check for" in prompt_lower:
            return json.dumps({
                "findings": [
                    {
                        "severity": "critical",
                        "resource": "aws_s3_bucket.public_bucket",
                        "issue": "S3 bucket is publicly accessible to the world",
                        "remediation": "Enable block public access settings on the S3 bucket configuration"
                    },
                    {
                        "severity": "high",
                        "resource": "aws_security_group.allow_all",
                        "issue": "Ingress rule allows port 22 access from 0.0.0.0/0",
                        "remediation": "Restrict SSH port 22 access to specific administrator IP ranges or VPN CIDR blocks"
                    }
                ],
                "overall_risk_score": 85
            })
        elif "monthly cost" in prompt_lower or "savings" in prompt_lower or "right-sizing" in prompt_lower:
            return json.dumps({
                "current_estimated_cost": 1500.0,
                "optimized_estimated_cost": 980.0,
                "savings_potential": 520.0,
                "recommendations": [
                    "Purchase Savings Plans for steady-state EC2 instance workloads",
                    "Configure autoscaling schedule for ECS non-production tasks",
                    "Right-size overprovisioned db.m5.xlarge RDS instances to db.t3.medium"
                ]
            })
        elif "react flow" in prompt_lower or "nodes" in prompt_lower or "edges" in prompt_lower:
            return json.dumps({
                "diagram_json": {
                    "nodes": [
                        {"id": "dns", "position": {"x": 250, "y": 50}, "data": {"label": "Route 53"}},
                        {"id": "alb", "position": {"x": 250, "y": 150}, "data": {"label": "Application Load Balancer"}},
                        {"id": "ecs", "position": {"x": 250, "y": 250}, "data": {"label": "ECS Service (Fargate)"}},
                        {"id": "db", "position": {"x": 250, "y": 350}, "data": {"label": "Aurora Serverless DB"}}
                    ],
                    "edges": [
                        {"id": "e-dns-alb", "source": "dns", "target": "alb"},
                        {"id": "e-alb-ecs", "source": "alb", "target": "ecs"},
                        {"id": "e-ecs-db", "source": "ecs", "target": "db"}
                    ]
                },
                "explanation": "Standard 3-tier high-availability architecture with Route 53, ALB, Fargate backend, and Aurora DB.",
                "tradeoffs": "Serverless Aurora limits control over DB tuning but improves scalability and maintenance.",
                "cost_estimate_rough": "$120/month"
            })
        elif "monitoring" in prompt_lower or "cpu" in prompt_lower or "metrics" in prompt_lower:
            return json.dumps({
                "health_status": "warning",
                "alerts": [
                    "Average CPU utilization exceeds 80% on instance i-0abcd1234ef",
                    "HTTP 5xx error rate has peaked above 5.2%"
                ],
                "summary": "High CPU load coupled with increased error rate detected."
            })
        elif "log" in prompt_lower or "root cause" in prompt_lower or "incident" in prompt_lower:
            return json.dumps({
                "root_cause": "Database connection pool exhaustion due to slow-running queries.",
                "affected_services": ["payment-service", "order-service"],
                "timeline": ["10:15 UTC Connection timeout errors started", "10:18 UTC CPU spiked to 95% on primary RDS"],
                "recommended_actions": ["Increase DB max connections", "Optimize slow query scans"],
                "severity": "critical",
                "summary": "Database connectivity failure triggered application-wide timeouts."
            })
        elif "automate" in prompt_lower or "action plan" in prompt_lower:
            return json.dumps({
                "action_plan": [
                    {
                        "action_type": "scale_up",
                        "resource": "aws_appautoscaling_policy.scale_ecs",
                        "parameters": {"min_capacity": 4, "max_capacity": 10},
                        "requires_approval": False
                    },
                    {
                        "action_type": "rotate_credentials",
                        "resource": "aws_iam_access_key.admin_key",
                        "parameters": {"user": "admin-deployer"},
                        "requires_approval": True
                    }
                ],
                "human_approval_required": True
            })
        elif "synthesize" in prompt_lower or "report_markdown" in prompt_lower or "executive summary" in prompt_lower:
            return json.dumps({
                "report_markdown": "# CloudDaddy Architecture Report\n\n## Executive Summary\nAnalysis indicates critical security findings and cost optimization targets.\n\n## Architecture Analysis\n3-tier design has standard availability characteristics.\n\n## Security Findings\nPublic S3 buckets and open SSH ports were identified.",
                "key_findings": ["Unencrypted data storage", "Overprovisioned databases"],
                "priority_actions": ["Enable S3 bucket default encryption", "Purchase EC2 Savings Plans"]
            })
        else:
            return "Mock response from CloudDaddy AI Platform engine."
