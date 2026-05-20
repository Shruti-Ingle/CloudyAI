import os
import json
import urllib.request
import urllib.error
import re

class OllamaService:
    def __init__(self):
        # Read from environment variables, fallback to local Ollama port
        self.base_url = os.environ.get("OLLAMA_BASE_URL") or os.environ.get("OLLAMA_HOST") or "http://localhost:11434"
        self.base_url = self.base_url.rstrip("/")
        
        # Configurable default model, fallback to gemma3
        self.default_model = os.environ.get("OLLAMA_MODEL", "gemma3")

    def _get_active_model(self):
        # Attempt to dynamically query `/api/tags` to find any locally pulled model
        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/tags",
                method="GET"
            )
            with urllib.request.urlopen(req, timeout=3) as response:
                res = json.loads(response.read().decode('utf-8'))
                models = res.get("models", [])
                if models:
                    return models[0]["name"]
        except Exception as e:
            print(f"OllamaService failed to fetch active models from /api/tags: {e}")
        
        return self.default_model

    def _call_ollama(self, messages, system_prompt=None, require_json=False):
        active_model = self._get_active_model()
        payload_messages = []
        if system_prompt:
            payload_messages.append({"role": "system", "content": system_prompt})
        payload_messages.extend(messages)

        payload = {
            "model": active_model,
            "messages": payload_messages,
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }

        if require_json:
            payload["format"] = "json"

        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            # Set a 25-second timeout for local generation
            with urllib.request.urlopen(req, timeout=25) as response:
                res_body = response.read().decode('utf-8')
                res_json = json.loads(res_body)
                content = res_json['message']['content'].strip()
                
                # Strip out any <think>...</think> reasoning blocks if using DeepSeek-R1
                content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
                return content
        except Exception as e:
            print(f"Ollama chat call failed on {active_model}: {e}")
            raise e

    def generate_architecture(self, prompt: str, platform: str = "AWS", history: list = None):
        context_str = ""
        if history:
            context_str = "Conversation Context:\n"
            for msg in history:
                role = "User" if not msg.get("isBot") else "Assistant (Cloudy AI)"
                context_str += f"- {role}: {msg.get('text')}\n"
            context_str += "\nNew requirement based on history:\n"

        full_prompt = f"{context_str}Design a highly available and cost-optimized {platform} architecture for: {prompt}"

        system_prompt = (
            f"You are an expert cloud architect specialized in {platform}. Your task is to design a cost-optimized, "
            f"highly available cloud architecture on {platform} based on the user's request. You must output ONLY a valid "
            "JSON object containing 'nodes', 'edges', and 'cost' details. Do not include any explanations, markdown code blocks, "
            "or text outside the JSON.\n\n"
            "Layout Rules (CRITICAL to prevent overlap):\n"
            "1. Give nodes at least 250px vertical spacing and 300px horizontal spacing.\n"
            "2. Establish a clear top-to-bottom layout:\n"
            "   - Clients or DNS at y: 50\n"
            "   - Gateways or CDNs at y: 200\n"
            "   - Compute, Logic, or Containers at y: 350\n"
            "   - Storage, Queues, or Databases at y: 500\n"
            "3. If there are multiple nodes at the same tier, space them horizontally (e.g. x: 100, x: 400, x: 700).\n\n"
            "Cost Estimation:\n"
            "Provide realistic monthly cost details for all services.\n\n"
            "Example structure:\n"
            "{\n"
            "  \"nodes\": [\n"
            "    {\"id\": \"1\", \"data\": {\"label\": \"React Frontend\"}, \"position\": {\"x\": 400, \"y\": 50}},\n"
            "    {\"id\": \"2\", \"data\": {\"label\": \"API Gateway\"}, \"position\": {\"x\": 400, \"y\": 200}},\n"
            "    {\"id\": \"3\", \"data\": {\"label\": \"Lambda Function\"}, \"position\": {\"x\": 400, \"y\": 350}},\n"
            "    {\"id\": \"4\", \"data\": {\"label\": \"DynamoDB Table\"}, \"position\": {\"x\": 400, \"y\": 500}}\n"
            "  ],\n"
            "  \"edges\": [\n"
            "    {\"id\": \"e1-2\", \"source\": \"1\", \"target\": \"2\"},\n"
            "    {\"id\": \"e2-3\", \"source\": \"2\", \"target\": \"3\"},\n"
            "    {\"id\": \"e3-4\", \"source\": \"3\", \"target\": \"4\"}\n"
            "  ],\n"
            "  \"cost\": {\n"
            "    \"total_monthly_cost\": \"$15.20\",\n"
            "    \"services\": [\n"
            "      {\"name\": \"API Gateway\", \"monthly_cost\": \"$3.50\", \"breakdown\": \"Based on 1M requests per month ($3.50/million)\"},\n"
            "      {\"name\": \"AWS Lambda\", \"monthly_cost\": \"$0.20\", \"breakdown\": \"1M executions with free tier covering compute time\"},\n"
            "      {\"name\": \"Amazon DynamoDB\", \"monthly_cost\": \"$11.50\", \"breakdown\": \"25 GB storage and provisioned capacity\"}\n"
            "    ]\n"
            "  }\n"
            "}"
        )

        try:
            res_text = self._call_ollama(
                messages=[{"role": "user", "content": full_prompt}],
                system_prompt=system_prompt,
                require_json=True
            )
            # Make sure we clean up any non-JSON wrappers if the local model outputted markdown blocks
            res_text = re.sub(r'^```json\s*', '', res_text)
            res_text = re.sub(r'\s*```$', '', res_text)
            return json.loads(res_text.strip())
        except Exception as e:
            print(f"Ollama generate architecture failed: {e}")
            return {"error": str(e)}

    def generate_chat_response(self, user_message: str, history: list, platform: str = "AWS", question_index: int = None):
        # Structured sequence of 10 essential architect questions
        QUESTIONS = {
            "AWS": [
                "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
                "How would you like to host and deliver your frontend client? (e.g. static S3 + CloudFront CDN for super-fast global delivery, or server-side rendered on AWS Amplify/App Runner?)",
                "What compute tier fits your backend business logic best? (e.g. Serverless AWS Lambda for zero-idle scaling, containerized Amazon ECS/EKS for constant loads, or EC2 VMs?)",
                "What kind of database fits your data model? (e.g. Relational Postgres/MySQL via Amazon RDS/Aurora, or high-throughput NoSQL via DynamoDB?)",
                "How will clients communicate with your backend? (e.g. REST API via Amazon API Gateway, or GraphQL via AWS AppSync?)",
                "How would you like to handle user registration, logins, and JWT token validation? (e.g. Serverless AWS Cognito user pools, or custom OAuth/Auth0?)",
                "Does your application require persistent object storage for files, media, or backups? (e.g. Amazon S3 buckets, or shared Elastic File System?)",
                "Do you need a low-latency caching layer to speed up database read operations? (e.g. ElastiCache Redis/Memcached, or standard DB read replicas?)",
                "What level of network security do you require? (e.g. placing resources in private subnets, enabling AWS WAF firewall, or KMS key encryption?)",
                "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, AWS CloudFormation/CDK, or standard GitHub Actions pipelines?)"
            ],
            "GCP": [
                "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
                "How would you like to host and deliver your frontend client? (e.g. Firebase Hosting + Cloud CDN, or server-side rendered on Cloud Run?)",
                "What compute tier fits your backend business logic best? (e.g. Serverless Cloud Run / Cloud Functions, containerized Google Kubernetes Engine (GKE), or Compute Engine VMs?)",
                "What kind of database fits your data model? (e.g. Relational Postgres/MySQL via Cloud SQL/Spanner, or high-throughput NoSQL via Firestore/Bigtable?)",
                "How will clients communicate with your backend? (e.g. Google Cloud API Gateway, or direct Cloud Run URLs?)",
                "How would you like to handle user registration, logins, and JWT token validation? (e.g. Google Identity Platform / Firebase Auth, or custom OAuth?)",
                "Does your application require persistent object storage for files, media, or backups? (e.g. Cloud Storage buckets?)",
                "Do you need a low-latency caching layer to speed up database read operations? (e.g. Memorystore Redis/Memcached?)",
                "What level of network security do you require? (e.g. Cloud Armor WAF firewall, VPC Service Controls, or Cloud KMS encryption?)",
                "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, Cloud Build, or standard GitHub Actions?)"
            ],
            "Azure": [
                "What is the expected scale or active user base of your system? (e.g. thousands of monthly active users, or daily peaks, to help us size your resources properly?)",
                "How would you like to host and deliver your frontend client? (e.g. Azure Static Web Apps + Front Door CDN, or App Service?)",
                "What compute tier fits your backend business logic best? (e.g. Serverless Azure Functions, containerized Azure Container Apps / Azure Kubernetes Service (AKS), or App Service?)",
                "What kind of database fits your data model? (e.g. Relational Azure SQL / Database for PostgreSQL, or high-throughput NoSQL via Cosmos DB?)",
                "How will clients communicate with your backend? (e.g. Azure API Management (APIM), or Application Gateway?)",
                "How would you like to handle user registration, logins, and JWT token validation? (e.g. Microsoft Entra ID / B2C, or custom OAuth?)",
                "Does your application require persistent object storage for files, media, or backups? (e.g. Azure Blob Storage?)",
                "Do you need a low-latency caching layer to speed up database read operations? (e.g. Azure Cache for Redis?)",
                "What level of network security do you require? (e.g. Azure WAF firewall, Key Vault, or private endpoints?)",
                "How do you plan to manage deployment and Infrastructure as Code? (e.g. Terraform, Azure Bicep/ARM, or Azure Pipelines/GitHub Actions?)"
            ]
        }

        questions_list = QUESTIONS.get(platform, QUESTIONS["AWS"])
        
        # Override calculation if question_index is explicitly provided from frontend
        if question_index is not None:
            num_user_messages = question_index
        else:
            num_user_messages = sum(1 for msg in history if not msg.get("isBot")) if history else 0

        history_str = ""
        if history:
            for msg in history:
                role = "Cloudy AI" if msg.get("isBot") else "User"
                history_str += f"{role}: {msg.get('text')}\n"

        if num_user_messages < len(questions_list):
            current_question = questions_list[num_user_messages]
            system_prompt = (
                f"You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in {platform}.\n"
                "The user is designing a cloud application. Your role is to have a natural, professional conversation to understand "
                "their needs and help them refine their architecture.\n\n"
                "Rules:\n"
                "1. Be friendly, conversational, and highly technical.\n"
                "2. Keep your response brief and to the point (maximum 2 sentences).\n"
                "3. Intelligently acknowledge the user's latest choice/message with expert technical insight.\n"
                f"4. At the end of your response, ask this EXACT question: '{current_question}'\n"
                "5. Do NOT ask any other questions. Do NOT output any JSON, YAML, code blocks, or diagram structures."
            )
            prompt = f"Conversation history:\n{history_str}User: {user_message}\n\nInstruction: Acknowledge user's input with brief tech insights, and then ask Question #{num_user_messages + 1}: '{current_question}'\n\nGenerate your technical response:"
        else:
            system_prompt = (
                f"You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in {platform}.\n"
                "The user is designing a cloud application.\n\n"
                "Rules:\n"
                "1. Be friendly, conversational, and highly technical.\n"
                "2. Keep your response brief and to the point (maximum 2 sentences).\n"
                "3. Let the user know that you have gathered all standard architectural inputs. Suggest that they can mention any additional requirements, or click the 'Generate Architecture' button below to create their design.\n"
                "4. Do NOT ask any new questions. Do NOT output any JSON, YAML, code blocks, or diagram structures."
            )
            prompt = f"Conversation history:\n{history_str}User: {user_message}\n\nInstruction: Acknowledge user's input, let them know onboarding is complete, and suggest they click 'Generate Architecture' or mention additional requests.\n\nGenerate your technical response:"

        try:
            res_text = self._call_ollama(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=system_prompt
            )
            return {"reply": res_text}
        except Exception as e:
            print(f"Ollama chat failed: {e}")

            return {"reply": "I encountered a minor connection issue. Tell me more about your requirements or click Generate Architecture whenever you are ready!"}

    def analyse_architecture(self, architecture_data: str):
        system_prompt = (
            "You are an expert cloud architect. Analyze the provided architecture and return a JSON object with "
            "'issues' (a list of objects with 'severity', 'title', 'description', and 'suggestion') and "
            "'suggested_nodes' and 'suggested_edges' arrays for React Flow representing the improved architecture. "
            "Do not include any explanations, markdown code blocks, or text outside the JSON.\n\n"
            "Example structure:\n"
            "{\n"
            "  \"issues\": [\n"
            "    {\n"
            "      \"severity\": \"high\",\n"
            "      \"title\": \"Single Point of Failure\",\n"
            "      \"description\": \"The database is deployed in a single availability zone without replication.\",\n"
            "      \"suggestion\": \"Enable multi-AZ deployment for high availability.\"\n"
            "    }\n"
            "  ],\n"
            "  \"suggested_nodes\": [],\n"
            "  \"suggested_edges\": []\n"
            "}"
        )

        prompt = f"Analyze this architecture and suggest improvements: {architecture_data}"

        try:
            res_text = self._call_ollama(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=system_prompt,
                require_json=True
            )
            res_text = re.sub(r'^```json\s*', '', res_text)
            res_text = re.sub(r'\s*```$', '', res_text)
            return json.loads(res_text.strip())
        except Exception as e:
            print(f"Ollama analysis failed: {e}")
            return {"error": str(e)}
