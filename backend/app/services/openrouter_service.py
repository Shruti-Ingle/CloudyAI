import os
import json
import urllib.request
import urllib.error

class OpenRouterService:
    def __init__(self):
        # Read from environment variables, fallback to the key provided by the user
        self.api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OLLAMA_API_KEY")
        if not self.api_key:
            # Fallback to the exact key provided by the user
            self.api_key = "ae9185cb5675464b9566360907995454.5XQlA7RzVKZ0-_xHp5Ttj_-c"
        
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        # We use deepseek-chat (DeepSeek V3) or Google Gemini Flash via OpenRouter for smart, compliant completions!
        self.primary_model = "deepseek/deepseek-chat"
        self.fallback_model = "google/gemini-flash-1.5"

    def _call_openrouter(self, messages, system_prompt=None, require_json=False):
        payload_messages = []
        if system_prompt:
            payload_messages.append({"role": "system", "content": system_prompt})
        payload_messages.extend(messages)

        payload = {
            "model": self.primary_model,
            "messages": payload_messages,
            "temperature": 0.2
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
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "CloudDaddy AI Architect"
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_body = response.read().decode('utf-8')
                    res_json = json.loads(res_body)
                    return res_json['choices'][0]['message']['content'].strip()
            except urllib.error.HTTPError as e:
                err_data = e.read().decode('utf-8')
                print(f"OpenRouter model {model} failed with: {err_data}")
            except Exception as e:
                print(f"OpenRouter call failed for model {model}: {e}")
        
        raise Exception("Failed to get response from all configured OpenRouter models.")

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
            res_text = self._call_openrouter(
                messages=[{"role": "user", "content": full_prompt}],
                system_prompt=system_prompt,
                require_json=True
            )
            return json.loads(res_text)
        except Exception as e:
            print(f"OpenRouter generate architecture failed: {e}")
            return {"error": str(e)}

    def generate_chat_response(self, user_message: str, history: list, platform: str = "AWS"):
        history_str = ""
        if history:
            for msg in history:
                role = "Cloudy AI" if msg.get("isBot") else "User"
                history_str += f"{role}: {msg.get('text')}\n"

        system_prompt = (
            f"You are Cloudy AI, a helpful, enthusiastic, and expert cloud architect assistant specialized in {platform}.\n"
            "The user is designing a cloud application. Your role is to have a natural, professional conversation to understand "
            "their needs and help them refine their architecture before they click the generate button.\n\n"
            "Rules:\n"
            "1. Be friendly, conversational, and highly technical.\n"
            "2. Keep your response brief and to the point (maximum 2-3 sentences).\n"
            "3. Ask exactly ONE relevant, smart, open-ended question that helps clarify their architecture.\n"
            "4. Match your question specifically to what they just proposed. If the user is off-topic, guide them back on track.\n"
            "5. Do NOT output any JSON, YAML, code blocks, or diagram structures."
        )

        prompt = f"Conversation history:\n{history_str}User: {user_message}\n\nGenerate your technical conversational response:"

        try:
            res_text = self._call_openrouter(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=system_prompt
            )
            return {"reply": res_text}
        except Exception as e:
            print(f"OpenRouter chat failed: {e}")
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
            res_text = self._call_openrouter(
                messages=[{"role": "user", "content": prompt}],
                system_prompt=system_prompt,
                require_json=True
            )
            return json.loads(res_text)
        except Exception as e:
            print(f"OpenRouter analysis failed: {e}")
            return {"error": str(e)}
