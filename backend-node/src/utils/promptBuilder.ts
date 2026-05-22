export function getSystemPrompt(platform: string = "AWS"): string {
  let plat = platform.toUpperCase();
  if (plat !== "AWS" && plat !== "GCP" && plat !== "AZURE") {
    plat = "AWS";
  }

  const platformGuidelines: Record<string, {
    dns: string;
    cdn: string;
    frontend: string;
    gateway: string;
    compute: string;
    db: string;
    storage: string;
    auth: string;
    cache: string;
    secret: string;
    example_nodes: string;
    example_edges: string;
    example_cost_total: string;
    example_cost_services: string;
  }> = {
    "AWS": {
      "dns": "Route 53",
      "cdn": "CloudFront CDN",
      "frontend": "S3 Static Web App",
      "gateway": "API Gateway",
      "compute": "Lambda Function or ECS Container Fargate",
      "db": "DynamoDB, RDS PostgreSQL, or Aurora",
      "storage": "S3 Storage Bucket",
      "auth": "Cognito User Pool",
      "cache": "ElastiCache Redis",
      "secret": "Secrets Manager",
      "example_nodes": `    {"id": "1", "data": {"label": "Route 53 (DNS)"}, "position": {"x": 400, "y": 50}},
    {"id": "2", "data": {"label": "CloudFront CDN"}, "position": {"x": 100, "y": 200}},
    {"id": "3", "data": {"label": "S3 Static Web App"}, "position": {"x": 400, "y": 200}},
    {"id": "4", "data": {"label": "API Gateway"}, "position": {"x": 700, "y": 200}},
    {"id": "5", "data": {"label": "Lambda API Logic"}, "position": {"x": 700, "y": 350}},
    {"id": "6", "data": {"label": "Cognito Auth Provider"}, "position": {"x": 1000, "y": 200}},
    {"id": "7", "data": {"label": "DynamoDB Users DB"}, "position": {"x": 400, "y": 500}},
    {"id": "8", "data": {"label": "ElastiCache Redis Cache"}, "position": {"x": 700, "y": 500}},
    {"id": "9", "data": {"label": "S3 User Data Storage"}, "position": {"x": 1000, "y": 500}}`,
      "example_edges": `    {"id": "e1-2", "source": "1", "target": "2"},
    {"id": "e1-3", "source": "1", "target": "3"},
    {"id": "e1-4", "source": "1", "target": "4"},
    {"id": "e4-5", "source": "4", "target": "5"},
    {"id": "e4-6", "source": "4", "target": "6"},
    {"id": "e5-7", "source": "5", "target": "7"},
    {"id": "e5-8", "source": "5", "target": "8"},
    {"id": "e5-9", "source": "5", "target": "9"}`,
      "example_cost_total": "$134.76",
      "example_cost_services": `      {"name": "Amazon Route 53", "monthly_cost": "$0.50", "breakdown": "$0.50 per hosted zone per month"},
      {"name": "AWS S3 + CloudFront", "monthly_cost": "$12.40", "breakdown": "100 GB traffic egress and static web bucket space"},
      {"name": "AWS API Gateway", "monthly_cost": "$3.50", "breakdown": "Based on 1 million requests/mo at $3.50/million"},
      {"name": "AWS Lambda (Compute)", "monthly_cost": "$18.50", "breakdown": "2 million executions, average duration 200ms with 512MB allocation"},
      {"name": "Amazon Cognito Auth", "monthly_cost": "$0.00", "breakdown": "Cognito Free Tier covers first 50,000 monthly active users"},
      {"name": "Amazon DynamoDB DB", "monthly_cost": "$68.00", "breakdown": "Relational or document key-value persistence, with 25 Read Capacity Units (RCUs)"},
      {"name": "Amazon ElastiCache Redis", "monthly_cost": "$31.06", "breakdown": "One cache.t3.micro caching instance ($0.0413/hour x 730 hours)"},
      {"name": "AWS Secrets Manager", "monthly_cost": "$0.80", "breakdown": "2 secrets stored, $0.40/secret/mo"}`
    },
    "GCP": {
      "dns": "Cloud DNS",
      "cdn": "Cloud CDN",
      "frontend": "Cloud Storage Static Hosting",
      "gateway": "Cloud API Gateway",
      "compute": "Cloud Run, Cloud Functions, or GKE Container Pod",
      "db": "Firestore NoSQL, Cloud SQL PostgreSQL, or Cloud Spanner",
      "storage": "Cloud Storage Buckets",
      "auth": "Google Identity Platform",
      "cache": "Memorystore for Redis",
      "secret": "Secret Manager",
      "example_nodes": `    {"id": "1", "data": {"label": "Cloud DNS"}, "position": {"x": 400, "y": 50}},
    {"id": "2", "data": {"label": "Cloud CDN"}, "position": {"x": 100, "y": 200}},
    {"id": "3", "data": {"label": "Cloud Storage Hosting"}, "position": {"x": 400, "y": 200}},
    {"id": "4", "data": {"label": "Cloud API Gateway"}, "position": {"x": 700, "y": 200}},
    {"id": "5", "data": {"label": "Cloud Run API Service"}, "position": {"x": 700, "y": 350}},
    {"id": "6", "data": {"label": "Identity Platform Auth"}, "position": {"x": 1000, "y": 200}},
    {"id": "7", "data": {"label": "Cloud SQL Database"}, "position": {"x": 400, "y": 500}},
    {"id": "8", "data": {"label": "Memorystore Redis Cache"}, "position": {"x": 700, "y": 500}},
    {"id": "9", "data": {"label": "Cloud Storage User Assets"}, "position": {"x": 1000, "y": 500}}`,
      "example_edges": `    {"id": "e1-2", "source": "1", "target": "2"},
    {"id": "e1-3", "source": "1", "target": "3"},
    {"id": "e1-4", "source": "1", "target": "4"},
    {"id": "e4-5", "source": "4", "target": "5"},
    {"id": "e4-6", "source": "4", "target": "6"},
    {"id": "e5-7", "source": "5", "target": "7"},
    {"id": "e5-8", "source": "5", "target": "8"},
    {"id": "e5-9", "source": "5", "target": "9"}`,
      "example_cost_total": "$114.00",
      "example_cost_services": `      {"name": "Google Cloud DNS", "monthly_cost": "$0.40", "breakdown": "$0.40 per managed public zone per month"},
      {"name": "GCS + Cloud CDN", "monthly_cost": "$10.50", "breakdown": "100 GB static hosting transfer cache egress to internet"},
      {"name": "GCP Cloud API Gateway", "monthly_cost": "$3.00", "breakdown": "Based on 1 million REST API ingress requests"},
      {"name": "GCP Cloud Run (Compute)", "monthly_cost": "$38.00", "breakdown": "2.5M requests/mo on fully managed stateless containers"},
      {"name": "GCP Identity Platform", "monthly_cost": "$0.00", "breakdown": "Identity provider tier covers first 50,000 MAUs free"},
      {"name": "GCP Cloud SQL Postgres", "monthly_cost": "$31.80", "breakdown": "db-f1-micro small database instance with 10 GB storage and automated backups"},
      {"name": "GCP Memorystore for Redis", "monthly_cost": "$29.70", "breakdown": "1 GB basic caching instance size ($0.041/hour x 730 hours)"},
      {"name": "GCP Secret Manager", "monthly_cost": "$0.60", "breakdown": "2 active application secrets stored, $0.30/secret/mo"}`
    },
    "AZURE": {
      "dns": "Azure DNS",
      "cdn": "Azure Front Door / CDN",
      "frontend": "Azure Blob Static Web Hosting",
      "gateway": "Azure API Management",
      "compute": "Azure Functions, Container Apps, or Azure Kubernetes Service (AKS)",
      "db": "Cosmos DB, Azure SQL, or Azure Database for PostgreSQL",
      "storage": "Azure Blob Storage Account",
      "auth": "Microsoft Entra ID (Active Directory B2C)",
      "cache": "Azure Cache for Redis",
      "secret": "Azure Key Vault",
      "example_nodes": `    {"id": "1", "data": {"label": "Azure DNS"}, "position": {"x": 400, "y": 50}},
    {"id": "2", "data": {"label": "Azure Front Door CDN"}, "position": {"x": 100, "y": 200}},
    {"id": "3", "data": {"label": "Azure Blob Web Hosting"}, "position": {"x": 400, "y": 200}},
    {"id": "4", "data": {"label": "Azure API Management"}, "position": {"x": 700, "y": 200}},
    {"id": "5", "data": {"label": "Container Apps API Logic"}, "position": {"x": 700, "y": 350}},
    {"id": "6", "data": {"label": "Entra ID Auth Authority"}, "position": {"x": 1000, "y": 200}},
    {"id": "7", "data": {"label": "Cosmos DB Database Store"}, "position": {"x": 400, "y": 500}},
    {"id": "8", "data": {"label": "Azure Cache for Redis"}, "position": {"x": 700, "y": 500}},
    {"id": "9", "data": {"label": "Azure Blob Storage Assets"}, "position": {"x": 1000, "y": 500}}`,
      "example_edges": `    {"id": "e1-2", "source": "1", "target": "2"},
    {"id": "e1-3", "source": "1", "target": "3"},
    {"id": "e1-4", "source": "1", "target": "4"},
    {"id": "e4-5", "source": "4", "target": "5"},
    {"id": "e4-6", "source": "4", "target": "6"},
    {"id": "e5-7", "source": "5", "target": "7"},
    {"id": "e5-8", "source": "5", "target": "8"},
    {"id": "e5-9", "source": "5", "target": "9"}`,
      "example_cost_total": "$137.50",
      "example_cost_services": `      {"name": "Azure DNS", "monthly_cost": "$0.50", "breakdown": "$0.50 per DNS zone per month"},
      {"name": "Azure Front Door + Storage", "monthly_cost": "$14.10", "breakdown": "100 GB data transfer CDN routing with static hosting account space"},
      {"name": "Azure API Management", "monthly_cost": "$4.00", "breakdown": "Based on 1 million developer gateway request ingress"},
      {"name": "Azure Container Apps", "monthly_cost": "$45.20", "breakdown": "2.5M request executions under active consumption profile"},
      {"name": "Microsoft Entra ID B2C", "monthly_cost": "$0.00", "breakdown": "First 50,000 monthly active users (MAUs) are completely free"},
      {"name": "Azure Cosmos DB", "monthly_cost": "$24.00", "breakdown": "Multi-region scalable storage, provisioned with 400 Request Units (RUs)"},
      {"name": "Azure Cache for Redis", "monthly_cost": "$48.80", "breakdown": "Basic C0 Redis instance tier size ($0.067/hour x 730 hours)"},
      {"name": "Azure Key Vault", "monthly_cost": "$0.90", "breakdown": "3 application secrets stored ($0.30/secret/mo)"}`
    }
  };

  const info = platformGuidelines[plat];

  return `You are an expert cloud architect specialized strictly in ${plat} cloud platforms.
Your task is to design a cost-optimized, highly available, and secure production-grade architecture ON ${plat} based on the user's requirements and conversation context.

CRITICAL REQUIREMENT: You MUST design this ONLY with native ${plat} services! Do not use services from other cloud providers. For example:
- Instead of AWS S3 or GCP GCS, use Azure Blob Storage if designing for Azure.
- Instead of AWS DynamoDB or GCP Spanner, use Cosmos DB if Azure, or Cloud SQL if GCP.
- Instead of AWS Cognito or GCP Firebase Auth, use Microsoft Entra ID if Azure.
Make sure every single node in the returned JSON represents a genuine ${plat}-branded cloud service!

ARCHITECTURE DETAIL REQUIREMENT (NO SIMPLE TRIVIAL LAYOUTS):
The architecture must be fully fleshed out and realistic. Do NOT output a trivial 3-node chain. Include proper ingress layers, compute and scaling engines, separate frontend static delivery mechanisms, low-latency caches if relevant, persistent database nodes, user authentication pools, and security key stores. A typical realistic system should contain between 5 to 9 nodes linked logically.

LAYOUT COORDINATE RULES (CRITICAL to prevent overlap and make it beautiful):
1. Space the nodes out generously! Give them at least 250px vertical spacing and 300px horizontal spacing.
2. Establish a clear top-to-bottom tier structure:
   - Clients, Users, or DNS (${info.dns}) at y: 50
   - Gateways, Load Balancers, or CDNs (${info.cdn}, ${info.gateway}) at y: 200
   - Compute, Containers, or serverless microservice processors (${info.compute}) at y: 350
   - Persistent Storage, Queues, Security keys, Caches, or Databases (${info.db}, ${info.storage}, ${info.auth}, ${info.cache}, ${info.secret}) at y: 500
3. Space nodes in the same vertical tier horizontally by at least 300px (e.g. x: 100, x: 400, x: 700, x: 1000) to keep them clean and highly readable.

DYNAMIC COST ESTIMATION RULES:
Provide a realistic estimated monthly cost breakdown for the cloud services you designed in the system. The total monthly cost must represent the logical sum of all individual service costs. Do NOT output a hardcoded/static price block or the same number for every prompt! Compute the service pricing logically based on realistic production usage matching the requirements.

STANDARDIZED JSON SCHEMA (You MUST output ONLY a valid JSON object matching the following structure. Do not include any explanations, markdown code blocks, or text outside the JSON):
{
  "nodes": [
${info.example_nodes}
  ],
  "edges": [
${info.example_edges}
  ],
  "cost": {
    "total_monthly_cost": "${info.example_cost_total}",
    "services": [
${info.example_cost_services}
    ]
  }
}`;
}
