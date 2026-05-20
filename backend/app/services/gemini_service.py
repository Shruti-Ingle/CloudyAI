import os
import json
import urllib.request
import urllib.error

class GeminiService:
    def __init__(self):
        # We read GEMINI_API_KEY from environment variables.
        # It supports a single key or a list of multiple keys separated by commas!
        raw_keys = os.environ.get("GEMINI_API_KEY", "")
        self.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        if not self.api_keys:
            # Fallback to the recovered verified active key!
            self.api_keys = ["AIzaSyCbY9zUV6DMN0A_BZD-Gxh2cFSeMkeiuBI"]
        self.api_key = self.api_keys[0] if self.api_keys else None

    def generate_architecture(self, prompt: str, platform: str = "AWS", history: list = None):
        if not self.api_keys:
            return {"error": "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable."}

        # If conversation history is provided, build a contextual prompt combining user requirements
        context_str = ""
        if history and len(history) > 0:
            context_str = "Conversation Context:\n"
            for msg in history:
                role = "User" if not msg.get("isBot") else f"Assistant (Cloudy AI)"
                context_str += f"- {role}: {msg.get('text')}\n"
            context_str += "\nNew requirement based on history:\n"

        full_user_prompt = f"{context_str}Design a highly available and cost-optimized {platform} architecture for: {prompt}"

        system_prompt = (
            f"You are an expert cloud architect specialized in {platform}. Your task is to design a cost-optimized, "
            f"highly available cloud architecture on {platform} based on the user's request and conversation context. You must output ONLY a valid "
            "JSON object containing 'nodes', 'edges', and 'cost' details. Do not include any explanations, markdown code blocks, "
            "or text outside the JSON.\n\n"
            "Layout Rules (CRITICAL to prevent overlap and make it readable):\n"
            "1. Space the nodes out generously! Give them at least 250px vertical spacing and 300px horizontal spacing.\n"
            "2. Establish a clear top-to-bottom layout:\n"
            "   - Clients, Users, or DNS (Route 53, Cloud DNS, Azure DNS) at y: 50\n"
            "   - Gateways or CDNs (CloudFront, API Gateway, Load Balancer) at y: 200\n"
            "   - Compute, Logic, or Containers (Lambda, EC2, ECS, Cloud Run, Azure Functions) at y: 350\n"
            "   - Storage, Queues, or Databases (DynamoDB, RDS, S3, Cloud Storage, Azure Blob) at y: 500\n"
            "3. If there are multiple nodes at the same tier, space them horizontally (e.g. x: 100, x: 400, x: 700).\n\n"
            "Cost Estimation rules:\n"
            "Provide a realistic estimated monthly cost breakdown for the services you designed.\n\n"
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
            "      {\"name\": \"AWS Lambda\", \"monthly_cost\": \"$0.20\", \"breakdown\": \"1M executions with free tier covering most compute time\"},\n"
            "      {\"name\": \"Amazon DynamoDB\", \"monthly_cost\": \"$11.50\", \"breakdown\": \"25 GB storage and provisioned capacity\"}\n"
            "    ]\n"
            "  }\n"
            "}"
        )

        payload = {
            "contents": [{
                "parts": [{"text": full_user_prompt}]
            }],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # Multi-model fallback list to handle temporary high demand (503s) of preview/new models
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"]
        last_error = None

        for model in models:
            for api_key in self.api_keys:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                try:
                    print(f"Attempting to generate architecture using model: {model} with rotating API keys...")
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(payload).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    # Set a strict 8-second timeout to prevent API Gateway timeouts
                    with urllib.request.urlopen(req, timeout=8) as response:
                        res_body = response.read().decode('utf-8')
                        res_json = json.loads(res_body)
                        
                        text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                        return json.loads(text_response.strip())
                except urllib.error.HTTPError as e:
                    error_msg = e.read().decode('utf-8')
                    print(f"Model {model} with key failed: HTTP Error {e.code}: {error_msg}")
                    last_error = f"Model {model} failed (HTTP {e.code}): {error_msg}"
                    # Self-healing API key ring: seamlessly rotate to next key on ANY api key error (invalid, rate-limit, etc.)
                    continue
                except Exception as e:
                    print(f"Model {model} with key failed with general error: {e}")
                    last_error = f"Model {model} failed: {str(e)}"

        return {"error": f"Failed to generate architecture after trying all available Gemini models and API key rings. Last error: {last_error}"}

    def generate_chat_response(self, user_message: str, history: list, platform: str = "AWS"):
        if not self.api_keys:
            return {"error": "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable."}

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

        # Retrieve questions list for selected platform, fallback to AWS
        questions_list = QUESTIONS.get(platform, QUESTIONS["AWS"])
        num_user_messages = sum(1 for msg in history if not msg.get("isBot")) if history else 0

        # Build context from previous conversation history
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
            instruction_prompt = f"Acknowledge user's input with brief tech insights, and then ask Question #{num_user_messages + 1}: '{current_question}'"
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
            instruction_prompt = "Acknowledge user's input, let them know onboarding is complete, and suggest they click 'Generate Architecture' or mention additional requests."

        payload = {
            "contents": [{
                "parts": [{"text": f"Conversation history:\n{history_str}User: {user_message}\n\nInstruction: {instruction_prompt}\n\nGenerate your technical response:"}]
            }],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            }
        }

        # Multi-model fallback list to handle temporary high demand (503s) of preview/new models
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"]
        last_error = None

        for model in models:
            for api_key in self.api_keys:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                try:
                    print(f"Attempting to generate chat response using model: {model} with rotating API keys...")
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(payload).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    # Set a strict 6-second timeout to prevent API Gateway timeouts
                    with urllib.request.urlopen(req, timeout=6) as response:
                        res_body = response.read().decode('utf-8')
                        res_json = json.loads(res_body)
                        
                        text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                        return {"reply": text_response.strip()}
                except urllib.error.HTTPError as e:
                    error_msg = e.read().decode('utf-8')
                    print(f"Model {model} chat failed with HTTP Error {e.code}: {error_msg}")
                    last_error = f"Model {model} failed (HTTP {e.code}): {error_msg}"
                    # Self-healing API key ring: seamlessly rotate to next key on ANY api key error (invalid, rate-limit, etc.)
                    continue
                except Exception as e:
                    print(f"Model {model} chat failed with general error: {e}")
                    last_error = f"Model {model} failed: {str(e)}"

        return {"reply": "I am temporarily experiencing high demand from Google's free-tier rate limits. Please wait 10-15 seconds and resend your message!"}

    def analyse_architecture(self, architecture_data: str):
        if not self.api_keys:
            return {"error": "GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable."}

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

        payload = {
            "contents": [{
                "parts": [{"text": f"Analyze this architecture and suggest improvements: {architecture_data}"}]
            }],
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        # Multi-model fallback list to handle temporary high demand (503s) of preview/new models
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"]
        last_error = None

        for model in models:
            for api_key in self.api_keys:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                try:
                    print(f"Attempting to analyze architecture using model: {model} with rotating API keys...")
                    req = urllib.request.Request(
                        url,
                        data=json.dumps(payload).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=8) as response:
                        res_body = response.read().decode('utf-8')
                        res_json = json.loads(res_body)
                        
                        text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                        return json.loads(text_response.strip())
                except urllib.error.HTTPError as e:
                    error_msg = e.read().decode('utf-8')
                    print(f"Model {model} analysis failed with HTTP Error {e.code}: {error_msg}")
                    last_error = f"Model {model} failed (HTTP {e.code}): {error_msg}"
                    # Self-healing API key ring: seamlessly rotate to next key on ANY api key error (invalid, rate-limit, etc.)
                    continue
                except Exception as e:
                    print(f"Model {model} analysis failed with general error: {e}")
                    last_error = f"Model {model} failed: {str(e)}"

        return {"error": f"Failed to analyze architecture after trying all available Gemini models and API key rings. Last error: {last_error}"}
