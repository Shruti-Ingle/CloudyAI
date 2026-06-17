import os
import json
import urllib.request
import joblib

CLASSES = [
    "dns", "cdn", "storage", "api", "compute", "db", "auth", "cache", "firewall", "queue"
]

class ArchitectureInference:
    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load trained classifier and vectorizer
        try:
            self.vectorizer = joblib.load(os.path.join(self.model_dir, "vectorizer.joblib"))
            self.classifier = joblib.load(os.path.join(self.model_dir, "classifier.joblib"))
            self.is_trained = True
        except Exception:
            self.vectorizer = None
            self.classifier = None
            self.is_trained = False

    def predict_resources(self, prompt: str) -> list:
        """Predicts required resource nodes using the Random Forest classifier."""
        if not self.is_trained:
            return ["dns", "api", "compute", "db"]  # Standard fallback
            
        X = self.vectorizer.transform([prompt])
        preds = self.classifier.predict(X)[0]
        
        required = []
        for idx, val in enumerate(preds):
            if val == 1:
                required.append(CLASSES[idx])
        return required

    def generate_architecture(self, prompt: str, platform: str = "AWS") -> dict:
        """Queries the custom Ollama model with predicted architectural hints."""
        predicted_resources = self.predict_resources(prompt)
        
        # Create user prompt containing classifier guidelines
        guided_prompt = (
            f"Generate a cost-optimized, highly available {platform} cloud architecture diagram for:\n"
            f"Requirements: {prompt}\n"
            f"Classifier constraint hints: Include these modules: {', '.join(predicted_resources)}\n"
        )
        
        payload = {
            "model": "clouddaddy-architecture",
            "messages": [
                {
                    "role": "user",
                    "content": guided_prompt
                }
            ],
            "stream": False,
            "options": {
                "temperature": 0.2
            },
            "format": "json"
        }
        
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.ollama_url}/api/chat",
            data=data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30.0) as response:
                res_data = json.loads(response.read().decode())
                content = res_data["message"]["content"].strip()
                return json.loads(content)
        except Exception as e:
            # Local fallback response mapping
            print(f"Warning: Local Ollama chat invocation failed: {e}. Returning rule-based architecture structure.")
            return self._heuristic_fallback(prompt, predicted_resources, platform)

    def _heuristic_fallback(self, prompt: str, predicted: list, platform: str) -> dict:
        """Heuristic rule-based architecture generation fallback if Ollama is offline."""
        nodes = []
        edges = []
        services = []
        
        # 1. DNS/Client tier
        nodes.append({"id": "dns", "data": {"label": f"{platform} Ingress DNS"}, "position": {"x": 400, "y": 50}, "properties": {"type": "client"}})
        
        # 2. API/Ingress tier
        if "api" in predicted or "cdn" in predicted:
            label = "API Gateway" if "api" in predicted else "CloudFront CDN"
            nodes.append({"id": "api", "data": {"label": label}, "position": {"x": 400, "y": 200}, "properties": {"type": "api", "requests": 2}})
            edges.append({"id": "e-dns-api", "source": "dns", "target": "api"})
            last_source = "api"
        else:
            last_source = "dns"
            
        # 3. Compute tier
        if "compute" in predicted:
            nodes.append({"id": "compute", "data": {"label": "Lambda Logic"}, "position": {"x": 400, "y": 350}, "properties": {"type": "compute", "size": "t3.medium"}})
            edges.append({"id": f"e-{last_source}-compute", "source": last_source, "target": "compute"})
            last_source = "compute"
            services.append({"name": "Lambda compute service", "monthly_cost": "$2.50", "breakdown": "Evaluated executions cost"})
            
        # 4. Storage/DB tier
        if "db" in predicted:
            nodes.append({"id": "db", "data": {"label": "DynamoDB"}, "position": {"x": 400, "y": 500}, "properties": {"type": "db", "size": "db.t3.medium"}})
            edges.append({"id": f"e-{last_source}-db", "source": last_source, "target": "db"})
            services.append({"name": "DynamoDB tables", "monthly_cost": "$12.00", "breakdown": "Storage volume + provisioned read/write capacity"})
            
        if "storage" in predicted:
            nodes.append({"id": "s3", "data": {"label": "S3 Static Bucket"}, "position": {"x": 100, "y": 500}, "properties": {"type": "storage", "capacity": 100}})
            edges.append({"id": f"e-{last_source}-s3", "source": last_source, "target": "s3"})
            services.append({"name": "S3 Bucket storage", "monthly_cost": "$3.00", "breakdown": "100GB files storage space"})

        total_cost = sum(float(s["monthly_cost"].replace("$", "")) for s in services)
        
        return {
            "nodes": nodes,
            "edges": edges,
            "cost": {
                "total_monthly_cost": f"${total_cost:.2f}",
                "services": services
            }
        }

if __name__ == "__main__":
    inf = ArchitectureInference()
    arch = inf.generate_architecture("A serverless app with database and files", "AWS")
    print(json.dumps(arch, indent=2))
