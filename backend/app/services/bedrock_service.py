import boto3
import json
import os

class BedrockService:
    def __init__(self):
        self.client = boto3.client(
            service_name='bedrock-runtime',
            region_name=os.environ.get("AWS_REGION", "us-east-1")
        )

    def _get_fallback_architecture(self, prompt: str):
        prompt_lower = prompt.lower()
        
        # Static Website / CDN
        if any(w in prompt_lower for w in ["static", "website", "s3", "frontend", "cdn"]):
            nodes = [
                {"id": "dns", "position": {"x": 250, "y": 50}, "data": {"label": "Route 53 (DNS)"}, "style": {"background": "#D97706", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "cdn", "position": {"x": 250, "y": 150}, "data": {"label": "CloudFront CDN"}, "style": {"background": "#4F46E5", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "s3", "position": {"x": 250, "y": 250}, "data": {"label": "S3 Static Hosting"}, "style": {"background": "#10B981", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "ssl", "position": {"x": 420, "y": 150}, "data": {"label": "ACM (SSL/TLS)"}, "style": {"background": "#6366F1", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-dns-cdn", "source": "dns", "target": "cdn", "animated": True, "style": {"stroke": "#D97706"}},
                {"id": "e-cdn-s3", "source": "cdn", "target": "s3", "animated": True, "style": {"stroke": "#4F46E5"}},
                {"id": "e-ssl-cdn", "source": "ssl", "target": "cdn", "style": {"stroke": "#6366F1", "strokeDasharray": "5,5"}},
            ]
            
        # E-commerce / Complex Microservices
        elif any(w in prompt_lower for w in ["commerce", "shop", "store", "microservice", "order"]):
            nodes = [
                {"id": "client", "position": {"x": 250, "y": 50}, "data": {"label": "React Web App"}, "style": {"background": "#4F46E5", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "cognito", "position": {"x": 450, "y": 150}, "data": {"label": "Cognito Auth"}, "style": {"background": "#6366F1", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "api", "position": {"x": 250, "y": 150}, "data": {"label": "API Gateway"}, "style": {"background": "#06B6D4", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda_prod", "position": {"x": 100, "y": 250}, "data": {"label": "Products Lambda"}, "style": {"background": "#F59E0B", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda_order", "position": {"x": 250, "y": 250}, "data": {"label": "Orders Lambda"}, "style": {"background": "#F59E0B", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db_prod", "position": {"x": 100, "y": 350}, "data": {"label": "DynamoDB Products"}, "style": {"background": "#10B981", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db_order", "position": {"x": 250, "y": 350}, "data": {"label": "DynamoDB Orders"}, "style": {"background": "#10B981", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-api", "source": "client", "target": "api", "animated": True, "style": {"stroke": "#4F46E5"}},
                {"id": "e-client-auth", "source": "client", "target": "cognito", "style": {"stroke": "#6366F1", "strokeDasharray": "3,3"}},
                {"id": "e-api-prod", "source": "api", "target": "lambda_prod", "animated": True, "style": {"stroke": "#06B6D4"}},
                {"id": "e-api-order", "source": "api", "target": "lambda_order", "animated": True, "style": {"stroke": "#06B6D4"}},
                {"id": "e-prod-db", "source": "lambda_prod", "target": "db_prod", "style": {"stroke": "#F59E0B"}},
                {"id": "e-order-db", "source": "lambda_order", "target": "db_order", "style": {"stroke": "#F59E0B"}},
            ]
            
        # Real-time / Messaging / WebSockets
        elif any(w in prompt_lower for w in ["chat", "realtime", "real-time", "websocket", "message"]):
            nodes = [
                {"id": "client", "position": {"x": 250, "y": 50}, "data": {"label": "Web Client"}, "style": {"background": "#4F46E5", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "api", "position": {"x": 250, "y": 150}, "data": {"label": "API Gateway (WebSockets)"}, "style": {"background": "#06B6D4", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda", "position": {"x": 250, "y": 250}, "data": {"label": "WebSocket Manager (Lambda)"}, "style": {"background": "#F59E0B", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "redis", "position": {"x": 420, "y": 250}, "data": {"label": "ElastiCache Redis"}, "style": {"background": "#EF4444", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db", "position": {"x": 250, "y": 350}, "data": {"label": "DynamoDB (Sessions)"}, "style": {"background": "#10B981", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-api", "source": "client", "target": "api", "animated": True, "style": {"stroke": "#4F46E5"}},
                {"id": "e-api-lambda", "source": "api", "target": "lambda", "animated": True, "style": {"stroke": "#06B6D4"}},
                {"id": "e-lambda-redis", "source": "lambda", "target": "redis", "style": {"stroke": "#F59E0B"}},
                {"id": "e-lambda-db", "source": "lambda", "target": "db", "style": {"stroke": "#F59E0B"}},
            ]
            
        # Monolith / Traditional VM hosting
        elif any(w in prompt_lower for w in ["monolith", "legacy", "vm", "ec2", "server", "rds"]):
            nodes = [
                {"id": "client", "position": {"x": 250, "y": 50}, "data": {"label": "Web Client"}, "style": {"background": "#4F46E5", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "alb", "position": {"x": 250, "y": 150}, "data": {"label": "Application Load Balancer"}, "style": {"background": "#06B6D4", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "ec2", "position": {"x": 250, "y": 250}, "data": {"label": "EC2 Autoscaling Group"}, "style": {"background": "#EF4444", "color": "#fff", "border": "2px solid #991B1B", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "rds", "position": {"x": 250, "y": 350}, "data": {"label": "RDS Postgres (Multi-AZ)"}, "style": {"background": "#10B981", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-alb", "source": "client", "target": "alb", "animated": True, "style": {"stroke": "#4F46E5"}},
                {"id": "e-alb-ec2", "source": "alb", "target": "ec2", "animated": True, "style": {"stroke": "#06B6D4"}},
                {"id": "e-ec2-rds", "source": "ec2", "target": "rds", "style": {"stroke": "#475569"}},
            ]
            
        # Default Serverless Stack
        else:
            nodes = [
                {"id": "client", "position": {"x": 250, "y": 50}, "data": {"label": "Web Client (React)"}, "style": {"background": "#4F46E5", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "api", "position": {"x": 250, "y": 150}, "data": {"label": "API Gateway"}, "style": {"background": "#06B6D4", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda", "position": {"x": 250, "y": 250}, "data": {"label": "AWS Lambda (Backend)"}, "style": {"background": "#F59E0B", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db", "position": {"x": 150, "y": 350}, "data": {"label": "DynamoDB Database"}, "style": {"background": "#10B981", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "s3", "position": {"x": 350, "y": 350}, "data": {"label": "S3 Storage Bucket"}, "style": {"background": "#EF4444", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-api", "source": "client", "target": "api", "animated": True, "style": {"stroke": "#4F46E5"}},
                {"id": "e-api-lambda", "source": "api", "target": "lambda", "animated": True, "style": {"stroke": "#06B6D4"}},
                {"id": "e-lambda-db", "source": "lambda", "target": "db", "animated": True, "style": {"stroke": "#F59E0B"}},
                {"id": "e-lambda-s3", "source": "lambda", "target": "s3", "animated": True, "style": {"stroke": "#EF4444"}},
            ]
            
        return {"nodes": nodes, "edges": edges}

    def _get_fallback_analysis(self, architecture_data: str):
        # We can dynamically suggest standard cloud improvements
        issues = [
            {
                "severity": "Critical",
                "title": "Single Instance Dependency",
                "description": "The architecture shows resources grouped without auto-scaling or multi-AZ configuration.",
                "suggestion": "Implement an Auto Scaling Group and deploy across multiple Availability Zones with an ALB."
            },
            {
                "severity": "Warning",
                "title": "Uncached Database Reads",
                "description": "Database queries go directly to primary storage on all web requests.",
                "suggestion": "Introduce an Amazon ElastiCache (Redis) cluster or DAX layer to cache frequent queries."
            },
            {
                "severity": "Info",
                "title": "No Edge Caching / CDN",
                "description": "Static web pages or media resources are served directly from centralized hosting servers.",
                "suggestion": "Provision an Amazon CloudFront distribution to cache assets globally and reduce load times."
            }
        ]
        
        # Suggested improvement architecture nodes
        suggested_nodes = [
            {"id": "client", "position": {"x": 250, "y": 50}, "data": {"label": "Web Client"}, "style": {"background": "#4F46E5", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            {"id": "api", "position": {"x": 250, "y": 150}, "data": {"label": "API Gateway / ALB"}, "style": {"background": "#06B6D4", "color": "#fff", "border": "2px solid #164E63", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            {"id": "lambda", "position": {"x": 250, "y": 250}, "data": {"label": "Lambda / Auto-Scaling Compute"}, "style": {"background": "#10B981", "color": "#fff", "border": "2px solid #065F46", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            {"id": "db", "position": {"x": 250, "y": 350}, "data": {"label": "RDS/DynamoDB (Multi-AZ)"}, "style": {"background": "#10B981", "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
        ]
        
        suggested_edges = [
            {"id": "e1-2", "source": "client", "target": "api", "animated": True, "style": {"stroke": "#06B6D4"}},
            {"id": "e2-3", "source": "api", "target": "lambda", "animated": True, "style": {"stroke": "#10B981"}},
            {"id": "e3-4", "source": "lambda", "target": "db", "style": {"stroke": "#475569"}},
        ]
        
        return {
            "issues": issues,
            "suggested_nodes": suggested_nodes,
            "suggested_edges": suggested_edges
        }

    def generate_architecture(self, prompt: str):
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        
        system_prompt = "You are an expert cloud architect. Your task is to design a cost-optimized cloud architecture based on the user's request. You must output ONLY a valid JSON object containing 'nodes' and 'edges' arrays compatible with React Flow. Do not include any explanations, markdown code blocks, or text outside the JSON. Example structure: {\"nodes\": [{\"id\": \"1\", \"data\": {\"label\": \"App\"}, \"position\": {\"x\": 100, \"y\": 100}}], \"edges\": [{\"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\"}]}"
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": f"Design architecture for: {prompt}"
                }
            ]
        })

        try:
            response = self.client.invoke_model(
                body=body,
                modelId=model_id,
                accept="application/json",
                contentType="application/json"
            )
            
            response_body = json.loads(response.get('body').read())
            text_response = response_body['content'][0]['text']
            
            try:
                parsed_json = json.loads(text_response.strip())
                return parsed_json
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'```json\s*(.*?)\s*```', text_response, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(1).strip())
                return self._get_fallback_architecture(prompt)
                
        except Exception as e:
            print(f"Error invoking Bedrock: {e}. Using dynamic fallback service.")
            return self._get_fallback_architecture(prompt)

    def analyse_architecture(self, architecture_data: str):
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        
        system_prompt = "You are an expert cloud architect. Analyze the provided architecture and return a JSON object with 'issues' (list of objects with severity, title, description, suggestion) and 'suggested_nodes' and 'suggested_edges' arrays for React Flow. Do not include any explanations, markdown code blocks, or text outside the JSON."
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": f"Analyze this architecture: {architecture_data}"
                }
            ]
        })

        try:
            response = self.client.invoke_model(
                body=body,
                modelId=model_id,
                accept="application/json",
                contentType="application/json"
            )
            
            response_body = json.loads(response.get('body').read())
            text_response = response_body['content'][0]['text']
            
            try:
                return json.loads(text_response.strip())
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'```json\s*(.*?)\s*```', text_response, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(1).strip())
                return self._get_fallback_analysis(architecture_data)
                
        except Exception as e:
            print(f"Error invoking Bedrock: {e}. Using dynamic fallback service.")
            return self._get_fallback_analysis(architecture_data)

