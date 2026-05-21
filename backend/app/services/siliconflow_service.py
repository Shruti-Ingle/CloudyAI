import os
import json
import urllib.request
import urllib.error
from app.utils.prompt_builder import get_system_prompt

class SiliconFlowService:
    def __init__(self):
        # Read from environment variables, fallback to the key provided by the user
        self.api_key = os.environ.get("SILICONFLOW_API_KEY")
        if not self.api_key:
            # Fallback to the exact key provided by the user (ensuring sk- prefix)
            self.api_key = "sk-e8c955b188ca4d95808f1168b0283b4f.iETov7wv3lyf9IXV49xDihwT"
        
        self.base_url = "https://api.siliconflow.cn/v1/chat/completions"
        # SiliconFlow hosts deepseek-ai/DeepSeek-V3 and Qwen2.5-72B-Instruct!
        self.primary_model = "deepseek-ai/DeepSeek-V3"
        self.fallback_model = "Qwen/Qwen2.5-72B-Instruct"

    def _call_siliconflow(self, messages, system_prompt=None, require_json=False):
        payload_messages = []
        if system_prompt:
            payload_messages.append({"role": "system", "content": system_prompt})
        payload_messages.extend(messages)

        payload = {
            "model": self.primary_model,
            "messages": payload_messages,
            "temperature": 0.2,
            "max_tokens": 2048
        }
        
        if require_json:
            payload["response_format"] = {"type": "json_object"}

        # Attempt invocation
        for model in [self.primary_model, self.fallback_model]:
            payload["model"] = model
            req = urllib.request.Request(
                self.base_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as response:
                    res_body = response.read().decode('utf-8')
                    res_json = json.loads(res_body)
                    return res_json['choices'][0]['message']['content'].strip()
            except urllib.error.HTTPError as e:
                err_data = e.read().decode('utf-8')
                print(f"SiliconFlow model {model} failed with: {err_data}")
            except Exception as e:
                print(f"SiliconFlow call failed for model {model}: {e}")
        
        raise Exception("Failed to get response from all configured SiliconFlow models.")

    def generate_architecture(self, prompt: str, platform: str = "AWS", history: list = None):
        context_str = ""
        if history:
            context_str = "Conversation Context:\n"
            for msg in history:
                role = "User" if not msg.get("isBot") else "Assistant (Cloudy AI)"
                context_str += f"- {role}: {msg.get('text')}\n"
            context_str += "\nNew requirement based on history:\n"

        full_prompt = f"{context_str}Design a highly available and cost-optimized {platform} architecture for: {prompt}"

        system_prompt = get_system_prompt(platform)

        try:
            res_text = self._call_siliconflow(
                messages=[{"role": "user", "content": full_prompt}],
                system_prompt=system_prompt,
                require_json=True
            )
            return json.loads(res_text)
        except Exception as e:
            print(f"SiliconFlow generate architecture failed: {e}")
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

        # Retrieve questions list for selected platform, fallback to AWS
        questions_list = QUESTIONS.get(platform, QUESTIONS["AWS"])
        
        # Override calculation if question_index is explicitly provided from frontend
        if question_index is not None:
            num_user_messages = question_index
        else:
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
            res_text = self._call_siliconflow(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=system_prompt
            )
            return {"reply": res_text}
        except Exception as e:
            print(f"SiliconFlow chat failed: {e}")
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
            res_text = self._call_siliconflow(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=system_prompt,
                require_json=True
            )
            return json.loads(res_text)
        except Exception as e:
            print(f"SiliconFlow analysis failed: {e}")
            return {"error": str(e)}
