import boto3
import json
import os
from app.utils.prompt_builder import get_system_prompt

class BedrockService:
    def __init__(self):
        self.client = boto3.client(
            service_name='bedrock-runtime',
            region_name=os.environ.get("AWS_REGION", "us-east-1")
        )

    def _get_fallback_architecture(self, prompt: str, platform: str = "AWS"):
        plat = platform.upper()
        if plat not in ["AWS", "GCP", "AZURE"]:
            plat = "AWS"
            
        prompt_lower = prompt.lower()
        
        # Color palettes for styling matching each cloud provider's premium aesthetic
        colors = {
            "AWS": {"primary": "#FF9900", "secondary": "#232F3E", "accent": "#4F46E5", "db": "#10B981", "storage": "#EF4444", "dns": "#D97706"},
            "GCP": {"primary": "#4285F4", "secondary": "#0F9D58", "accent": "#DB4437", "db": "#F4B400", "storage": "#4285F4", "dns": "#0F9D58"},
            "AZURE": {"primary": "#0078D4", "secondary": "#5C2D91", "accent": "#F25022", "db": "#00B0F0", "storage": "#7FBA00", "dns": "#0078D4"}
        }
        c = colors[plat]
        
        # Static Website / CDN
        if any(w in prompt_lower for w in ["static", "website", "s3", "frontend", "cdn"]):
            dns_lbl = "Route 53 (DNS)" if plat == "AWS" else ("Cloud DNS" if plat == "GCP" else "Azure DNS")
            cdn_lbl = "CloudFront CDN" if plat == "AWS" else ("Cloud CDN" if plat == "GCP" else "Azure Front Door CDN")
            storage_lbl = "S3 Static Hosting" if plat == "AWS" else ("Cloud Storage Hosting" if plat == "GCP" else "Azure Blob Web Hosting")
            ssl_lbl = "ACM (SSL/TLS)" if plat == "AWS" else ("Google Managed Certificate" if plat == "GCP" else "Azure App Service Certificate")
            
            nodes = [
                {"id": "dns", "position": {"x": 400, "y": 50}, "data": {"label": dns_lbl}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "cdn", "position": {"x": 100, "y": 200}, "data": {"label": cdn_lbl}, "style": {"background": c["primary"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "s3", "position": {"x": 400, "y": 200}, "data": {"label": storage_lbl}, "style": {"background": c["db"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "ssl", "position": {"x": 700, "y": 200}, "data": {"label": ssl_lbl}, "style": {"background": c["accent"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-dns-cdn", "source": "dns", "target": "cdn", "animated": True, "style": {"stroke": c["dns"]}},
                {"id": "e-cdn-s3", "source": "cdn", "target": "s3", "animated": True, "style": {"stroke": c["primary"]}},
                {"id": "e-ssl-cdn", "source": "ssl", "target": "cdn", "style": {"stroke": c["accent"], "strokeDasharray": "5,5"}},
            ]
            
            cost = {
                "total_monthly_cost": "$13.70" if plat == "GCP" else ("$15.10" if plat == "Azure" else "$13.70"),
                "services": [
                    {"name": dns_lbl, "monthly_cost": "$0.40" if plat == "GCP" else "$0.50", "breakdown": "DNS zone lookup costs"},
                    {"name": cdn_lbl, "monthly_cost": "$10.50" if plat == "GCP" else "$11.20", "breakdown": "100 GB egress global bandwidth"},
                    {"name": storage_lbl, "monthly_cost": "$2.80" if plat == "GCP" else "$3.40", "breakdown": "Static assets file storage space"}
                ]
            }
            
        # E-commerce / Complex Microservices
        elif any(w in prompt_lower for w in ["commerce", "shop", "store", "microservice", "order"]):
            auth_lbl = "Cognito Auth" if plat == "AWS" else ("Identity Platform Auth" if plat == "GCP" else "Entra ID Auth")
            gw_lbl = "API Gateway" if plat == "AWS" else ("Cloud API Gateway" if plat == "GCP" else "Azure API Management")
            comp1_lbl = "Products Lambda" if plat == "AWS" else ("Products Cloud Run" if plat == "GCP" else "Products Container App")
            comp2_lbl = "Orders Lambda" if plat == "AWS" else ("Orders Cloud Run" if plat == "GCP" else "Orders Container App")
            db1_lbl = "DynamoDB Products" if plat == "AWS" else ("Firestore Products" if plat == "GCP" else "Cosmos DB Products")
            db2_lbl = "DynamoDB Orders" if plat == "AWS" else ("Firestore Orders" if plat == "GCP" else "Cosmos DB Orders")
            
            nodes = [
                {"id": "client", "position": {"x": 400, "y": 50}, "data": {"label": "React Web App"}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "cognito", "position": {"x": 100, "y": 200}, "data": {"label": auth_lbl}, "style": {"background": c["accent"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "api", "position": {"x": 400, "y": 200}, "data": {"label": gw_lbl}, "style": {"background": c["primary"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda_prod", "position": {"x": 100, "y": 350}, "data": {"label": comp1_lbl}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda_order", "position": {"x": 400, "y": 350}, "data": {"label": comp2_lbl}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db_prod", "position": {"x": 100, "y": 500}, "data": {"label": db1_lbl}, "style": {"background": c["db"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db_order", "position": {"x": 400, "y": 500}, "data": {"label": db2_lbl}, "style": {"background": c["db"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-api", "source": "client", "target": "api", "animated": True, "style": {"stroke": c["dns"]}},
                {"id": "e-client-auth", "source": "client", "target": "cognito", "style": {"stroke": c["accent"], "strokeDasharray": "3,3"}},
                {"id": "e-api-prod", "source": "api", "target": "lambda_prod", "animated": True, "style": {"stroke": c["primary"]}},
                {"id": "e-api-order", "source": "api", "target": "lambda_order", "animated": True, "style": {"stroke": c["primary"]}},
                {"id": "e-prod-db", "source": "lambda_prod", "target": "db_prod", "style": {"stroke": c["dns"]}},
                {"id": "e-order-db", "source": "lambda_order", "target": "db_order", "style": {"stroke": c["dns"]}},
            ]
            
            cost = {
                "total_monthly_cost": "$96.00" if plat == "GCP" else ("$104.50" if plat == "Azure" else "$89.50"),
                "services": [
                    {"name": auth_lbl, "monthly_cost": "$0.00", "breakdown": "Free Tier for first 50k MAUs"},
                    {"name": gw_lbl, "monthly_cost": "$4.00", "breakdown": "Based on 1.2 million requests"},
                    {"name": comp1_lbl + " / " + comp2_lbl, "monthly_cost": "$32.00", "breakdown": "Active compute cores scaling"},
                    {"name": db1_lbl + " / " + db2_lbl, "monthly_cost": "$60.00", "breakdown": "Multi-region replicated database tier"}
                ]
            }
            
        # Real-time / Messaging / WebSockets
        elif any(w in prompt_lower for w in ["chat", "realtime", "real-time", "websocket", "message"]):
            gw_lbl = "API Gateway (WebSockets)" if plat == "AWS" else ("Cloud API Gateway" if plat == "GCP" else "Azure API Management")
            comp_lbl = "WebSocket Manager (Lambda)" if plat == "AWS" else ("WebSocket Manager (Cloud Run)" if plat == "GCP" else "WebSocket Manager (Container Apps)")
            redis_lbl = "ElastiCache Redis" if plat == "AWS" else ("Memorystore for Redis" if plat == "GCP" else "Azure Cache for Redis")
            db_lbl = "DynamoDB (Sessions)" if plat == "AWS" else ("Firestore (Sessions)" if plat == "GCP" else "Cosmos DB (Sessions)")
            
            nodes = [
                {"id": "client", "position": {"x": 400, "y": 50}, "data": {"label": "Web Client"}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "api", "position": {"x": 400, "y": 200}, "data": {"label": gw_lbl}, "style": {"background": c["primary"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda", "position": {"x": 400, "y": 350}, "data": {"label": comp_lbl}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "redis", "position": {"x": 100, "y": 500}, "data": {"label": redis_lbl}, "style": {"background": c["accent"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db", "position": {"x": 400, "y": 500}, "data": {"label": db_lbl}, "style": {"background": c["db"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-api", "source": "client", "target": "api", "animated": True, "style": {"stroke": c["dns"]}},
                {"id": "e-api-lambda", "source": "api", "target": "lambda", "animated": True, "style": {"stroke": c["primary"]}},
                {"id": "e-lambda-redis", "source": "lambda", "target": "redis", "style": {"stroke": c["accent"]}},
                {"id": "e-lambda-db", "source": "lambda", "target": "db", "style": {"stroke": c["db"]}},
            ]
            
            cost = {
                "total_monthly_cost": "$65.00" if plat == "GCP" else ("$78.00" if plat == "Azure" else "$68.50"),
                "services": [
                    {"name": gw_lbl, "monthly_cost": "$6.50", "breakdown": "WebSocket active connections fee"},
                    {"name": comp_lbl, "monthly_cost": "$15.00", "breakdown": "Stateless socket event processing compute"},
                    {"name": redis_lbl, "monthly_cost": "$29.00", "breakdown": "Basic cache instance class for socket routing"},
                    {"name": db_lbl, "monthly_cost": "$18.00", "breakdown": "Active connection states database lookup"}
                ]
            }
            
        # Monolith / Traditional VM hosting
        elif any(w in prompt_lower for w in ["monolith", "legacy", "vm", "ec2", "server", "rds"]):
            alb_lbl = "Application Load Balancer" if plat == "AWS" else ("Cloud Load Balancing" if plat == "GCP" else "Azure Application Gateway")
            comp_lbl = "EC2 Autoscaling Group" if plat == "AWS" else ("Compute Engine Managed Instance Group" if plat == "GCP" else "Azure Virtual Machine Scale Sets")
            db_lbl = "RDS Postgres (Multi-AZ)" if plat == "AWS" else ("Cloud SQL Postgres" if plat == "GCP" else "Azure Database for PostgreSQL")
            
            nodes = [
                {"id": "client", "position": {"x": 400, "y": 50}, "data": {"label": "Web Client"}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "alb", "position": {"x": 400, "y": 200}, "data": {"label": alb_lbl}, "style": {"background": c["primary"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "ec2", "position": {"x": 400, "y": 350}, "data": {"label": comp_lbl}, "style": {"background": c["accent"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "rds", "position": {"x": 400, "y": 500}, "data": {"label": db_lbl}, "style": {"background": c["db"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-alb", "source": "client", "target": "alb", "animated": True, "style": {"stroke": c["dns"]}},
                {"id": "e-alb-ec2", "source": "alb", "target": "ec2", "animated": True, "style": {"stroke": c["primary"]}},
                {"id": "e-ec2-rds", "source": "ec2", "target": "rds", "style": {"stroke": c["db"]}},
            ]
            
            cost = {
                "total_monthly_cost": "$83.50" if plat == "GCP" else ("$98.20" if plat == "Azure" else "$87.40"),
                "services": [
                    {"name": alb_lbl, "monthly_cost": "$18.00" if plat == "GCP" else "$22.00", "breakdown": "Incoming connections high availability routing"},
                    {"name": comp_lbl, "monthly_cost": "$32.00", "breakdown": "2x virtual machine active scaling cores"},
                    {"name": db_lbl, "monthly_cost": "$33.50" if plat == "GCP" else "$42.00", "breakdown": "Managed relational multi-AZ SQL instance with 10 GB backup space"}
                ]
            }
            
        # Default Serverless Stack
        else:
            gw_lbl = "API Gateway" if plat == "AWS" else ("Cloud API Gateway" if plat == "GCP" else "Azure API Management")
            comp_lbl = "AWS Lambda (Backend)" if plat == "AWS" else ("Cloud Run (Backend)" if plat == "GCP" else "Azure Container Apps (Backend)")
            db_lbl = "DynamoDB Database" if plat == "AWS" else ("Cloud SQL Database" if plat == "GCP" else "Cosmos DB Database")
            storage_lbl = "S3 Storage Bucket" if plat == "AWS" else ("Cloud Storage Bucket" if plat == "GCP" else "Azure Blob Storage")
            
            nodes = [
                {"id": "client", "position": {"x": 400, "y": 50}, "data": {"label": "Web Client (React)"}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "api", "position": {"x": 400, "y": 200}, "data": {"label": gw_lbl}, "style": {"background": c["primary"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "lambda", "position": {"x": 400, "y": 350}, "data": {"label": comp_lbl}, "style": {"background": c["dns"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "db", "position": {"x": 100, "y": 500}, "data": {"label": db_lbl}, "style": {"background": c["db"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
                {"id": "s3", "position": {"x": 400, "y": 500}, "data": {"label": storage_lbl}, "style": {"background": c["accent"], "color": "#fff", "border": "none", "borderRadius": "8px", "padding": "10px 20px", "fontWeight": "bold"}},
            ]
            edges = [
                {"id": "e-client-api", "source": "client", "target": "api", "animated": True, "style": {"stroke": c["dns"]}},
                {"id": "e-api-lambda", "source": "api", "target": "lambda", "animated": True, "style": {"stroke": c["primary"]}},
                {"id": "e-lambda-db", "source": "lambda", "target": "db", "animated": True, "style": {"stroke": c["db"]}},
                {"id": "e-lambda-s3", "source": "lambda", "target": "s3", "animated": True, "style": {"stroke": c["accent"]}},
            ]
            
            cost = {
                "total_monthly_cost": "$56.00" if plat == "GCP" else ("$65.80" if plat == "Azure" else "$52.40"),
                "services": [
                    {"name": gw_lbl, "monthly_cost": "$3.50", "breakdown": "REST API gateway calls routing"},
                    {"name": comp_lbl, "monthly_cost": "$12.00", "breakdown": "Stateless serverless compute scaling"},
                    {"name": db_lbl, "monthly_cost": "$31.80" if plat == "GCP" else "$42.00", "breakdown": "Managed database storage resources"},
                    {"name": storage_lbl, "monthly_cost": "$5.10" if plat == "GCP" else "$8.30", "breakdown": "Object file storage space"}
                ]
            }
            
        return {"nodes": nodes, "edges": edges, "cost": cost}

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

    def generate_architecture(self, prompt: str, platform: str = "AWS", history: list = None):
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        
        context_str = ""
        if history and len(history) > 0:
            context_str = "Conversation Context:\n"
            for msg in history:
                role = "User" if not msg.get("isBot") else "Assistant (Cloudy AI)"
                context_str += f"- {role}: {msg.get('text')}\n"
            context_str += "\nNew requirement based on history:\n"

        full_user_prompt = f"{context_str}Design a highly available and cost-optimized {platform} architecture for: {prompt}"
        system_prompt = get_system_prompt(platform)
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": full_user_prompt
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
                return self._get_fallback_architecture(prompt, platform)
                
        except Exception as e:
            print(f"Error invoking Bedrock: {e}. Using dynamic fallback service.")
            return self._get_fallback_architecture(prompt, platform)

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

